
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { GoogleGenerativeAI } from "@google/generative-ai";

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  try {
    // There isn't a direct listModels in the simple SDK, but we can try to guess or use a known one.
    // Actually, let's try gemini-2.0-flash-exp if available, or just gemini-1.5-flash.
    
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("test");
        console.log(`Model ${modelName} works!`);
        break;
      } catch (e: any) {
        console.log(`Model ${modelName} failed: ${e.message}`);
      }
    }
  } catch (e) {
    console.error("List failed:", e);
  }
}

listModels();
