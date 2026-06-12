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
          window.history.pushState({}, '', '/dashboard');
          window.dispatchEvent(new Event('popstate'));
        }
        return;
      }

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

  const fillDemoCredentials = () => {
    setEmail('audit@atlaslogistics.com');
    setPassword('demopass123');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 relative" id="auth-login-screen">
      
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
            Welcome back
          </h2>
          <p className="text-sm text-gray-500">
            Sign in to access secure carrier audit ledgers and dispute generators
          </p>
        </div>

        {useMock && (
          <div className="mb-6 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-left">
            <div className="flex items-center gap-1.5 text-indigo-600 font-semibold text-[10px] uppercase tracking-wider mb-1">
              <Sparkles size={12} /> Sandbox Interactive Mode
            </div>
            <p className="text-[10px] text-gray-500 leading-normal">
              Running without active cloud secrets. Log in with any email & password (min 6 chars) or click autofill to use simulated accounts.
            </p>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="mt-2 text-[10px] font-semibold text-indigo-600 hover:underline"
            >
              Autofill Atlas Global Logistics Test Account
            </button>
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Corporate Email Address
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

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Account Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Lock size={15} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
                <span>Authorizing user Ledger...</span>
              </>
            ) : (
              <span>Sign In to Portal</span>
            )}
          </button>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
              <p className="text-[11px] text-red-600 font-medium leading-normal">{errorMsg}</p>
            </div>
          )}
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-400 font-medium">Don't have an account? </span>
          <button
            type="button"
            onClick={onNavigateToSignup ? onNavigateToSignup : () => {
              window.history.pushState({}, '', '/auth/signup');
              window.dispatchEvent(new Event('popstate'));
            }}
            className="text-indigo-600 font-semibold hover:underline bg-transparent border-none cursor-pointer"
          >
            Sign up
          </button>
        </div>

      </div>

      <p className="text-[10px] text-gray-400 mt-8 font-mono tracking-wider">
        FreightAudit AI &bull; Secure AES Encryption &bull; v1.4.0
      </p>
    </div>
  );
}
