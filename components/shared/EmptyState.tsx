import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div 
      className="flex flex-col items-center justify-center text-center p-8 py-10 border border-dashed border-[#1F2D45] rounded-xl bg-[#111827]/40 max-w-sm mx-auto space-y-4" 
      id="shared-empty-state-card"
    >
      {/* Icon placed in a custom glowing teal-tinted circle background */}
      <div className="p-4 bg-teal-950/25 text-[#2DD4BF] border border-[#2DD4BF]/15 rounded-full shadow-[0_0_20px_rgba(45,212,191,0.06)]">
        <Icon size={24} className="shrink-0" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-xs font-bold text-white tracking-tight uppercase">
          {title}
        </h3>
        <p className="text-[10px] text-[#94A3B8] leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 text-[10px] font-bold text-white uppercase tracking-wider py-1.5 px-4 bg-[#1C2537] hover:bg-[#1F2D45] border border-[#1F2D45] rounded-lg transition-all cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
