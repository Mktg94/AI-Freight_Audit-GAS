import React from 'react';
import { createClient } from '@/lib/supabase/server';
import ContractForm from '@/components/contracts/ContractForm';
import { initialContracts } from '@/src/fakeData';

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function EditContractPage({ params }: PageProps) {
  // Gracefully handle dynamic params (which can be a Promise in newer Next.js versions)
  const resolvedParams = await ('then' in params ? params : Promise.resolve(params));
  const id = resolvedParams?.id;
  
  let contract = null;

  if (id) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        contract = data;
      } else {
        console.warn(`Supabase contract loading for ID ${id} failed, resorting to static cache:`, error);
        contract = initialContracts.find(c => c.id === id) || null;
      }
    } catch (err) {
      console.warn("Fell back to memory datasets for editing state:", err);
      contract = initialContracts.find(c => c.id === id) || null;
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4">
      <ContractForm contract={contract} />
    </div>
  );
}
