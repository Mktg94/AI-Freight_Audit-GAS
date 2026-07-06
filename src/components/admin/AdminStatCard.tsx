interface Props {
  label: string;
  value: string | number;
  trend?: string;
  trendPositive?: boolean;
}

export default function AdminStatCard({ label, value, trend, trendPositive }: Props) {
  return (
    <div className="bg-[#121212] rounded-2xl p-6 transition-all duration-300 group hover:bg-[#161616]">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1 h-1 rounded-full bg-blue-500" />
        <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.12em]">
          {label}
        </div>
      </div>
      <div className="text-[28px] font-mono font-bold leading-none text-zinc-50 mb-1.5 tracking-tight">
        {value}
      </div>
      {trend && (
        <div className="text-xs font-mono leading-none" style={{ color: trendPositive ? '#4ADE80' : '#52525B' }}>
          {trend}
        </div>
      )}
    </div>
  );
}
