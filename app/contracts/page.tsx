import React from 'react';
import { createClient } from '@/lib/supabase/server';
import ContractPageClient from '@/components/contracts/ContractPageClient';

export const dynamic = 'force-dynamic';

export default async function CarrierContractsPage() {
  let contracts = [];
  
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      contracts = data;
    }
  } catch (err) {
    console.warn("Contract fetch failed:", err);
  }

  return <ContractPageClient initialContracts={contracts} />;
}
