"use client";

import React, { useEffect, useState } from 'react';
import UploadDropzone from '@/components/invoices/UploadDropzone';
import SplitPreviewModal from '@/components/invoices/SplitPreviewModal';
import BatchProgressTracker from '@/components/invoices/BatchProgressTracker';
import UsageLimitBanner from '@/components/shared/UsageLimitBanner';
import { createClient } from '@/lib/supabase/client';
import { Contract } from '@/types';
import { 
  FileText, Landmark, Play, Loader2, ArrowLeft, Layers, Sparkles 
} from 'lucide-react';

export default function InvoiceUploadPage() {
  const [phase, setPhase] = useState<1 | 2>(1); // 1 = Upload Setup, 2 = Auditing Progress Tracker
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Split Preview modal control state
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitFileName, setSplitFileName] = useState('');
  const [splitDetectedCount, setSplitDetectedCount] = useState(1);
  const [splitPreviewData, setSplitPreviewData] = useState<any[]>([]);
  const [checkingMulti, setCheckingMulti] = useState(false);

  // Batch status states
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [refreshBanner, setRefreshBanner] = useState(0);

  // Load Carrier Contracts Agreements on mount
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
          // Fallback Express route CRM fetch
          const response = await fetch('/api/contracts');
          const result = await response.json();
          if (result.success && result.data) {
            setContracts(result.data);
            setSelectedContractId(result.data[0]?.id || '');
          }
        }
      } catch (err) {
        console.warn("Unable to fetch comparisons contract schedules:", err);
      } finally {
        setLoadingContracts(false);
      }
    }
    loadContracts();
  }, []);

  // Validate limits and multi-invoice flags on Click Start
  const handleStartAuditCheck = async () => {
    if (selectedFiles.length === 0 || !selectedContractId) return;

    setCheckingMulti(true);
    setUploadError(null);

    try {
      // Step 1: For each file, check if any is a multi-page/multi-invoice element
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
            // Found a multi invoice! Open SplitPreviewModal first as required
            setSplitFileName(file.name);
            setSplitDetectedCount(checkData.estimatedCount);
            setSplitPreviewData(checkData.previewData || []);
            setShowSplitModal(true);
            setCheckingMulti(false);
            return; // Halt and show dialog modal!
          }
        }
      }

      // No multi-invoice files detected: proceed directly to batch audit
      await executeFullBatchUpload();

    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Verification phase failed');
      setCheckingMulti(false);
    }
  };

  // Perform full batch uploading to Route Parser
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
        headers: {
          // Note: let the browser set the boundary correctly for multi-part
        },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'invoice_limit_reached') {
          throw new Error(`Usage limit of ${data.limit} monthly invoices reached. Upgrade plan to resume audits.`);
        }
        throw new Error(data.error || 'Batch creation transaction error.');
      }

      // Set state to tracker
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
    setRefreshBanner(prev => prev + 1); // Refresh usage statistics
  };

  return (
    <div className="max-w-xl mx-auto py-4 md:py-8 space-y-6" id="upload-pipeline-wrapper">
      
      {/* Upload Header navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            window.history.pushState({}, '', '/invoices');
            window.dispatchEvent(new Event('popstate'));
          }}
          className="p-1.5 rounded-lg border border-[#1F2D45] bg-[#111827] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-black font-display uppercase tracking-tight text-white flex items-center gap-2">
            <span>Audit Upload Center</span>
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Transmit LTL shipping invoices for programmatic cross-checking with contractual terms.
          </p>
        </div>
      </div>

      {/* Usage Limit Banner displays in Setup Tab */}
      {phase === 1 && (
        <UsageLimitBanner refreshTrigger={refreshBanner} />
      )}

      {phase === 1 ? (
        <div className="bg-[#111827] border border-teal-900/40 rounded-xl p-5 md:p-6 space-y-5 shadow-2xl" id="phase-1-form">
          {uploadError && (
            <div className="bg-red-950/20 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-xs font-mono leading-relaxed" id="upload-error-display">
              ⚠ {uploadError}
            </div>
          )}

          {/* Multiple PDF Upload Dropzone */}
          <div>
            <label className="text-[10px] font-bold text-[#2DD4BF] font-mono uppercase tracking-widest block mb-2">
              Invoice PDF Documents
            </label>
            <UploadDropzone onFilesSelect={setSelectedFiles} />
          </div>

          {/* Active Contract comparison choice */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#2DD4BF] font-mono uppercase tracking-widest block">
              Comparison Contract Rate Sheet
            </label>
            {loadingContracts ? (
              <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                <Loader2 size={14} className="animate-spin text-teal-400" />
                <span>Loading active agreements...</span>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedContractId}
                  onChange={(e) => setSelectedContractId(e.target.value)}
                  className="w-full bg-[#0A0F1E] border border-[#1F2D45] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#2DD4BF] focus:shadow-[0_0_15px_rgba(45,212,191,0.15)] transition-all cursor-pointer appearance-none font-sans"
                  id="contract-comparison-selector"
                >
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#0A0F1E] text-white py-2">
                      {c.carrier_name} — Rate Profile Agreement (Min charge ${c.minimum_charge})
                    </option>
                  ))}
                </select>
                <Landmark className="absolute right-4 top-3.5 h-4 w-4 text-[#475569] pointer-events-none" />
              </div>
            )}
          </div>

          {/* Action trigger button */}
          <button
            type="button"
            disabled={selectedFiles.length === 0 || !selectedContractId || checkingMulti}
            onClick={handleStartAuditCheck}
            className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider font-mono flex items-center justify-center gap-2 transition-all duration-300 ${
              selectedFiles.length > 0 && selectedContractId && !checkingMulti
                ? 'bg-[#2DD4BF] text-[#0A0F1E] shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:bg-[#14B8A4] hover:scale-[1.01] cursor-pointer'
                : 'bg-[#1C2537] text-zinc-500 cursor-not-allowed border border-[#1F2D45]'
            }`}
          >
            {checkingMulti ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Verifying Invoice Formats...</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Start AI Audit Pipeline</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Progress Batch polling view */
        currentBatchId && (
          <BatchProgressTracker 
            batchId={currentBatchId} 
            files={selectedFiles} 
            onRetry={handleReturnToSetup} 
            onComplete={(ids) => {
              // Custom completed toast triggers
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

      {/* Split Preview screen overlay */}
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
