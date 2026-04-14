import { useStore } from '../store/useStore';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart } from 'recharts';
import { format, subDays } from 'date-fns';

export function Dashboard() {
  const { hourlyLogs, dailyScores, sleepLogs } = useStore();

  // Prepare data for Today's Score Card
  const today = format(new Date(), 'yyyy-MM-dd');
  const todaysLogs = hourlyLogs.filter(l => l.timestamp.startsWith(today));
  
  const hourlyData = Array.from({ length: 24 }).map((_, i) => {
    const hourStr = i.toString().padStart(2, '0');
    const log = todaysLogs.find(l => {
      const logHour = new Date(l.timestamp).getHours();
      return logHour === i;
    });
    
    // Calculate ghost score for this hour
    const pastLogs = hourlyLogs.filter(l => {
      const d = new Date(l.timestamp);
      return d.getHours() === i && format(d, 'yyyy-MM-dd') !== today && l.ai_score !== null;
    });
    const ghostScore = pastLogs.length > 0
      ? pastLogs.reduce((sum, l) => sum + (l.ai_score || 0), 0) / pastLogs.length
      : 0;

    return {
      hour: `${hourStr}:00`,
      score: log?.ai_score || 0,
      ghost: ghostScore,
      hasLog: !!log
    };
  });

  // Prepare data for Weekly Trend
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const score = dailyScores.find(s => s.date === d);
    return {
      date: format(new Date(d), 'EEE'),
      score: score?.avg_score || 0,
      alignment: score?.alignment_pct || 0
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const score = payload.find((p: any) => p.dataKey === 'score')?.value;
      const ghost = payload.find((p: any) => p.dataKey === 'ghost')?.value;
      const alignment = payload.find((p: any) => p.dataKey === 'alignment')?.value;

      return (
        <div className="bg-[#151619] border border-[#333] p-3 rounded-lg shadow-xl">
          <p className="text-xs font-mono text-[#8E9299] mb-1">{label}</p>
          {score !== undefined && <p className="text-[#FF4444] font-bold">Score: {score}</p>}
          {ghost > 0 && <p className="text-[#8E9299] font-bold">Ghost: {ghost.toFixed(1)}</p>}
          {alignment !== undefined && <p className="text-[#4CAF50] font-bold">Align: {alignment}%</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 pt-12">
      <header className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Telemetry</h1>
        <p className="text-[#8E9299] font-mono text-xs mt-1">PERFORMANCE METRICS</p>
      </header>

      <div className="space-y-6">
        {/* Today's Score Card */}
        <div className="bg-[#151619] border border-[#333] rounded-xl p-5">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xs uppercase tracking-widest font-bold text-[#8E9299]">Today's Output</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#FF4444]"></div>
                <span className="text-[9px] uppercase font-bold text-[#8E9299]">You</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#8E9299]"></div>
                <span className="text-[9px] uppercase font-bold text-[#8E9299]">Ghost</span>
              </div>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={hourlyData}>
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} interval={3} />
                <YAxis hide domain={[0, 10]} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#222' }} />
                <Bar 
                  dataKey="score" 
                  fill="#FF4444" 
                  radius={[4, 4, 0, 0]} 
                  shape={(props: any) => {
                    const { x, y, width, height, payload } = props;
                    if (!payload.hasLog) {
                      return <rect x={x} y={y + height - 2} width={width} height={2} fill="#333" />;
                    }
                    return <rect x={x} y={y} width={width} height={height} fill="#FF4444" rx={4} ry={4} />;
                  }}
                />
                <Line type="monotone" dataKey="ghost" stroke="#8E9299" strokeDasharray="3 3" dot={false} strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Trend */}
        <div className="bg-[#151619] border border-[#333] rounded-xl p-5">
          <h2 className="text-xs uppercase tracking-widest font-bold text-[#8E9299] mb-4">7-Day Trend</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last7Days}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#555' }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 10]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" stroke="#FF4444" strokeWidth={3} dot={{ r: 4, fill: '#FF4444', strokeWidth: 0 }} />
                <Line type="monotone" dataKey="alignment" stroke="#4CAF50" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF4444]"></div>
              <span className="text-[10px] uppercase font-bold text-[#8E9299]">Avg Score</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#4CAF50]"></div>
              <span className="text-[10px] uppercase font-bold text-[#8E9299]">Alignment %</span>
            </div>
          </div>
        </div>

        {/* Goal Progress */}
        <div className="bg-[#151619] border border-[#333] rounded-xl p-5">
          <h2 className="text-xs uppercase tracking-widest font-bold text-[#8E9299] mb-4">Yearly Objectives</h2>
          <div className="space-y-4">
            {useStore.getState().goals.filter(g => g.tier === 'yearly').length === 0 ? (
              <p className="text-xs font-mono text-[#555]">No yearly goals set. Set your trajectory.</p>
            ) : (
              useStore.getState().goals.filter(g => g.tier === 'yearly').map(goal => {
                // Mock progress for now based on effort weight
                const progress = Math.min(100, goal.effort_weight * 15);
                return (
                  <div key={goal.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold">{goal.title}</span>
                      <span className="font-mono text-[#8E9299]">{progress}%</span>
                    </div>
                    <div className="h-2 bg-[#333] rounded-full overflow-hidden">
                      <div className="h-full bg-[#FF4444]" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#151619] border border-[#333] rounded-xl p-5">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-[#8E9299] mb-1">Avg Score</h3>
            <p className="text-3xl font-black font-mono text-white">
              {dailyScores.find(s => s.date === today)?.avg_score.toFixed(1) || '0.0'}
            </p>
          </div>
          <div className="bg-[#151619] border border-[#333] rounded-xl p-5">
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-[#8E9299] mb-1">Alignment</h3>
            <p className="text-3xl font-black font-mono text-[#4CAF50]">
              {dailyScores.find(s => s.date === today)?.alignment_pct.toFixed(0) || '0'}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
