"use client";

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log the error details internally for telemetry audits
    console.error("Global boundary intercept audit: ", error);
  }, [error]);

  const navigateToDashboard = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/dashboard');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center p-6 text-center" id="global-error-page-root">
      
      {/* Red ambient decorative blur */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-80 w-80 bg-red-500/5 blur-3xl rounded-full pointer-events-none" />

      <div className="relative space-y-6 max-w-xl w-full" id="error-boundary-deck">
        
        {/* Large alert warning badge */}
        <div className="flex justify-center">
          <div className="bg-red-500/10 text-[#EF4444] p-3 rounded-2xl border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
            <AlertTriangle size={24} />
          </div>
        </div>

        {/* Header warnings */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white font-display tracking-tight uppercase">
            Something went wrong
          </h1>
          <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
            Our automated audit engine logged an unexpected layout rendering exception.
          </p>
        </div>

        {/* Error message in code block format */}
        <div className="bg-[#111827] border border-red-900/40 rounded-xl p-4 text-left shadow-lg overflow-hidden">
          <span className="text-[9px] font-mono text-red-400 font-extrabold block uppercase tracking-wide border-b border-[#1F2D45]/40 pb-2 mb-2">
            STACK EXCEPTION METRICS:
          </span>
          <pre className="text-[10px] text-[#94A3B8] font-mono whitespace-pre-wrap word-break overflow-x-auto max-h-[160px] leading-relaxed select-all">
            {error.message || 'Unknown runtime error occurred within standard context.'}
            {error.digest && `\nException ID: ${error.digest}`}
          </pre>
        </div>

        {/* Row actions */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2" id="error-actions-deck">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto hover:bg-[#14B8A4] bg-[#2DD4BF] text-black font-black font-mono py-2.5 px-6 rounded-lg uppercase tracking-wider text-xs cursor-pointer transition-all inline-flex items-center justify-center gap-2"
            id="error-try-again-action"
          >
            <RotateCcw size={14} />
            <span>Try Again</span>
          </button>
          
          <button
            onClick={navigateToDashboard}
            className="w-full sm:w-auto bg-[#1C2537] hover:bg-[#1C2537]/80 text-[#94A3B8] hover:text-white border border-[#1F2D45] rounded-lg font-mono font-black py-2.5 px-5 uppercase tracking-wider text-xs cursor-pointer transition-all inline-flex items-center justify-center gap-2"
          >
            <Home size={14} />
            <span>Dashboard Home</span>
          </button>
        </div>

      </div>

    </div>
  );
}
