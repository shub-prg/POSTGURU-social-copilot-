import { GoogleGenerativeAI } from "@google/generative-ai";

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-flash-latest as a stable alias
  return genAI.getGenerativeModel({ model: "gemini-flash-latest" });
}

/**
 * Generates an auto-reply for a social media comment.
 */
export async function generateAutoReply(
  commentText: string,
  aiPrompt: string,
  context: { commenterName?: string; postContent?: string } = {}
) {
  const prompt = `
    You are an AI assistant for a social media manager. 
    Your goal is to reply to a comment on a social media post.
    
    Context:
    - Post Content: "${context.postContent || "N/A"}"
    - Commenter Name: "${context.commenterName || "someone"}"
    - Original Comment: "${commentText}"
    
    Instruction: ${aiPrompt || "Reply warmly and engage with the commenter."}
    
    Rules:
    - Keep it short and professional yet friendly.
    - Do not use hashtags unless requested.
    - If you don't know what to say, just be polite.
    - Return ONLY the reply text.
  `;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Gemini generation failed:", error);
    throw new Error("Failed to generate AI reply");
  }
}

/**
 * Analyzes the sentiment of a comment.
 * Returns "POSITIVE", "NEGATIVE", or "NEUTRAL".
 */
export async function analyzeSentiment(commentText: string): Promise<"POSITIVE" | "NEGATIVE" | "NEUTRAL"> {
  const prompt = `
    Analyze the sentiment of the following social media comment and return exactly one word: POSITIVE, NEGATIVE, or NEUTRAL.
    
    Comment: "${commentText}"
  `;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const sentiment = response.text().trim().toUpperCase();
    
    if (sentiment.includes("POSITIVE")) return "POSITIVE";
    if (sentiment.includes("NEGATIVE")) return "NEGATIVE";
    return "NEUTRAL";
  } catch (error) {
    console.error("Sentiment analysis failed:", error);
    return "NEUTRAL";
  }
}

/**
 * Analyzes historical post engagement to determine the best time to post.
 * Requirement: At least 20-30 posts with engagement data are needed for reliable insights.
 */
export async function analyzeBestTimeToPost(
  postsData: { timestamp: string; engagementRate: number }[]
) {
  if (postsData.length < 20) {
    throw new Error("Insufficient data: At least 20 posts with engagement data are required for Gemini analysis.");
  }

  const prompt = `
    Analyze the following historical post engagement data.
    Determine the top 3 best times to post (day of week and time of day) for maximum engagement.
    Provide a brief, data-driven rationale.
    
    Data: ${JSON.stringify(postsData)}
  `;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Best time to post analysis failed:", error);
    throw new Error("Failed to analyze best time to post");
  }
}
