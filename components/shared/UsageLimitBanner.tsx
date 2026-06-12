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
        className="w-full bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 mb-4" 
        id="usage-limit-banner-error"
      >
        <div className="flex items-center gap-3">
          <div className="text-red-500 shrink-0">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-red-700">
              Usage Limits Exceeded
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              You've reached your {plan} plan limit of {limit} invoices this month. Upgrade to continue.
            </p>
          </div>
        </div>

        <button
          onClick={handleUpgrade}
          className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
        >
          <span>Upgrade Plan</span>
          <ArrowUpRight size={12} />
        </button>
      </div>
    );
  }

  return (
    <div 
      className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 mb-4"
      id="usage-limit-banner-warning"
    >
      <div className="flex items-center gap-3">
        <div className="text-amber-600 shrink-0">
          <AlertTriangle size={18} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-amber-800">
            Approaching Monthly Limits
          </h4>
          <p className="text-xs text-gray-500 leading-relaxed">
            You've used {used} of {limit} invoices on your {plan} plan this month.
          </p>
        </div>
      </div>

      <button
        onClick={handleUpgrade}
        className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
      >
        <span>Expand Seats</span>
        <Zap size={12} />
      </button>
    </div>
  );
}
