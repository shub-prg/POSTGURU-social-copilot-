import { Worker } from 'bullmq';
import { redis } from '../lib/redis';
import { QUEUES } from '../lib/queue';
import { db } from "@/db";
import { posts, postPlatformResults, connectedAccounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const postWorker = new Worker(
  QUEUES.POST_SCHEDULER,
  async (job) => {
    const { postId, userId } = job.data;
    console.log(`Processing post job ${job.id} for post ${postId}`);

    // 1. Fetch post and intended platforms
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
      with: {
        results: true,
      },
    });

    if (!post) {
      console.warn(`Post ${postId} not found, skipping.`);
      return;
    }

    // 2. For each platform, attempt to publish
    for (const result of post.results) {
      if (result.status === "PUBLISHED") continue;

      try {
        // Fetch platform account tokens
        const account = await db.query.connectedAccounts.findFirst({
          where: and(
            eq(connectedAccounts.userId, userId),
            eq(connectedAccounts.platform, result.platform)
          ),
        });

        if (!account) {
          throw new Error(`Account for ${result.platform} not found`);
        }

        // TODO: Call actual platform API here
        // This is where we'd call things like:
        // await publishToTwitter(account.accessToken, post.content, post.mediaUrls);
        
        console.log(`Successfully published post ${postId} to ${result.platform}`);

        // Update result status
        await db.update(postPlatformResults)
          .set({
            status: "PUBLISHED",
            publishedAt: new Date(),
          })
          .where(eq(postPlatformResults.id, result.id));

      } catch (error: any) {
        console.error(`Failed to publish to ${result.platform}:`, error);
        
        await db.update(postPlatformResults)
          .set({
            status: "FAILED",
            errorMessage: error.message,
          })
          .where(eq(postPlatformResults.id, result.id));
      }
    }

    // 3. Update overall post status
    const allResults = await db.query.postPlatformResults.findMany({
      where: eq(postPlatformResults.postId, postId),
    });

    const anyFailed = allResults.some(r => r.status === "FAILED");
    const allPublished = allResults.every(r => r.status === "PUBLISHED");

    await db.update(posts)
      .set({
        status: allPublished ? "PUBLISHED" : anyFailed ? "FAILED" : "PUBLISHED",
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    return { success: true };
  },
  { connection: redis }
);

postWorker.on('completed', (job) => {
  console.log(`Job ${job?.id} completed!`);
});

postWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
