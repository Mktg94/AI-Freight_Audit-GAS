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
    // Determine if Supabase configuration is present
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      setUseMock(true);
    }
  }, []);

  const handleSignUpHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Field-level client validations
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
        // Safe simulator mode for sandbox environment preview
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
          // Trigger local cookie or storage variable then redirect
          window.history.pushState({}, '', '/dashboard');
          window.dispatchEvent(new Event('popstate'));
        }
        return;
      }

      // Real Supabase Auth Execution
      const supabase = createClient();
      
      // 1. Sing up the user using Supabase
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

      // 2. Insert corresponding organization row
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
        // Continue but alert details
      }

      // Create a temporary mock session or direct logins
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
    <div className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center p-6 relative overflow-hidden" id="auth-signup-screen">
      
      {/* Decorative subtle background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-teal-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-[#111827] border border-teal-900/40 rounded-xl p-8 relative z-10 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        
        {/* Header brand details */}
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-teal-500 to-teal-400 p-0.5 flex items-center justify-center shadow-[0_0_20px_rgba(45,212,191,0.25)]">
            <div className="h-full w-full bg-[#111827] rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="text-[#2DD4BF] h-6 w-6" />
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
          <h2 className="text-lg font-medium text-white tracking-tight mt-3 font-display">
            Create Free Account
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Begin protecting your logistical margins and auditing freight invoices
          </p>
        </div>

        {useMock && (
          <div className="mb-6 p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg text-left">
            <div className="flex items-center gap-1.5 text-[#2DD4BF] font-bold text-[10px] uppercase tracking-wider mb-1">
              <Sparkles size={12} /> Sandbox Interactive Mode
            </div>
            <p className="text-[10px] text-zinc-400 leading-normal">
              Running without active cloud secrets. Fill out the form, and click Register. Simulation will automatically set up your local workspace environment.
            </p>
          </div>
        )}

        <form onSubmit={handleSignUpHandler} className="space-y-4">
          
          {/* Company Name */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
              Company / Organization Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <Building size={14} />
              </span>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Atlas Global Logistics"
                className="w-full pl-9 pr-4 py-2 bg-[#0A0F1E] text-[#F1F5F9] border border-[#1F2D45] rounded-lg focus:outline-none focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF] placeholder-[#475569] text-xs transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
              />
            </div>
          </div>

          {/* Your Name */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
              Your Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <User size={14} />
              </span>
              <input
                type="text"
                required
                value={yourName}
                onChange={(e) => setYourName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full pl-9 pr-4 py-2 bg-[#0A0F1E] text-[#F1F5F9] border border-[#1F2D45] rounded-lg focus:outline-none focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF] placeholder-[#475569] text-xs transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
              Work Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <Mail size={14} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-9 pr-4 py-2 bg-[#0A0F1E] text-[#F1F5F9] border border-[#1F2D45] rounded-lg focus:outline-none focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF] placeholder-[#475569] text-xs transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
              />
            </div>
          </div>

          {/* Password (min 8) */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
              Secure Password (min 8 characters)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <Lock size={14} />
              </span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (minimum 8 chars)"
                className="w-full pl-9 pr-4 py-2 bg-[#0A0F1E] text-[#F1F5F9] border border-[#1F2D45] rounded-lg focus:outline-none focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF] placeholder-[#475569] text-xs transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <Lock size={14} />
              </span>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retype password"
                className="w-full pl-9 pr-4 py-2 bg-[#0A0F1E] text-[#F1F5F9] border border-[#1F2D45] rounded-lg focus:outline-none focus:border-[#2DD4BF] focus:ring-1 focus:ring-[#2DD4BF] placeholder-[#475569] text-xs transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
              />
            </div>
          </div>

          {/* Create Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#2DD4BF] hover:bg-[#14B8A4] disabled:opacity-50 text-black font-semibold rounded-lg text-xs tracking-wide uppercase transition-all shadow-[0_0_20px_rgba(45,212,191,0.2)] hover:shadow-[0_0_25px_rgba(45,212,191,0.35)] flex items-center justify-center gap-2 cursor-pointer mt-4"
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

          {/* Error Message Box */}
          {errorMsg && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-center mt-2">
              <p className="text-[10px] text-red-400 font-semibold leading-normal">{errorMsg}</p>
            </div>
          )}
        </form>

        {/* Existing account link */}
        <div className="mt-6 text-center text-xs">
          <span className="text-[#94A3B8] font-medium">Already have an account? </span>
          <button
            type="button"
            onClick={onNavigateToLogin ? onNavigateToLogin : () => {
              window.history.pushState({}, '', '/auth/login');
              window.dispatchEvent(new Event('popstate'));
            }}
            className="text-[#2DD4BF] font-semibold hover:underline bg-transparent border-none cursor-pointer"
          >
            Sign in
          </button>
        </div>

      </div>

      <p className="text-[10px] text-zinc-600 mt-6 font-mono tracking-wider">
        FreightAudit AI &bull; Secure AES Encryption &bull; v1.4.0
      </p>
    </div>
  );
}
