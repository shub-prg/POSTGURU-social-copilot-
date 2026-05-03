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
    return NextResponse.json({ error: "AI service configuration missing" }, { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const { content } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      You are an expert social media manager. Based on the following post content, suggest 10 trending and relevant hashtags.
      Content: "${content}"
      
      Return ONLY the hashtags separated by spaces, starting with #.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract hashtags
    const hashtags = text.match(/#[\w\d]+/g) || [];

    return NextResponse.json({ hashtags });
  } catch (error: any) {
    console.error("Hashtag generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
