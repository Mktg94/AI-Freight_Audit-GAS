"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, Mail, Lock, Loader2, Sparkles } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess?: (session: any) => void;
  onNavigateToSignup?: () => void;
}

export default function LoginPage({ onLoginSuccess, onNavigateToSignup }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [useMock, setUseMock] = useState(false);

  useEffect(() => {
    // Check if Supabase keys are configured or we should run in dev-safe mock mode
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      setUseMock(true);
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both your email and password');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (useMock) {
        // Safe simulator mode for AI Studio sandbox environments lacking Supabase DB secrets
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        const mockUser = {
          id: 'usr-mock-123',
          email,
          user_metadata: { full_name: 'Atlas Audit Team User' }
        };

        const mockSession = {
          user: mockUser,
          access_token: 'mock-jwt-token-abc-123'
        };

        if (onLoginSuccess) {
          onLoginSuccess(mockSession);
        } else {
          // Fallback standard routing
          window.history.pushState({}, '', '/dashboard');
          window.dispatchEvent(new Event('popstate'));
        }
        return;
      }

      // Real Supabase Auth Execution
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.session) {
        if (onLoginSuccess) {
          onLoginSuccess(data.session);
        } else {
          window.history.pushState({}, '', '/dashboard');
          window.dispatchEvent(new Event('popstate'));
        }
      }
    } catch (err: any) {
      console.error('Sign-in operation encountered an error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Demo fill helper
  const fillDemoCredentials = () => {
    setEmail('audit@atlaslogistics.com');
    setPassword('demopass123');
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center p-6 relative overflow-hidden" id="auth-login-screen">
      
      {/* Decorative subtle gradient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-teal-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-[#111827] border border-teal-900/40 rounded-xl p-8 relative z-10 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        
        {/* Branding header bar */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-teal-500 to-teal-400 p-0.5 flex items-center justify-center shadow-[0_0_20px_rgba(45,212,191,0.25)]">
            <div className="h-full w-full bg-[#111827] rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="text-[#2DD4BF] h-6 w-6 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#2DD4BF] font-display">
              FreightAudit <span className="text-white">AI</span>
            </h1>
            <p className="text-[10px] text-[#2DD4BF] font-mono tracking-widest uppercase mt-0.5 font-bold">
              Automated Billing Protection
            </p>
          </div>
          <h2 className="text-lg font-medium text-white tracking-tight mt-4 font-display">
            Welcome back
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Sign in to access secure carrier audit ledgers and dispute generators
          </p>
        </div>

        {useMock && (
          <div className="mb-6 p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg text-left">
            <div className="flex items-center gap-1.5 text-[#2DD4BF] font-bold text-[10px] uppercase tracking-wider mb-1">
              <Sparkles size={12} /> Sandbox Interactive Mode
            </div>
            <p className="text-[10px] text-zinc-400 leading-normal">
              Running without active cloud secrets. Log in with any email & password (min 6 chars) or click autofill to use simulated accounts.
            </p>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="mt-2 text-[10px] font-semibold text-[#2DD4BF] hover:underline"
            >
              Autofill Atlas Global Logistics Test Account
            </button>
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-5">
          {/* Email Form Entry */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
              Corporate Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <Mail size={15} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0A0F1E] text-[#F1F5F9] border border-[#1F2D45] rounded-lg focus:outline-none focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF] placeholder-[#475569] text-xs transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
              />
            </div>
          </div>

          {/* Password Form Entry */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                Account Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <Lock size={15} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0A0F1E] text-[#F1F5F9] border border-[#1F2D45] rounded-lg focus:outline-none focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF] placeholder-[#475569] text-xs transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
              />
            </div>
          </div>

          {/* Sign-In Submit Trigger */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#2DD4BF] hover:bg-[#14B8A4] disabled:opacity-50 text-black font-semibold rounded-lg text-xs tracking-wide uppercase transition-all shadow-[0_0_20px_rgba(45,212,191,0.2)] hover:shadow-[0_0_25px_rgba(45,212,191,0.35)] flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Authorizing user Ledger...</span>
              </>
            ) : (
              <span>Sign In to Portal</span>
            )}
          </button>

          {/* Red Inline Error Block */}
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/35 rounded-lg text-center">
              <p className="text-[11px] text-red-400 font-semibold leading-normal">{errorMsg}</p>
            </div>
          )}
        </form>

        {/* Link back over to Signup */}
        <div className="mt-6 text-center text-xs">
          <span className="text-[#94A3B8] font-medium">Don't have an account? </span>
          <button
            type="button"
            onClick={onNavigateToSignup ? onNavigateToSignup : () => {
              window.history.pushState({}, '', '/auth/signup');
              window.dispatchEvent(new Event('popstate'));
            }}
            className="text-[#2DD4BF] font-semibold hover:underline bg-transparent border-none cursor-pointer"
          >
            Sign up
          </button>
        </div>

      </div>

      {/* Corporate trust and indicators */}
      <p className="text-[10px] text-zinc-600 mt-8 font-mono tracking-wider">
        FreightAudit AI &bull; Secure AES Encryption &bull; v1.4.0
      </p>
    </div>
  );
}
