export type GoalTier = 'yearly' | 'monthly' | 'weekly' | 'daily';
export type GoalCategory = 'Deep Work' | 'Health' | 'Learning' | 'Relationships' | 'Finance' | 'Other';

export interface Goal {
  id: string;
  title: string;
  tier: GoalTier;
  category: GoalCategory;
  effort_weight: number; // 1-5
  deadline: string | null;
  parent_goal_id: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface HourlyLog {
  id: string;
  timestamp: string;
  text: string;
  tags: string[];
  ai_score: number | null; // 0-10
  ai_category: string | null;
  ai_alignment: number | null; // 0-100
  ai_insight: string | null;
  ai_warning: string | null;
  ai_daily_projection: string | null;
}

export interface SleepLog {
  id: string;
  date: string; // YYYY-MM-DD
  wake_time: string | null;
  sleep_time: string | null;
  total_hours: number | null;
}

export interface DailyScore {
  id: string;
  date: string; // YYYY-MM-DD
  avg_score: number;
  alignment_pct: number;
  hours_logged: number;
  hours_awake: number;
}
