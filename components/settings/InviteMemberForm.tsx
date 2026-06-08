"use client";

import React, { useState } from 'react';
import { Mail, Shield, ChevronDown, Check, Loader2, Info } from 'lucide-react';
import { useRole } from '@/lib/auth/RoleContext';

interface InviteMemberFormProps {
  onSuccess: () => void;
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin', desc: 'Full access: billing, users, contracts, disputes' },
  { value: 'logistics_manager', label: 'Logistics Manager', desc: 'Review exceptions, approve disputes, view reports' },
  { value: 'finance_clerk', label: 'Finance Clerk', desc: 'Upload invoices, review line items, approve charges' },
  { value: 'operations_coordinator', label: 'Operations Coordinator', desc: 'Upload invoices, manage contracts' },
];

export default function InviteMemberForm({ onSuccess }: InviteMemberFormProps) {
  const { role: currentRole } = useRole();
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('finance_clerk');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [limitData, setLimitData] = useState<{ limit: number } | null>(null);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMessage(null);
    setLimitData(null);

    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-simulated-role': currentRole // Ensure simulation state is sent to Express
        },
        body: JSON.stringify({ email, role: selectedRole }),
      });

      const resData = await response.json();

      if (!response.ok) {
        if (resData.error === 'seat_limit_reached') {
          setLimitData({ limit: resData.limit || 10 });
          setErrorMessage('seat_limit_reached');
        } else {
          setErrorMessage(resData.error || 'Something went wrong');
        }
      } else {
        // Clear form
        setEmail('');
        setSelectedRole('finance_clerk');
        
        // Trigger generic custom toast
        const toastEvent = new CustomEvent('toast-message', {
          detail: {
            title: 'Invite Sent',
            message: `Invitation successfully dispatched to ${email}.`
          }
        });
        window.dispatchEvent(toastEvent);
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'System network failure.');
    } finally {
      setLoading(false);
    }
  };

  const activeRoleOption = ROLE_OPTIONS.find(o => o.value === selectedRole) || ROLE_OPTIONS[0];

  return (
    <div className="space-y-4" id="team-invite-form-container">
      <div className="bg-[#0E1324] border border-[#1F2D45] rounded-xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="text-[#2DD4BF]" size={15} />
          <h4 className="text-[11px] font-mono tracking-widest font-black text-white uppercase">Invite Team Member</h4>
        </div>

        <form onSubmit={handleSendInvite} className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Email input field */}
          <div className="flex-1 min-w-0 relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. associate@company.com"
              required
              className="w-full bg-[#111827] border border-[#1F2D45] text-white text-xs pl-9 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-[#2DD4BF] transition-all"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]">
              @
            </span>
          </div>

          {/* Elegant Custom Dropdown Select */}
          <div className="relative min-w-[240px]">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full flex items-center justify-between text-left text-xs bg-[#111827] border border-[#1F2D45] text-white py-2.5 px-4 rounded-lg focus:outline-none transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <Shield className="text-[#2DD4BF] text-xs shrink-0" size={13} />
                <span className="font-bold">{activeRoleOption.label}</span>
              </div>
              <ChevronDown size={14} className={`text-[#94A3B8] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Float Menu Dropdown Options */}
            {isOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsOpen(false)} 
                />
                <div className="absolute top-[calc(100%+4px)] right-0 left-0 bg-[#111827] border border-[#1F2D45] rounded-lg z-50 py-1 shadow-[0_10px_25px_rgba(0,0,0,0.6)] animate-fade-in max-h-[300px] overflow-y-auto">
                  {ROLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSelectedRole(opt.value);
                        setIsOpen(false);
                      }}
                      className="group w-full text-left p-3 hover:bg-[#1C2537] text-white transition-colors duration-150 relative cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold font-sans tracking-wide">{opt.label}</span>
                        {selectedRole === opt.value && <Check size={12} className="text-[#2DD4BF]" />}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono leading-relaxed line-clamp-2">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || !email}
            className="px-6 py-2.5 bg-transparent border border-[#2DD4BF] text-[#2DD4BF] hover:bg-[#2DD4BF] hover:text-black font-extrabold rounded-lg text-xs font-mono uppercase tracking-widest transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2 shrink-0 hover:shadow-[0_0_15px_rgba(45,212,191,0.2)]"
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Inviting...</span>
              </>
            ) : (
              <span>Send Invite</span>
            )}
          </button>
        </form>

        {/* Hover detail info help of the current selected Role */}
        <div className="mt-3.5 flex items-start gap-1 p-2 rounded bg-slate-900/10 border border-[#1F2D45]/30">
          <Info size={11} className="text-[#94A3B8] mt-0.5" />
          <p className="text-[10px] text-slate-400 leading-normal">
            <strong className="text-white text-[9px] uppercase font-mono tracking-wider mr-1.5">{activeRoleOption.label}:</strong>
            {activeRoleOption.desc}
          </p>
        </div>
      </div>

      {/* Error / Upgrade Prompt Display */}
      {errorMessage === 'seat_limit_reached' && limitData && (
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in" id="org-limit-alert">
          <div className="space-y-0.5">
            <p className="font-extrabold text-[#F59E0B] uppercase font-mono tracking-wider">WORKSPACE LIMIT EXCEEDED</p>
            <p className="text-[#94A3B8]">
              You've reached your {limitData.limit} seat limit. Upgrade to add more team members.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              // Trigger popstate/custom-routing to simulated upgrade
              const toastEvent = new CustomEvent('toast-message', {
                detail: {
                  title: 'Billing Inquiry',
                  message: 'FreightAudit AI enterprise seat extension billing opened.'
                }
              });
              window.dispatchEvent(toastEvent);
            }}
            className="px-4 py-2 bg-[#F59E0B] hover:bg-amber-500 text-black font-bold uppercase text-[10px] font-mono tracking-wider rounded-lg shrink-0 transition-all cursor-pointer"
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {errorMessage && errorMessage !== 'seat_limit_reached' && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400" id="team-invite-error-display">
          Error sending invitation: {errorMessage}
        </div>
      )}
    </div>
  );
}
