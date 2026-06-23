interface Props {
  label: string;
  value: string | number;
  trend?: string;
  trendPositive?: boolean;
}

export default function AdminStatCard({ label, value, trend, trendPositive }: Props) {
  return (
    <div className="bg-[#111113] border border-[#27272A] rounded-xl p-5 hover:border-[#3F3F46] transition-colors duration-200">
      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">
        {label}
      </div>
      <div className="text-2xl font-mono font-bold text-zinc-50">
        {value}
      </div>
      {trend && (
        <div className={`text-xs font-mono mt-1 ${trendPositive ? 'text-green-400' : 'text-zinc-500'}`}>
          {trend}
        </div>
      )}
    </div>
  );
}
