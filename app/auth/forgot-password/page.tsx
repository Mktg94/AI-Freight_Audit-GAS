"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, Mail, ArrowLeft, Loader2, Sparkles, CheckCircle } from 'lucide-react';

interface ForgotPasswordPageProps {
  onNavigateToLogin?: () => void;
}

export default function ForgotPasswordPage({ onNavigateToLogin }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sent, setSent] = useState(false);
  const [useMock, setUseMock] = useState(false);

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      setUseMock(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    try {
      if (useMock) {
        await new Promise(resolve => setTimeout(resolve, 1200));
        setSent(true);
        return;
      }

      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/update-password`,
      });

      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    if (onNavigateToLogin) {
      onNavigateToLogin();
    } else {
      window.history.pushState({}, '', '/auth/login');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl p-8 relative z-10 shadow-sm text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mb-6">
            <CheckCircle className="text-green-600 h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight mb-2">
            Check your inbox
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            If an account exists for <strong className="text-gray-700">{email}</strong>, we've sent password reset instructions.
          </p>
          <button
            type="button"
            onClick={navigateToLogin}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs tracking-wide uppercase transition-all cursor-pointer shadow-sm"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl p-8 relative z-10 shadow-sm">
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <ShieldCheck className="text-indigo-600 h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              FreightAudit <span className="text-indigo-600">AI</span>
            </h1>
            <p className="text-[10px] text-indigo-600 font-mono tracking-widest uppercase mt-0.5 font-semibold">
              Automated Billing Protection
            </p>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight mt-4">
            Reset your password
          </h2>
          <p className="text-sm text-gray-500">
            Enter your email and we'll send you a recovery link
          </p>
        </div>

        {useMock && (
          <div className="mb-6 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-left">
            <div className="flex items-center gap-1.5 text-indigo-600 font-semibold text-[10px] uppercase tracking-wider mb-1">
              <Sparkles size={12} /> Sandbox Interactive Mode
            </div>
            <p className="text-[10px] text-gray-500 leading-normal">
              No email will be sent. Click Submit to simulate the reset flow.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Mail size={15} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 placeholder-gray-400 text-xs transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs tracking-wide uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Sending recovery link...</span>
              </>
            ) : (
              <span>Send Recovery Link</span>
            )}
          </button>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
              <p className="text-[11px] text-red-600 font-medium leading-normal">{errorMsg}</p>
            </div>
          )}
        </form>

        <div className="mt-6 text-center text-sm">
          <button
            type="button"
            onClick={navigateToLogin}
            className="text-indigo-600 font-semibold hover:underline bg-transparent border-none cursor-pointer inline-flex items-center gap-1"
          >
            <ArrowLeft size={14} />
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
