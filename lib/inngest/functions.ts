import { inngest } from "./client";
import { db } from "@/db";
import { posts, postPlatformResults, connectedAccounts } from "@/db/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import { decrypt } from "@/lib/encryption";
import { publishToTwitter, refreshTwitterToken } from "@/lib/platforms/twitter";
import { publishToFacebook } from "@/lib/platforms/facebook-publish";
import { publishToInstagram } from "@/lib/platforms/instagram-publish";
import { autoReplyRules, autoReplyLogs, analyticsSnapshots, postAnalyticsSnapshots } from "@/db/schema";
import { fetchPlatformComments, postPlatformReply } from "@/lib/platforms/comments";
import { generateAutoReply, analyzeSentiment } from "@/lib/gemini";
import { getTwitterProfile, getTwitterPostMetrics } from "@/lib/platforms/twitter";
import { calculateEngagementRate } from "@/lib/utils";
import { userSettings as userSettingsTable, users } from "@/db/schema";
import { sendEmail } from "@/lib/plunk";

export const publishPost = inngest.createFunction(
  { id: "publish-post", name: "Publish Post to Social Media", triggers: [{ event: "post/scheduled" }] },
  async ({ event, step }) => {
    const { postId } = event.data;

    // 1. Fetch the post and its platforms
    const post = await step.run("fetch-post", async () => {
      const results = await db.query.posts.findMany({
        where: eq(posts.id, postId),
        with: {
          results: true,
        },
      });
      return results[0];
    });

    if (!post) return { error: "Post not found" };

    // 2. Map through platforms and publish
    const publishResults: any[] = [];
    for (const platformResult of post.results) {
      if (platformResult.status === "PUBLISHED") continue;

      const result = await step.run(`publish-${platformResult.platform}-${platformResult.id}`, async () => {
        try {
          // Get the connected account for this user and platform
          const account = await db.query.connectedAccounts.findFirst({
            where: and(
              eq(connectedAccounts.userId, post.userId),
              eq(connectedAccounts.platform, platformResult.platform)
            ),
          });

          if (!account) throw new Error(`No connected account for ${platformResult.platform}`);

          let accessToken = decrypt(account.accessToken);
          
          // Check if token is expired and refresh if needed
          if (account.expiresAt && new Date(account.expiresAt) < new Date()) {
             if (account.platform === "TWITTER" && account.refreshToken) {
                const refreshed = await refreshTwitterToken(decrypt(account.refreshToken));
                accessToken = decrypt(refreshed.accessToken);
                
                // Update account with new tokens
                await db.update(connectedAccounts)
                  .set({
                    accessToken: refreshed.accessToken,
                    refreshToken: refreshed.refreshToken,
                    expiresAt: refreshed.expiresAt,
                  })
                  .where(eq(connectedAccounts.id, account.id));
             }
             // Add refresh logic for other platforms here...
          }

          let publishResult;
          const mediaLinks = Array.isArray(post.mediaUrls) ? post.mediaUrls.map((m: any) => typeof m === 'string' ? m : m.url) : [];

          switch (platformResult.platform) {
            case "TWITTER":
              publishResult = await publishToTwitter(accessToken, post.content || "", mediaLinks);
              break;
              
            case "FACEBOOK":
              publishResult = await publishToFacebook(account.platformAccountId, accessToken, post.content || "", mediaLinks);
              break;

            case "INSTAGRAM":
              publishResult = await publishToInstagram(account.platformAccountId, accessToken, post.content || "", mediaLinks);
              break;

            case "LINKEDIN":
            case "YOUTUBE":
            case "PINTEREST":
            case "REDDIT":
            case "THREADS":
              // Simulated publishing for platforms without full API integration yet
              await new Promise(resolve => setTimeout(resolve, 1500));
              publishResult = {
                platformPostId: `mock_${platformResult.platform.toLowerCase()}_${Date.now()}`,
              };
              break;

            default:
              throw new Error(`Publishing to ${platformResult.platform} is not supported.`);
          }

          // Update platform result to success
          await db.update(postPlatformResults)
            .set({
              status: "PUBLISHED",
              platformPostId: publishResult.platformPostId,
              publishedAt: new Date(),
              connectedAccountId: account.id, // Save the account used for publishing
            })
            .where(eq(postPlatformResults.id, platformResult.id));

          return { platform: platformResult.platform, status: "PUBLISHED" };
        } catch (error: any) {
          console.error(`Failed to publish to ${platformResult.platform}:`, error);
          
          // Update platform result to failed
          await db.update(postPlatformResults)
            .set({
              status: "FAILED",
              errorMessage: error.message,
            })
            .where(eq(postPlatformResults.id, platformResult.id));
          
          // Re-throw to make the step actually fail in Inngest for better visibility
          throw error;
        }
      });
      publishResults.push(result);
    }

    // 3. Update overall post status if all succeeded
    await step.run("update-post-status", async () => {
      const allSuccess = publishResults.every(r => r.status === "PUBLISHED");
      await db.update(posts)
        .set({
          status: allSuccess ? "PUBLISHED" : "FAILED",
        })
        .where(eq(posts.id, postId));
    });

    // 4. Send notifications
    await step.run("send-notifications", async () => {
      const settings = await db.query.userSettings.findFirst({
        where: eq(userSettingsTable.userId, post.userId),
      });

      if (!settings?.emailNotificationsEnabled) return;

      const user = await db.query.users.findFirst({
        where: eq(users.id, post.userId),
      });

      if (!user?.email) return;

      const allSuccess = publishResults.every(r => r.status === "PUBLISHED");

      if (allSuccess && settings.notifyOnPostSuccess) {
        await sendEmail({
          to: user.email,
          subject: "🚀 Post Published Successfully!",
          body: `<p>Your post <strong>"${post.content.substring(0, 50)}..."</strong> has been published to all platforms.</p><p>View your post analytics in the <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/analytics">dashboard</a>.</p>`,
        });
      } else if (!allSuccess && settings.notifyOnPostFailure) {
        await sendEmail({
          to: user.email,
          subject: "⚠️ Post Publication Failed",
          body: `<p>One or more platforms failed to publish your post: <strong>"${post.content.substring(0, 50)}..."</strong>.</p><p>Please check the <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/calendar">calendar</a> for specific error messages.</p>`,
        });
      }
    });

    return { results: publishResults };
  }
);

