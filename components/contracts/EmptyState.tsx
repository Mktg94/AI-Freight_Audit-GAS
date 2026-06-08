import React from 'react';
import { FileSignature, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onActionClick?: (e: React.MouseEvent) => void;
}

export default function EmptyState({ 
  icon, 
  title, 
  description, 
  actionText, 
  onActionClick 
}: EmptyStateProps) {
  
  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onActionClick) {
      onActionClick(e);
    } else {
      window.history.pushState({}, '', '/contracts/new');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-16 border border-dashed border-teal-900/30 rounded-2xl bg-[#111827]/40 text-center space-y-5 max-w-lg mx-auto my-6 animate-fade-in" id="contracts-empty-state">
      <div className="p-4 bg-teal-950/20 text-[#2DD4BF] border border-teal-500/10 rounded-full shadow-[0_0_20px_rgba(45,212,191,0.06)]">
        {icon || <FileSignature size={32} />}
      </div>
      
      <div className="space-y-1.5">
        <h3 className="text-lg font-black font-display text-white uppercase tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-[#94A3B8] leading-relaxed">
          {description}
        </p>
      </div>

      {actionText && (
        <button
          onClick={handleAction}
          className="py-2.5 px-5 bg-[#2DD4BF] hover:bg-[#14B8A4] text-black font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow-[0_0_15px_rgba(45,212,191,0.2)] hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}
