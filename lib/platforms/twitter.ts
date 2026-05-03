import { encrypt } from '@/lib/encryption';

export async function exchangeTwitterCode(code: string, verifier: string) {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/oauth/callback/twitter`;

  if (!clientId || !clientSecret) {
    throw new Error('Twitter credentials missing');
  }

  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Twitter token exchange failed:', data);
    throw new Error(data.error_description || 'Twitter token exchange failed');
  }

  return {
    accessToken: encrypt(data.access_token),
    refreshToken: data.refresh_token ? encrypt(data.refresh_token) : undefined,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

export async function getTwitterProfile(accessToken: string) {
  // Twitter API v2 uses Bearer token
  const response = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,public_metrics', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error('Failed to fetch Twitter profile');
  }

  return {
    platformAccountId: data.data.id,
    platformUsername: data.data.username,
    profilePictureUrl: data.data.profile_image_url,
    followersCount: data.data.public_metrics.followers_count,
  };
}

export async function refreshTwitterToken(refreshToken: string) {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Twitter credentials missing');
  }

  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      client_id: clientId,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Twitter token refresh failed:', data);
    throw new Error(data.error_description || 'Twitter token refresh failed');
  }

  return {
    accessToken: encrypt(data.access_token),
    refreshToken: data.refresh_token ? encrypt(data.refresh_token) : undefined,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

export async function publishToTwitter(accessToken: string, content: string, mediaUrls: string[] = []) {
  // 1. Upload media if any (Twitter v1.1 is still used for media upload usually, but v2 supports some)
  // For simplicity and matching the "PostGuru" style, we'll focus on text first or basic media support.
  // Twitter API v2 /tweets endpoint

  const body: any = {
    text: content,
  };

  // If media is present, you'd normally upload to v1.1 /media/upload first and get media_ids
  // For this implementation, we'll stick to text-only for now or add media_ids if available.
  
  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Twitter publish failed:', data);
    throw new Error(data.detail || 'Twitter publish failed');
  }

  return {
    platformPostId: data.data.id,
    postUrl: `https://twitter.com/i/web/status/${data.data.id}`,
  };
}

export async function getTwitterPostMetrics(accessToken: string, platformPostId: string) {
  const response = await fetch(`https://api.twitter.com/2/tweets/${platformPostId}?tweet.fields=public_metrics`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error('Failed to fetch Twitter post metrics');
  }

  const metrics = data.data.public_metrics;
  return {
    likes: metrics.like_count,
    comments: metrics.reply_count,
    shares: metrics.retweet_count,
    views: metrics.impression_count,
  };
}

