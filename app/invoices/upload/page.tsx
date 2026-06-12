"use client";

import React, { useEffect, useState } from 'react';
import UploadDropzone from '@/components/invoices/UploadDropzone';
import SplitPreviewModal from '@/components/invoices/SplitPreviewModal';
import BatchProgressTracker from '@/components/invoices/BatchProgressTracker';
import UsageLimitBanner from '@/components/shared/UsageLimitBanner';
import { createClient } from '@/lib/supabase/client';
import { Contract } from '@/types';
import { 
  FileText, Landmark, Play, Loader2, ArrowLeft, Sparkles 
} from 'lucide-react';

export default function InvoiceUploadPage() {
  const [phase, setPhase] = useState<1 | 2>(1);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitFileName, setSplitFileName] = useState('');
  const [splitDetectedCount, setSplitDetectedCount] = useState(1);
  const [splitPreviewData, setSplitPreviewData] = useState<any[]>([]);
  const [checkingMulti, setCheckingMulti] = useState(false);

  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [refreshBanner, setRefreshBanner] = useState(0);

  useEffect(() => {
    async function loadContracts() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('contracts')
          .select('*')
          .order('carrier_name', { ascending: true });

        if (!error && data && data.length > 0) {
          setContracts(data);
          setSelectedContractId(data[0].id);
        } else {
          const response = await fetch('/api/contracts');
          const result = await response.json();
          if (result.success && result.data) {
            setContracts(result.data);
            setSelectedContractId(result.data[0]?.id || '');
          }
        }
      } catch (err) {
        console.warn("Unable to fetch comparison contract schedules:", err);
      } finally {
        setLoadingContracts(false);
      }
    }
    loadContracts();
  }, []);

  const handleStartAuditCheck = async () => {
    if (selectedFiles.length === 0 || !selectedContractId) return;

    setCheckingMulti(true);
    setUploadError(null);

    try {
      for (const file of selectedFiles) {
        const checkFormData = new FormData();
        checkFormData.append('file', file);

        const checkRes = await fetch('/api/invoices/detect-multi', {
          method: 'POST',
          body: checkFormData
        });

        if (checkRes.ok) {
          const checkData = await checkRes.json();
          
          if (checkData.isMultiInvoice) {
            setSplitFileName(file.name);
            setSplitDetectedCount(checkData.estimatedCount);
            setSplitPreviewData(checkData.previewData || []);
            setShowSplitModal(true);
            setCheckingMulti(false);
            return;
          }
        }
      }

      await executeFullBatchUpload();

    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Verification phase failed');
      setCheckingMulti(false);
    }
  };

  const executeFullBatchUpload = async () => {
    setShowSplitModal(false);
    setCheckingMulti(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('contract_id', selectedContractId);

      const res = await fetch('/api/invoices/batch-upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'invoice_limit_reached') {
          throw new Error(`Usage limit of ${data.limit} monthly invoices reached. Upgrade plan to resume audits.`);
        }
        throw new Error(data.error || 'Batch creation transaction error.');
      }

      setCurrentBatchId(data.batchId);
      setPhase(2);

    } catch (err: any) {
      setUploadError(err.message || 'Audit pipeline submission failed.');
    } finally {
      setCheckingMulti(false);
    }
  };

  const handleReturnToSetup = () => {
    setPhase(1);
    setSelectedFiles([]);
    setCurrentBatchId(null);
    setRefreshBanner(prev => prev + 1);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6" id="upload-pipeline-wrapper">
      
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            window.history.pushState({}, '', '/invoices');
            window.dispatchEvent(new Event('popstate'));
          }}
          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Audit Upload Center
          </h1>
          <p className="text-sm text-gray-500">
            Upload invoices for AI contract cross-checking.
          </p>
        </div>
      </div>

      {phase === 1 && (
        <UsageLimitBanner refreshTrigger={refreshBanner} />
      )}

      {phase === 1 ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5" id="phase-1-form">
          {uploadError && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm" id="upload-error-display">
              {uploadError}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Invoice PDF Documents
            </label>
            <UploadDropzone onFilesSelect={setSelectedFiles} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
              Comparison Contract
            </label>
            {loadingContracts ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 size={14} className="animate-spin text-indigo-600" />
                <span>Loading agreements...</span>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedContractId}
                  onChange={(e) => setSelectedContractId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-500 transition-all cursor-pointer"
                  id="contract-comparison-selector"
                >
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.carrier_name}
                    </option>
                  ))}
                </select>
                <Landmark className="absolute right-4 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={selectedFiles.length === 0 || !selectedContractId || checkingMulti}
            onClick={handleStartAuditCheck}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-150 ${
              selectedFiles.length > 0 && selectedContractId && !checkingMulti
                ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white cursor-pointer'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {checkingMulti ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Verifying Formats...</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Start AI Audit</span>
              </>
            )}
          </button>
        </div>
      ) : (
        currentBatchId && (
          <BatchProgressTracker 
            batchId={currentBatchId} 
            files={selectedFiles} 
            onRetry={handleReturnToSetup} 
            onComplete={(ids) => {
              const toastEvent = new CustomEvent('toast-message', {
                detail: {
                  title: 'Batch Completed',
                  message: 'Freight invoices analyzed, discrepancies categorized successfully.'
                }
              });
              window.dispatchEvent(toastEvent);
            }}
          />
        )
      )}

      <SplitPreviewModal
        isOpen={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        onConfirm={executeFullBatchUpload}
        filename={splitFileName}
        detectedCount={splitDetectedCount}
        previewData={splitPreviewData}
      />
    </div>
  );
}
