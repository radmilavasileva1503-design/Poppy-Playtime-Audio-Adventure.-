import { GoogleGenAI, Modality } from "@google/genai";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function generateIntro() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const prompt = `Say in a creepy, immersive, and welcoming voice: "Welcome to the Poppy Playtime audio adventure. Step into the abandoned toy factory, where the shadows whisper and the toys are always watching. Are you ready to uncover the truth, or will you become part of the game?"`;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Fenrir' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    fs.writeFileSync("public/intro.mp3", Buffer.from(base64Audio, "base64"));
    console.log("Audio generated successfully!");
  } else {
    console.error("Failed to generate audio.");
  }
}

generateIntro().catch(console.error);
