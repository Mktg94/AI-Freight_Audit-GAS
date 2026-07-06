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
    <header className="h-14 bg-[#0A0A0A] flex items-center justify-between px-8">
      <h1 className="text-zinc-100 font-semibold text-sm">{title}</h1>
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs text-zinc-600">{time}</span>
        <div className="w-px h-4 bg-zinc-800" />
        <span className="text-[11px] font-medium text-blue-400 bg-blue-500/8 px-2.5 py-0.5 rounded-lg">
          Super Admin
        </span>
        <div className="w-7 h-7 rounded-xl bg-blue-500 flex items-center justify-center text-white text-[11px] font-bold shadow-lg shadow-blue-500/15">
          {initials}
        </div>
      </div>
    </header>
  );
}
