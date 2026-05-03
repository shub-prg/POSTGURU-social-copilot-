import { NextRequest, NextResponse } from 'next/server';
import { PLATFORM_CONFIGS, Platform } from '@/lib/platforms';
import crypto from 'crypto';
import { cookies } from 'next/headers';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const platformName = platform.toUpperCase() as Platform;
  const config = PLATFORM_CONFIGS[platformName];

  if (!config) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  }

  // INSTAGRAM: No standalone OAuth — connects automatically via Facebook.
  // Redirect to the Facebook connect flow instead.
  if (platformName === 'INSTAGRAM') {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    return NextResponse.redirect(new URL(`${baseUrl}/api/oauth/connect/facebook`, req.url));
  }

  // Check if we stay in Mock Flow or go for Real Flow
  const clientId = process.env[`${platformName}_CLIENT_ID`];
  
  if (config.isDemo || (!clientId && process.env.NODE_ENV !== 'production')) {
    // Falls back to mock UI if platform is demo or no client ID provided in development
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const callbackUrl = new URL(`${baseUrl}/api/oauth/callback/${platform}`);
    callbackUrl.searchParams.set('code', 'mock_code');
    callbackUrl.searchParams.set('state', 'mock_state');
    return NextResponse.redirect(callbackUrl);
  }

  if (!clientId) {
    return NextResponse.json({ error: `Missing CLIENT_ID for ${platformName}` }, { status: 500 });
  }

  const state = crypto.randomBytes(16).toString('hex');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/oauth/callback/${platform}`;

  // Store state in cookie for callback verification
  // Use secure=true if the app URL is HTTPS (e.g. ngrok), otherwise false for plain localhost
  const isHttps = (process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin).startsWith('https://');
  const cookieStore = await cookies();
  cookieStore.set(`${platform}_oauth_state`, state, { 
    maxAge: 60 * 10, // 10 minutes
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
  });

  const authUrl = new URL(config.authUrl);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  // Twitter OAuth 2.0 requires SPACE-separated scopes; most others use comma
  const scopeSeparator = platformName === 'TWITTER' ? ' ' : ',';
  authUrl.searchParams.set('scope', config.scopes.join(scopeSeparator));
  authUrl.searchParams.set('state', state);

  // PKCE for Twitter (X)
  if (config.requiresPkce) {
    const codeVerifier = crypto.randomBytes(32).toString('hex');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    
    cookieStore.set(`${platform}_oauth_verifier`, codeVerifier, {
      maxAge: 60 * 10,
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? 'none' : 'lax',
    });
    
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
  }

  return NextResponse.redirect(authUrl);
}
