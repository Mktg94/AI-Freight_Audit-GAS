"use client";

import React from 'react';
import { HelpCircle, MoveLeft, Zap } from 'lucide-react';

export default function NotFoundPage() {
  const navigateToDashboard = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/dashboard');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center p-6 text-center select-none" id="notformatted-404-root">
      
      {/* Decorative ambient glowing ring */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-80 w-80 bg-teal-500/5 blur-3xl rounded-full pointer-events-none" />

      <div className="relative space-y-6 max-w-md" id="notfound-deck">
        
        {/* Decorative branding element */}
        <div className="flex justify-center">
          <div className="bg-[#2DD4BF]/10 text-[#2DD4BF] p-3 rounded-2xl border border-[#2DD4BF]/20 shadow-[0_0_20px_rgba(45,212,191,0.1)]">
            <Zap size={24} className="fill-[#2DD4BF]/10" />
          </div>
        </div>

        {/* Huge 404 graphic */}
        <h1 className="text-8xl md:text-9xl font-black text-[#2DD4BF] tracking-tighter font-display uppercase leading-none select-all drop-shadow-[0_0_25px_rgba(45,212,191,0.2)]">
          404
        </h1>

        <div className="space-y-2">
          <h2 className="text-lg font-black text-white font-display tracking-tight uppercase">
            Page Not Found
          </h2>
          <p className="text-xs text-[#94A3B8] leading-relaxed max-w-sm mx-auto">
            The page you're looking for doesn't exist or was moved to an administrative vault.
          </p>
        </div>

        {/* Back and CTA button */}
        <div className="pt-3">
          <button
            onClick={navigateToDashboard}
            className="shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:bg-[#14B8A4] bg-[#2DD4BF] text-black font-black font-mono py-3 px-6 rounded-lg uppercase tracking-wider text-xs cursor-pointer transition-all inline-flex items-center gap-2"
          >
            <MoveLeft size={14} />
            <span>Back to Dashboard</span>
          </button>
        </div>

      </div>

    </div>
  );
}
