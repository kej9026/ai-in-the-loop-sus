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
            model: "gemini-1.5-flash",
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
      Analyze the ${overview ? "media item" : "title"} "${title}"${overview ? ` with description: "${overview.substring(0, 200)}..."` : ""}.
      
      Generate 5 mood tags in Korean (e.g., "어두운", "몽환적인", "빠른 전개") and a hex theme color code that fits the vibe.
      
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
