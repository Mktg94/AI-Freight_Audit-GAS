"use client";

import React from 'react';
import { FileText, AlertCircle, Sparkles, Check, X, ArrowRight } from 'lucide-react';

interface PreviewInvoice {
  index: number;
  startPage: number;
  endPage: number;
  vendor?: string;
  estimatedTotal?: number;
}

interface SplitPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  filename: string;
  detectedCount: number;
  previewData: PreviewInvoice[];
}

export default function SplitPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  filename,
  detectedCount,
  previewData,
}: SplitPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in" id="split-preview-modal-root">
      <div className="relative w-full max-w-2xl bg-[#111827] border border-teal-500/30 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(45,212,191,0.15)] max-h-[90vh] flex flex-col animate-scale-up">
        {/* Glowing border effects */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-teal-500 via-[#10B981] to-teal-400" />

        {/* Modal Header */}
        <div className="p-6 border-b border-[#1F2D45] flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center h-5 w-5 rounded bg-teal-500/10 border border-teal-500/30 text-[#2DD4BF]">
                <Sparkles size={12} className="animate-pulse" />
              </span>
              <h2 className="text-base font-black text-white font-display uppercase tracking-wide">
                We detected {detectedCount} invoices in {filename}
              </h2>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Review the detected split points before processing.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Content - List of split elements */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0 bg-[#0A0F1E]">
          <div className="divide-y divide-[#1F2D45] border border-[#1F2D45] rounded-lg bg-[#111827]/80 overflow-hidden">
            {previewData.map((item, idx) => (
              <div 
                key={idx}
                className="p-4 flex items-center justify-between gap-4 hover:bg-[#1C2537]/25 transition-all text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded bg-teal-500/5 border border-teal-900/40 flex items-center justify-center text-[#2DD4BF]">
                    <FileText size={15} />
                  </div>
                  <div>
                    <p className="font-extrabold text-white font-mono uppercase tracking-wider">
                      Invoice #{item.index}
                    </p>
                    <p className="text-[10px] text-[#94A3B8] font-mono">
                      Pages {item.startPage} – {item.endPage}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-sans font-bold text-slate-200">
                    {item.vendor || 'FedEx Freight'}
                  </p>
                  <p className="text-[10px] font-mono font-extrabold text-[#10B981]">
                    Est. ${item.estimatedTotal?.toFixed(2) || '1,100.00'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3.5 flex items-start gap-2.5 text-[10px] leading-normal text-[#94A3B8]">
            <AlertCircle className="text-[#F59E0B] shrink-0 mt-0.5" size={14} />
            <div>
              <span className="font-mono font-black text-white mr-1 uppercase">Note:</span>
              Split points are detected automatically. Contact support if the split looks wrong.
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 border-t border-[#1F2D45] flex items-center justify-end gap-3 font-mono text-xs uppercase tracking-wider font-extrabold bg-[#111827]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 hover:bg-[#1C2537] border border-[#1F2D45] text-[#94A3B8] rounded-lg transition-all cursor-pointer text-[10px]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 bg-[#2DD4BF] hover:bg-[#14B8A4] text-black font-extrabold rounded-lg hover:shadow-[0_0_20px_rgba(45,212,191,0.35)] transition-all cursor-pointer flex items-center gap-1.5 text-[10px]"
          >
            <span>Looks good — Process All</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
