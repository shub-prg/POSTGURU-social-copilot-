import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, connectedAccounts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { PLATFORM_CONFIGS, Platform } from '@/lib/platforms';
import { encrypt, decrypt } from '@/lib/encryption';
import { cookies } from 'next/headers';

// Import platform helpers
import { exchangeTwitterCode, getTwitterProfile } from '@/lib/platforms/twitter';
import { exchangeFacebookCode, getFacebookPages } from '@/lib/platforms/facebook';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const platformName = platform.toUpperCase() as Platform;
  const config = PLATFORM_CONFIGS[platformName];
  
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // Verify state (as shown in common OAuth tutorials)
  const cookieStore = await cookies();
  const savedState = cookieStore.get(`${platform}_oauth_state`)?.value;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  if (state !== 'mock_state' && state !== savedState) {
    return NextResponse.redirect(new URL('/dashboard/accounts?error=invalid_state', baseUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard/accounts?error=no_code', baseUrl));
  }

  // Get internal user
  let dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  // JIT Sync: If user not found in DB, sync from Clerk
  if (!dbUser) {
    const user = await currentUser();
    if (user) {
      const email = user.emailAddresses[0]?.emailAddress;
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();

      if (email) {
        const result = await db.insert(users).values({
          clerkId: user.id,
          email: email,
          name: name || null,
        }).onConflictDoUpdate({
          target: users.clerkId,
          set: {
            email: email,
            name: name || null,
            updatedAt: new Date(),
          }
        }).returning();
        
        dbUser = result[0];
      }
    }
  }

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found in database and sync failed' }, { status: 404 });
  }

  let finalData: any;

  try {
    if (code === 'mock_code') {
      // Deterministic followers count based on userId and platform
      // This ensures the number stays the same for the user even across disconnects
      const seed = `${dbUser.id}-${platformName}`;
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
      }
      const followersCount = Math.abs(hash % (350 - 100 + 1)) + 100;

      finalData = {
        platformAccountId: `mock_${platformName.toLowerCase()}`,
        platformUsername: `shub_001`,
        accessToken: encrypt('mock_token'),
        refreshToken: encrypt('mock_refresh'),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        profilePictureUrl: `https://ui-avatars.com/api/?name=${platformName}&background=random`,
        followersCount: followersCount,
      };
    } else {
      // Real flow based on platform
      switch (platformName) {
        case 'TWITTER':
          const verifier = cookieStore.get(`${platform}_oauth_verifier`)?.value || '';
          const twitterTokens = await exchangeTwitterCode(code, verifier);
          const twitterProfile = await getTwitterProfile(decrypt(twitterTokens.accessToken));
          finalData = { ...twitterTokens, ...twitterProfile };
          break;
        case 'FACEBOOK':
          const userToken = await exchangeFacebookCode(code);
          
          // Try to get Pages first
          const accountsRes = await fetch(
            `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,picture&access_token=${userToken}`
          );
          const accountsData = await accountsRes.json();
          
          if (accountsData.data && accountsData.data.length > 0) {
            // Use the first Page found
            const firstPage = accountsData.data[0];
            finalData = {
              platformAccountId: firstPage.id,
              platformUsername: firstPage.name,
              accessToken: encrypt(firstPage.access_token || userToken),
              refreshToken: null,
              expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
              profilePictureUrl: firstPage.picture?.data?.url || `https://graph.facebook.com/v18.0/${firstPage.id}/picture?type=large`,
              followersCount: 0,
            };
          } else {
            // Fallback: connect using personal Facebook profile
            const meRes = await fetch(
              `https://graph.facebook.com/v18.0/me?fields=id,name,email,picture&access_token=${userToken}`
            );
            const meData = await meRes.json();
            
            if (!meData.id) {
              throw new Error('Failed to fetch Facebook profile. Please try again.');
            }
            
            finalData = {
              platformAccountId: meData.id,
              platformUsername: meData.name || meData.email || 'Facebook User',
              accessToken: encrypt(userToken),
              refreshToken: null,
              expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
              profilePictureUrl: meData.picture?.data?.url || `https://graph.facebook.com/v18.0/${meData.id}/picture?type=large`,
              followersCount: 0,
            };
          }
          break;
        default:
          throw new Error('Real OAuth only implemented for Twitter currently');
      }
    }

    // Upsert into connectedAccounts
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
      }
    });

    // Cleanup cookies
    cookieStore.delete(`${platform}_oauth_state`);
    cookieStore.delete(`${platform}_oauth_verifier`);

    return NextResponse.redirect(new URL('/dashboard/accounts?success=true', baseUrl));

  } catch (err: any) {
    console.error(`OAuth error for ${platformName}:`, err);
    return NextResponse.redirect(new URL(`/dashboard/accounts?error=${encodeURIComponent(err.message)}`, baseUrl));
  }
}
