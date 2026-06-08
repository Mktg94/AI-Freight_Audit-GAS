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
      className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-[#111827] border border-teal-900/40 shadow-[0_0_30px_rgba(45,212,191,0.03)] space-y-5 max-w-lg mx-auto"
      id="invoices-empty-state"
    >
      <div className="p-4 bg-[#1C2537] border border-[#1F2D45] text-[#2DD4BF] rounded-full shadow-[0_0_20px_rgba(45,212,191,0.1)]">
        <FileText size={40} />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-black font-display text-white uppercase tracking-tight">No invoices yet</h3>
        <p className="text-xs text-[#94A3B8] max-w-sm leading-relaxed">
          Upload your first freight invoice to begin auditing and automatically claiming carriage rate protection.
        </p>
      </div>

      <button
        onClick={handleUploadClick}
        className="py-2.5 px-5 bg-[#2DD4BF] hover:bg-[#14B8A4] text-black font-bold rounded-lg text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_25px_rgba(45,212,191,0.45)] flex items-center gap-2 cursor-pointer font-mono"
        id="empty-state-upload-btn"
      >
        <Upload size={14} />
        <span>Upload Invoice</span>
      </button>
    </div>
  );
}
