import { useState } from 'react';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';

export function Settings() {
  const { sleepLogs, setWakeTime, setSleepTime, nukeDatabase } = useStore();
  const today = format(new Date(), 'yyyy-MM-dd');
  const todaySleep = sleepLogs.find(l => l.date === today);

  const [wakeInput, setWakeInput] = useState(todaySleep?.wake_time ? format(new Date(todaySleep.wake_time), 'HH:mm') : '');
  const [sleepInput, setSleepInput] = useState(todaySleep?.sleep_time ? format(new Date(todaySleep.sleep_time), 'HH:mm') : '');
  const [isNuking, setIsNuking] = useState(false);

  const handleWakeSave = () => {
    if (!wakeInput) return;
    const [hours, minutes] = wakeInput.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    setWakeTime(today, date.toISOString());
  };

  const handleSleepSave = () => {
    if (!sleepInput) return;
    const [hours, minutes] = sleepInput.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    setSleepTime(today, date.toISOString());
  };

  return (
    <div className="p-6 pt-12">
      <header className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tighter">System</h1>
        <p className="text-[#8E9299] font-mono text-xs mt-1">CALIBRATION & LOGS</p>
      </header>

      <div className="space-y-6">
        <div className="bg-[#151619] border border-[#333] rounded-xl p-5">
          <h2 className="text-xs uppercase tracking-widest font-bold text-[#8E9299] mb-4">Sleep / Wake Cycle</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-[#8E9299] mb-2">Wake Time Today</label>
              <div className="flex gap-3">
                <input 
                  type="time" 
                  value={wakeInput}
                  onChange={(e) => setWakeInput(e.target.value)}
                  className="flex-1 bg-black border border-[#333] rounded-lg p-3 text-white focus:outline-none focus:border-[#FF4444]"
                />
                <button 
                  onClick={handleWakeSave}
                  className="bg-[#333] text-white px-4 rounded-lg text-xs uppercase font-bold hover:bg-[#444]"
                >
                  Save
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-[#8E9299] mb-2">Sleep Time Today</label>
              <div className="flex gap-3">
                <input 
                  type="time" 
                  value={sleepInput}
                  onChange={(e) => setSleepInput(e.target.value)}
                  className="flex-1 bg-black border border-[#333] rounded-lg p-3 text-white focus:outline-none focus:border-[#FF4444]"
                />
                <button 
                  onClick={handleSleepSave}
                  className="bg-[#333] text-white px-4 rounded-lg text-xs uppercase font-bold hover:bg-[#444]"
                >
                  Save
                </button>
              </div>
            </div>
            
            {todaySleep?.total_hours && (
              <div className="mt-4 p-3 bg-black rounded-lg border border-[#333]">
                <p className="text-xs font-mono text-[#8E9299]">Total Sleep: <span className="text-white font-bold">{todaySleep.total_hours.toFixed(1)} hrs</span></p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#151619] border border-[#333] rounded-xl p-5">
          <h2 className="text-xs uppercase tracking-widest font-bold text-[#8E9299] mb-4">Danger Zone</h2>
          <button 
            onClick={async () => {
              if(window.confirm("This will wipe all local data. Are you sure?")) {
                setIsNuking(true);
                await nukeDatabase();
                window.location.reload();
              }
            }}
            disabled={isNuking}
            className="w-full border border-[#FF4444] text-[#FF4444] py-3 rounded-lg text-xs uppercase font-bold hover:bg-[#FF4444]/10 transition-colors"
          >
            {isNuking ? 'Nuking...' : 'Nuke Database'}
          </button>
        </div>
      </div>
    </div>
  );
}
