
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { generateAutoReply } from "../lib/gemini";

async function testGemini() {
  console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY?.substring(0, 10) + "...");
  try {
    const reply = await generateAutoReply(
      "Great dancer",
      "give positive reply",
      {
        commenterName: "Bichitra",
        postContent: "Just watched 'Michael' and I am still buzzing from the energy! 🕺✨ The choreography, the music, the storytelling—it all felt so alive. A true tribute to the King of Pop. If you haven't seen it yet, do yourself a favor and go! #MichaelJackson #KingOfPop #MovieNight #Legendary"
      }
    );
    console.log("Reply:", reply);
  } catch (e) {
    console.error("Gemini failed:", e);
  }
}

testGemini();
