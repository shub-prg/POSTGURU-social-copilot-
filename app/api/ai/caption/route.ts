import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing in environment variables");
    return NextResponse.json({ error: "AI service configuration missing" }, { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const { topic, keywords, platforms, mediaUrls } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    let promptParts: any[] = [];

    const promptText = `
      You are an expert social media manager. Generate 3 engaging caption variants.
      ${topic ? `Topic/Message: "${topic}"` : "Analyze the attached images and write a compelling post about them."}
      Keywords/Tone to include: ${keywords || "none"}.
      Target platforms: ${platforms.join(", ")}.
      
      Format each variant clearly with a title "Option 1:", "Option 2:", "Option 3:".
      Include relevant emojis and hashtags.
      Keep platform constraints in mind (e.g., shorter for Twitter, more professional for LinkedIn).
      Return ONLY the captions.
    `;

    promptParts.push(promptText);

    // Add images if provided
    if (mediaUrls && mediaUrls.length > 0) {
      for (const url of mediaUrls.filter((u: string) => !u.includes(".mp4"))) {
        try {
          const imageResp = await fetch(url);
          const buffer = await imageResp.arrayBuffer();
          promptParts.push({
            inlineData: {
              data: Buffer.from(buffer).toString("base64"),
              mimeType: "image/jpeg", // ImageKit usually returns jpeg/webp, but jpeg is safe for Gemini
            },
          });
        } catch (e) {
          console.error("Failed to fetch image for AI analysis:", url, e);
        }
      }
    }

    const result = await model.generateContent(promptParts);
    const response = await result.response;
    const text = response.text();

    // Split text into options
    const options = text.split(/Option \d:/i).filter(opt => opt.trim().length > 0).map(opt => opt.trim());

    return NextResponse.json({ options });
  } catch (error: any) {
    console.error("Gemini AI error:", error);
    return NextResponse.json({
      error: error.message || "Failed to generate captions",
      details: error.stack
    }, { status: 500 });
  }
}
