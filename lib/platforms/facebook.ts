import { encrypt } from '../encryption';

/**
 * Exchanges the Facebook authorization code for a User Access Token.
 */
export async function exchangeFacebookCode(code: string) {
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/oauth/callback/facebook`;

  if (!clientId || !clientSecret) {
    throw new Error('Facebook credentials missing');
  }
  const response = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${redirectUri}&client_secret=${clientSecret}&code=${code}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to exchange Facebook code');
  }

  // Returns user access token (short-lived or long-lived based on settings)
  return data.access_token;
}

/**
 * Fetches the user's Facebook Pages and their associated Page Access Tokens.
 */
export async function getFacebookPages(userToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${userToken}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to fetch Facebook pages');
  }

  if (!data.data || data.data.length === 0) {
    throw new Error('No Facebook Pages found');
  }

  // data.data is an array of page objects:
  // { access_token, category, name, id, tasks }
  return data.data;
}

/**
 * Fetches the Instagram Business Account linked to a Facebook Page.
 */
export async function getInstagramBusinessAccount(pageId: string, pageAccessToken: string) {
  // 1. Get the IG ID linked to the page
  const igUrl = `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`;
  const igRes = await fetch(igUrl);
  const igData = await igRes.json();

  console.log(`[Instagram Detection] Page ${pageId} response:`, JSON.stringify(igData));

  if (!igData.instagram_business_account) {
    console.log(`[Instagram Detection] No Instagram Business Account linked to page ${pageId}`);
    return null;
  }

  const igId = igData.instagram_business_account.id;

  // 2. Get IG account details
  const detailsRes = await fetch(
    `https://graph.facebook.com/v18.0/${igId}?fields=id,username,profile_picture_url,followers_count&access_token=${pageAccessToken}`
  );
  const details = await detailsRes.json();

  if (!details.id) {
    return null;
  }

  return {
    id: details.id,
    username: details.username,
    profilePictureUrl: details.profile_picture_url,
    followers_count: details.followers_count,
  };
}
