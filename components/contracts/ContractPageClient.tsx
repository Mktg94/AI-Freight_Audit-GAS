"use client";

import React, { useState, useEffect } from 'react';
import { Contract } from '../../types';
import { initialContracts } from '@/src/fakeData';
import ContractCard from '@/components/contracts/ContractCard';
import EmptyState from '@/components/contracts/EmptyState';
import { Plus, FileSignature, RefreshCw, Landmark } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const TypedContractCard = ContractCard as any;

interface ContractPageClientProps {
  initialContracts: Contract[];
}

export default function ContractPageClient({ initialContracts: ssrContracts }: ContractPageClientProps) {
  const [contracts, setContracts] = useState<Contract[]>(ssrContracts);
  const [loading, setLoading] = useState(false);
  const [isRealSupabase, setIsRealSupabase] = useState(false);

  // Sync state modifications from local events
  useEffect(() => {
    // Check if real database connection is established
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder') && !supabaseKey.includes('placeholder')) {
      setIsRealSupabase(true);
    }

    // Refresh dataset from server
    const fetchLatestContracts = async () => {
      try {
        const response = await fetch('/api/contracts');
        if (response.ok) {
          const result = await response.json();
          if (Array.isArray(result)) {
            setContracts(result);
          } else if (result.success && Array.isArray(result.data)) {
            setContracts(result.data);
          }
        }
      } catch (e) {
        console.warn("Client fetch failed, relying on props/cache memory:", e);
      }
    };

    fetchLatestContracts();

    // Setup event listeners for local updates
    const handleCreated = (e: Event) => {
      const newContract = (e as CustomEvent).detail;
      setContracts(prev => {
        if (prev.some(c => c.id === newContract.id)) return prev;
        return [newContract, ...prev];
      });
    };

    const handleUpdated = (e: Event) => {
      const updatedContract = (e as CustomEvent).detail;
      setContracts(prev => prev.map(c => c.id === updatedContract.id ? updatedContract : c));
    };

    window.addEventListener('contracts-created', handleCreated);
    window.addEventListener('contracts-updated', handleUpdated);

    return () => {
      window.removeEventListener('contracts-created', handleCreated);
      window.removeEventListener('contracts-updated', handleUpdated);
    };
  }, []);

  const handleAddContractClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState({}, '', '/contracts/new');
    window.dispatchEvent(new Event('popstate'));
  };

  const handleDeleteContract = async (contractId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setContracts(prev => prev.filter(c => c.id !== contractId));
        
        // Success Toast trigger
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: {
            title: "Agreement Removed",
            message: "Negotiated discount policies purged from active audit pipeline."
          }
        }));
      } else {
        throw new Error(await response.text() || "Failed to delete");
      }
    } catch (err) {
      console.warn("Local cache deletion active:", err);
      setContracts(prev => prev.filter(c => c.id !== contractId));
      
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          title: "Agreement Removed (Sandbox)",
          message: "Contract removed from local session mockup states."
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleEditContract = (contract: Contract) => {
    window.history.pushState({}, '', `/contracts/${contract.id}`);
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <div className="space-y-6 animate-fade-in" id="contracts-client-desk">
      
      {/* Header Deck */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#1F2D45]">
        <div>
          <h1 className="text-2xl font-black text-white font-display uppercase tracking-tight flex items-center gap-2">
            Carrier Contracts
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Manage negotiated contract rate templates. Our AI references these rules to catch billing discrepancies.
          </p>
        </div>

        <button
          onClick={handleAddContractClick}
          className="py-2.5 px-4.5 bg-[#2DD4BF] hover:bg-[#14B8A4] text-black font-semibold rounded-lg text-xs uppercase tracking-wide transition-all shadow-[0_0_20px_rgba(45,212,191,0.25)] hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
          id="add-contract-link-btn"
        >
          <Plus size={15} />
          <span>Add Contract</span>
        </button>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="flex items-center justify-center p-16">
          <div className="h-8 w-8 border-4 border-[#2DD4BF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={<FileSignature size={32} />}
          title="No contracts yet"
          description="Add your first carrier contract to enable automatic AI freight auditing."
          actionText="Add your first contract"
          onActionClick={handleAddContractClick}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contracts.map(contract => (
            <TypedContractCard
              key={contract.id}
              contract={contract}
              onEdit={handleEditContract}
              onDelete={handleDeleteContract}
            />
          ))}
        </div>
      )}

    </div>
  );
}
