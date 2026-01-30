"use server"

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

type AIResponse = {
    moods: string[]
    themeColor: string
}

export async function generateAITags(title: string, overview?: string): Promise<AIResponse> {
    if (!GEMINI_API_KEY) {
        console.error("Missing Gemini API Key")
        return { moods: [], themeColor: "#a855f7" }
    }

    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
            ],
        })

        const prompt = `
      Analyze the media item "${title}"${overview ? ` based STRICTLY on this description: "${overview.substring(0, 300)}..."` : ""}.
      
      CRITICAL INSTRUCTION:
      - If a description is provided, ignore the literal meaning of the title if the description contradicts it. (e.g., if title is "Nature" but description is about "Cyberpunk city", do NOT use nature tags).
      - Extract the true genre, atmosphere, and themes from the CONTENT/DESCRIPTION.
      
      Generate 5 mood tags in Korean NOUN forms (e.g., "우주", "미래", "철학", "액션", "반전"). 
      - Avoid adjectives like "어두운", use nouns like "어둠".
      - Tags must be relevant to the ACTUAL PLOT/CONTENT.
      
      Also generate a hex theme color code that fits the vibe.
      
      Return ONLY a JSON object with this format:
      {
        "moods": ["tag1", "tag2", "tag3", "tag4", "tag5"],
        "themeColor": "#hexcode"
      }
      Do not include markdown filtering or explanations.
    `

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()
        console.log("AI Raw Response:", text) // Debug log

        // Clean up potential markdown code blocks
        const jsonString = text.replace(/```json\n?|```\n?/g, "").trim()

        try {
            const data = JSON.parse(jsonString)
            return {
                moods: data.moods || [],
                themeColor: data.themeColor || "#a855f7",
            }
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError, "Raw:", jsonString)
            return { moods: [], themeColor: "#a855f7" }
        }

    } catch (error) {
        console.error("AI Generation Error:", error)
        return { moods: [], themeColor: "#a855f7" }
    }
}
