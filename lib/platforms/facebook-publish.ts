import { encrypt } from '@/lib/encryption';

export async function publishToFacebook(pageId: string, accessToken: string, content: string, mediaUrls: string[] = []) {
  let url = `https://graph.facebook.com/v18.0/${pageId}/feed`;
  const body: any = {
    message: content,
    access_token: accessToken,
  };

  if (mediaUrls.length > 0) {
    url = `https://graph.facebook.com/v18.0/${pageId}/photos`;
    body.url = mediaUrls[0]; 
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Facebook publish failed');
  }

  return {
    platformPostId: data.id,
    postUrl: `https://facebook.com/${data.id}`,
  };
}
