
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Simple .env.local parser
const envPath = path.resolve(process.cwd(), '.env.local');
let env = {};
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, '');
            env[key] = value;
        }
    });
}

const GEMINI_KEY = env.GEMINI_API_KEY;

async function testGemini() {
    if (!GEMINI_KEY) return console.log('❌ GEMINI_API_KEY missing');

    try {
        const genAI = new GoogleGenerativeAI(GEMINI_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        console.log('Testing Gemini API with prompt: "Analyze the title Inception..."');

        const prompt = `
      Analyze the title "Inception".
      Generate 5 mood tags and a hex theme color.
      Return ONLY a JSON object with this format:
      {
        "moods": ["tag1", "tag2"],
        "themeColor": "#hexcode"
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('Raw Response:', text);

        const jsonString = text.replace(/```json\n?|\n?```/g, "").trim();
        const data = JSON.parse(jsonString);

        if (data.moods && Array.isArray(data.moods) && data.themeColor) {
            console.log('✅ Gemini Response Valid JSON:', data);
        } else {
            console.log('❌ Invalid JSON structure:', data);
        }

    } catch (e) {
        console.log('❌ Gemini Error:', e.message);
    }
}

testGemini();
