import React from 'react';
import { createClient } from '@/lib/supabase/server';
import ContractForm from '@/components/contracts/ContractForm';

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function EditContractPage({ params }: PageProps) {
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
      }
    } catch (err) {
      console.warn(`Contract loading failed for ID ${id}:`, err);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4">
      <ContractForm contract={contract} />
    </div>
  );
}
