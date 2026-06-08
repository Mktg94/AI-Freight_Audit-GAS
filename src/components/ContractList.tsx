import React, { useState } from 'react';
import { Contract } from '../../types';
import { ShieldCheck, Plus, Calendar, DollarSign, FileText, X, Edit3, Trash2 } from 'lucide-react';

interface ContractListProps {
  contracts: Contract[];
  onAddContract: (contract: Contract) => void;
  onEditContract: (contract: Contract) => void;
}

export default function ContractList({ contracts, onAddContract, onEditContract }: ContractListProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  // Form State
  const [carrierName, setCarrierName] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('2026-01-01');
  const [expiryDate, setExpiryDate] = useState('2026-12-31');
  const [baseRateLb, setBaseRateLb] = useState('0.12');
  const [baseRateMile, setBaseRateMile] = useState('1.50');
  const [fuelPct, setFuelPct] = useState('14');
  const [residentialSurcharge, setResidentialSurcharge] = useState('75.00');
  const [detentionRate, setDetentionRate] = useState('50.00');
  const [liftgateFee, setLiftgateFee] = useState('65.00');
  const [insideDeliveryFee, setInsideDeliveryFee] = useState('90.00');
  const [redeliveryFee, setRedeliveryFee] = useState('50.00');
  const [minimumCharge, setMinimumCharge] = useState('120.00');

  const openAddModal = () => {
    setEditingContract(null);
    setCarrierName('');
    setEffectiveDate('2026-01-01');
    setExpiryDate('2026-12-31');
    setBaseRateLb('0.12');
    setBaseRateMile('1.50');
    setFuelPct('14');
    setResidentialSurcharge('75.00');
    setDetentionRate('50.00');
    setLiftgateFee('65.00');
    setInsideDeliveryFee('90.00');
    setRedeliveryFee('50.00');
    setMinimumCharge('120.00');
    setShowModal(true);
  };

  const openEditModal = (c: Contract) => {
    setEditingContract(c);
    setCarrierName(c.carrier_name);
    setEffectiveDate(c.effective_date);
    setExpiryDate(c.expiry_date);
    setBaseRateLb(c.base_rate_per_lb.toString());
    setBaseRateMile(c.base_rate_per_mile.toString());
    setFuelPct((c.fuel_surcharge_pct * 100).toString());
    setResidentialSurcharge(c.residential_surcharge.toString());
    setDetentionRate(c.detention_rate_per_hr.toString());
    setLiftgateFee(c.liftgate_fee.toString());
    setInsideDeliveryFee(c.inside_delivery_fee.toString());
    setRedeliveryFee(c.redelivery_fee.toString());
    setMinimumCharge(c.minimum_charge.toString());
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!carrierName.trim()) return;

    const rateSheet: Contract = {
      id: editingContract ? editingContract.id : 'contract-' + Math.random().toString(36).substr(2, 9),
      org_id: "org-101",
      carrier_name: carrierName,
      effective_date: effectiveDate,
      expiry_date: expiryDate,
      base_rate_per_lb: parseFloat(baseRateLb) || 0,
      base_rate_per_mile: parseFloat(baseRateMile) || 0,
      fuel_surcharge_pct: (parseFloat(fuelPct) || 0) / 100,
      residential_surcharge: parseFloat(residentialSurcharge) || 0,
      detention_rate_per_hr: parseFloat(detentionRate) || 0,
      liftgate_fee: parseFloat(liftgateFee) || 0,
      inside_delivery_fee: parseFloat(insideDeliveryFee) || 0,
      redelivery_fee: parseFloat(redeliveryFee) || 0,
      minimum_charge: parseFloat(minimumCharge) || 0,
      custom_rules: editingContract?.custom_rules || { free_detention_minutes: 60 },
      created_at: editingContract ? editingContract.created_at : new Date().toISOString()
    };

    if (editingContract) {
      onEditContract(rateSheet);
    } else {
      onAddContract(rateSheet);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6" id="contracts-section">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#f1f5f9] flex items-center gap-2">
            <ShieldCheck className="text-[#2dd4bf] h-6 w-6" /> Carrier Contracts
          </h2>
          <p className="text-sm text-[#94a3b8] mt-1">
            Negotiated carrier rate sheets used as active templates for automated AI freight audits.
          </p>
        </div>

        <button
          onClick={openAddModal}
          id="add-contract-btn"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2dd4bf] hover:bg-[#14b8a4] text-[#0a0f1e] font-semibold rounded-lg transition-all duration-200 shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:scale-[1.02]"
        >
          <Plus size={18} /> Add Contract Rate
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {contracts.map((contract) => (
          <div
            key={contract.id}
            className="bg-[#111827] border border-[#1f2d45] hover:border-teal-900/60 rounded-xl p-6 transition-all duration-200 shadow-lg relative flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#f1f5f9] tracking-tight">{contract.carrier_name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#94a3b8] mt-1">
                    <Calendar size={13} />
                    <span>{contract.effective_date} &rarr; {contract.expiry_date}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(contract)}
                    className="p-1.5 hover:bg-[#1c2537] text-[#94a3b8] hover:text-[#2dd4bf] rounded-lg transition-colors"
                    title="Edit Contract Terms"
                  >
                    <Edit3 size={16} />
                  </button>
                </div>
              </div>

              {/* Base Charge Formula */}
              <div className="bg-[#0a0f1e] rounded-lg p-3.5 border border-[#1f2d45] mb-4 text-xs space-y-2">
                <div className="text-teal-400 font-semibold uppercase tracking-wider text-[10px]">Primary Transit Rating Method</div>
                <div className="grid grid-cols-2 gap-4 text-[#f1f5f9]">
                  <div>
                    <span className="text-[#94a3b8]">Per Pound Rate:</span>
                    <span className="block font-sans font-bold text-sm mt-0.5">${contract.base_rate_per_lb.toFixed(4)} <span className="text-[10px] text-zinc-400">/ lb</span></span>
                  </div>
                  <div>
                    <span className="text-[#94a3b8]">Per Mile Rate:</span>
                    <span className="block font-sans font-bold text-sm mt-0.5">${contract.base_rate_per_mile.toFixed(4)} <span className="text-[10px] text-zinc-400">/ mi</span></span>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#1f2d45]/60 flex justify-between items-center text-[#f1f5f9]">
                  <span className="text-[#94a3b8]">Minimum Bill Threshold:</span>
                  <span className="font-bold font-mono text-emerald-400">${contract.minimum_charge.toFixed(2)}</span>
                </div>
              </div>

              {/* Surcharges & Extras List */}
              <div className="space-y-2 text-xs">
                <div className="text-[#94a3b8] font-medium uppercase tracking-wider text-[9px] mb-1">Negotiated Surcharge Rules</div>
                
                <div className="flex justify-between items-center py-1 border-b border-[#1f2d45]/40">
                  <span className="text-[#94a3b8]">Fuel Surcharge Cap</span>
                  <span className="font-semibold text-[#f1f5f9]">{(contract.fuel_surcharge_pct * 100).toFixed(1)}% limit</span>
                </div>
                
                <div className="flex justify-between items-center py-1 border-b border-[#1f2d45]/40">
                  <span className="text-[#94a3b8]">Residential Fee</span>
                  <span className="font-semibold text-[#f1f5f9]">${contract.residential_surcharge.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center py-1 border-b border-[#1f2d45]/40">
                  <span className="text-[#94a3b8]">Liftgate Accessory Fee</span>
                  <span className="font-semibold text-[#f1f5f9]">${contract.liftgate_fee.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-[#1f2d45]/40">
                  <span className="text-[#94a3b8]">Inside Delivery Fee</span>
                  <span className="font-semibold text-[#f1f5f9]">${contract.inside_delivery_fee.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-[#1f2d45]/40">
                  <span className="text-[#94a3b8]">Redelivery Charge</span>
                  <span className="font-semibold text-[#f1f5f9]">${contract.redelivery_fee.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-[#94a3b8]">Detention / Hour</span>
                  <span className="font-semibold text-[#f1f5f9]">${contract.detention_rate_per_hr.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {contract.custom_rules && (
              <div className="mt-4 pt-3 border-t border-[#1f2d45] text-[11px] text-[#94a3b8] flex justify-between bg-zinc-950/20 px-2 py-1.5 rounded">
                <span>Free Detention Wait Time:</span>
                <span className="font-bold text-zinc-300 font-mono">{(contract.custom_rules as any).free_detention_minutes || 0} mins</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* modal block */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0a0f1e]/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#111827] border border-[#1f2d45] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            
            <div className="flex justify-between items-center p-6 border-b border-[#1f2d45]">
              <h3 className="text-xl font-bold text-[#f1f5f9] flex items-center gap-2">
                <FileText className="text-[#2dd4bf]" size={20} />
                {editingContract ? 'Edit Contract Specifications' : 'Draft New Negotiated Contract'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-[#1c2537] rounded-lg text-[#94a3b8] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh] space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">Carrier Service Name</label>
                  <input
                    type="text"
                    required
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    placeholder="e.g. FedEx Freight, UPS, Swift Express"
                    className="w-full px-3.5 py-2 bg-[#0a0f1e] border border-[#1f2d45] rounded-lg text-white font-medium focus:outline-none focus:border-[#2dd4bf] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">Effective Date</label>
                  <input
                    type="date"
                    required
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#0a0f1e] border border-[#1f2d45] rounded-lg text-white font-medium focus:outline-none focus:border-[#2dd4bf] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">Expiration Date</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#0a0f1e] border border-[#1f2d45] rounded-lg text-white font-medium focus:outline-none focus:border-[#2dd4bf] transition-colors"
                  />
                </div>

                <div className="border-t border-[#1f2d45] sm:col-span-2 pt-4">
                  <h4 className="text-xs font-bold text-[#2dd4bf] uppercase tracking-wider mb-3">Primary Transit Rating Formula</h4>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">Base Rate per Lb ($)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-zinc-500 font-medium font-sans">$</span>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={baseRateLb}
                      onChange={(e) => setBaseRateLb(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2 bg-[#0a0f1e] border border-[#1f2d45] rounded-lg text-white font-mono focus:outline-none focus:border-[#2dd4bf] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">Base Rate per Mile ($)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-zinc-500 font-medium font-sans">$</span>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={baseRateMile}
                      onChange={(e) => setBaseRateMile(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2 bg-[#0a0f1e] border border-[#1f2d45] rounded-lg text-white font-mono focus:outline-none focus:border-[#2dd4bf] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">Minimum Charge Limit ($)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-zinc-500 font-medium font-sans">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={minimumCharge}
                      onChange={(e) => setMinimumCharge(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2 bg-[#0a0f1e] border border-[#1f2d45] rounded-lg text-white font-mono focus:outline-none focus:border-[#2dd4bf] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">Negotiated Fuel Sur. Cap (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={fuelPct}
                      onChange={(e) => setFuelPct(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#0a0f1e] border border-[#1f2d45] rounded-lg text-white font-mono focus:outline-none focus:border-[#2dd4bf] transition-colors"
                    />
                    <span className="absolute right-3.5 top-2.5 text-zinc-500 font-semibold">%</span>
                  </div>
                </div>

                <div className="border-t border-[#1f2d45] sm:col-span-2 pt-4">
                  <h4 className="text-xs font-bold text-[#2dd4bf] uppercase tracking-wider mb-3">Surcharges & Accessorial Rate caps</h4>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">Residential Delivery fee ($)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-zinc-500 font-medium font-sans">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={residentialSurcharge}
                      onChange={(e) => setResidentialSurcharge(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2 bg-[#0a0f1e] border border-[#1f2d45] rounded-lg text-white font-mono focus:outline-none focus:border-[#2dd4bf] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">Liftgate Surcharge fee ($)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-zinc-500 font-medium font-sans">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={liftgateFee}
                      onChange={(e) => setLiftgateFee(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2 bg-[#0a0f1e] border border-[#1f2d45] rounded-lg text-white font-mono focus:outline-none focus:border-[#2dd4bf] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">Inside Delivery Surcharge ($)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-zinc-500 font-medium font-sans">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={insideDeliveryFee}
                      onChange={(e) => setInsideDeliveryFee(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2 bg-[#0a0f1e] border border-[#1f2d45] rounded-lg text-white font-mono focus:outline-none focus:border-[#2dd4bf] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">Redelivery Surcharge ($)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-zinc-500 font-medium font-sans">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={redeliveryFee}
                      onChange={(e) => setRedeliveryFee(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2 bg-[#0a0f1e] border border-[#1f2d45] rounded-lg text-white font-mono focus:outline-none focus:border-[#2dd4bf] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-1.5">Detention Rate ($ / hr)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-zinc-500 font-medium font-sans">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={detentionRate}
                      onChange={(e) => setDetentionRate(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2 bg-[#0a0f1e] border border-[#1f2d45] rounded-lg text-white font-mono focus:outline-none focus:border-[#2dd4bf] transition-colors"
                    />
                  </div>
                </div>

              </div>

              <div className="pt-4 border-t border-[#1f2d45] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4.5 py-2 bg-[#1c2537] hover:bg-zinc-800 text-[#94a3b8] font-medium rounded-lg transition-colors border border-[#1f2d45]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-contract-btn"
                  className="px-5 py-2 bg-[#2dd4bf] hover:bg-[#14b8a4] text-[#0a0f1e] font-semibold rounded-lg transition-all duration-200 shadow-[0_0_15px_rgba(45,212,191,0.2)]"
                >
                  {editingContract ? 'Update Terms' : 'Save Negotiated Terms'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
