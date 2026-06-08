"use client";

import React, { useEffect, useState } from 'react';
import { 
  Loader2, CheckCircle2, AlertCircle, ChevronRight, 
  Clock, ArrowRight, Play, RefreshCw, Layers 
} from 'lucide-react';

interface BatchProgressTrackerProps {
  batchId: string;
  files: File[];
  onComplete?: (invoiceIds: string[]) => void;
  onRetry?: () => void;
}

interface BatchStatusResponse {
  status: 'splitting' | 'processing' | 'completed' | 'failed';
  completedCount: number;
  totalCount: number;
  invoiceIds: string[];
  failedFiles: string[];
}

export default function BatchProgressTracker({
  batchId,
  files,
  onComplete,
  onRetry
}: BatchProgressTrackerProps) {
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(files.length);
  const [invoiceIds, setInvoiceIds] = useState<string[]>([]);
  const [status, setStatus] = useState<'splitting' | 'processing' | 'completed' | 'failed'>('splitting');
  const [elapsed, setElapsed] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Poll batch status every 3 seconds
  useEffect(() => {
    let intervalId: any;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/invoices/batch/${batchId}/status`);
        if (!res.ok) throw new Error('Failed to fetch processing status');
        
        const data: BatchStatusResponse = await res.json();
        
        setStatus(data.status);
        setCompleted(data.completedCount);
        setTotal(Math.max(files.length, data.totalCount));
        setInvoiceIds(data.invoiceIds);

        if (data.status === 'completed') {
          clearInterval(intervalId);
          if (onComplete) {
            onComplete(data.invoiceIds);
          }
        } else if (data.status === 'failed') {
          clearInterval(intervalId);
          setErrorMessage('Processing batch audit routine terminated due to database write failure');
        }
      } catch (err: any) {
        console.warn('Polling status status offline / warning:', err);
      }
    };

    // run immediate
    checkStatus();

    intervalId = setInterval(checkStatus, 3000);

    return () => clearInterval(intervalId);
  }, [batchId, onComplete, files.length]);

  // Timer interval for elapsed time
  useEffect(() => {
    if (status === 'completed' || status === 'failed') return;
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  const formatElapsed = (allSeconds: number) => {
    if (allSeconds < 60) return `${allSeconds}s`;
    const mins = Math.floor(allSeconds / 60);
    const secs = allSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Compute files stages
  // Statuses: Queued -> Splitting -> Extracting -> Auditing -> Done | Failed
  const getFileState = (index: number) => {
    if (status === 'completed') {
      return { label: 'Done', color: 'text-emerald-400', icon: <CheckCircle2 size={13} className="text-emerald-400" /> };
    }
    if (status === 'failed') {
      return { label: 'Failed', color: 'text-red-400', icon: <AlertCircle size={13} className="text-red-400" /> };
    }

    // Heuristically map file states depending on completed indices
    if (index < completed) {
      return { label: 'Done', color: 'text-emerald-400', icon: <CheckCircle2 size={13} className="text-emerald-400" /> };
    } else if (index === completed) {
      if (status === 'splitting') {
        return { label: 'Splitting', color: 'text-amber-400', icon: <Loader2 size={13} className="animate-spin text-amber-400" /> };
      }
      // Alternate step for visualization
      const subSeconds = elapsed % 15;
      if (subSeconds < 5) {
        return { label: 'Extracting', color: 'text-teal-400', icon: <Loader2 size={13} className="animate-spin text-teal-400" /> };
      } else {
        return { label: 'Auditing', color: 'text-teal-400', icon: <Loader2 size={13} className="animate-spin text-[#2DD4BF]" /> };
      }
    } else {
      return { label: 'Queued', color: 'text-slate-500', icon: <Clock size={13} className="text-slate-500" /> };
    }
  };

  const percentComplete = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-[#111827] border border-teal-900/40 rounded-xl p-5 md:p-8 space-y-6" id="batch-progress-tracker-card">
      
      {/* Tracker Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F2D45]/40 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center h-5 w-5 rounded bg-teal-500/10 border border-teal-500/30 text-[#2DD4BF]">
              <Layers size={12} className="animate-pulse" />
            </span>
            <h3 className="text-sm font-black text-white font-display uppercase tracking-wide">
              Bulk Processing Pipeline
            </h3>
          </div>
          <p className="text-[10px] text-[#94A3B8] font-mono uppercase tracking-wider font-extrabold flex items-center gap-1.5">
            <span>ID: <code className="text-teal-400">{batchId}</code></span>
            <span>·</span>
            <span>Elapsed: {formatElapsed(elapsed)}</span>
          </p>
        </div>

        {status === 'completed' && (
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.history.pushState({}, '', `/invoices?batch=${batchId}`);
                window.dispatchEvent(new Event('popstate'));
              }
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-[#10B981] text-black font-extrabold uppercase font-mono tracking-wider text-[11px] rounded-lg shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_25px_rgba(45,212,191,0.5)] transition-all flex items-center gap-1.5 active:scale-[0.98] cursor-pointer"
          >
            <span>View Results</span>
            <ArrowRight size={13} />
          </button>
        )}
      </div>

      {/* Progress Bar display */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-white font-display tracking-wide uppercase">
            {status === 'completed' 
              ? 'Invoice Processing Completed!' 
              : status === 'failed'
              ? 'Processing Pipeline Terminated'
              : `Processing ${completed} of ${total} individual invoices...`}
          </span>
          <span className="text-[#2DD4BF] font-mono font-extrabold">
            {percentComplete}%
          </span>
        </div>

        <div className="h-2 w-full bg-[#0A0F1E] border border-[#1F2D45] rounded-full overflow-hidden shrink-0">
          <div 
            className="h-full bg-gradient-to-r from-teal-500 to-[#10B981] shadow-[0_0_15px_rgba(45,212,191,0.4)] rounded-full transition-all duration-500"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {/* Per-File progress list */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-mono font-black tracking-widest text-[#94A3B8] uppercase">
          Uploaded File Elements Status
        </h4>
        <div className="max-h-[300px] overflow-y-auto border border-[#1F2D45] rounded-lg bg-[#0A0F1E] divide-y divide-[#1F2D45]/40">
          {files.map((file, idx) => {
            const fileState = getFileState(idx);
            return (
              <div 
                key={idx}
                className="p-3.5 flex items-center justify-between gap-4 hover:bg-[#111827]/40 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="text-slate-500 shrink-0">
                    <ChevronRight size={12} className="text-[#2DD4BF]" />
                  </div>
                  <span className="font-mono text-white truncate max-w-[220px] md:max-w-md">
                    {file.name}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase font-extrabold ${fileState.color}`}>
                    {fileState.icon}
                    <span>{fileState.label}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatElapsed(idx < completed ? Math.min(elapsed, (idx + 1) * 8) : elapsed)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error & Retry blocks */}
      {status === 'failed' && (
        <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-red-400 uppercase font-mono tracking-wider">
                Pipeline execution error
              </p>
              <p className="text-[#94A3B8]">
                {errorMessage || 'One or more of the uploaded files could not be correctly split or audited.'}
              </p>
            </div>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-mono uppercase text-[10px] font-extrabold rounded-lg shrink-0 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw size={12} />
              <span>Retry Upload</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
