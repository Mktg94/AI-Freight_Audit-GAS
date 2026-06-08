"use client";

import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert, ArrowUpRight, Zap } from 'lucide-react';

interface UsageLimitBannerProps {
  usedOverride?: number;
  limitOverride?: number;
  planOverride?: string;
  refreshTrigger?: number;
}

export default function UsageLimitBanner({
  usedOverride,
  limitOverride,
  planOverride,
  refreshTrigger
}: UsageLimitBannerProps) {
  const [used, setUsed] = useState<number | null>(null);
  const [limit, setLimit] = useState<number | null>(null);
  const [plan, setPlan] = useState<string>('Growth');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If overrides are present, use them
    if (usedOverride !== undefined && limitOverride !== undefined) {
      setUsed(usedOverride);
      setLimit(limitOverride);
      if (planOverride) setPlan(planOverride);
      setLoading(false);
      return;
    }

    const fetchUsage = async () => {
      try {
        const res = await fetch('/api/settings/organization');
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            setUsed(result.data.invoices_used_this_month ?? 3);
            setLimit(result.data.invoice_limit_per_month ?? 100);
            setPlan(result.data.plan ?? 'Growth');
          }
        }
      } catch (err) {
        console.warn('Failed to load organization limit details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [usedOverride, limitOverride, planOverride, refreshTrigger]);

  if (loading || used === null || limit === null) return null;

  const isLimitReached = used >= limit;
  const isApproachingLimit = used >= limit * 0.8;

  if (!isLimitReached && !isApproachingLimit) return null;

  const handleUpgrade = () => {
    // Trigger toast notification for upgrading billing
    const toastEvent = new CustomEvent('toast-message', {
      detail: {
        title: 'Billing Engine Launched',
        message: 'Plan upgrade options and pricing models loaded.'
      }
    });
    window.dispatchEvent(toastEvent);
  };

  if (isLimitReached) {
    return (
      <div 
        className="w-full bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_4px_20px_rgba(239,68,68,0.1)] mb-4 animate-fade-in" 
        id="usage-limit-banner-error"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h4 className="font-extrabold text-[#EF4444] text-xs font-mono uppercase tracking-wider">
              Usage Limits Exceeded
            </h4>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              You've reached your <strong className="text-white">{plan}</strong> plan limit of <strong className="text-white">{limit}</strong> invoices this month. Upgrade to continue auditing.
            </p>
          </div>
        </div>

        <button
          onClick={handleUpgrade}
          className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-extrabold text-[10px] font-mono tracking-widest uppercase rounded-lg hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all cursor-pointer flex items-center gap-1 shrink-0"
        >
          <span>Upgrade Plan</span>
          <ArrowUpRight size={13} />
        </button>
      </div>
    );
  }

  // Approaching Limit: (> 80% used)
  return (
    <div 
      className="w-full bg-amber-500/5 border border-amber-500/25 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_4px_20px_rgba(245,158,11,0.05)] mb-4 animate-fade-in"
      id="usage-limit-banner-warning"
    >
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-500 shrink-0">
          <AlertTriangle size={18} />
        </div>
        <div>
          <h4 className="font-extrabold text-[#F59E0B] text-xs font-mono uppercase tracking-wider">
            Approaching Monthly Limits
          </h4>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            You've used <strong className="text-white">{used}</strong> of <strong className="text-white">{limit}</strong> invoices on your <strong className="text-white">{plan}</strong> plan this month.
          </p>
        </div>
      </div>

      <button
        onClick={handleUpgrade}
        className="px-5 py-2.5 bg-[#F59E0B] hover:bg-amber-500 text-black font-extrabold text-[10px] font-mono tracking-widest uppercase rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all cursor-pointer flex items-center gap-1 shrink-0"
      >
        <span>Expand Seats</span>
        <Zap size={12} fill="black" />
      </button>
    </div>
  );
}
