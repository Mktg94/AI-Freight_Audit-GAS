"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, Lock, Loader2, Sparkles, CheckCircle } from 'lucide-react';

interface UpdatePasswordPageProps {
  onPasswordUpdated?: () => void;
}

export default function UpdatePasswordPage({ onPasswordUpdated }: UpdatePasswordPageProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [useMock, setUseMock] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      setUseMock(true);
      setRecoveryReady(true);
      return;
    }

    const supabase = createClient();

    async function init() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        window.history.replaceState({}, '', '/auth/update-password');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setRecoveryReady(true);
      } else {
        setErrorMsg('Invalid or expired recovery link. Please request a new one.');
      }
    }

    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    try {
      if (useMock) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSuccess(true);
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      await supabase.auth.signOut();
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    if (onPasswordUpdated) {
      onPasswordUpdated();
    } else {
      window.history.pushState({}, '', '/auth/login');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl p-8 relative z-10 shadow-sm text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mb-6">
            <CheckCircle className="text-green-600 h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight mb-2">
            Password updated
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Your password has been reset successfully. Sign in with your new password.
          </p>
          <button
            type="button"
            onClick={navigateToLogin}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs tracking-wide uppercase transition-all cursor-pointer shadow-sm"
          >
            Sign In
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
            Set new password
          </h2>
          <p className="text-sm text-gray-500">
            Choose a strong password for your account
          </p>
        </div>

        {useMock && (
          <div className="mb-6 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-left">
            <div className="flex items-center gap-1.5 text-indigo-600 font-semibold text-[10px] uppercase tracking-wider mb-1">
              <Sparkles size={12} /> Sandbox Interactive Mode
            </div>
            <p className="text-[10px] text-gray-500 leading-normal">
              Password updates are simulated in sandbox mode.
            </p>
          </div>
        )}

        {!recoveryReady && !errorMsg && (
          <div className="p-4 text-center">
            <Loader2 size={20} className="animate-spin mx-auto mb-2 text-indigo-600" />
            <p className="text-sm text-gray-500">Validating recovery link...</p>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
            <p className="text-[11px] text-red-600 font-medium leading-normal">{errorMsg}</p>
          </div>
        )}

        {recoveryReady && !errorMsg && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Lock size={15} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="at least 8 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 placeholder-gray-400 text-xs transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Lock size={15} />
                </span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="repeat password"
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
                  <span>Updating password...</span>
                </>
              ) : (
                <span>Reset Password</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
