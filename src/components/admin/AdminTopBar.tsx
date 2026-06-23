import { useState, useEffect } from 'react';

export default function AdminTopBar({ title, user }: { title: string; user: any }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const userEmail = user?.email || 'admin@freightaudit.com';
  const initials = userEmail.charAt(0).toUpperCase();

  return (
    <header className="h-12 bg-[#09090B] border-b border-[#18181B] flex items-center justify-between px-6">
      <h1 className="text-zinc-100 font-semibold text-sm">{title}</h1>
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-zinc-500">{time}</span>
        <span className="text-zinc-700">|</span>
        <span className="text-[10px] font-medium text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-full px-2 py-0.5">
          Super Admin
        </span>
        <div className="w-6 h-6 rounded-full bg-fuchsia-500 flex items-center justify-center text-white text-[10px] font-bold">
          {initials}
        </div>
      </div>
    </header>
  );
}
