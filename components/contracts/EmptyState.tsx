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
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 max-w-lg mx-auto" id="contracts-empty-state">
      <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
        {icon || <FileSignature size={20} />}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-gray-900">
          {title}
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
          {description}
        </p>
      </div>

      {actionText && (
        <button
          onClick={handleAction}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl inline-flex items-center gap-2 transition-colors duration-150 cursor-pointer"
        >
          <Plus size={14} />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}
