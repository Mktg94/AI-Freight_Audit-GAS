"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, Info, CheckCircle2, AlertOctagon, Loader2 } from 'lucide-react';
import { LineItem, Contract } from '@/types';
import ConfidenceBar from '../shared/ConfidenceBar';
import PermissionGate from '../shared/PermissionGate';


interface AuditResultPanelProps {
  isOpen: boolean;
  onClose: () => void;
  lineItem: LineItem | null;
  contract: Contract | null;
  onStatusUpdated: (updatedLine: LineItem) => void;
}

export default function AuditResultPanel({
  isOpen,
  onClose,
  lineItem,
  contract,
  onStatusUpdated
}: AuditResultPanelProps) {
  const [loadingAction, setLoadingAction] = useState<'approve' | 'dispute' | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  if (!lineItem) return null;

  const handleUpdateStatus = async (status: 'approved' | 'disputed') => {
    setLoadingAction(status === 'approved' ? 'approve' : 'dispute');
    setErrorFeedback(null);

    try {
      const response = await fetch(`/api/line-items/${lineItem.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error(await response.text() || 'Failed to update line item status.');
      }

      const result = await response.json();
      if (result.success && result.lineItem) {
        // Callback to notify parent components
        onStatusUpdated(result.lineItem);
        // Distribute toast event
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            title: status === 'approved' ? 'Item Approved' : 'Item Disputed',
            message: `"${lineItem.description}" has been successfully updated to ${status}.`
          }
        }));
        onClose();
      } else {
        throw new Error(result.error || 'Server returned invalid status response.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorFeedback(err.message || 'Network error updating line item status.');
    } finally {
      setLoadingAction(null);
    }
  };

  // Helper to resolve which contract term is applicable
  const getContractViolationString = () => {
    if (!contract) return 'Comparison agreement missing.';
    const descLower = lineItem.description.toLowerCase();

    if (descLower.includes('base') || descLower.includes('transit') || descLower.includes('freight rate')) {
      return `Section 2.1: Base rates cap transit costs at $${contract.base_rate_per_lb.toFixed(4)}/lb and $${contract.base_rate_per_mile.toFixed(2)}/mile, minimum transit fee $${contract.minimum_charge}.`;
    }
    if (descLower.includes('fuel') || descLower.includes('surcharge')) {
      return `Section 4.3: Fuel surcharge index caps adjustments at ${contract.fuel_surcharge_pct}% of total transportation charge.`;
    }
    if (descLower.includes('liftgate') || descLower.includes('lift-gate')) {
      return `Schedule A: Accessorial Liftgate fee caps rate sheet at a flat $${contract.liftgate_fee}.`;
    }
    if (descLower.includes('residential') || descLower.includes('home')) {
      return `Schedule A: Residential delivery surcharge caps rate sheet at a flat $${contract.residential_surcharge}.`;
    }
    if (descLower.includes('detention') || descLower.includes('waiting')) {
      return `Schedule B: Detention and carrier standby rate of $${contract.detention_rate_per_hr}/hour after 2 free hours.`;
    }
    if (descLower.includes('inside') || descLower.includes('dock')) {
      return `Schedule A: Inside carrier delivery fee caps rate sheet at a flat $${contract.inside_delivery_fee}.`;
    }
    if (descLower.includes('redelivery') || descLower.includes('attempt')) {
      return `Schedule A: Carrier attempt redelivery rate caps at a flat $${contract.redelivery_fee}.`;
    }
    return `General Rate Agreement: All unlisted accessorial charges require pre-authorization and are capped at standard carrier tariff schedules.`;
  };

  // Safe checks for status styling
  const statusConfig = {
    pending: {
      label: 'Pending Review',
      style: 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/60'
    },
    approved: {
      label: 'Approved Charge',
      style: 'bg-emerald-500/10 text-[#10B981] border border-emerald-500/20'
    },
    disputed: {
      label: 'Disputed Error',
      style: 'bg-red-500/10 text-[#EF4444] border border-red-500/20 font-bold'
    }
  };

  const statusInfo = statusConfig[lineItem.status] || statusConfig.pending;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Slide Backdrop with motion */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0A0F1E] z-[100] cursor-pointer"
            id="audit-result-backdrop"
          />

          {/* Core Panel Card Slider */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed top-0 right-0 h-full max-w-[480px] w-full bg-[#111827] border-l border-[#1F2D45] shadow-2xl z-[101] flex flex-col justify-between"
            id="audit-result-panel"
          >
            {/* Header section */}
            <div className="p-6 border-b border-[#1F2D45] flex items-start justify-between">
              <div className="space-y-2 max-w-[340px]">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider font-mono ${statusInfo.style}`}>
                  {statusInfo.label}
                </span>
                <h3 className="text-sm font-bold text-white leading-relaxed font-display tracking-tight">
                  {lineItem.description}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg border border-[#1F2D45] bg-[#0A0F1E] text-[#94A3B8] hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Drawer Scroll container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {errorFeedback && (
                <div className="p-3 rounded-lg border border-red-500/30 bg-red-950/20 text-red-400 text-xs font-mono">
                  ⚠ Error: {errorFeedback}
                </div>
              )}

              {/* Billed, Expected, Discrepancy block */}
              <div className="grid grid-cols-3 gap-3">
                {/* Billed */}
                <div className="bg-[#0A0F1E] border border-[#1F2D45] rounded-xl p-3 text-center">
                  <span className="text-[9px] text-[#94A3B8] font-mono uppercase tracking-wider block">Billed Charge</span>
                  <span className="text-base font-extrabold text-[#EF4444] font-mono block mt-1">
                    ${lineItem.billed_amount.toFixed(2)}
                  </span>
                </div>

                {/* Expected */}
                <div className="bg-[#0A0F1E] border border-[#1F2D45] rounded-xl p-3 text-center">
                  <span className="text-[9px] text-[#94A3B8] font-mono uppercase tracking-wider block">Expected Rate</span>
                  <span className="text-base font-extrabold text-[#10B981] font-mono block mt-1">
                    ${lineItem.expected_amount.toFixed(2)}
                  </span>
                </div>

                {/* Discrepancy */}
                <div className={`bg-[#0A0F1E] border rounded-xl p-3 text-center ${
                  lineItem.discrepancy > 0 
                    ? 'border-red-900/40 shadow-[0_0_15px_rgba(239,68,68,0.05)]' 
                    : lineItem.discrepancy < 0 
                    ? 'border-emerald-950/40' 
                    : 'border-[#1F2D45]'
                }`}>
                  <span className="text-[9px] text-[#94A3B8] font-mono uppercase tracking-wider block">Discrepancy</span>
                  <span className={`text-base font-extrabold font-mono block mt-1 ${
                    lineItem.discrepancy > 0 
                      ? 'text-[#EF4444]' 
                      : lineItem.discrepancy < 0 
                      ? 'text-[#10B981]' 
                      : 'text-zinc-400'
                  }`}>
                    {lineItem.discrepancy > 0 ? `+$${lineItem.discrepancy.toFixed(2)}` : lineItem.discrepancy < 0 ? `-$${Math.abs(lineItem.discrepancy).toFixed(2)}` : '$0.00'}
                  </span>
                </div>
              </div>

              {/* Explanatory description card */}
              {lineItem.discrepancy > 0 && (
                <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-xl p-4 flex gap-3 text-xs text-[#94A3B8]">
                  <AlertOctagon size={18} className="text-[#EF4444] shrink-0 mt-0.5" />
                  <p>
                    Carrier overbilled this tariff row by <strong className="text-white">${lineItem.discrepancy.toFixed(2)}</strong> (a markup of <strong className="text-white">{((lineItem.discrepancy / (lineItem.expected_amount || 1)) * 100).toFixed(1)}%</strong> above negotiated limits).
                  </p>
                </div>
              )}

              {/* AI Reasoning */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#2DD4BF] font-mono uppercase tracking-widest block">
                  AI Compliance Analysis
                </label>
                <div className="bg-[#1C2537] border border-teal-900/10 rounded-xl p-4 text-xs text-[#F1F5F9] leading-relaxed relative">
                  {lineItem.ai_flag_reason ? (
                    <span>{lineItem.ai_flag_reason}</span>
                  ) : lineItem.discrepancy === 0 ? (
                    <span>No dynamic discrepancies detected. The raw billed line item matches contract terms with perfect accuracy.</span>
                  ) : (
                    <span>Billed amount differs from contractual terms but no automated reasoning was logged. Please review manually.</span>
                  )}
                </div>
              </div>

              {/* Confidence Score */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#2DD4BF] font-mono uppercase tracking-widest block">
                  AI Confidence Level
                </label>
                <div className="bg-[#0A0F1E] border border-[#1F2D45] rounded-xl p-4">
                  <ConfidenceBar score={lineItem.confidence_score} showLabel />
                  <p className="text-[10px] text-[#94A3B8] mt-2 leading-normal">
                    This score indicates the artificial intelligence model's extraction accuracy estimate for billing tables and accessorial rates in this PDF segment.
                  </p>
                </div>
              </div>

              <div className="border-t border-[#1F2D45] my-6" />

              {/* Contract Term reference section */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#2DD4BF] font-mono uppercase tracking-widest">
                  <Info size={12} />
                  <span>Contract Term Violation</span>
                </div>
                <div className="bg-[#0A0F1E] border border-teal-900/10 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-[11px] font-mono border-b border-[#1F2D45]/50 pb-2">
                    <span className="text-zinc-500 uppercase">Carrier agreement</span>
                    <span className="text-[#2DD4BF] font-medium">{contract?.carrier_name || 'Carrier contract profile'}</span>
                  </div>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    {getContractViolationString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Buttons Section */}
            <div className="p-6 bg-[#0E1324] border-t border-[#1F2D45]">
              <PermissionGate 
                action="review_line_items"
                fallback={
                  <div className="w-full text-center text-xs text-[#94A3B8] font-mono uppercase tracking-wider py-2">
                    Line item review restricted to authorized roles
                  </div>
                }
              >
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('approved')}
                    disabled={loadingAction !== null}
                    className="w-full py-3 bg-emerald-500/10 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black font-semibold rounded-xl text-xs uppercase tracking-wider font-mono text-center flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-55"
                  >
                    {loadingAction === 'approve' ? (
                      <Loader2 size={14} className="animate-spin text-emerald-400" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    <span>Approve Charge</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('disputed')}
                    disabled={loadingAction !== null}
                    className="w-full py-3 bg-red-500/10 border border-red-500/40 hover:bg-red-500 hover:text-white font-semibold rounded-xl text-xs uppercase tracking-wider font-mono text-center flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-55"
                  >
                    {loadingAction === 'dispute' ? (
                      <Loader2 size={14} className="animate-spin text-red-400" />
                    ) : (
                      <AlertOctagon size={14} />
                    )}
                    <span>Add to Dispute</span>
                  </button>
                </div>
              </PermissionGate>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
