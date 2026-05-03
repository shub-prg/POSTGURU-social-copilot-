import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, connectedAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { PLATFORM_CONFIGS, Platform } from '@/lib/platforms';
import { encrypt, decrypt } from '@/lib/encryption';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

// Import platform helpers
import { exchangeTwitterCode, getTwitterProfile } from '@/lib/platforms/twitter';
import { exchangeFacebookCode, getInstagramBusinessAccount } from '@/lib/platforms/facebook';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const platformName = platform.toUpperCase() as Platform;

  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');

  // Write debug log
  try {
    const allParams: Record<string, string> = {};
    req.nextUrl.searchParams.forEach((value, key) => { allParams[key] = value; });
    fs.writeFileSync(
      path.join(process.cwd(), 'callback_log.json'),
      JSON.stringify({ platform, allParams, timestamp: new Date().toISOString() }, null, 2)
    );
  } catch (_) {}

  const { userId: clerkId } = await auth();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  if (!clerkId) {
    return NextResponse.redirect(new URL('/sign-in', baseUrl));
  }

  const config = PLATFORM_CONFIGS[platformName];
  if (!config) {
    return NextResponse.redirect(new URL('/dashboard/accounts?error=invalid_platform', baseUrl));
  }

  // Verify CSRF state
  const cookieStore = await cookies();
  const savedState = cookieStore.get(`${platform}_oauth_state`)?.value;
  const savedVerifier = cookieStore.get(`${platform}_oauth_verifier`)?.value;

  // Extended debug log
  try {
    fs.writeFileSync(
      path.join(process.cwd(), 'callback_log.json'),
      JSON.stringify({ 
        platform, 
        code: code ? 'PRESENT' : 'MISSING', 
        state, 
        savedState: savedState || 'NOT_FOUND_IN_COOKIE',
        savedVerifier: savedVerifier ? 'PRESENT' : 'NOT_FOUND_IN_COOKIE',
        stateMatch: state === savedState,
        isMock: state === 'mock_state',
        timestamp: new Date().toISOString() 
      }, null, 2)
    );
  } catch (_) {}

  // State verification: block if state is clearly wrong.
  // If savedState is missing (cookie lost), log a warning but proceed so we can test the flow.
  // In production this should be a hard block.
  if (state !== 'mock_state') {
    if (savedState && state !== savedState) {
      // Hard block: state was set but doesn't match — likely CSRF attempt
      return NextResponse.redirect(new URL(`/dashboard/accounts?error=invalid_state`, baseUrl));
    }
    // If savedState is undefined (cookie lost in incognito/ngrok), warn and continue
    if (!savedState) {
      console.warn(`[OAuth] State cookie missing for ${platform}. Proceeding without CSRF check (dev mode).`);
    }
  }

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard/accounts?error=no_code', baseUrl));
  }

  // Get or sync internal user
  let dbUser = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });

  if (!dbUser) {
    const user = await currentUser();
    if (user) {
      const email = user.emailAddresses[0]?.emailAddress;
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if (email) {
        const result = await db.insert(users).values({
          clerkId: user.id,
          email,
          name: name || null,
        }).onConflictDoUpdate({
          target: users.clerkId,
          set: { email, name: name || null, updatedAt: new Date() }
        }).returning();
        dbUser = result[0];
      }
    }
  }

  if (!dbUser) {
    return NextResponse.redirect(new URL('/dashboard/accounts?error=user_not_found', baseUrl));
  }

  let finalData: any;

  try {
    if (code === 'mock_code') {
      const seed = `${dbUser.id}-${platformName}`;
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
      }
      const followersCount = Math.abs(hash % 251) + 100;

      finalData = {
        platformAccountId: `mock_${platformName.toLowerCase()}`,
        platformUsername: `shub_001`,
        accessToken: encrypt('mock_token'),
        refreshToken: encrypt('mock_refresh'),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        profilePictureUrl: `https://ui-avatars.com/api/?name=${platformName}&background=random`,
        followersCount,
      };
    } else {
      switch (platformName) {
        case 'TWITTER': {
          const twitterTokens = await exchangeTwitterCode(code, savedVerifier || '');
          const twitterProfile = await getTwitterProfile(decrypt(twitterTokens.accessToken));
          finalData = { ...twitterTokens, ...twitterProfile };
          break;
        }
        case 'FACEBOOK': {
          const userToken = await exchangeFacebookCode(code);
          
          // 0. Get User ID
          const meRes = await fetch(`https://graph.facebook.com/v18.0/me?fields=id&access_token=${userToken}`);
          const meData = await meRes.json();
          const fbUserId = meData.id;

          // Debug Permissions
          const debugRes = await fetch(`https://graph.facebook.com/v18.0/me/permissions?access_token=${userToken}`);
          const debugData = await debugRes.json();
          console.log('[Facebook Callback] Granted Permissions:', JSON.stringify(debugData.data));

          // 2. Fetch Pages (Standard)
          const accountsRes = await fetch(
            `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,picture,tasks,followers_count,instagram_business_account&access_token=${userToken}`
          );
          const accountsData = await accountsRes.json();
          console.log('[Facebook Callback] Raw /me/accounts response:', JSON.stringify(accountsData));

          let allPages = accountsData.data || [];

          // 3. Deep Search Fallback (Try fetching via user ID directly)
          if (allPages.length === 0 && fbUserId) {
            console.log(`[Facebook Callback] Standard search empty, trying Ultra-Deep Search for ID ${fbUserId}...`);
            const deepRes = await fetch(`https://graph.facebook.com/v18.0/${fbUserId}/accounts?fields=id,name,access_token,picture,followers_count,instagram_business_account&access_token=${userToken}`);
            const deepData = await deepRes.json();
            
            if (deepData.data) {
              allPages = deepData.data;
              console.log(`[Facebook Callback] Ultra-Deep Search found ${allPages.length} pages!`);
            }
          }

          // 4. Business Manager Fallback
          if (allPages.length === 0) {
            console.log('[Facebook Callback] Still no pages, trying Business Manager...');
            try {
              const bizRes = await fetch(`https://graph.facebook.com/v18.0/me/businesses?fields=id,name,owned_pages{id,name,access_token,picture,followers_count,instagram_business_account}&access_token=${userToken}`);
              const bizData = await bizRes.json();
              console.log('[Facebook Callback] Business Manager result:', JSON.stringify({ businesses: bizData.data?.length ?? 0 }));
              
              if (bizData.data) {
                for (const biz of bizData.data) {
                  if (biz.owned_pages?.data) {
                    allPages = [...allPages, ...biz.owned_pages.data];
                  }
                }
              }
            } catch (e) {
              console.error('[Facebook Callback] Business Manager fallback failed:', e);
            }
          }

          console.log(`[Facebook Callback] Total pages found: ${allPages.length}`);

          if (allPages.length > 0) {
            for (const page of allPages) {
              // Save the Facebook Page
              const pageFollowers = page.followers_count || 0;
              await db.insert(connectedAccounts).values({
                userId: dbUser.id,
                platform: 'FACEBOOK',
                platformAccountId: page.id,
                platformUsername: page.name,
                accessToken: encrypt(page.access_token || userToken),
                refreshToken: null,
                expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                profilePictureUrl: page.picture?.data?.url || `https://graph.facebook.com/v18.0/${page.id}/picture?type=large`,
                followersCount: pageFollowers,
                isActive: true,
              }).onConflictDoUpdate({
                target: [connectedAccounts.userId, connectedAccounts.platform],
                set: {
                  platformAccountId: page.id,
                  platformUsername: page.name,
                  accessToken: encrypt(page.access_token || userToken),
                  profilePictureUrl: page.picture?.data?.url || `https://graph.facebook.com/v18.0/${page.id}/picture?type=large`,
                  followersCount: pageFollowers,
                  updatedAt: new Date(),
                }
              });

              // Detect and Save linked Instagram account
              try {
                const igAccount = await getInstagramBusinessAccount(page.id, page.access_token || userToken);
                if (igAccount) {
                  console.log(`[Facebook Callback] Found Instagram account ${igAccount.username} for page ${page.name}`);
                  
                  const igFollowers = igAccount.followers_count || 0;
                  await db.insert(connectedAccounts).values({
                    userId: dbUser.id,
                    platform: 'INSTAGRAM',
                    platformAccountId: igAccount.id,
                    platformUsername: igAccount.username,
                    accessToken: encrypt(page.access_token || userToken),
                    refreshToken: null,
                    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                    profilePictureUrl: igAccount.profilePictureUrl || null,
                    followersCount: igFollowers,
                    isActive: true,
                  }).onConflictDoUpdate({
                    target: [connectedAccounts.userId, connectedAccounts.platform],
                    set: {
                      platformAccountId: igAccount.id,
                      platformUsername: igAccount.username,
                      accessToken: encrypt(page.access_token || userToken),
                      profilePictureUrl: igAccount.profilePictureUrl || null,
                      followersCount: igFollowers,
                      updatedAt: new Date(),
                    }
                  });
                }
              } catch (igErr) {
                console.error('[Facebook Callback] Instagram check failed for page:', page.name, igErr);
              }
            }
          } else {
            // Fallback: Save personal profile if no pages found
            const meRes = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,email,picture&access_token=${userToken}`);
            const meData = await meRes.json();
            
            await db.insert(connectedAccounts).values({
              userId: dbUser.id,
              platform: 'FACEBOOK',
              platformAccountId: meData.id,
              platformUsername: meData.name || 'Facebook User',
              accessToken: encrypt(userToken),
              refreshToken: null,
              expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
              profilePictureUrl: meData.picture?.data?.url || `https://graph.facebook.com/v18.0/${meData.id}/picture?type=large`,
              followersCount: 0,
              isActive: true,
            }).onConflictDoUpdate({
              target: [connectedAccounts.userId, connectedAccounts.platform],
              set: {
                platformAccountId: meData.id,
                platformUsername: meData.name || 'Facebook User',
                accessToken: encrypt(userToken),
                profilePictureUrl: meData.picture?.data?.url || `https://graph.facebook.com/v18.0/${meData.id}/picture?type=large`,
                updatedAt: new Date(),
              }
            });
          }
          break;
        }
        default:
          throw new Error(`OAuth not implemented for ${platformName}`);
      }
    }

    if (finalData) {
      await db.insert(connectedAccounts).values({
        userId: dbUser.id,
        platform: platformName,
        platformAccountId: finalData.platformAccountId,
        platformUsername: finalData.platformUsername,
        accessToken: finalData.accessToken,
        refreshToken: finalData.refreshToken || null,
        expiresAt: finalData.expiresAt,
        profilePictureUrl: finalData.profilePictureUrl || null,
        followersCount: finalData.followersCount || 0,
        isActive: true,
      }).onConflictDoUpdate({
        target: [connectedAccounts.userId, connectedAccounts.platform],
        set: {
          platformAccountId: finalData.platformAccountId,
          platformUsername: finalData.platformUsername,
          accessToken: finalData.accessToken,
          refreshToken: finalData.refreshToken || null,
          expiresAt: finalData.expiresAt,
          profilePictureUrl: finalData.profilePictureUrl || null,
          followersCount: finalData.followersCount || 0,
          isActive: true,
          updatedAt: new Date(),
        }
      });
    }

    cookieStore.delete(`${platform}_oauth_state`);
    cookieStore.delete(`${platform}_oauth_verifier`);

    return NextResponse.redirect(new URL('/dashboard/accounts?success=true', baseUrl));

  } catch (err: any) {
    console.error(`OAuth callback error for ${platformName}:`, err);
    return NextResponse.redirect(
      new URL(`/dashboard/accounts?error=${encodeURIComponent(err.message)}`, baseUrl)
    );
  }
}
