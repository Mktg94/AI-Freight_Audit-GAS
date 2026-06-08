import React from 'react';
import ContractForm from '@/components/contracts/ContractForm';

export default function NewContractPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4">
      <ContractForm contract={null} />
    </div>
  );
}
