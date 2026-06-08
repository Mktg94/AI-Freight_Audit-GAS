import React, { useState } from 'react';
import { Contract } from '@/types';
import { Truck, Calendar, DollarSign, Percent, Trash2, Edit3, X, AlertTriangle } from 'lucide-react';

interface ContractCardProps {
  contract: Contract;
  onEdit?: (contract: Contract) => void;
  onDelete?: (contractId: string) => void | Promise<void> | any;
}

export default function ContractCard({ contract, onEdit, onDelete }: ContractCardProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const formatRate = (rate: number, isPct = false) => {
    if (isPct) {
      return `${(rate * 100).toFixed(1)}%`;
    }
    return rate.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onEdit) {
      onEdit(contract);
    } else {
      window.history.pushState({}, '', `/contracts/${contract.id}`);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onDelete) {
      onDelete(contract.id);
    }
    setShowConfirmDelete(false);
  };

  return (
    <div 
      className="bg-[#111827] border border-teal-900/40 rounded-xl p-5 relative overflow-hidden transition-all duration-300 hover:border-teal-700/60 hover:shadow-[0_0_20px_rgba(45,212,191,0.04)] flex flex-col justify-between h-full"
      id={`contract-card-${contract.id}`}
    >
      {/* Upper info deck */}
      <div>
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-black tracking-tight text-white font-display uppercase truncate max-w-[180px]" title={contract.carrier_name}>
            {contract.carrier_name}
          </h3>
          <div className="p-2 bg-teal-950/20 text-[#2DD4BF] border border-teal-500/10 rounded-lg">
            <Truck size={16} />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#94A3B8] font-mono mt-2">
          <Calendar size={12} className="text-[#2DD4BF]" />
          <span>{contract.effective_date} &rarr; {contract.expiry_date}</span>
        </div>

        {/* Rates grid format (2x2) */}
        <div className="grid grid-cols-2 gap-3.5 mt-5">
          <div className="bg-[#0A0F1E]/60 border border-[#1F2D45] rounded-lg p-2.5">
            <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">BASE / LB</span>
            <span className="block text-xs font-black text-white mt-1 font-mono">
              {formatRate(contract.base_rate_per_lb)}
            </span>
          </div>

          <div className="bg-[#0A0F1E]/60 border border-[#1F2D45] rounded-lg p-2.5">
            <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">FUEL% SURCHARGE</span>
            <span className="block text-xs font-black text-white mt-1 font-mono">
              {formatRate(contract.fuel_surcharge_pct, true)}
            </span>
          </div>

          <div className="bg-[#0A0F1E]/60 border border-[#1F2D45] rounded-lg p-2.5">
            <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">RESIDENTIAL FEE</span>
            <span className="block text-xs font-black text-white mt-1 font-mono">
              {formatRate(contract.residential_surcharge)}
            </span>
          </div>

          <div className="bg-[#0A0F1E]/60 border border-[#1F2D45] rounded-lg p-2.5">
            <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">LIFTGATE FEE</span>
            <span className="block text-xs font-black text-white mt-1 font-mono">
              {formatRate(contract.liftgate_fee)}
            </span>
          </div>
        </div>

        {/* Extras & Rules panel */}
        {contract.custom_rules && Object.keys(contract.custom_rules).length > 0 && (
          <div className="mt-4 p-2.5 bg-[#1C2537] border border-[#1F2D45] rounded-lg text-left">
            <span className="text-[8px] font-mono font-bold text-[#2DD4BF] uppercase block mb-1">CONTRACT CUSTOM LAWS</span>
            <div className="space-y-1">
              {Array.isArray(contract.custom_rules) ? (
                contract.custom_rules.map((rule: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
                    <span className="truncate max-w-[120px]">{rule.name}</span>
                    <span className="font-bold text-[#F59E0B]">{rule.value} ({rule.type})</span>
                  </div>
                ))
              ) : (
                Object.entries(contract.custom_rules).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
                    <span>{key.replace(/_/g, ' ')}</span>
                    <span className="font-bold text-[#F59E0B]">{String(val)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Primary bottom operations */}
      <div className="flex gap-2 mt-5 pt-4 border-t border-[#1F2D45]">
        <button
          onClick={handleEditClick}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#1C2537] hover:bg-[#1F2D45] text-xs font-bold uppercase text-[#2DD4BF] rounded-lg border border-[#1F2D45] hover:border-[#2DD4BF]/40 transition-all cursor-pointer"
        >
          <Edit3 size={12} />
          <span>Edit Terms</span>
        </button>

        <button
          onClick={handleDeleteClick}
          className="p-1.5 px-3 hover:bg-red-500/10 text-red-500 hover:text-red-400 rounded-lg border border-[#1F2D45] hover:border-red-500/30 transition-all cursor-pointer flex items-center justify-center gap-1 text-xs"
          title="Delete Contract"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Inline delete confirmations modal block */}
      {showConfirmDelete && (
        <div className="absolute inset-0 bg-[#0A0F1E]/95 backdrop-blur-sm p-4 flex flex-col justify-center items-center text-center z-20 animate-fade-in">
          <AlertTriangle className="text-[#EF4444] h-8 w-8 animate-bounce mb-2" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Confirm Purge
          </h4>
          <p className="text-[10px] text-[#94A3B8] leading-relaxed max-w-[170px] mt-1 mb-4">
            Are you sure you want to permanently delete {contract.carrier_name}? This action cannot be undone.
          </p>
          <div className="flex gap-2 w-full">
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="flex-1 py-1.5 bg-[#1C2537] hover:bg-zinc-800 text-[#94A3B8] font-bold text-[10px] uppercase rounded-lg border border-[#1F2D45] cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="flex-1 py-1.5 bg-[#EF4444] hover:bg-red-600 text-white font-bold text-[10px] uppercase rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.2)] cursor-pointer"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
