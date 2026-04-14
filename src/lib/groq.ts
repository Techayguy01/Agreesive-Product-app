import {Goal, HourlyLog} from '../types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

interface LogAnalysis {
  hourly_score: number;
  effort_category: 'Deep Work' | 'Admin' | 'Distraction' | 'Rest';
  goal_alignment_pct: number;
  insight: string;
  warning: string | null;
  daily_projection: 'On track' | 'At risk' | 'Off track';
}

function getGroqApiKey() {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('GROQ_API_KEY environment variable is required. Please set it in your .env file.');
  }
  return key;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeAnalysis(value: Partial<LogAnalysis>): LogAnalysis {
  const categories = ['Deep Work', 'Admin', 'Distraction', 'Rest'] as const;
  const projections = ['On track', 'At risk', 'Off track'] as const;

  return {
    hourly_score: clamp(Number(value.hourly_score ?? 0), 0, 10),
    effort_category: categories.includes(value.effort_category as LogAnalysis['effort_category'])
      ? value.effort_category as LogAnalysis['effort_category']
      : 'Admin',
    goal_alignment_pct: clamp(Number(value.goal_alignment_pct ?? 0), 0, 100),
    insight: String(value.insight ?? 'No useful signal. Log with more precision next time.'),
    warning: value.warning ? String(value.warning) : null,
    daily_projection: projections.includes(value.daily_projection as LogAnalysis['daily_projection'])
      ? value.daily_projection as LogAnalysis['daily_projection']
      : 'At risk',
  };
}

export async function analyzeLogEntry(
  currentLog: string,
  recentLogs: HourlyLog[],
  activeGoals: Goal[],
  wakeTime: string | null,
  ghostScore: number | null,
) {
  const prompt = `
You are the AI Analysis Engine for GRIND, an aggressive productivity tracker.
The user just submitted an hourly log. Analyze it.

Context:
- Active Goals: ${JSON.stringify(activeGoals.map(g => ({title: g.title, tier: g.tier, category: g.category})))}
- Recent Logs: ${JSON.stringify(recentLogs.slice(-5).map(l => l.text))}
- Current Log: "${currentLog}"
- Wake Time: ${wakeTime || 'Unknown'}
- Ghost Score (Your historical average for this hour): ${ghostScore !== null ? `${ghostScore.toFixed(1)}/10` : 'No historical data yet'}

Return only a JSON object with this exact structure:
{
  "hourly_score": number,
  "effort_category": "Deep Work" | "Admin" | "Distraction" | "Rest",
  "goal_alignment_pct": number,
  "insight": string,
  "warning": string | null,
  "daily_projection": "On track" | "At risk" | "Off track"
}

Rules:
- hourly_score must be 0-10. Be harsh but fair.
- goal_alignment_pct must be 0-100.
- insight must be one sharp, aggressive, confrontational sentence.
- If Ghost Score is available and the user's effort seems lower than it, taunt them for losing to their past self.
- If they beat the ghost, acknowledge it aggressively.
- warning should be null unless a bad pattern is detected.
`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getGroqApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You return compact, valid JSON only. Do not include markdown, commentary, or extra keys.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: {type: 'json_object'},
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API returned ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return null;
    }

    return normalizeAnalysis(JSON.parse(content));
  } catch (error) {
    console.error('Groq API Error:', error);
    return null;
  }
}
