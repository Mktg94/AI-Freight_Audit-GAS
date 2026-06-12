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
      className="flex flex-col items-center justify-center text-center p-8 py-10 border border-dashed border-gray-200 rounded-2xl bg-white max-w-sm mx-auto space-y-4" 
      id="shared-empty-state-card"
    >
      <div className="p-4 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl">
        <Icon size={24} className="shrink-0" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-xs font-semibold text-gray-900 tracking-tight uppercase">
          {title}
        </h3>
        <p className="text-[10px] text-gray-400 leading-relaxed">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 text-[10px] font-semibold text-white uppercase tracking-wider py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 border border-indigo-600 rounded-lg transition-all cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
