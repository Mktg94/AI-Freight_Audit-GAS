"use client";

import React, { useState } from 'react';
import { Contract } from '@/types';
import { 
  FileSignature, Plus, X, 
  ArrowLeft, Save, ShieldAlert
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

  const [carrierName, setCarrierName] = useState(contract?.carrier_name || '');
  const [effectiveDate, setEffectiveDate] = useState(contract?.effective_date || '2026-06-01');
  const [expiryDate, setExpiryDate] = useState(contract?.expiry_date || '2027-06-01');

  const [baseRateLb, setBaseRateLb] = useState((contract?.base_rate_per_lb ?? 0.12).toString());
  const [baseRateMile, setBaseRateMile] = useState((contract?.base_rate_per_mile ?? 1.50).toString());
  const [minimumCharge, setMinimumCharge] = useState((contract?.minimum_charge ?? 120.00).toString());

  const [fuelPct, setFuelPct] = useState(((contract?.fuel_surcharge_pct ?? 0.14) * 100).toString());
  const [residentialSurcharge, setResidentialSurcharge] = useState((contract?.residential_surcharge ?? 75.00).toString());
  const [liftgateFee, setLiftgateFee] = useState((contract?.liftgate_fee ?? 65.00).toString());
  const [detentionRate, setDetentionRate] = useState((contract?.detention_rate_per_hr ?? 50.00).toString());
  const [insideDeliveryFee, setInsideDeliveryFee] = useState((contract?.inside_delivery_fee ?? 90.00).toString());
  const [redeliveryFee, setRedeliveryFee] = useState((contract?.redelivery_fee ?? 50.00).toString());

  const initialRules: CustomRuleItem[] = (() => {
    if (contract?.custom_rules) {
      if (Array.isArray(contract.custom_rules)) {
        return contract.custom_rules as CustomRuleItem[];
      } else {
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

  const handleAddRule = () => {
    setCustomRules(prev => [...prev, { name: '', value: '', type: 'Fixed Fee' }]);
  };

  const handleRemoveRule = (index: number) => {
    setCustomRules(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateRule = (index: number, fields: Partial<CustomRuleItem>) => {
    setCustomRules(prev => prev.map((item, i) => i === index ? { ...item, ...fields } : item));
  };

  const handleBackToContracts = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState({}, '', '/contracts');
    window.dispatchEvent(new Event('popstate'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carrierName.trim()) {
      setErrorText("Carrier Name is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorText(null);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await response.text() || "Failed to save contract");
      }

      const result = await response.json();
      
      const customEventName = isEditing ? 'contracts-updated' : 'contracts-created';
      window.dispatchEvent(new CustomEvent(customEventName, { detail: result.data || { ...payload, id: contract?.id || `contract-${Date.now()}` } }));

      const successToast = new CustomEvent('show-toast', {
        detail: {
          title: "Contract Saved",
          message: `Policies for '${carrierName}' archived.`
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
      console.error("Failed to save contract:", err);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          title: "Save Failed",
          message: err.message || "Could not save contract."
        }
      }));

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

  const inputClass = "w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-500 transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const sectionHeaderClass = "flex items-center gap-2 pb-3 border-b border-gray-50 mb-4";
  const accentBarClass = "w-1 h-4 bg-indigo-500 rounded-full";

  return (
    <div className="max-w-2xl mx-auto bg-white border border-gray-100 rounded-2xl shadow-sm p-8 space-y-6 animate-fade-in" id="contract-builder-form">
      
      <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
        <button
          onClick={handleBackToContracts}
          className="p-2 bg-white hover:bg-gray-50 text-gray-500 border border-gray-200 rounded-lg transition-all cursor-pointer"
          title="Go Back"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Carrier Agreement' : 'New Carrier Agreement'}
          </h2>
          <p className="text-sm text-gray-500">
            Define negotiated rates and surcharge terms.
          </p>
        </div>
      </div>

      {errorText && (
        <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-4 text-sm flex items-center gap-3">
          <ShieldAlert size={16} />
          <span>{errorText}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        <section>
          <div className={sectionHeaderClass}>
            <div className={accentBarClass} />
            <h3 className="text-sm font-semibold text-gray-900">Carrier Info</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className={labelClass}>Carrier Name</label>
              <input
                type="text"
                required
                value={carrierName}
                onChange={(e) => setCarrierName(e.target.value)}
                placeholder="e.g. UPS Freight"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Effective Date</label>
              <input
                type="date"
                required
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Expiry Date</label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section>
          <div className={sectionHeaderClass}>
            <div className={accentBarClass} />
            <h3 className="text-sm font-semibold text-gray-900">Base Rates</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Base Rate per LB ($)</label>
              <input
                type="number"
                step="0.0001"
                required
                value={baseRateLb}
                onChange={(e) => setBaseRateLb(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Base Rate per Mile ($)</label>
              <input
                type="number"
                step="0.0001"
                required
                value={baseRateMile}
                onChange={(e) => setBaseRateMile(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Minimum Charge ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={minimumCharge}
                onChange={(e) => setMinimumCharge(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section>
          <div className={sectionHeaderClass}>
            <div className={accentBarClass} />
            <h3 className="text-sm font-semibold text-gray-900">Accessorial Charges</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Fuel Surcharge (%)</label>
              <input
                type="number"
                step="0.1"
                required
                value={fuelPct}
                onChange={(e) => setFuelPct(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Residential ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={residentialSurcharge}
                onChange={(e) => setResidentialSurcharge(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Liftgate Fee ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={liftgateFee}
                onChange={(e) => setLiftgateFee(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Detention per Hour ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={detentionRate}
                onChange={(e) => setDetentionRate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Inside Delivery ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={insideDeliveryFee}
                onChange={(e) => setInsideDeliveryFee(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Redelivery Fee ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={redeliveryFee}
                onChange={(e) => setRedeliveryFee(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center pb-3 border-b border-gray-50 mb-4">
            <div className="flex items-center gap-2">
              <div className={accentBarClass} />
              <h3 className="text-sm font-semibold text-gray-900">Custom Audit Policies</h3>
            </div>
            
            <button
              type="button"
              onClick={handleAddRule}
              className="border-2 border-dashed border-gray-200 hover:border-indigo-200 text-gray-500 hover:text-indigo-600 text-sm font-medium rounded-xl px-4 py-1.5 transition-colors duration-150 flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} />
              <span>Add Rule</span>
            </button>
          </div>

          <div className="space-y-3">
            {customRules.length === 0 ? (
              <div className="py-6 border border-dashed border-gray-200 rounded-xl text-center text-sm text-gray-400">
                No custom rules defined.
              </div>
            ) : (
              customRules.map((rule, index) => (
                <div key={index} className="flex gap-3 items-center flex-wrap md:flex-nowrap bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="flex-1 min-w-[150px]">
                    <span className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Rule Name</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Free Waiting Minutes"
                      value={rule.name}
                      onChange={(e) => handleUpdateRule(index, { name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div className="w-[120px] shrink-0">
                    <span className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Value</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 60"
                      value={rule.value}
                      onChange={(e) => handleUpdateRule(index, { value: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div className="w-[150px] shrink-0">
                    <span className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Type</span>
                    <select
                      value={rule.type}
                      onChange={(e) => handleUpdateRule(index, { type: e.target.value as any })}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-500 transition-all"
                    >
                      <option value="Fixed Fee">Fixed Fee</option>
                      <option value="Percentage">Percentage</option>
                      <option value="Not Allowed">Not Allowed</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveRule(index)}
                    className="p-1 text-gray-400 hover:text-red-500 shrink-0 self-end md:mt-0 mt-2 mb-0.5 cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="pt-6 border-t border-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleBackToContracts}
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 text-sm font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors duration-150 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={13} />
                <span>Save Contract</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
