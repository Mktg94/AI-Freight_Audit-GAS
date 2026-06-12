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
      style: 'bg-gray-50 text-gray-600 border-gray-200'
    },
    approved: {
      label: 'Approved Charge',
      style: 'bg-green-50 text-green-700 border-green-200'
    },
    disputed: {
      label: 'Disputed Error',
      style: 'bg-red-50 text-red-600 border-red-200 font-bold'
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
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-[100] cursor-pointer"
            id="audit-result-backdrop"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed top-0 right-0 h-full max-w-[480px] w-full bg-white border-l border-gray-100 shadow-xl z-[101] flex flex-col justify-between"
            id="audit-result-panel"
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
              <div className="space-y-2 max-w-[340px]">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium font-mono ${statusInfo.style}`}>
                  {statusInfo.label}
                </span>
                <h3 className="text-base font-semibold text-gray-900">
                  {lineItem.description}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {errorFeedback && (
                <div className="p-3 rounded-xl border border-red-100 bg-red-50 text-red-600 text-xs">
                  Error: {errorFeedback}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide block">Billed</span>
                  <span className="text-lg font-bold text-red-500 font-mono block mt-1">
                    ${lineItem.billed_amount.toFixed(2)}
                  </span>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide block">Expected</span>
                  <span className="text-lg font-bold text-green-600 font-mono block mt-1">
                    ${lineItem.expected_amount.toFixed(2)}
                  </span>
                </div>

                <div className={`bg-gray-50 border rounded-xl p-3 text-center ${
                  lineItem.discrepancy > 0 
                    ? 'border-red-100' 
                    : 'border-gray-100'
                }`}>
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide block">Difference</span>
                  <span className={`text-lg font-bold font-mono block mt-1 ${
                    lineItem.discrepancy > 0 
                      ? 'text-red-500' 
                      : lineItem.discrepancy < 0 
                      ? 'text-green-600' 
                      : 'text-gray-400'
                  }`}>
                    {lineItem.discrepancy > 0 ? `+$${lineItem.discrepancy.toFixed(2)}` : lineItem.discrepancy < 0 ? `-$${Math.abs(lineItem.discrepancy).toFixed(2)}` : '$0.00'}
                  </span>
                </div>
              </div>

              {lineItem.discrepancy > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 text-sm text-gray-600">
                  <AlertOctagon size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <p>
                    Carrier overbilled by <strong className="text-red-600">${lineItem.discrepancy.toFixed(2)}</strong> ({((lineItem.discrepancy / (lineItem.expected_amount || 1)) * 100).toFixed(1)}% above negotiated limits).
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-900 uppercase tracking-wide block">
                  AI Analysis
                </label>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-600 leading-relaxed">
                  {lineItem.ai_flag_reason ? (
                    <span>{lineItem.ai_flag_reason}</span>
                  ) : lineItem.discrepancy === 0 ? (
                    <span>No discrepancies detected. Line item matches contract terms.</span>
                  ) : (
                    <span>Billed amount differs from contractual terms. Manual review recommended.</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-900 uppercase tracking-wide block">
                  AI Confidence
                </label>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <ConfidenceBar score={lineItem.confidence_score} showLabel />
                </div>
              </div>

              <div className="border-t border-gray-100 my-4" />

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900 uppercase tracking-wide">
                  <Info size={12} />
                  <span>Contract Reference</span>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-xs font-mono border-b border-gray-100 pb-2">
                    <span className="text-gray-400 uppercase">Carrier</span>
                    <span className="text-indigo-600 font-medium">{contract?.carrier_name || 'N/A'}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {getContractViolationString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
              <PermissionGate 
                action="review_line_items"
                fallback={
                  <div className="w-full text-center text-xs text-gray-400 py-2">
                    Line item review restricted to authorized roles
                  </div>
                }
              >
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('approved')}
                    disabled={loadingAction !== null}
                    className="w-full py-2.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 font-medium rounded-xl text-sm text-center flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loadingAction === 'approve' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    <span>Approve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('disputed')}
                    disabled={loadingAction !== null}
                    className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-medium rounded-xl text-sm text-center flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loadingAction === 'dispute' ? (
                      <Loader2 size={14} className="animate-spin" />
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
