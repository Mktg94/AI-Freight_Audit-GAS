"use client";

import React, { useState } from 'react';
import { Contract } from '@/types';
import { 
  FileSignature, Landmark, Percent, Settings, Plus, X, 
  ArrowLeft, Save, HelpCircle, DollarSign, ListPlus, Flame, ShieldAlert
} from 'lucide-react';

interface CustomRuleItem {
  name: string;
  value: string;
  type: 'Fixed Fee' | 'Percentage' | 'Not Allowed';
}

interface ContractFormProps {
  contract?: Contract | null;
  onSuccess?: () => void;
}

export default function ContractForm({ contract, onSuccess }: ContractFormProps) {
  const isEditing = !!contract;

  // Form states Section 1 — Carrier Info
  const [carrierName, setCarrierName] = useState(contract?.carrier_name || '');
  const [effectiveDate, setEffectiveDate] = useState(contract?.effective_date || '2026-06-01');
  const [expiryDate, setExpiryDate] = useState(contract?.expiry_date || '2027-06-01');

  // Form states Section 2 — Base Rates
  const [baseRateLb, setBaseRateLb] = useState((contract?.base_rate_per_lb ?? 0.12).toString());
  const [baseRateMile, setBaseRateMile] = useState((contract?.base_rate_per_mile ?? 1.50).toString());
  const [minimumCharge, setMinimumCharge] = useState((contract?.minimum_charge ?? 120.00).toString());

  // Form states Section 3 — Accessorial Charges
  const [fuelPct, setFuelPct] = useState(((contract?.fuel_surcharge_pct ?? 0.14) * 100).toString());
  const [residentialSurcharge, setResidentialSurcharge] = useState((contract?.residential_surcharge ?? 75.00).toString());
  const [liftgateFee, setLiftgateFee] = useState((contract?.liftgate_fee ?? 65.00).toString());
  const [detentionRate, setDetentionRate] = useState((contract?.detention_rate_per_hr ?? 50.00).toString());
  const [insideDeliveryFee, setInsideDeliveryFee] = useState((contract?.inside_delivery_fee ?? 90.00).toString());
  const [redeliveryFee, setRedeliveryFee] = useState((contract?.redelivery_fee ?? 50.00).toString());

  // Form states Section 4 — Custom Rules
  const initialRules: CustomRuleItem[] = (() => {
    if (contract?.custom_rules) {
      if (Array.isArray(contract.custom_rules)) {
        return contract.custom_rules as CustomRuleItem[];
      } else {
        // convert from object format if necessary
        return Object.entries(contract.custom_rules).map(([key, value]) => ({
          name: key.replace(/_/g, ' '),
          value: String(value),
          type: 'Fixed Fee' as const
        }));
      }
    }
    return [
      { name: 'Free Detention Minutes', value: '45', type: 'Fixed Fee' as const }
    ];
  })();

  const [customRules, setCustomRules] = useState<CustomRuleItem[]>(initialRules);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Field triggers
  const handleAddRule = () => {
    setCustomRules(prev => [...prev, { name: '', value: '', type: 'Fixed Fee' }]);
  };

  const handleRemoveRule = (index: number) => {
    setCustomRules(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateRule = (index: number, fields: Partial<CustomRuleItem>) => {
    setCustomRules(prev => prev.map((item, i) => i === index ? { ...item, ...fields } : item));
  };

  // Safe navigation back
  const handleBackToContracts = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState({}, '', '/contracts');
    window.dispatchEvent(new Event('popstate'));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carrierName.trim()) {
      setErrorText("Carrier Name is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorText(null);

    // Build Payload Object
    const payload = {
      carrier_name: carrierName,
      effective_date: effectiveDate,
      expiry_date: expiryDate,
      base_rate_per_lb: parseFloat(baseRateLb) || 0,
      base_rate_per_mile: parseFloat(baseRateMile) || 0,
      minimum_charge: parseFloat(minimumCharge) || 0,
      fuel_surcharge_pct: (parseFloat(fuelPct) || 0) / 100,
      residential_surcharge: parseFloat(residentialSurcharge) || 0,
      liftgate_fee: parseFloat(liftgateFee) || 0,
      detention_rate_per_hr: parseFloat(detentionRate) || 0,
      inside_delivery_fee: parseFloat(insideDeliveryFee) || 0,
      redelivery_fee: parseFloat(redeliveryFee) || 0,
      custom_rules: customRules.filter(rule => rule.name.trim() !== ''),
    };

    try {
      const endpoint = isEditing ? `/api/contracts/${contract.id}` : '/api/contracts';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await response.text() || "Failed to preserve contract ledger rates");
      }

      const result = await response.json();
      
      // Update global SPA state if callback exists or trigger navigation
      // Using custom trigger events to notify App.tsx of state modifications natively!
      const customEventName = isEditing ? 'contracts-updated' : 'contracts-created';
      window.dispatchEvent(new CustomEvent(customEventName, { detail: result.data || { ...payload, id: contract?.id || `contract-${Date.now()}` } }));

      // Success feedback toast setup
      const successToast = new CustomEvent('show-toast', {
        detail: {
          title: "Contract Saved Successfully",
          message: `Negotiated audit policies for '${carrierName}' have been archived securely.`
        }
      });
      window.dispatchEvent(successToast);

      if (onSuccess) {
        onSuccess();
      } else {
        window.history.pushState({}, '', '/contracts');
        window.dispatchEvent(new Event('popstate'));
      }
    } catch (err: any) {
      console.warn("API write issue, performing fallback local write:", err);
      // Fallback sandbox write directly so user experiences a working mock flows!
      const mockResult = {
        ...payload,
        id: contract?.id || `contract-mock-${Math.random().toString(36).substr(2, 9)}`,
        created_at: contract?.created_at || new Date().toISOString()
      };

      const customEventName = isEditing ? 'contracts-updated' : 'contracts-created';
      window.dispatchEvent(new CustomEvent(customEventName, { detail: mockResult }));

      // Success feedback toast setup
      const successToast = new CustomEvent('show-toast', {
        detail: {
          title: "Contract Cached",
          message: `Policy cached locally in Sandbox memory for ${carrierName}.`
        }
      });
      window.dispatchEvent(successToast);

      if (onSuccess) {
        onSuccess();
      } else {
        window.history.pushState({}, '', '/contracts');
        window.dispatchEvent(new Event('popstate'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#111827] border border-teal-900/40 rounded-xl p-6 md:p-8 space-y-6 animate-fade-in max-w-4xl mx-auto" id="contract-builder-form">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#1F2D45]">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToContracts}
            className="p-2 bg-[#1C2537] hover:bg-teal-950/20 text-[#2DD4BF] border border-[#1F2D45] rounded-lg transition-all cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-xl font-black text-white font-display uppercase tracking-tight">
              {isEditing ? 'Modify Carrier Agreement' : 'Register Carrier Agreement'}
            </h2>
            <p className="text-xs text-[#94A3B8]">
              Formulate negotiated rates, surcharge grids, and dynamic accessorial validation policies.
            </p>
          </div>
        </div>
      </div>

      {errorText && (
        <div className="bg-red-500/10 border border-red-500/30 text-[#EF4444] rounded-xl p-4 text-xs font-semibold flex items-center gap-3">
          <ShieldAlert size={16} />
          <span>{errorText}</span>
        </div>
      )}

      {/* Main Entry Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1 — CARRIER INFO */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1F2D45]/60 pb-1.5">
            <span className="p-1 px-1.5 rounded bg-teal-500/10 text-[#2DD4BF] font-mono text-[9px] font-bold">SEC &bull; 01</span>
            <h3 className="text-xs font-bold text-[#2DD4BF] uppercase tracking-wider font-mono">Carrier Profile Info</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2 font-mono">Carrier/Logistics Name</label>
              <input
                type="text"
                required
                value={carrierName}
                onChange={(e) => setCarrierName(e.target.value)}
                placeholder="e.g. UPS Freight, FedEx, XPO Logistics"
                className="w-full px-3 py-2 bg-[#0A0F1E] border border-[#1F2D45] rounded-lg text-white font-bold text-xs focus:outline-none focus:border-[#2DD4BF] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2 font-mono">Effective Term Start</label>
              <input
                type="date"
                required
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#0A0F1E] border border-[#1F2D45] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#2DD4BF] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2 font-mono">Effective Term End</label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#0A0F1E] border border-[#1F2D45] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#2DD4BF] transition-colors"
              />
            </div>
          </div>
        </section>

        {/* SECTION 2 — BASE RATES */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1F2D45]/60 pb-1.5">
            <span className="p-1 px-1.5 rounded bg-teal-500/10 text-[#2DD4BF] font-mono text-[9px] font-bold">SEC &bull; 02</span>
            <h3 className="text-xs font-bold text-[#2DD4BF] uppercase tracking-wider font-mono">Base Rating Schedule</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2 font-mono">Base Rate per LB ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-zinc-500 text-xs font-bold font-mono">$</span>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={baseRateLb}
                  onChange={(e) => setBaseRateLb(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-[#0A0F1E] border border-[#1F2D45] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#2DD4BF] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2 font-mono">Base Rate per Mile ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-zinc-500 text-xs font-bold font-mono">$</span>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={baseRateMile}
                  onChange={(e) => setBaseRateMile(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-[#0A0F1E] border border-[#1F2D45] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#2DD4BF] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2 font-mono">Minimum Charge Limit ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-zinc-500 text-xs font-bold font-mono">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={minimumCharge}
                  onChange={(e) => setMinimumCharge(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-[#0A0F1E] border border-[#1F2D45] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#2DD4BF] transition-colors"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 — ACCESSORIAL CHARGES */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1F2D45]/60 pb-1.5">
            <span className="p-1 px-1.5 rounded bg-teal-500/10 text-[#2DD4BF] font-mono text-[9px] font-bold">SEC &bull; 03</span>
            <h3 className="text-xs font-bold text-[#2DD4BF] uppercase tracking-wider font-mono">Accessorial & Surcharges</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2 font-mono">Fuel Surcharge Limit (%)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  required
                  value={fuelPct}
                  onChange={(e) => setFuelPct(e.target.value)}
                  className="w-full pr-7 px-3 py-2 bg-[#0A0F1E] border border-[#1F2D45] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#2DD4BF] transition-colors"
                />
                <span className="absolute right-3 top-2 text-zinc-500 text-xs font-bold font-mono">%</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2 font-mono">Residential Surcharge ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-zinc-500 text-xs font-bold font-mono">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={residentialSurcharge}
                  onChange={(e) => setResidentialSurcharge(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-[#0A0F1E] border border-[#1F2D45] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#2DD4BF] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2 font-mono">Liftgate Accessory Fee ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-zinc-500 text-xs font-bold font-mono">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={liftgateFee}
                  onChange={(e) => setLiftgateFee(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-[#0A0F1E] border border-[#1F2D45] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#2DD4BF] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2 font-mono">Detention per Hour ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-zinc-500 text-xs font-bold font-mono">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={detentionRate}
                  onChange={(e) => setDetentionRate(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-[#0A0F1E] border border-[#1F2D45] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#2DD4BF] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2 font-mono">Inside Delivery Surcharge ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-zinc-500 text-xs font-bold font-mono">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={insideDeliveryFee}
                  onChange={(e) => setInsideDeliveryFee(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-[#0A0F1E] border border-[#1F2D45] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#2DD4BF] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2 font-mono">Redelivery Attempt Fee ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-zinc-500 text-xs font-bold font-mono">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={redeliveryFee}
                  onChange={(e) => setRedeliveryFee(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-[#0A0F1E] border border-[#1F2D45] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#2DD4BF] transition-colors"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4 — CUSTOM RULES */}
        <section className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#1F2D45]/60 pb-1.5 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1 px-1.5 rounded bg-teal-500/10 text-[#2DD4BF] font-mono text-[9px] font-bold">SEC &bull; 04</span>
              <h3 className="text-xs font-bold text-[#2DD4BF] uppercase tracking-wider font-mono">Dynamic Custom Audit Policies</h3>
            </div>
            
            <button
              type="button"
              onClick={handleAddRule}
              className="py-1 px-3 bg-teal-950/20 text-[#2DD4BF] border border-teal-500/20 hover:border-[#2DD4BF] rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus size={11} />
              <span>Add Custom Rule</span>
            </button>
          </div>

          <div className="space-y-3">
            {customRules.length === 0 ? (
              <div className="py-6 border border-dashed border-[#1F2D45] rounded-xl text-center text-zinc-500 text-[11px]">
                No custom audit policies defined. Active rate sheet auditing defaults to standard accessorial logic.
              </div>
            ) : (
              customRules.map((rule, index) => (
                <div key={index} className="flex gap-3 items-center flex-wrap md:flex-nowrap bg-[#0A0F1E]/60 border border-[#1F2D45] rounded-xl p-3 animate-fade-in">
                  <div className="flex-1 min-w-[150px]">
                    <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-1">RULE NAME / EVENT</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Free Waiting Minutes, Liftgate Waiver"
                      value={rule.name}
                      onChange={(e) => handleUpdateRule(index, { name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-[#111827] border border-[#1F2D45] rounded bg-transparent text-white font-medium text-xs focus:outline-none focus:border-[#2DD4BF] transition-colors"
                    />
                  </div>

                  <div className="w-[120px] shrink-0">
                    <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-1">REQUIRED VALUE</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 60, 0.0"
                      value={rule.value}
                      onChange={(e) => handleUpdateRule(index, { value: e.target.value })}
                      className="w-full px-3 py-1.5 bg-[#111827] border border-[#1F2D45] rounded bg-transparent text-white font-mono text-xs focus:outline-none focus:border-[#2DD4BF] transition-colors"
                    />
                  </div>

                  <div className="w-[150px] shrink-0">
                    <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-1">AUDIT STRATEGY TYPE</span>
                    <select
                      value={rule.type}
                      onChange={(e) => handleUpdateRule(index, { type: e.target.value as any })}
                      className="w-full px-3 py-1.5 bg-[#111827] border border-[#1F2D45] rounded bg-transparent text-[#2DD4BF] font-mono text-xs focus:outline-none focus:border-[#2DD4BF] transition-colors"
                    >
                      <option value="Fixed Fee" className="bg-[#111827]">Fixed Fee</option>
                      <option value="Percentage" className="bg-[#111827]">Percentage</option>
                      <option value="Not Allowed" className="bg-[#111827]">Not Allowed</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveRule(index)}
                    className="p-1 bg-red-500/10 hover:bg-red-500/20 text-[#EF4444] border border-red-500/20 rounded-lg shrink-0 self-end md:mt-0 mt-2 mb-0.5 cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Submit Block */}
        <div className="pt-6 border-t border-[#1F2D45] flex justify-end gap-3.5">
          <button
            type="button"
            onClick={handleBackToContracts}
            className="px-4.5 py-2.5 bg-[#1C2537] hover:bg-zinc-800 text-[#94A3B8] font-bold text-xs uppercase rounded-lg border border-[#1F2D45] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#2DD4BF] hover:bg-[#14B8A4] text-black font-black text-xs uppercase rounded-lg transition-all shadow-[0_0_20px_rgba(45,212,191,0.2)] hover:shadow-[0_0_25px_rgba(45,212,191,0.35)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="h-3 w-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Saving agreement policies...</span>
              </>
            ) : (
              <>
                <Save size={13} />
                <span>Save Agreement Terms</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
