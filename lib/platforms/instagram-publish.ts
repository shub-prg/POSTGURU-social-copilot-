/**
 * Instagram Content Publishing API implementation.
 * Note: Instagram requires an image or video; text-only posts are not supported.
 */
export async function publishToInstagram(igUserId: string, accessToken: string, caption: string, mediaUrls: string[]) {
  if (!mediaUrls || mediaUrls.length === 0) {
    throw new Error('Instagram requires at least one image or video.');
  }

  // 1. Create Media Container
  const containerResponse = await fetch(
    `https://graph.facebook.com/v18.0/${igUserId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: mediaUrls[0], // Currently supporting single image
        caption: caption,
        access_token: accessToken,
      }),
    }
  );

  const containerData = await containerResponse.json();
  if (!containerResponse.ok) {
    throw new Error(containerData.error?.message || 'Failed to create Instagram media container');
  }

  const creationId = containerData.id;

  // 2. Publish the Media Container
  // For production, you might want to poll /creation_id?fields=status_code until it's 'FINISHED'
  // but for simple images it's usually ready immediately.
  const publishResponse = await fetch(
    `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken,
      }),
    }
  );

  const publishData = await publishResponse.json();
  if (!publishResponse.ok) {
    throw new Error(publishData.error?.message || 'Failed to publish Instagram media');
  }

  return {
    platformPostId: publishData.id,
    postUrl: `https://www.instagram.com/reels/`, // IG doesn't return a direct post URL in the publish response, but we can return the ID
  };
}
