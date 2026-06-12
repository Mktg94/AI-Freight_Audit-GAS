import React, { useState } from 'react';
import { Contract } from '@/types';
import { Truck, Calendar, Edit3, Trash2, AlertTriangle } from 'lucide-react';

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

  const isActive = new Date(contract.expiry_date) >= new Date();

  return (
    <div 
      className="bg-white rounded-2xl border border-gray-100 p-5 relative overflow-hidden transition-all duration-200 hover:border-gray-200 hover:shadow-sm flex flex-col justify-between h-full"
      id={`contract-card-${contract.id}`}
    >
      <div>
        <div className="flex justify-between items-start">
          <h3 className="text-base font-semibold text-gray-900 truncate max-w-[180px]" title={contract.carrier_name}>
            {contract.carrier_name}
          </h3>
          <div className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg">
            <Truck size={16} />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono mt-2">
          <Calendar size={12} className="text-indigo-500" />
          <span>{contract.effective_date} &rarr; {contract.expiry_date}</span>
        </div>

        {isActive && (
          <span className="inline-block mt-2 bg-green-50 text-green-700 border border-green-200 text-xs rounded-full px-2 py-0.5 font-mono font-semibold">
            Active
          </span>
        )}

        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-50">
            <span className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide">Base / lb</span>
            <span className="block text-sm font-mono font-semibold text-gray-900 mt-0.5">
              {formatRate(contract.base_rate_per_lb)}
            </span>
          </div>

          <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-50">
            <span className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide">Fuel %</span>
            <span className="block text-sm font-mono font-semibold text-gray-900 mt-0.5">
              {formatRate(contract.fuel_surcharge_pct, true)}
            </span>
          </div>

          <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-50">
            <span className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide">Residential</span>
            <span className="block text-sm font-mono font-semibold text-gray-900 mt-0.5">
              {formatRate(contract.residential_surcharge)}
            </span>
          </div>

          <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-50">
            <span className="block text-[10px] font-medium text-gray-400 uppercase tracking-wide">Liftgate</span>
            <span className="block text-sm font-mono font-semibold text-gray-900 mt-0.5">
              {formatRate(contract.liftgate_fee)}
            </span>
          </div>
        </div>

        {contract.custom_rules && Object.keys(contract.custom_rules).length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-100 rounded-xl text-left">
            <span className="text-[10px] font-mono font-semibold text-indigo-600 uppercase block mb-1">CUSTOM RULES</span>
            <div className="space-y-1">
              {Array.isArray(contract.custom_rules) ? (
                contract.custom_rules.map((rule: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-xs text-gray-500 font-mono">
                    <span className="truncate max-w-[120px]">{rule.name}</span>
                    <span className="font-semibold text-amber-600">{rule.value} ({rule.type})</span>
                  </div>
                ))
              ) : (
                Object.entries(contract.custom_rules).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center text-xs text-gray-500 font-mono">
                    <span>{key.replace(/_/g, ' ')}</span>
                    <span className="font-semibold text-amber-600">{String(val)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
        <button
          onClick={handleEditClick}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 text-xs font-medium rounded-lg transition-all cursor-pointer"
        >
          <Edit3 size={12} />
          <span>Edit</span>
        </button>

        <button
          onClick={handleDeleteClick}
          className="p-1.5 px-3 bg-white hover:bg-red-50 text-red-500 border border-gray-200 hover:border-red-200 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 text-xs"
          title="Delete Contract"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {showConfirmDelete && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm p-4 flex flex-col justify-center items-center text-center z-20 animate-fade-in rounded-2xl">
          <AlertTriangle className="text-red-500 h-8 w-8 mb-2" />
          <h4 className="text-sm font-semibold text-gray-900">
            Confirm Delete
          </h4>
          <p className="text-xs text-gray-500 leading-relaxed max-w-[170px] mt-1 mb-4">
            Are you sure you want to permanently delete {contract.carrier_name}?
          </p>
          <div className="flex gap-2 w-full">
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="flex-1 py-1.5 bg-white hover:bg-gray-50 text-gray-600 text-xs font-medium rounded-lg border border-gray-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
