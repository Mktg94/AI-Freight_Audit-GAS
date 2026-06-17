"use client";

import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const APPROVAL_REASONS = [
  { value: 'ai_was_wrong', label: 'The AI was wrong — this charge is correct per our agreement' },
  { value: 'one_time_exception', label: 'We agreed to this charge as a one-time exception' },
  { value: 'contract_updated', label: 'The contract has since been updated — rate is now correct' },
  { value: 'other', label: 'Other — add a note' },
];

interface ApprovalReasonModalProps {
  description: string;
  discrepancy: number;
  onConfirm: (reason: string, notes: string) => void;
  onCancel: () => void;
}

export default function ApprovalReasonModal({
  description,
  discrepancy,
  onConfirm,
  onCancel,
}: ApprovalReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) return;
    if (selectedReason === 'other' && !notes.trim()) return;
    onConfirm(selectedReason, notes.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full animate-fade-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600 shrink-0 mt-0.5">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">This charge was flagged</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                <span className="font-mono font-semibold text-red-500">+${discrepancy.toFixed(2)}</span> discrepancy &mdash; why are you approving it?
              </p>
              <p className="text-[11px] text-gray-400 mt-1 font-mono truncate max-w-sm">
                {description}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            {APPROVAL_REASONS.map((reason) => (
              <label
                key={reason.value}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedReason === reason.value
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="approval_reason"
                  value={reason.value}
                  checked={selectedReason === reason.value}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="mt-0.5 accent-indigo-600"
                />
                <span className="text-xs leading-relaxed">{reason.label}</span>
              </label>
            ))}
          </div>

          {selectedReason === 'other' && (
            <div className="animate-fade-in">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Your note
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain why this flagged charge should be approved..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-500 transition-all resize-none"
                autoFocus
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-xl text-sm font-medium transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedReason || (selectedReason === 'other' && !notes.trim())}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              Approve Anyway
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