export const autoReplyProcessor = inngest.createFunction(
  { 
    id: "auto-reply-processor", 
    name: "Auto-Reply Processor",
    triggers: [{ cron: "0/15 * * * *" }] 
  },
  async ({ step }) => {
    // 1. Fetch active rules
    const activeRules = await step.run("fetch-active-rules", async () => {
      return await db.query.autoReplyRules.findMany({
        where: eq(autoReplyRules.isActive, true),
        orderBy: [autoReplyRules.priority],
      });
    });

    if (activeRules.length === 0) return { message: "No active rules" };

    // 2. Fetch published posts from last 48 hours for FB/IG
    const recentPosts = await step.run("fetch-recent-posts", async () => {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      return await db.query.postPlatformResults.findMany({
        where: and(
          eq(postPlatformResults.status, "PUBLISHED"),
          gt(postPlatformResults.publishedAt, fortyEightHoursAgo),
          sql`${postPlatformResults.platform} IN ('FACEBOOK', 'INSTAGRAM')`
        ),
        with: {
          post: true,
          connectedAccount: true,
        },
      });
    });

    const results: any[] = [];

    for (const platformPost of recentPosts) {
      const comments = await step.run(`fetch-comments-${platformPost.id}`, async () => {
        let account = platformPost.connectedAccount;
        
        // Fallback: if connectedAccountId is null, find the active account for this user/platform
        if (!account) {
          account = await db.query.connectedAccounts.findFirst({
            where: and(
              eq(connectedAccounts.userId, platformPost.post.userId),
              eq(connectedAccounts.platform, platformPost.platform),
              eq(connectedAccounts.isActive, true)
            ),
          }) as any;
        }

        if (!account) return [];
        
        const accessToken = decrypt(account.accessToken);
        return await fetchPlatformComments(
          platformPost.platform,
          platformPost.platformPostId!,
          accessToken
        );
      });

      for (const comment of comments) {
        // Check if we successfully replied to this comment
        const alreadyReplied = await step.run(`check-replied-${comment.id}`, async () => {
          const log = await db.query.autoReplyLogs.findFirst({
            where: and(
              eq(autoReplyLogs.platformCommentId, comment.id),
              eq(autoReplyLogs.status, "SUCCESS")
            ),
          });
          return !!log;
        });

        if (alreadyReplied) continue;

        // Match against rules
        for (const rule of activeRules) {
          // Check if rule applies to this platform
          const rulePlatforms = rule.platforms as string[];
          if (!rulePlatforms.includes(platformPost.platform)) continue;

          let isMatch = false;
          let sentiment: string | null = null;

          if (rule.triggerType === "ANY_COMMENT") {
            isMatch = true;
          } else if (rule.triggerType === "KEYWORD_MATCH") {
            const keywords = rule.keywords as string[];
            isMatch = keywords.some((kw) => 
              comment.text.toLowerCase().includes(kw.toLowerCase())
            );
          } else if (rule.triggerType === "POSITIVE_SENTIMENT" || rule.triggerType === "NEGATIVE_SENTIMENT") {
            sentiment = await step.run(`analyze-sentiment-${comment.id}`, async () => {
              return await analyzeSentiment(comment.text);
            });
            isMatch = (rule.triggerType === "POSITIVE_SENTIMENT" && sentiment === "POSITIVE") ||
                      (rule.triggerType === "NEGATIVE_SENTIMENT" && sentiment === "NEGATIVE");
          }

          if (isMatch) {
            // Generate and post reply
            await step.run(`process-reply-${comment.id}-rule-${rule.id}`, async () => {
              try {
                let replyText = rule.replyTemplate || "";
                
                if (rule.replyMode === "AI_GENERATED") {
                  replyText = await generateAutoReply(comment.text, rule.aiPrompt || "", {
                    commenterName: comment.from,
                    postContent: platformPost.post.content,
                  });
                } else {
                  // Replace variables in template
                  replyText = replyText
                    .replace(/{{commenter_name}}/g, comment.from)
                    .replace(/{{post_title}}/g, platformPost.post.content.substring(0, 20) + "...");
                }

                if (!replyText) return;

                let account = platformPost.connectedAccount;
                if (!account) {
                  account = await db.query.connectedAccounts.findFirst({
                    where: and(
                      eq(connectedAccounts.userId, platformPost.post.userId),
                      eq(connectedAccounts.platform, platformPost.platform),
                      eq(connectedAccounts.isActive, true)
                    ),
                  }) as any;
                }

                if (!account) return;

                const accessToken = decrypt(account.accessToken);
                const replyId = await postPlatformReply(
                  platformPost.platform,
                  comment.id,
                  accessToken,
                  replyText
                );

                // Log success
                await db.insert(autoReplyLogs).values({
                  ruleId: rule.id,
                  userId: platformPost.post.userId,
                  platform: platformPost.platform,
                  platformPostId: platformPost.platformPostId!,
                  platformCommentId: comment.id,
                  commentText: comment.text,
                  replyContent: replyText,
                  status: "SUCCESS",
                });

                results.push({ commentId: comment.id, status: "REPLIED", replyId });
              } catch (error: any) {
                console.error(`Failed to auto-reply to comment ${comment.id}:`, error);
                // Log failure
                await db.insert(autoReplyLogs).values({
                  ruleId: rule.id,
                  userId: platformPost.post.userId,
                  platform: platformPost.platform,
                  platformPostId: platformPost.platformPostId!,
                  platformCommentId: comment.id,
                  commentText: comment.text,
                  replyContent: "FAILED_TO_GENERATE_OR_POST",
                  status: "FAILED",
                  errorMessage: error.message,
                });
              }
            });
            
            break; // Stop at first matching rule
          }
        }
      }
    }

    return { processedPosts: recentPosts.length, results };
  }
);

