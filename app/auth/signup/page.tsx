"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, Mail, Lock, User, Building, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

interface SignupPageProps {
  onSignupSuccess?: (session: any, companyName: string) => void;
  onNavigateToLogin?: () => void;
}

export default function SignupPage({ onSignupSuccess, onNavigateToLogin }: SignupPageProps) {
  const [companyName, setCompanyName] = useState('');
  const [yourName, setYourName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
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

  const handleSignUpHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!companyName.trim()) {
      setErrorMsg('Company Name is required');
      return;
    }
    if (!yourName.trim()) {
      setErrorMsg('Full Name is required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please supply a valid corporate email address');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Review and enter again.');
      return;
    }

    setLoading(true);

    try {
      if (useMock) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockUser = {
          id: `usr-mock-${Date.now()}`,
          email,
          user_metadata: { full_name: yourName }
        };

        const mockSession = {
          user: mockUser,
          access_token: 'mock-jwt-register-token-123'
        };

        if (onSignupSuccess) {
          onSignupSuccess(mockSession, companyName);
        } else {
          window.history.pushState({}, '', '/dashboard');
          window.dispatchEvent(new Event('popstate'));
        }
        return;
      }

      const supabase = createClient();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: yourName,
          }
        }
      });

      if (error) {
        throw error;
      }

      if (!data?.user) {
        throw new Error('No user data returned from Auth gateway.');
      }

      const { error: orgError } = await supabase
        .from('organizations')
        .insert([
          {
            name: companyName,
            owner_id: data.user.id
          }
        ]);

      if (orgError) {
        console.error('Failed to create company entry, but auth occurred:', orgError);
      }

      if (onSignupSuccess) {
        onSignupSuccess(data, companyName);
      } else {
        window.history.pushState({}, '', '/dashboard?welcome=true');
        window.dispatchEvent(new Event('popstate'));
      }

    } catch (err: any) {
      console.error('Sign-up procedure encountered an error:', err);
      setErrorMsg(err.message || 'Registration failed. Please consult network setup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 relative" id="auth-signup-screen">
      
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl p-8 relative z-10 shadow-sm">
        
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
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
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight mt-3">
            Create Free Account
          </h2>
          <p className="text-sm text-gray-500">
            Begin protecting your logistical margins and auditing freight invoices
          </p>
        </div>

        {useMock && (
          <div className="mb-6 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-left">
            <div className="flex items-center gap-1.5 text-indigo-600 font-semibold text-[10px] uppercase tracking-wider mb-1">
              <Sparkles size={12} /> Sandbox Interactive Mode
            </div>
            <p className="text-[10px] text-gray-500 leading-normal">
              Running without active cloud secrets. Fill out the form, and click Register. Simulation will automatically set up your local workspace environment.
            </p>
          </div>
        )}

        <form onSubmit={handleSignUpHandler} className="space-y-4">
          
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Company / Organization Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Building size={14} />
              </span>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Atlas Global Logistics"
                className="w-full pl-9 pr-4 py-2 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 placeholder-gray-400 text-xs transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Your Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <User size={14} />
              </span>
              <input
                type="text"
                required
                value={yourName}
                onChange={(e) => setYourName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full pl-9 pr-4 py-2 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 placeholder-gray-400 text-xs transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Work Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Mail size={14} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-9 pr-4 py-2 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 placeholder-gray-400 text-xs transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Secure Password (min 8 characters)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Lock size={14} />
              </span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (minimum 8 chars)"
                className="w-full pl-9 pr-4 py-2 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 placeholder-gray-400 text-xs transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Lock size={14} />
              </span>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retype password"
                className="w-full pl-9 pr-4 py-2 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 placeholder-gray-400 text-xs transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs tracking-wide uppercase transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Assembling corporate details...</span>
              </>
            ) : (
              <span>Create Free Account</span>
            )}
          </button>

          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-center mt-2">
              <p className="text-[10px] text-red-600 font-medium leading-normal">{errorMsg}</p>
            </div>
          )}
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-400 font-medium">Already have an account? </span>
          <button
            type="button"
            onClick={onNavigateToLogin ? onNavigateToLogin : () => {
              window.history.pushState({}, '', '/auth/login');
              window.dispatchEvent(new Event('popstate'));
            }}
            className="text-indigo-600 font-semibold hover:underline bg-transparent border-none cursor-pointer"
          >
            Sign in
          </button>
        </div>

      </div>

      <p className="text-[10px] text-gray-400 mt-6 font-mono tracking-wider">
        FreightAudit AI &bull; Secure AES Encryption &bull; v1.4.0
      </p>
    </div>
  );
}
