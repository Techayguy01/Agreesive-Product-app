import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Target, BarChart2, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

export function Layout() {
  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans overflow-hidden">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      
      <nav className="fixed bottom-0 w-full bg-[#141414] border-t border-[#333] px-6 py-4 flex justify-between items-center z-50">
        <NavItem to="/" icon={<Home size={24} />} label="Home" />
        <NavItem to="/goals" icon={<Target size={24} />} label="Goals" />
        <NavItem to="/dashboard" icon={<BarChart2 size={24} />} label="Dashboard" />
        <NavItem to="/settings" icon={<Settings size={24} />} label="Settings" />
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center gap-1 transition-colors",
          isActive ? "text-[#FF4444]" : "text-[#8E9299] hover:text-[#F5F5F5]"
        )
      }
    >
      {icon}
      <span className="text-[10px] uppercase tracking-wider font-bold">{label}</span>
    </NavLink>
  );
}
