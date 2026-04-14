import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { analyzeLogEntry } from '../lib/gemini';
import { format } from 'date-fns';
import { Clock, Zap, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export function Home() {
  const { streak, hourlyLogs, addHourlyLog, goals, sleepLogs } = useStore();
  const [logText, setLogText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextPing, setNextPing] = useState(60);
  const navigate = useNavigate();

  useEffect(() => {
    if (goals.filter(g => g.tier === 'yearly').length === 0) {
      navigate('/goals');
    }
  }, [goals, navigate]);

  const lastLog = hourlyLogs[hourlyLogs.length - 1];
  const today = format(new Date(), 'yyyy-MM-dd');
  const todaySleep = sleepLogs.find(l => l.date === today);

  useEffect(() => {
    const timer = setInterval(() => {
      setNextPing(prev => prev > 0 ? prev - 1 : 60);
    }, 60000); // every minute
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const timestamp = new Date().toISOString();
    
    // Optimistic add
    addHourlyLog({
      timestamp,
      text: logText,
      tags: [],
      ai_score: null,
      ai_category: null,
      ai_alignment: null,
      ai_insight: null,
      ai_warning: null,
      ai_daily_projection: null
    });

    setLogText('');
    setNextPing(60);

    // Background analysis
    const analysis = await analyzeLogEntry(logText, hourlyLogs, goals, todaySleep?.wake_time || null);
    
    if (analysis) {
      const logs = useStore.getState().hourlyLogs;
      const addedLog = logs.find(l => l.timestamp === timestamp);
      if (addedLog) {
        useStore.getState().updateHourlyLog(addedLog.id, {
          ai_score: analysis.hourly_score,
          ai_category: analysis.effort_category,
          ai_alignment: analysis.goal_alignment_pct,
          ai_insight: analysis.insight,
          ai_warning: analysis.warning,
          ai_daily_projection: analysis.daily_projection
        });
        useStore.getState().updateDailyScore(today);
      }
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="p-6 pt-12 flex flex-col h-full">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-[#FF4444]">GRIND</h1>
          <p className="text-[#8E9299] font-mono text-xs mt-1">AGGRESSIVE TRACKING</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black font-mono">{streak}</div>
          <div className="text-[10px] uppercase tracking-widest text-[#8E9299] font-bold">Hour Streak</div>
        </div>
      </header>

      <div className="bg-[#151619] rounded-xl p-6 mb-8 border border-[#333] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#333]">
          <div 
            className="h-full bg-[#FF4444] transition-all duration-1000" 
            style={{ width: `${(nextPing / 60) * 100}%` }}
          />
        </div>
        <div className="flex items-center gap-3 mb-4 text-[#FF4444]">
          <Clock size={20} />
          <h2 className="font-bold uppercase tracking-wider text-sm">Next Check-in</h2>
        </div>
        <div className="text-5xl font-black font-mono">{nextPing} <span className="text-2xl text-[#8E9299]">MIN</span></div>
        <p className="text-[#8E9299] text-sm mt-2 font-mono">Clock's ticking. Account for your time.</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <label className="block text-xs uppercase tracking-widest font-bold text-[#8E9299] mb-2">What did you just do?</label>
        <textarea
          value={logText}
          onChange={(e) => setLogText(e.target.value)}
          placeholder="I spent 45 mins deep working on the architecture..."
          className="w-full bg-[#151619] border border-[#333] rounded-xl p-4 text-[#F5F5F5] font-mono focus:outline-none focus:border-[#FF4444] resize-none h-32"
          maxLength={200}
        />
        <button 
          type="submit"
          disabled={!logText.trim() || isSubmitting}
          className="w-full mt-4 bg-[#FF4444] text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-[#ff6666] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? 'Analyzing...' : 'Log Effort'}
          <Zap size={18} />
        </button>
      </form>

      {lastLog && (
        <div className="mt-auto">
          <h3 className="text-xs uppercase tracking-widest font-bold text-[#8E9299] mb-3">Last Entry</h3>
          <div className="bg-[#151619] border-l-2 border-[#FF4444] p-4 rounded-r-xl">
            <p className="font-mono text-sm mb-2">"{lastLog.text}"</p>
            {lastLog.ai_insight ? (
              <div className="mt-3 pt-3 border-t border-[#333]">
                <p className="text-[#FF4444] font-bold text-sm">{lastLog.ai_insight}</p>
                <div className="flex gap-4 mt-2">
                  <span className="text-xs font-mono text-[#8E9299]">Score: <span className="text-white">{lastLog.ai_score}/10</span></span>
                  <span className="text-xs font-mono text-[#8E9299]">Align: <span className="text-white">{lastLog.ai_alignment}%</span></span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#8E9299] font-mono animate-pulse">Awaiting AI judgment...</p>
            )}
            {lastLog.ai_warning && (
              <div className="mt-2 text-[#FF4444] text-xs font-bold flex items-center gap-1 bg-[#FF4444]/10 p-2 rounded">
                <AlertTriangle size={14} />
                {lastLog.ai_warning}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
