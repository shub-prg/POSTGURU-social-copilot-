
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function listModelsDirectly() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("Status:", response.status);
    if (data.models) {
      console.log("Available models:", data.models.map((m: any) => m.name));
    } else {
      console.log("Response Data:", JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}

listModelsDirectly();
