"use client";

import React, { useState, useEffect } from 'react';
import { Contract, ChargeItem, RateType } from '@/types';
import { 
  Plus, X, ArrowLeft, Save, Truck, Plane, Ship, FileSignature, Loader2
} from 'lucide-react';

const RATE_TYPES: RateType[] = [
  'Per lb', 'Per kg', 'Per mile', 'Per km', 'Per hour', 'Per CBM',
  'Flat fee per occurrence',
  'Percentage of base freight charge',
  'Percentage of cargo value',
  'Not Allowed',
];

interface TemplateDefinition {
  name: string;
  icon: React.ReactNode;
  description: string;
  items: ChargeItem[];
}

const TEMPLATES: Record<string, TemplateDefinition> = {
  road: {
    name: 'Road Freight / LTL',
    icon: <Truck size={24} />,
    description: 'Common less-than-truckload and road freight charges',
    items: [
      { name: 'Base Freight', rate: 0.15, rate_type: 'Per lb' },
      { name: 'Fuel Surcharge', rate: 18.5, rate_type: 'Percentage of base freight charge' },
      { name: 'Residential Delivery', rate: 85.00, rate_type: 'Flat fee per occurrence' },
      { name: 'Liftgate Fee', rate: 75.00, rate_type: 'Flat fee per occurrence' },
      { name: 'Detention / Driver Standby', rate: 75.00, rate_type: 'Per hour' },
      { name: 'Inside Delivery', rate: 95.00, rate_type: 'Flat fee per occurrence' },
      { name: 'Redelivery Attempt', rate: 65.00, rate_type: 'Flat fee per occurrence' },
    ],
  },
  air: {
    name: 'Air Freight',
    icon: <Plane size={24} />,
    description: 'Common air cargo and express freight charges',
    items: [
      { name: 'Air Freight Base Rate', rate: 4.20, rate_type: 'Per kg' },
      { name: 'Fuel Surcharge', rate: 25.0, rate_type: 'Percentage of base freight charge' },
      { name: 'Airport Handling Fee', rate: 0.15, rate_type: 'Per kg' },
      { name: 'Security Surcharge', rate: 0.10, rate_type: 'Per kg' },
      { name: 'AWB (Airway Bill) Fee', rate: 35.00, rate_type: 'Flat fee per occurrence' },
      { name: 'Dangerous Goods Surcharge', rate: 150.00, rate_type: 'Flat fee per occurrence' },
    ],
  },
  ocean: {
    name: 'Ocean / Sea Freight',
    icon: <Ship size={24} />,
    description: 'Common ocean container and sea freight charges',
    items: [
      { name: 'Ocean Freight Base Rate', rate: 850.00, rate_type: 'Flat fee per occurrence' },
      { name: 'BAF (Bunker Adjustment Factor)', rate: 12.0, rate_type: 'Percentage of base freight charge' },
      { name: 'CAF (Currency Adjustment Factor)', rate: 3.0, rate_type: 'Percentage of base freight charge' },
      { name: 'Port Handling (Origin)', rate: 120.00, rate_type: 'Flat fee per occurrence' },
      { name: 'Port Handling (Destination)', rate: 120.00, rate_type: 'Flat fee per occurrence' },
      { name: 'Documentation Fee', rate: 65.00, rate_type: 'Flat fee per occurrence' },
      { name: 'Container Seal Fee', rate: 25.00, rate_type: 'Flat fee per occurrence' },
    ],
  },
  custom: {
    name: 'Custom / Blank',
    icon: <FileSignature size={24} />,
    description: 'Start with no charge items — build from scratch',
    items: [],
  },
};

interface ContractFormProps {
  contract?: Contract | null;
  contractId?: string;
  onSuccess?: () => void;
}

