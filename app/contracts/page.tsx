import React from 'react';
import { createClient } from '@/lib/supabase/server';
import ContractPageClient from '@/components/contracts/ContractPageClient';
import { initialContracts } from '@/src/fakeData';

export const dynamic = 'force-dynamic';

export default async function CarrierContractsPage() {
  let contracts = [];
  
  try {
    const supabase = createClient();
    
    // Fetch contracts ordered by newest created first
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      contracts = data;
    } else {
      console.warn("Supabase contract fetch failed, using fallback data:", error);
      contracts = initialContracts;
    }
  } catch (err) {
    console.warn("Express / local context error, using memory sandbox backup:", err);
    contracts = initialContracts;
  }

  return <ContractPageClient initialContracts={contracts} />;
}
