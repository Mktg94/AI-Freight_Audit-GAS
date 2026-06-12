"use client";

import React from 'react';
import { FileText, Upload } from 'lucide-react';

interface EmptyStateProps {
  onUploadClick?: () => void;
}

export default function EmptyState({ onUploadClick }: EmptyStateProps) {
  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onUploadClick) {
      onUploadClick();
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/invoices/upload');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <div 
      className="flex flex-col items-center justify-center py-16 text-center space-y-4 max-w-lg mx-auto"
      id="invoices-empty-state"
    >
      <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
        <FileText size={20} className="text-gray-400" />
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-gray-900">No invoices yet</h3>
        <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
          Upload your first freight invoice to begin auditing and catching overcharges.
        </p>
      </div>

      <button
        onClick={handleUploadClick}
        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl inline-flex items-center gap-2 transition-colors duration-150 cursor-pointer"
        id="empty-state-upload-btn"
      >
        <Upload size={14} />
        <span>Upload Invoice</span>
      </button>
    </div>
  );
}
