
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { GoogleGenerativeAI } from "@google/generative-ai";

async function testGeminiDynamic() {
  console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY?.substring(0, 10) + "...");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const result = await model.generateContent("Say hello");
    const response = await result.response;
    console.log("Reply:", response.text());
  } catch (e) {
    console.error("Gemini failed:", e);
  }
}

testGeminiDynamic();
