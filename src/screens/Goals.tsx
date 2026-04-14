import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { GoalTier, GoalCategory } from '../types';
import { Plus, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export function Goals() {
  const { goals, addGoal, deleteGoal } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', tier: 'yearly' as GoalTier, category: 'Deep Work' as GoalCategory, effort_weight: 3 });
  const [expandedTiers, setExpandedTiers] = useState<Record<string, boolean>>({ yearly: true, monthly: true });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title.trim()) return;
    addGoal({
      title: newGoal.title,
      tier: newGoal.tier,
      category: newGoal.category,
      effort_weight: newGoal.effort_weight,
      deadline: null,
      parent_goal_id: null,
      completed_at: null
    });
    setNewGoal({ ...newGoal, title: '' });
    setIsAdding(false);
  };

  const toggleTier = (tier: string) => {
    setExpandedTiers(prev => ({ ...prev, [tier]: !prev[tier] }));
  };

  const renderTier = (tier: GoalTier, label: string) => {
    const tierGoals = goals.filter(g => g.tier === tier);
    const isExpanded = expandedTiers[tier];

    return (
      <div className="mb-6">
        <button 
          onClick={() => toggleTier(tier)}
          className="flex items-center gap-2 w-full text-left mb-3 group"
        >
          {isExpanded ? <ChevronDown size={18} className="text-[#8E9299]" /> : <ChevronRight size={18} className="text-[#8E9299]" />}
          <h2 className="text-sm uppercase tracking-widest font-bold text-[#8E9299] group-hover:text-white transition-colors">{label}</h2>
          <div className="flex-1 h-px bg-[#333] ml-2"></div>
          <span className="text-xs font-mono text-[#8E9299]">{tierGoals.length}</span>
        </button>

        {isExpanded && (
          <div className="space-y-3 pl-6 border-l border-[#333] ml-2">
            {tierGoals.length === 0 ? (
              <p className="text-xs font-mono text-[#555]">No goals set. You're drifting.</p>
            ) : (
              tierGoals.map(goal => (
                <div key={goal.id} className="bg-[#151619] border border-[#333] rounded-lg p-4 flex justify-between items-start group">
                  <div>
                    <h3 className="font-bold text-sm mb-1">{goal.title}</h3>
                    <div className="flex gap-2 text-[10px] uppercase tracking-wider font-bold">
                      <span className={cn(
                        "px-2 py-0.5 rounded",
                        goal.category === 'Deep Work' ? "bg-blue-500/20 text-blue-400" :
                        goal.category === 'Health' ? "bg-green-500/20 text-green-400" :
                        "bg-[#333] text-[#8E9299]"
                      )}>{goal.category}</span>
                      <span className="bg-[#333] text-[#8E9299] px-2 py-0.5 rounded">Weight: {goal.effort_weight}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteGoal(goal.id)} className="text-[#555] hover:text-[#FF4444] opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 pt-12">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Targets</h1>
          <p className="text-[#8E9299] font-mono text-xs mt-1">ALIGN YOUR EFFORT</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="w-10 h-10 rounded-full bg-[#FF4444] text-black flex items-center justify-center hover:bg-[#ff6666] transition-colors"
        >
          <Plus size={20} />
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-[#151619] border border-[#FF4444] rounded-xl p-5 mb-8">
          <h3 className="text-xs uppercase tracking-widest font-bold text-[#FF4444] mb-4">New Target</h3>
          
          <input
            type="text"
            value={newGoal.title}
            onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
            placeholder="What needs to be done?"
            className="w-full bg-black border border-[#333] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#FF4444] mb-4"
            autoFocus
          />
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-[#8E9299] mb-2">Tier</label>
              <select 
                value={newGoal.tier}
                onChange={(e) => setNewGoal({ ...newGoal, tier: e.target.value as GoalTier })}
                className="w-full bg-black border border-[#333] rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#FF4444]"
              >
                <option value="yearly">Yearly</option>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-[#8E9299] mb-2">Category</label>
              <select 
                value={newGoal.category}
                onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as GoalCategory })}
                className="w-full bg-black border border-[#333] rounded-lg p-2 text-sm text-white focus:outline-none focus:border-[#FF4444]"
              >
                <option value="Deep Work">Deep Work</option>
                <option value="Health">Health</option>
                <option value="Learning">Learning</option>
                <option value="Finance">Finance</option>
                <option value="Relationships">Relationships</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setIsAdding(false)} className="text-xs uppercase tracking-widest font-bold text-[#8E9299] hover:text-white px-4 py-2">Cancel</button>
            <button type="submit" className="bg-[#FF4444] text-black text-xs uppercase tracking-widest font-bold px-6 py-2 rounded-lg hover:bg-[#ff6666]">Save</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {renderTier('yearly', 'Yearly Master Goals')}
        {renderTier('monthly', 'Monthly Objectives')}
        {renderTier('weekly', 'Weekly Targets')}
        {renderTier('daily', 'Daily Tasks')}
      </div>
    </div>
  );
}
