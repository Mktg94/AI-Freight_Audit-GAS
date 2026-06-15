"use client";

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, Lock, User, Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function AcceptInvitePage() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [orgName, setOrgName] = useState('');
  const [role, setRole] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlEmail = params.get('email');

    if (urlToken) {
      setToken(urlToken);
      if (urlEmail) setEmail(urlEmail);
      validateInvite(urlToken, urlEmail || '');
    } else {
      setValidating(false);
      setErrorMsg('No invitation token found. Please use the link from your invitation email.');
    }
  }, []);

  const validateInvite = async (inviteToken: string, inviteEmail: string) => {
    setValidating(true);
    setErrorMsg('');

    try {
      const params = new URLSearchParams({ token: inviteToken });
      if (inviteEmail) params.set('email', inviteEmail);

      const res = await fetch(`/api/team/accept-invite?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Invalid or expired invitation.');
      } else {
        setOrgName(data.invite.org_name);
        setRole(data.invite.role);
        setEmail(data.invite.email);
      }
    } catch {
      setErrorMsg('Failed to validate invitation. Please check your connection.');
    } finally {
      setValidating(false);
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/team/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, full_name: fullName.trim(), password })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to accept invitation.');
        return;
      }

      setSuccess(true);
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    window.history.pushState({}, '', '/auth/login');
    window.dispatchEvent(new Event('popstate'));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="text-green-600 h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Account Created!</h2>
          <p className="text-sm text-gray-500">
            Your account has been created and you're now part of <strong>{orgName}</strong> as a <strong>{role.replace('_', ' ')}</strong>.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-left">
            <p className="text-xs text-blue-700 font-medium">Log in with your email:</p>
            <p className="text-sm text-blue-900 font-mono font-bold mt-1">{email}</p>
            <p className="text-[10px] text-blue-500 mt-1">Use the password you just created.</p>
          </div>
          <button
            onClick={handleGoToLogin}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs tracking-wide uppercase transition-all cursor-pointer"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl p-8">
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <ShieldCheck className="text-indigo-600 h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              FreightAudit <span className="text-indigo-600">AI</span>
            </h1>
          </div>

          {validating ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm mt-4">
              <Loader2 size={16} className="animate-spin" />
              <span>Validating invitation...</span>
            </div>
          ) : errorMsg && !orgName ? (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl w-full">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <XCircle size={16} />
                <span className="font-semibold text-sm">Invalid Invitation</span>
              </div>
              <p className="text-xs text-red-500 mt-1">{errorMsg}</p>
            </div>
          ) : orgName ? (
            <>
              <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl w-full text-left">
                <p className="text-xs text-indigo-600 font-semibold mb-1">You've been invited to join:</p>
                <p className="text-sm font-bold text-gray-900">{orgName}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <Mail size={12} />
                  <span>{email}</span>
                </div>
                <div className="mt-1.5">
                  <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-semibold uppercase">
                    {role.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <form onSubmit={handleAcceptInvite} className="w-full space-y-4 mt-4">
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
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Jane Smith"
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/20 placeholder-gray-400 text-xs transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    Password (min 8 characters)
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
                      placeholder="Create a secure password"
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

                {errorMsg && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-[10px] text-red-600 font-medium text-center">{errorMsg}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs tracking-wide uppercase transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Accept Invitation & Create Account</span>
                  )}
                </button>
              </form>
            </>
          ) : null}
        </div>
      </div>

      <p className="text-[10px] text-gray-400 mt-6 font-mono tracking-wider">
        FreightAudit AI &bull; Secure AES Encryption &bull; v1.4.0
      </p>
    </div>
  );
}