export const analyticsSync = inngest.createFunction(
  { id: "analytics-sync", name: "Analytics Periodic Sync", triggers: [{ cron: "0 */4 * * *" }] }, // Every 4 hours
  async ({ step }) => {
    // 1. Fetch all connected accounts
    const accounts = await step.run("fetch-accounts", async () => {
      return await db.query.connectedAccounts.findMany({
        where: eq(connectedAccounts.isActive, true),
      });
    });

    const accountResults: any[] = [];
    for (const account of accounts) {
      await step.run(`sync-account-${account.id}`, async () => {
        try {
          let followersCount = account.followersCount;
          let engagementRate = "0";

          if (account.platform === "TWITTER") {
            const profile = await getTwitterProfile(decrypt(account.accessToken));
            followersCount = profile.followersCount;
          }
          // Add other platforms...

          await db.insert(analyticsSnapshots).values({
            userId: account.userId,
            platform: account.platform,
            followersCount,
            engagementRate,
            snapshotDate: new Date(),
          });

          // Update current account followers count
          await db.update(connectedAccounts)
            .set({ followersCount, updatedAt: new Date() })
            .where(eq(connectedAccounts.id, account.id));

          accountResults.push({ accountId: account.id, status: "SUCCESS" });
        } catch (error: any) {
          console.error(`Failed to sync account ${account.id}:`, error);
          accountResults.push({ accountId: account.id, status: "FAILED", error: error.message });
        }
      });
    }

    // 2. Fetch posts published in the last 7 days for granular metrics
    const recentPosts = await step.run("fetch-recent-posts-for-metrics", async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return await db.query.postPlatformResults.findMany({
        where: and(
          eq(postPlatformResults.status, "PUBLISHED"),
          gt(postPlatformResults.publishedAt, sevenDaysAgo)
        ),
        with: {
          post: true,
          connectedAccount: true,
        },
      });
    });

    const postResults: any[] = [];
    for (const platformPost of recentPosts) {
      await step.run(`sync-post-${platformPost.id}`, async () => {
        try {
          const account = platformPost.connectedAccount;
          if (!account) return;

          let metrics: any = null;
          if (platformPost.platform === "TWITTER") {
            metrics = await getTwitterPostMetrics(decrypt(account.accessToken), platformPost.platformPostId!);
          }
          // Add other platforms...

          if (metrics) {
            const rate = calculateEngagementRate({
              likes: metrics.likes,
              comments: metrics.comments,
              shares: metrics.shares,
              followers: account.followersCount,
            });

            await db.insert(postAnalyticsSnapshots).values({
              postId: platformPost.postId,
              platformPostId: platformPost.platformPostId!,
              platform: platformPost.platform,
              likesCount: metrics.likes,
              commentsCount: metrics.comments,
              sharesCount: metrics.shares,
              viewsCount: metrics.views,
              engagementRate: rate.toFixed(2),
              snapshotDate: new Date(),
            });

            postResults.push({ platformPostId: platformPost.platformPostId, status: "SUCCESS" });
          }
        } catch (error: any) {
          console.error(`Failed to sync post ${platformPost.id}:`, error);
          postResults.push({ platformPostId: platformPost.platformPostId, status: "FAILED", error: error.message });
        }
      });
    }

    return { accountsSynced: accountResults.length, postsSynced: postResults.length };
  }
);
