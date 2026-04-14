import { GoogleGenAI, Type } from "@google/genai";
import { Goal, HourlyLog } from "../types";

let aiClient: GoogleGenAI | null = null;

function getAIClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export async function analyzeLogEntry(
  currentLog: string,
  recentLogs: HourlyLog[],
  activeGoals: Goal[],
  wakeTime: string | null
) {
  const prompt = `
You are the AI Analysis Engine for GRIND, an aggressive productivity tracker.
The user just submitted an hourly log. Analyze it.

Context:
- Active Goals: ${JSON.stringify(activeGoals.map(g => ({ title: g.title, tier: g.tier, category: g.category })))}
- Recent Logs: ${JSON.stringify(recentLogs.slice(-5).map(l => l.text))}
- Current Log: "${currentLog}"
- Wake Time: ${wakeTime || 'Unknown'}

Return a JSON object with the following structure:
{
  "hourly_score": number (0-10, be harsh but fair),
  "effort_category": string ("Deep Work" | "Admin" | "Distraction" | "Rest"),
  "goal_alignment_pct": number (0-100, how much does this align with active goals?),
  "insight": string (1 sharp, aggressive, confrontational sentence),
  "warning": string | null (if a bad pattern is detected, e.g., "You've been doing admin for 3 hours. Stop."),
  "daily_projection": string ("On track" | "At risk" | "Off track")
}
  `;

  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hourly_score: { type: Type.NUMBER },
            effort_category: { type: Type.STRING },
            goal_alignment_pct: { type: Type.NUMBER },
            insight: { type: Type.STRING },
            warning: { type: Type.STRING, nullable: true },
            daily_projection: { type: Type.STRING }
          },
          required: ["hourly_score", "effort_category", "goal_alignment_pct", "insight", "daily_projection"]
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return null;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
}