export default function ContractForm({ contract, contractId, onSuccess }: ContractFormProps) {
  const [loadingContract, setLoadingContract] = useState(!!contractId && !contract);
  const [resolvedContract, setResolvedContract] = useState<Contract | null | undefined>(contract);

  const isEditing = !!(resolvedContract || contractId);

  useEffect(() => {
    if (contract) {
      setResolvedContract(contract);
    } else if (contractId && !resolvedContract) {
      fetch(`/api/contracts/${contractId}`)
        .then(r => r.json())
        .then(data => {
          const c = data.data || data;
          if (c && c.id) {
            setResolvedContract(c);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingContract(false));
    }
  }, [contract, contractId]);

  const [showTemplatePicker, setShowTemplatePicker] = useState(!isEditing);
  const [carrierName, setCarrierName] = useState(resolvedContract?.carrier_name || '');
  const [effectiveDate, setEffectiveDate] = useState(resolvedContract?.effective_date || '');
  const [expiryDate, setExpiryDate] = useState(resolvedContract?.expiry_date || '');
  const [minimumCharge, setMinimumCharge] = useState((resolvedContract?.minimum_charge ?? 0).toString());
  const [currency, setCurrency] = useState(resolvedContract?.currency || 'USD');

  const [chargeItems, setChargeItems] = useState<ChargeItem[]>(
    (resolvedContract?.charge_items || []).map(ci => ({ ...ci }))
  );

  useEffect(() => {
    if (resolvedContract) {
      setCarrierName(resolvedContract.carrier_name || '');
      setEffectiveDate(resolvedContract.effective_date || '');
      setExpiryDate(resolvedContract.expiry_date || '');
      setMinimumCharge((resolvedContract.minimum_charge ?? 0).toString());
      setCurrency(resolvedContract.currency || 'USD');
      setChargeItems((resolvedContract.charge_items || []).map(ci => ({ ...ci })));
    }
  }, [resolvedContract]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const selectTemplate = (templateKey: string) => {
    const template = TEMPLATES[templateKey];
    if (template) {
      setChargeItems(template.items.map(i => ({ ...i })));
    }
    setShowTemplatePicker(false);
  };

  const addChargeItem = () => {
    setChargeItems(prev => [...prev, { name: '', rate: 0, rate_type: 'Flat fee per occurrence' }]);
  };

  const removeChargeItem = (index: number) => {
    setChargeItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateChargeItem = (index: number, fields: Partial<ChargeItem>) => {
    setChargeItems(prev => prev.map((item, i) => i === index ? { ...item, ...fields } : item));
  };

  const handleBackToContracts = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState({}, '', '/contracts');
    window.dispatchEvent(new Event('popstate'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carrierName.trim()) {
      setErrorText('Carrier name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorText(null);

    const payload = {
      carrier_name: carrierName,
      effective_date: effectiveDate,
      expiry_date: expiryDate,
      minimum_charge: parseFloat(minimumCharge) || 0,
      currency,
      charge_items: chargeItems.filter(ci => ci.name.trim() !== ''),
    };

    try {
      const endpoint = isEditing ? `/api/contracts/${resolvedContract?.id || contractId}` : '/api/contracts';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await response.text() || 'Failed to save contract');
      }

      const result = await response.json();

      const customEventName = isEditing ? 'contracts-updated' : 'contracts-created';
      window.dispatchEvent(new CustomEvent(customEventName, { detail: result.data || payload }));

      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          title: 'Contract Saved',
          message: `Agreement for '${carrierName}' archived.`,
        },
      }));

      if (onSuccess) {
        onSuccess();
      } else {
        window.history.pushState({}, '', '/contracts');
        window.dispatchEvent(new Event('popstate'));
      }
    } catch (err: any) {
      console.error('Failed to save contract:', err);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          title: 'Save Failed',
          message: err.message || 'Could not save contract.',
        },
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

  if (showTemplatePicker) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">New Carrier Agreement</h2>
          <p className="text-sm text-gray-500 mb-6">Start from a template or build from scratch?</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(TEMPLATES).map(([key, tpl]) => (
              <button
                key={key}
                type="button"
                onClick={() => selectTemplate(key)}
                className="text-left p-5 bg-white border-2 border-gray-100 hover:border-indigo-300 hover:bg-indigo-50/30 rounded-xl transition-all cursor-pointer group"
              >
                <div className="text-gray-400 group-hover:text-indigo-600 mb-3">
                  {tpl.icon}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700">{tpl.name}</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{tpl.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-500 transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

  if (loadingContract) {
    return (
      <div className="max-w-2xl mx-auto py-16 flex flex-col items-center justify-center space-y-4">
        <Loader2 size={24} className="animate-spin text-indigo-600" />
        <span className="text-sm text-gray-500 font-mono">Loading contract...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white border border-gray-100 rounded-2xl shadow-sm p-8 space-y-6 animate-fade-in">
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
            Define negotiated rates and charge items.
          </p>
        </div>
      </div>

      {errorText && (
        <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-4 text-sm">
          {errorText}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <section>
          <div className="flex items-center gap-2 pb-3 border-b border-gray-50 mb-4">
            <div className="w-1 h-4 bg-indigo-500 rounded-full" />
            <h3 className="text-sm font-semibold text-gray-900">Carrier Info</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <input type="date" required value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Expiry Date</label>
              <input type="date" required value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="AUD">AUD (A$)</option>
              </select>
            </div>
          </div>

          <div className="mt-4 max-w-[200px]">
            <label className={labelClass}>Minimum Charge</label>
            <input
              type="number"
              step="0.01"
              value={minimumCharge}
              onChange={(e) => setMinimumCharge(e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between pb-3 border-b border-gray-50 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-indigo-500 rounded-full" />
              <h3 className="text-sm font-semibold text-gray-900">Charge Items</h3>
            </div>
            <button
              type="button"
              onClick={addChargeItem}
              className="border-2 border-dashed border-gray-200 hover:border-indigo-200 text-gray-500 hover:text-indigo-600 text-sm font-medium rounded-xl px-4 py-1.5 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} />
              <span>Add charge item</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="text-left pb-2 pr-2 min-w-[200px]">Charge Name</th>
                  <th className="text-left pb-2 pr-2 min-w-[100px]">Rate</th>
                  <th className="text-left pb-2 pr-2 min-w-[200px]">Rate Type</th>
                  <th className="pb-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {chargeItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-400 text-sm">
                      No charge items defined. Click "Add charge item" to start.
                    </td>
                  </tr>
                ) : (
                  chargeItems.map((item, index) => (
                    <tr key={index} className="border-t border-gray-50">
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Driver Standby Time"
                          value={item.name}
                          onChange={(e) => updateChargeItem(index, { name: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-500 transition-all"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          step="any"
                          placeholder="Rate"
                          value={item.rate || ''}
                          onChange={(e) => updateChargeItem(index, { rate: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-500 transition-all"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <select
                          value={item.rate_type}
                          onChange={(e) => updateChargeItem(index, { rate_type: e.target.value as RateType })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-500 transition-all"
                        >
                          {RATE_TYPES.map((rt) => (
                            <option key={rt} value={rt}>{rt}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeChargeItem(index)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
            className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
