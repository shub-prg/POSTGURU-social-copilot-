/**
 * Unified service for handling comments and replies on Facebook and Instagram.
 */

export async function fetchPlatformComments(platform: string, platformPostId: string, accessToken: string) {
  let url = "";
  
  if (platform === "FACEBOOK") {
    url = `https://graph.facebook.com/v18.0/${platformPostId}/comments?access_token=${accessToken}&fields=id,message,from,created_time`;
  } else if (platform === "INSTAGRAM") {
    url = `https://graph.facebook.com/v18.0/${platformPostId}/comments?access_token=${accessToken}&fields=id,text,from,timestamp`;
  } else {
    return [];
  }

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error(`Failed to fetch ${platform} comments for object ${platformPostId}. Status: ${response.status}`, data);
      return [];
    }

    // Unify the response format
    return (data.data || []).map((c: any) => ({
      id: c.id,
      text: platform === "FACEBOOK" ? c.message : c.text,
      from: c.from?.name || c.from?.username || "Unknown",
      timestamp: platform === "FACEBOOK" ? c.created_time : c.timestamp,
    }));
  } catch (error) {
    console.error(`Error fetching ${platform} comments:`, error);
    return [];
  }
}

export async function postPlatformReply(
  platform: string,
  commentId: string,
  accessToken: string,
  replyText: string
) {
  let url = "";
  
  if (platform === "FACEBOOK") {
    // Facebook replies are posted to the comment ID as if it's a post
    url = `https://graph.facebook.com/v18.0/${commentId}/comments`;
  } else if (platform === "INSTAGRAM") {
    // Instagram replies are posted to the comment ID's replies endpoint
    url = `https://graph.facebook.com/v18.0/${commentId}/replies`;
  } else {
    throw new Error(`Unsupported platform for replies: ${platform}`);
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: replyText, // FB uses message
        text: replyText,    // IG uses text? No, usually message in Graph API body
        access_token: accessToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Some versions of IG API might use 'message' or 'text'
      if (platform === "INSTAGRAM") {
        const retryRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: replyText,
            access_token: accessToken,
          }),
        });
        if (retryRes.ok) return (await retryRes.json()).id;
      }
      
      console.error(`Failed to post ${platform} reply:`, data);
      throw new Error(data.error?.message || `Failed to post ${platform} reply`);
    }

    return data.id;
  } catch (error: any) {
    console.error(`Error posting ${platform} reply:`, error);
    throw error;
  }
}
