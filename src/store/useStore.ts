import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';
import { Goal, HourlyLog, SleepLog, DailyScore } from '../types';
import { format } from 'date-fns';

// Custom storage using localforage
const storage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await localforage.getItem(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await localforage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await localforage.removeItem(name);
  },
};

interface AppState {
  goals: Goal[];
  hourlyLogs: HourlyLog[];
  sleepLogs: SleepLog[];
  dailyScores: DailyScore[];
  streak: number;
  lastLogTime: string | null;
  
  // Actions
  addGoal: (goal: Omit<Goal, 'id' | 'created_at'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  
  addHourlyLog: (log: Omit<HourlyLog, 'id'>) => void;
  updateHourlyLog: (id: string, updates: Partial<HourlyLog>) => void;
  
  setWakeTime: (date: string, time: string) => void;
  setSleepTime: (date: string, time: string) => void;
  
  updateDailyScore: (date: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      goals: [],
      hourlyLogs: [],
      sleepLogs: [],
      dailyScores: [],
      streak: 0,
      lastLogTime: null,

      addGoal: (goal) => set((state) => ({
        goals: [...state.goals, { ...goal, id: crypto.randomUUID(), created_at: new Date().toISOString() }]
      })),
      
      updateGoal: (id, updates) => set((state) => ({
        goals: state.goals.map(g => g.id === id ? { ...g, ...updates } : g)
      })),

      deleteGoal: (id) => set((state) => ({
        goals: state.goals.filter(g => g.id !== id)
      })),

      addHourlyLog: (log) => set((state) => {
        const newLog = { ...log, id: crypto.randomUUID() };
        // Simple streak logic: if last log was within 2 hours, increment, else reset to 1
        let newStreak = 1;
        if (state.lastLogTime) {
          const hoursDiff = (new Date(log.timestamp).getTime() - new Date(state.lastLogTime).getTime()) / (1000 * 60 * 60);
          if (hoursDiff <= 2.5) {
            newStreak = state.streak + 1;
          }
        }
        return {
          hourlyLogs: [...state.hourlyLogs, newLog],
          streak: newStreak,
          lastLogTime: log.timestamp
        };
      }),

      updateHourlyLog: (id, updates) => set((state) => ({
        hourlyLogs: state.hourlyLogs.map(l => l.id === id ? { ...l, ...updates } : l)
      })),

      setWakeTime: (date, time) => set((state) => {
        const existing = state.sleepLogs.find(l => l.date === date);
        if (existing) {
          return { sleepLogs: state.sleepLogs.map(l => l.date === date ? { ...l, wake_time: time } : l) };
        }
        return { sleepLogs: [...state.sleepLogs, { id: crypto.randomUUID(), date, wake_time: time, sleep_time: null, total_hours: null }] };
      }),

      setSleepTime: (date, time) => set((state) => {
        const existing = state.sleepLogs.find(l => l.date === date);
        let total_hours = null;
        if (existing && existing.wake_time) {
           // Calculate total hours
           const wake = new Date(existing.wake_time);
           const sleep = new Date(time);
           if (sleep > wake) {
             total_hours = (sleep.getTime() - wake.getTime()) / (1000 * 60 * 60);
           }
        }
        if (existing) {
          return { sleepLogs: state.sleepLogs.map(l => l.date === date ? { ...l, sleep_time: time, total_hours } : l) };
        }
        return { sleepLogs: [...state.sleepLogs, { id: crypto.randomUUID(), date, wake_time: null, sleep_time: time, total_hours }] };
      }),

      updateDailyScore: (date) => set((state) => {
        const logsForDay = state.hourlyLogs.filter(l => l.timestamp.startsWith(date));
        if (logsForDay.length === 0) return state;

        const scoredLogs = logsForDay.filter(l => l.ai_score !== null);
        const avg_score = scoredLogs.length > 0 
          ? scoredLogs.reduce((acc, l) => acc + (l.ai_score || 0), 0) / scoredLogs.length 
          : 0;
        
        const alignedLogs = logsForDay.filter(l => l.ai_alignment !== null);
        const alignment_pct = alignedLogs.length > 0
          ? alignedLogs.reduce((acc, l) => acc + (l.ai_alignment || 0), 0) / alignedLogs.length
          : 0;

        const existing = state.dailyScores.find(d => d.date === date);
        const newScore: DailyScore = {
          id: existing?.id || crypto.randomUUID(),
          date,
          avg_score,
          alignment_pct,
          hours_logged: logsForDay.length,
          hours_awake: 16 // Placeholder, should calculate from sleep logs
        };

        if (existing) {
          return { dailyScores: state.dailyScores.map(d => d.date === date ? newScore : d) };
        }
        return { dailyScores: [...state.dailyScores, newScore] };
      })
    }),
    {
      name: 'grind-storage',
      storage: createJSONStorage(() => storage),
    }
  )
);
