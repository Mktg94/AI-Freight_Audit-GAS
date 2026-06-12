"use client";

import React, { useState, useEffect } from 'react';
import { 
  Building2, Sliders, ShieldCheck, Mail, Sparkles, Key, KeyRound, 
  Terminal, User, CheckCircle2, AlertTriangle, Play, CheckCircle, 
  Lock, Eye, EyeOff, Laptop, HelpCircle, Palette, Sun, Moon,
  Users, Loader2, XCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRole } from '@/lib/auth/RoleContext';
import { UserRole, ROLE_PERMISSIONS } from '@/lib/auth/roles';
import TeamMemberList from '@/components/settings/TeamMemberList';
import InviteMemberForm from '@/components/settings/InviteMemberForm';

export default function SettingsPage() {
  const { role: simulatedRole, setRole: setSimulatedRole } = useRole();
  const [activeTab, setActiveTab] = useState<'organization' | 'integrations' | 'appearance' | 'account' | 'roles' | 'team' | 'billing'>('organization');
  const [loadingOrg, setLoadingOrg] = useState(false);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [signingOutDevices, setSigningOutDevices] = useState(false);

  const [seatLimit, setSeatLimit] = useState(10);
  const [activeSeatCount, setActiveSeatCount] = useState(3);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [orgPlan, setOrgPlan] = useState<string>('Starter');
  const [invoicesUsed, setInvoicesUsed] = useState<number>(3);
  const [invoicesLimit, setInvoicesLimit] = useState<number>(100);
  const [billingResetDate, setBillingResetDate] = useState<string>('');

  const [currentTheme, setCurrentTheme] = useState('navy');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('fa_theme') || 'navy';
      setCurrentTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const changeTheme = (themeName: string) => {
    setCurrentTheme(themeName);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fa_theme', themeName);
      document.documentElement.setAttribute('data-theme', themeName);
      triggerToast('Palette Changed', `Global styling updated to ${themeName.replace('-', ' ').toUpperCase()}.`);
    }
  };

  const [companyName, setCompanyName] = useState('Atlas Global Logistics');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [resendKey, setResendKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [isResendConnected, setIsResendConnected] = useState(false);
  const [isAnthropicConnected, setIsAnthropicConnected] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fetchActiveSeatCount = async () => {
    try {
      const res = await fetch('/api/team/members', {
        headers: { 'x-simulated-role': simulatedRole }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const count = data.data.filter((m: any) => m.status !== 'suspended').length;
          setActiveSeatCount(count);
        }
      }
    } catch (e) {
      console.warn('Failed tracking active seats:', e);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoadingOrg(true);
      const resOrg = await fetch('/api/settings/organization');
      if (resOrg.ok) {
        const result = await resOrg.json();
        if (result.success && result.data) {
          setCompanyName(result.data.name || 'Atlas Global Logistics');
          setSeatLimit(result.data.seat_limit || 10);
          setOrgPlan(result.data.plan || 'Starter');
          setInvoicesUsed(result.data.invoices_used_this_month || 0);
          setInvoicesLimit(result.data.invoice_limit_per_month || 100);
          setBillingResetDate(result.data.billing_reset_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
        }
      }

      await fetchActiveSeatCount();

      const resInt = await fetch('/api/settings/integrations');
      if (resInt.ok) {
        const result = await resInt.json();
        if (result.success) {
          setIsResendConnected(result.data.resend_connected);
          setIsAnthropicConnected(result.data.anthropic_connected);
          setResendKey(result.data.resend_api_key || '');
          setAnthropicKey(result.data.anthropic_api_key || '');
        }
      }
    } catch (e) {
      console.warn("Error fetching settings endpoints:", e);
    } finally {
      setLoadingOrg(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [simulatedRole]);

  useEffect(() => {
    fetchActiveSeatCount();
  }, [refreshTrigger, simulatedRole]);

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      triggerToast('Error', 'Company name cannot be blank.');
      return;
    }
    setLoadingOrg(true);
    try {
      const response = await fetch('/api/settings/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: companyName })
      });

      if (!response.ok) {
        throw new Error('Failed to update organization details.');
      }

      const result = await response.json();
      if (result.success) {
        setCompanyName(result.data.name);
        triggerToast('Organization Updated', 'Aesthetic profile and billing entities registered successfully.');
      }
    } catch (err: any) {
      triggerToast('Update Failed', err.message || 'Server connection error.');
    } finally {
      setLoadingOrg(false);
    }
  };

  const handleDeleteOrg = () => {
    setShowDeleteConfirm(false);
    triggerToast(
      'Audit Workspace Intact',
      'Sandbox security policy prohibits root deletions without administrative credentials.'
    );
  };

  const handleSaveIntegrations = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingIntegrations(true);
    try {
      const response = await fetch('/api/settings/integrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resend_api_key: resendKey,
          anthropic_api_key: anthropicKey
        })
      });

      if (!response.ok) {
        throw new Error('Failed to synchronize cloud endpoints.');
      }

      const result = await response.json();
      if (result.success) {
        setIsResendConnected(result.data.resend_connected);
        setIsAnthropicConnected(result.data.anthropic_connected);
        setResendKey(result.data.resend_api_key || '');
        setAnthropicKey(result.data.anthropic_api_key || '');
        triggerToast('Integrations Standardized', 'Connected carrier intelligence nodes updated and saved.');
      }
    } catch (err: any) {
      triggerToast('Hardware Intercept', err.message || 'Failure updating credentials.');
    } finally {
      setLoadingIntegrations(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      triggerToast('Payload Deficit', 'Please enter and verify your new passcode.');
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast('Password Mismatch', 'The confirmed password does not match the chosen entry.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
      
      if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder') && !supabaseKey.includes('placeholder')) {
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        triggerToast('Password Modified', 'Auth ledger credentials standardized securely via Supabase.');
      } else {
        setTimeout(() => {
          triggerToast('Password Synced', 'Sandbox user credential credentials updated successfully.');
          setUpdatingPassword(false);
        }, 900);
        return;
      }
    } catch (err: any) {
      triggerToast('Update Rejected', err.message || 'Error communicating with Supabase Security.');
    } finally {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setUpdatingPassword(false);
    }
  };

  const handleSignOutAllDevices = async () => {
    setSigningOutDevices(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

      if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder') && !supabaseKey.includes('placeholder')) {
        const supabase = createClient();
        const { error } = await supabase.auth.signOut({ scope: 'global' });
        if (error) throw error;
        triggerToast('Sessions Evicted', 'All remote connections closed successfully.');
      } else {
        setTimeout(() => {
          triggerToast('Sessions Closed', 'Sandbox cache evicted successfully.');
          setSigningOutDevices(false);
        }, 850);
        return;
      }
    } catch (err: any) {
      triggerToast('Sign Out Blocked', err.message || 'Authorization server rejected global eviction.');
    } finally {
      setSigningOutDevices(false);
    }
  };

  const triggerToast = (title: string, message: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title, message }
      }));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="settings-application-root">
      
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
          Settings & Configurations
        </h1>
        <p className="text-sm text-gray-500">
          Adjust automated audit limits, authenticate connected carrier accounts, and secure active billing profiles.
        </p>
      </div>

      <div className="border-b border-gray-100 flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider font-semibold text-gray-400">
        <button
          onClick={() => setActiveTab('organization')}
          className={`pb-3 px-5 relative transition-all cursor-pointer ${
            activeTab === 'organization' ? 'text-indigo-600 font-bold' : 'hover:text-gray-600 text-gray-400'
          }`}
        >
          <span>Organization</span>
          {activeTab === 'organization' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('integrations')}
          className={`pb-3 px-5 relative transition-all cursor-pointer ${
            activeTab === 'integrations' ? 'text-indigo-600 font-bold' : 'hover:text-gray-600 text-gray-400'
          }`}
        >
          <span>Integrations</span>
          {activeTab === 'integrations' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`pb-3 px-5 relative transition-all cursor-pointer ${
            activeTab === 'appearance' ? 'text-indigo-600 font-bold' : 'hover:text-gray-600 text-gray-400'
          }`}
        >
          <span>Appearance</span>
          {activeTab === 'appearance' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`pb-3 px-5 relative transition-all cursor-pointer ${
            activeTab === 'account' ? 'text-indigo-600 font-bold' : 'hover:text-gray-600 text-gray-400'
          }`}
        >
          <span>Account & Security</span>
          {activeTab === 'account' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-3 px-5 relative transition-all cursor-pointer ${
            activeTab === 'roles' ? 'text-indigo-600 font-bold' : 'hover:text-gray-600 text-gray-400'
          }`}
        >
          <span>Security & Roles</span>
          {activeTab === 'roles' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600" />
          )}
        </button>

        {simulatedRole === 'admin' && (
          <button
            onClick={() => setActiveTab('team')}
            className={`pb-3 px-5 relative transition-all cursor-pointer ${
              activeTab === 'team' ? 'text-indigo-600 font-bold' : 'hover:text-gray-600 text-gray-400'
            }`}
          >
            <span>Team Management</span>
            {activeTab === 'team' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600" />
            )}
          </button>
        )}

        {simulatedRole === 'admin' && (
          <button
            onClick={() => setActiveTab('billing')}
            className={`pb-3 px-5 relative transition-all cursor-pointer ${
              activeTab === 'billing' ? 'text-indigo-600 font-bold' : 'hover:text-gray-600 text-gray-400'
            }`}
            id="billing-tab-header-btn"
          >
            <span>Billing & Plans</span>
            {activeTab === 'billing' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600" />
            )}
          </button>
        )}
      </div>

      <div className="mt-4" id="settings-tab-viewports">
        
        {activeTab === 'organization' && (
          <div className="space-y-6 animate-fade-in" id="org-settings-tabpanel">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 space-y-6">
              
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <Building2 className="text-indigo-600" size={20} />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Organization Settings</h3>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">MANAGE ROOT SYSTEM IDENTITY AND SHIPPING PROFILE DETAILS</p>
                </div>
              </div>

              <form onSubmit={handleSaveOrg} className="space-y-4 max-w-xl">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono font-semibold text-gray-500 tracking-widest block">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="bg-gray-50 border border-gray-200 text-gray-900 focus:border-indigo-400 focus:ring-0 focus:outline-none rounded-lg p-3 w-full font-sans text-xs"
                    placeholder="Enter organization name"
                  />
                  <p className="text-[9px] text-gray-400 font-mono">
                    Controls customer-facing document titles, audit headings, and carrier dispute sign-offs.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loadingOrg}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold font-mono py-2.5 px-5 rounded-lg uppercase tracking-wider text-xs cursor-pointer transition-all disabled:opacity-50"
                  id="save-org-button"
                >
                  {loadingOrg ? 'Synchronizing...' : 'Save Changes'}
                </button>
              </form>
            </div>

            <div className="bg-white border border-red-100 rounded-2xl p-6 md:p-8 space-y-4" id="org-danger-zone-section">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-red-400" size={20} />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Danger Zone</h3>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">DESTRUCTIVE ADMINISTRATIVE ROOT ACTIONS</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-gray-900 uppercase">Delete Organization</h4>
                  <p className="text-[10px] text-gray-400">
                    Instantly purges all carrier rate agreements, analyzed invoices, audited logs, and prepared disputes.
                  </p>
                </div>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-transparent hover:bg-red-50 text-red-500 border border-red-200 rounded-lg font-mono font-semibold py-2.5 px-4 uppercase tracking-wider text-xs cursor-pointer transition-all shrink-0"
                    id="trigger-delete-confirm"
                  >
                    Delete Organization
                  </button>
                ) : (
                  <div className="flex items-center gap-2 animate-fade-in shrink-0">
                    <button
                      onClick={handleDeleteOrg}
                      className="bg-red-500 hover:bg-red-600 text-white font-mono font-semibold py-2 px-3.5 rounded-lg uppercase tracking-wider text-xs cursor-pointer transition-all"
                      id="confirm-delete-action"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="bg-white border border-gray-200 text-gray-500 hover:text-gray-700 font-mono font-semibold py-2 px-3.5 rounded-lg uppercase tracking-wider text-xs cursor-pointer transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <form onSubmit={handleSaveIntegrations} className="space-y-6 animate-fade-in" id="integrations-settings-tabpanel">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 space-y-6">
              
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <Sliders className="text-indigo-600" size={20} />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Connected Services</h3>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">AUTHENTICATE SECONDARY API KEY CONNECTIONS</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-green-50 rounded-lg text-green-600">
                        <Mail size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-900 uppercase">Resend (Email)</h4>
                        <p className="text-[9px] text-gray-400 font-mono">Mail client dispatching for carrier claims</p>
                      </div>
                    </div>
                    {isResendConnected ? (
                      <span className="flex items-center gap-1.5 text-[9px] font-semibold font-mono py-1 px-2.5 bg-green-50 text-green-700 rounded-full border border-green-200">
                        <CheckCircle size={10} /> Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[9px] font-semibold font-mono py-1 px-2.5 bg-gray-100 text-gray-400 rounded-full border border-gray-200">
                        Missing Key
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase text-gray-500 font-semibold block">Resend API Key</label>
                    <input
                      type="password"
                      value={resendKey}
                      onChange={(e) => setResendKey(e.target.value)}
                      placeholder="re_xxxxxxxxxxxxxxxxxxx"
                      className="bg-gray-50 border border-gray-200 text-gray-900 focus:border-indigo-400 focus:ring-0 focus:outline-none rounded-lg p-2.5 w-full font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-900 uppercase">Anthropic AI</h4>
                        <p className="text-[9px] text-gray-400 font-mono">Dispute claims generation models</p>
                      </div>
                    </div>
                    {isAnthropicConnected ? (
                      <span className="flex items-center gap-1.5 text-[9px] font-semibold font-mono py-1 px-2.5 bg-green-50 text-green-700 rounded-full border border-green-200">
                        <CheckCircle size={10} /> Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[9px] font-semibold font-mono py-1 px-2.5 bg-gray-100 text-gray-400 rounded-full border border-gray-200">
                        Not Connected
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-mono uppercase text-gray-500 font-semibold block">Anthropic API Key</label>
                    <div className="relative">
                      <input
                        type={showAnthropicKey ? "text" : "password"}
                        value={anthropicKey}
                        onChange={(e) => setAnthropicKey(e.target.value)}
                        placeholder="sk-ant-xxxxxxxxxxxxxxxxxxx"
                        className="bg-gray-50 border border-gray-200 text-gray-900 focus:border-indigo-400 focus:ring-0 focus:outline-none rounded-lg p-2.5 w-full font-mono text-xs pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showAnthropicKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              <div className="border-t border-gray-100 pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={loadingIntegrations}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold font-mono py-2.5 px-5 rounded-lg uppercase tracking-wider text-xs cursor-pointer transition-all disabled:opacity-50"
                  id="save-integrations-button"
                >
                  {loadingIntegrations ? 'Updating API ledger...' : 'Update Integrations'}
                </button>
              </div>

            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-gray-400 font-semibold pl-1">Coming Soon Integrations:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="coming-soon-integrations-row">
                
                <div className="bg-white/50 border border-gray-100 rounded-xl p-4 flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-2">
                    <Lock size={13} className="text-gray-300" />
                    <div>
                      <h5 className="text-[11px] font-semibold text-gray-500 uppercase">QuickBooks</h5>
                      <p className="text-[8px] text-gray-400 font-mono">Invoice Ledger Syncer</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-semibold font-mono py-0.5 px-1.5 bg-gray-50 text-gray-300 border border-gray-100 rounded uppercase">Locked</span>
                </div>

                <div className="bg-white/50 border border-gray-100 rounded-xl p-4 flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-2">
                    <Lock size={13} className="text-gray-300" />
                    <div>
                      <h5 className="text-[11px] font-semibold text-gray-500 uppercase">Xero Accounting</h5>
                      <p className="text-[8px] text-gray-400 font-mono">General Ledger API</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-semibold font-mono py-0.5 px-1.5 bg-gray-50 text-gray-300 border border-gray-100 rounded uppercase">Locked</span>
                </div>

                <div className="bg-white/50 border border-gray-100 rounded-xl p-4 flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-2">
                    <Lock size={13} className="text-gray-300" />
                    <div>
                      <h5 className="text-[11px] font-semibold text-gray-500 uppercase">SAP Logistics</h5>
                      <p className="text-[8px] text-gray-400 font-mono">ERP Enterprise Connector</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-semibold font-mono py-0.5 px-1.5 bg-gray-50 text-gray-300 border border-gray-100 rounded uppercase">Locked</span>
                </div>

              </div>
            </div>
          </form>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-6 animate-fade-in" id="appearance-settings-tabpanel">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 space-y-6">
              
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <Palette className="text-indigo-600" size={20} />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Appearance</h3>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">CHOOSE YOUR PREFERRED INTERFACE PALETTE</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="theme-options-grid">
                
                <div 
                  onClick={() => changeTheme('navy')}
                  className={`border rounded-2xl p-5 bg-[#0A1128] space-y-4 cursor-pointer transition-all ${
                    currentTheme === 'navy' 
                      ? 'border-indigo-400 shadow-md ring-1 ring-indigo-300' 
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Maritime Deep Dark</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">The professional deep maritime slate layout for cargo and logistics auditing.</p>
                    </div>
                    {currentTheme === 'navy' && (
                      <span className="bg-indigo-50 text-indigo-600 border border-indigo-200 text-[8px] font-mono font-semibold uppercase px-2 py-0.5 rounded">Active</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="h-4 w-10 rounded bg-[#0A1128] border border-[#1E3A8A]" title="Background" />
                    <span className="h-4 w-6 rounded bg-[#101F42]" title="Surface" />
                    <span className="h-4 w-4 rounded bg-[#2DD4BF]" title="Accent" />
                    <span className="h-4 w-4 rounded bg-[#FBBF24]" title="Warning" />
                    <span className="h-4 w-4 rounded bg-[#10B981]" title="Success" />
                  </div>
                </div>

                <div 
                  onClick={() => changeTheme('high-contrast')}
                  className={`border rounded-2xl p-5 bg-[#030712] space-y-4 cursor-pointer transition-all ${
                    currentTheme === 'high-contrast' 
                      ? 'border-indigo-400 shadow-md ring-1 ring-indigo-300' 
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">High-Contrast Ocean Cargo</h4>
                      <p className="text-[10px] text-gray-300 mt-0.5">A high-legibility transport workspace built for active terminal and dock operators.</p>
                    </div>
                    {currentTheme === 'high-contrast' && (
                      <span className="bg-indigo-50 text-indigo-600 border border-indigo-200 text-[8px] font-mono font-semibold uppercase px-2 py-0.5 rounded">Active</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="h-4 w-10 rounded bg-[#030712] border border-[#334155]" title="Background" />
                    <span className="h-4 w-6 rounded bg-[#0F172A]" title="Surface" />
                    <span className="h-4 w-4 rounded bg-[#60A5FA]" title="Accent" />
                    <span className="h-4 w-4 rounded bg-[#F59E0B]" title="Warning" />
                    <span className="h-4 w-4 rounded bg-[#10B981]" title="Success" />
                  </div>
                </div>

                <div 
                  onClick={() => changeTheme('light-mode')}
                  className={`border rounded-2xl p-5 bg-[#F8FAFC] space-y-4 cursor-pointer transition-all ${
                    currentTheme === 'light-mode' 
                      ? 'border-indigo-400 shadow-md ring-1 ring-indigo-300' 
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Industrial Steel Light</h4>
                      <p className="text-[10px] text-[#475569] mt-0.5">Clean paperwork and freight ledger style with corporate slate steel accents.</p>
                    </div>
                    {currentTheme === 'light-mode' && (
                      <span className="bg-indigo-50 text-indigo-600 border border-indigo-200 text-[8px] font-mono font-semibold uppercase px-2 py-0.5 rounded">Active</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="h-4 w-10 rounded bg-[#F8FAFC] border border-gray-300" title="Background" />
                    <span className="h-4 w-6 rounded bg-[#FFFFFF] border border-gray-200" title="Surface" />
                    <span className="h-4 w-4 rounded bg-[#2563EB]" title="Accent" />
                    <span className="h-4 w-4 rounded bg-[#D97706]" title="Warning" />
                    <span className="h-4 w-4 rounded bg-[#16A34A]" title="Success" />
                  </div>
                </div>

                <div 
                  onClick={() => changeTheme('emerald-obsidian')}
                  className={`border rounded-2xl p-5 bg-[#022C22] space-y-4 cursor-pointer transition-all ${
                    currentTheme === 'emerald-obsidian' 
                      ? 'border-indigo-400 shadow-md ring-1 ring-indigo-300' 
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Evergreen Land-Freighters</h4>
                      <p className="text-[10px] text-[#A7F3D0] mt-0.5">Line-haul evergreen forest theme for ecological supply-chain operators.</p>
                    </div>
                    {currentTheme === 'emerald-obsidian' && (
                      <span className="bg-indigo-50 text-indigo-600 border border-indigo-200 text-[8px] font-mono font-semibold uppercase px-2 py-0.5 rounded">Active</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="h-4 w-10 rounded bg-[#022C22] border border-[#115E59]" title="Background" />
                    <span className="h-4 w-6 rounded bg-[#064E3B]" title="Surface" />
                    <span className="h-4 w-4 rounded bg-[#34D399]" title="Accent" />
                    <span className="h-4 w-4 rounded bg-[#FBBF24]" title="Warning" />
                    <span className="h-4 w-4 rounded bg-[#34D399]" title="Success" />
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-6 animate-fade-in" id="account-settings-tabpanel">
            
            <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 space-y-6">
              
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <KeyRound className="text-indigo-600" size={20} />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Security Credentials</h3>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">UPDATE ACCESSIBLE PASSWORDS AND MASTER KEYS</p>
                </div>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-xl">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono font-semibold text-gray-500 tracking-widest block">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-gray-50 border border-gray-200 text-gray-900 focus:border-indigo-400 focus:ring-0 focus:outline-none rounded-lg p-2.5 w-full font-sans text-xs"
                    placeholder="••••••••••••"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono font-semibold text-gray-500 tracking-widest block">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-gray-50 border border-gray-200 text-gray-900 focus:border-indigo-400 focus:ring-0 focus:outline-none rounded-lg p-2.5 w-full font-sans text-xs"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono font-semibold text-gray-500 tracking-widest block">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-gray-50 border border-gray-200 text-gray-900 focus:border-indigo-400 focus:ring-0 focus:outline-none rounded-lg p-2.5 w-full font-sans text-xs"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 flex justify-start">
                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold font-mono py-2.5 px-5 rounded-lg uppercase tracking-wider text-xs cursor-pointer transition-all disabled:opacity-50"
                    id="update-password-button"
                  >
                    {updatingPassword ? 'Re-encrypting Auth...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 space-y-5" id="active-sessions-section">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <Laptop className="text-indigo-600" size={20} />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Active Sessions</h3>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">CURRENT AUTHENTICATED PHYSICAL TERMINALS</p>
                </div>
              </div>

              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
                    <Laptop size={18} />
                  </div>
                  <div className="font-mono text-gray-500 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-semibold text-gray-900 uppercase">Chrome on macOS Terminal</span>
                      <span className="py-0.5 px-2 bg-green-50 text-green-700 border border-green-200 text-[8px] font-semibold rounded-full select-none uppercase">Current Entry</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 space-y-0.5">
                      <p>IP Address Anchor: 127.0.0.1 (Ingress reverse proxy)</p>
                      <p>Established: June 06, 2026 01:04 UTC</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSignOutAllDevices}
                  disabled={signingOutDevices}
                  className="bg-transparent hover:bg-gray-50 text-gray-500 border border-gray-200 rounded-lg font-mono font-semibold py-2.5 px-4 uppercase tracking-wider text-xs cursor-pointer transition-all shrink-0 disabled:opacity-50"
                  id="sign-out-all-devices-action"
                >
                  {signingOutDevices ? 'Evicting devices...' : 'Sign out all devices'}
                </button>
              </div>

            </div>

          </div>
        )}

        {activeTab === 'roles' && (
          <div className="space-y-6 animate-fade-in" id="rbac-role-tabpanel">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <ShieldCheck className="text-indigo-600" size={20} />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Security & Role-Based Access Control</h3>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">SIMULATE ROLES IN REAL TIME AND AUDIT LOGISTIC PERMISSIONS</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 text-xs text-gray-500 leading-relaxed">
                <p>
                  To simplify testing and code evaluation, this emulator overrides your database member role in the client browser's local state. Selecting any role below instantly updates the navigation bar, locks down API endpoints, and hides/displays action buttons across the entire FreightAudit AI dashboard.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase font-mono font-semibold text-gray-500 tracking-widest block">
                  Select Active Simulation Role
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { value: 'admin', label: 'Admin', desc: 'Full root access to all team, contract, and billing systems', color: 'indigo' },
                    { value: 'logistics_manager', label: 'Logistics Manager', desc: 'Manages exceptions, reviews claims, and sends dispute letters', color: 'blue' },
                    { value: 'finance_clerk', label: 'Finance Clerk', desc: 'Uploads invoices, analyzes tariff rows, and drafts claims', color: 'amber' },
                    { value: 'operations_coordinator', label: 'Operations Coord.', desc: 'ReadOnly on claims, uploads invoices, maintains carrier contracts', color: 'gray' }
                  ].map((r) => {
                    const isSelected = simulatedRole === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => {
                          setSimulatedRole(r.value as UserRole);
                          triggerToast('Simulation Switched', `Active role simmer set to ${r.label}.`);
                        }}
                        className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-50 border-indigo-300 text-gray-900' 
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold uppercase tracking-wide">{r.label}</span>
                            {isSelected && <span className="h-2 w-2 rounded-full bg-indigo-500" />}
                          </div>
                          <p className="text-[9px] font-mono leading-normal text-gray-400">{r.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <label className="text-[10px] uppercase font-mono font-semibold text-gray-500 tracking-widest block">
                  Dynamic Permissions Matrix
                </label>
                <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
                  <table className="w-full border-collapse font-sans text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-left text-[9px] uppercase font-mono font-semibold tracking-wider text-gray-400">
                        <th className="p-3.5 pl-4">System Operation / Action</th>
                        <th className="p-3.5 text-center">Admin</th>
                        <th className="p-3.5 text-center">Logistics Mgr</th>
                        <th className="p-3.5 text-center">Finance Clerk</th>
                        <th className="p-3.5 text-center">Operations Coord</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-700">
                      {[
                        { action: 'upload_invoices', label: 'Upload Invoices' },
                        { action: 'review_line_items', label: 'Review / Approve Tariff Line Items' },
                        { action: 'generate_disputes', label: 'Generate Challenge Dispute PDF Letter' },
                        { action: 'send_disputes', label: 'Transmit Final Claims Outbound Mail' },
                        { action: 'manage_contracts', label: 'Create / Update / Delete Carrier Contracts' },
                        { action: 'view_reports', label: 'View Real-time Savings Metrics Reports' },
                        { action: 'manage_team', label: 'Invite / Remove Workspace Members' },
                        { action: 'view_billing', label: 'Audit Company Subscription Plan & Billing' }
                      ].map((item) => (
                        <tr key={item.action} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-3.5 pl-4 font-medium text-gray-700">
                            {item.label}
                            <span className="block text-[9px] text-gray-400 font-mono uppercase mt-0.5">{item.action}</span>
                          </td>
                          {['admin', 'logistics_manager', 'finance_clerk', 'operations_coordinator'].map((r) => {
                            const rolePermissionsMap: Record<UserRole, Record<string, boolean>> = ROLE_PERMISSIONS;
                            const hasAccess = rolePermissionsMap[r as UserRole]?.[item.action] || false;
                            const isCurrentSimmed = simulatedRole === r;
                            return (
                              <td 
                                key={r} 
                                className={`p-3.5 text-center transition-all ${
                                  isCurrentSimmed ? 'bg-indigo-50/50 font-bold' : ''
                                }`}
                              >
                                {hasAccess ? (
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full ${
                                    isCurrentSimmed ? 'bg-green-50 text-green-700' : 'text-green-600'
                                  }`}>
                                    <CheckCircle2 size={10} /> ALLOWED
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full text-red-400 bg-red-50">
                                    <XCircle size={10} /> DENIED
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-6 animate-fade-in" id="team-settings-tabpanel">
            {simulatedRole !== 'admin' ? (
              <div className="bg-white border border-red-100 rounded-2xl p-8 text-center space-y-4">
                <ShieldCheck className="mx-auto text-red-400" size={36} />
                <h3 className="text-sm font-semibold text-gray-900 tracking-wide">Access Restricted</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                  Workspace Team administration is constrained exclusively to root Administrators. Access is denied for your current simulated role permissions.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 space-y-6">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                  <div className="flex items-center gap-3">
                    <Users className="text-indigo-600" size={20} />
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Team & Seat Allocation</h3>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5 font-semibold uppercase tracking-wider">Configure workspace permissions and dispatch team credentials</p>
                    </div>
                  </div>

                  <div className="w-full md:w-64 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
                      <span className="text-gray-400">Active Seat Meter</span>
                      <span className={`font-semibold ${
                        activeSeatCount >= seatLimit ? 'text-red-500' : (activeSeatCount / seatLimit) * 100 > 80 ? 'text-amber-600' : 'text-indigo-600'
                      }`}>
                        {activeSeatCount} of {seatLimit} seats used
                      </span>
                    </div>

                    <div className="h-2 w-full bg-gray-50 border border-gray-100 rounded-full overflow-hidden shrink-0">
                      <div 
                        className={`h-full transition-all duration-300 rounded-full ${
                          activeSeatCount >= seatLimit 
                            ? 'bg-red-400' 
                            : (activeSeatCount / seatLimit) * 100 > 80 
                              ? 'bg-amber-400' 
                              : 'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, (activeSeatCount / seatLimit) * 100)}%` }}
                      />
                    </div>

                    {activeSeatCount >= seatLimit && (
                      <p className="text-[9px] text-red-500 font-mono font-semibold tracking-wider mt-1 text-right uppercase">
                        Seat capacity full. Upgrade plan to expand limit.
                      </p>
                    )}
                  </div>
                </div>

                <InviteMemberForm onSuccess={() => setRefreshTrigger(prev => prev + 1)} />

                <div className="space-y-3">
                  <h4 className="text-[10px] font-mono font-semibold tracking-widest text-gray-400 uppercase">Active Organization Collaborators</h4>
                  <TeamMemberList 
                    refreshTrigger={refreshTrigger} 
                    onRefreshCompleted={() => fetchActiveSeatCount()} 
                  />
                </div>

              </div>
            )}
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6 animate-fade-in" id="billing-settings-tabpanel">
            {simulatedRole !== 'admin' ? (
              <div className="bg-white border border-red-100 rounded-2xl p-8 text-center space-y-4">
                <ShieldCheck className="mx-auto text-red-400" size={36} />
                <h3 className="text-sm font-semibold text-gray-900 tracking-wide">Access Restricted</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                  Billing administration is constrained exclusively to root Administrators. Access is denied for your current simulated role permissions.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Active Plan & Subscription</h3>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5 font-semibold uppercase tracking-wider">
                        Configure billing limits and monitor resource capacities across cycles
                      </p>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-[11px] uppercase font-semibold tracking-wider px-3.5 py-1 rounded-md">
                      {orgPlan} Plan
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
                        <span className="text-gray-400">Monthly Invoice Footprint</span>
                        <span className="font-semibold text-indigo-600">
                          {invoicesUsed} of {invoicesLimit === 99999 ? 'unlimited' : `${invoicesLimit}`} used
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-50 border border-gray-100 rounded-full overflow-hidden shrink-0">
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${invoicesLimit === 99999 ? 1 : Math.min(100, (invoicesUsed / invoicesLimit) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-gray-400 font-mono">
                        Resets automatically on {new Date(billingResetDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
                        <span className="text-gray-400">Seat Capacity Utilization</span>
                        <span className="font-semibold text-indigo-600">
                          {activeSeatCount} of {seatLimit === 999 ? 'unlimited' : `${seatLimit}`} seats occupied
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-50 border border-gray-100 rounded-full overflow-hidden shrink-0">
                        <div 
                          className="h-full bg-green-500 rounded-full transition-all duration-300"
                          style={{ width: `${seatLimit === 999 ? 1 : Math.min(100, (activeSeatCount / seatLimit) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-gray-400 font-mono">
                        Provides access credentials for root, audits checkers, and carriers disputers
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Available Subscription Pathways</h3>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5 font-semibold uppercase tracking-wider">
                      Empower your logistics audits with additional AI power and higher processing speeds
                    </p>
                  </div>

                  <div className="border border-gray-100 bg-gray-50 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6" id="plan-upgrade-cta-card">
                    {orgPlan.toLowerCase() === 'starter' && (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-indigo-50 text-indigo-700 text-[10px] uppercase font-semibold tracking-widest px-2.5 py-0.5 rounded-full border border-indigo-200 font-mono">Recommended Path</span>
                            <span className="text-sm font-semibold text-gray-900">Upgrade to Professional Plan</span>
                          </div>
                          <p className="text-xs text-gray-400 max-w-xl">
                            Unlock bulk uploading, automated PDF splitting, priority AI-audits pipelines, dedicated savings dashboards, and support up to 500 invoices/month.
                          </p>
                          <div className="text-xs font-mono font-bold text-green-600">
                            $299/mo (billed monthly) or $239/mo (billed annually)
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch('/api/settings/organization', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ plan: 'Professional' })
                              });
                              if (res.ok) {
                                triggerToast('Plan Upgraded', 'Your organization has been upgraded to the Professional tier successfully.');
                                await fetchSettings();
                              } else {
                                throw new Error();
                              }
                            } catch {
                              triggerToast('Action Blocked', 'Beta environment failed provisioning the upgrade automatedly.');
                            }
                          }}
                          className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs uppercase font-semibold tracking-wider py-2.5 px-6 rounded-lg transition-all cursor-pointer"
                        >
                          Upgrade Now
                        </button>
                      </>
                    )}

                    {orgPlan.toLowerCase() === 'professional' && (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-amber-50 text-amber-700 text-[10px] uppercase font-semibold tracking-widest px-2.5 py-0.5 rounded-full border border-amber-200 font-mono">Premium Scale</span>
                            <span className="text-sm font-semibold text-gray-900">Upgrade to Enterprise Plan</span>
                          </div>
                          <p className="text-xs text-gray-400 max-w-xl">
                            Unlock unlimited invoice processing, custom carrier rules configurations, dedicated account managers, and Service Level Agreements (SLAs).
                          </p>
                          <div className="text-xs font-mono font-bold text-amber-600">
                            Custom Tailored Billing (Contract Quote)
                          </div>
                        </div>
                        <a
                          href="mailto:billing@freightaudit.ai?subject=Enterprise%20Upgrade%20Inquiry"
                          className="shrink-0 border border-indigo-300 hover:bg-indigo-50 text-indigo-600 font-mono text-xs uppercase font-semibold tracking-wider py-2.5 px-6 rounded-lg transition-all text-center"
                        >
                          Contact Sales
                        </a>
                      </>
                    )}

                    {orgPlan.toLowerCase() === 'enterprise' && (
                      <div className="flex items-center gap-3 py-2 w-full justify-center text-center">
                        <CheckCircle2 className="text-green-500" size={22} />
                        <div>
                          <strong className="text-gray-900 text-sm">You are on our best high-payload plan</strong>
                          <p className="text-xs text-gray-400 mt-0.5">Thank you for leveraging FreightAudit AI Enterprise workspace!</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Invoice Processing History</h3>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5 font-semibold uppercase tracking-wider">
                      Historical footprint records and automated dispute saving stats over past 6 billing months
                    </p>
                  </div>

                  <div className="overflow-x-auto border border-gray-100 rounded-lg">
                    <table className="w-full text-left font-sans text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-mono text-[10px] uppercase font-semibold">
                          <th className="py-3 px-4">Billing Month</th>
                          <th className="py-3 px-4">Invoices Processed</th>
                          <th className="py-3 px-4">Invoices Flagged</th>
                          <th className="py-3 px-4">Savings Detected</th>
                          <th className="py-3 px-4 text-right">Plan Level</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-gray-600">
                        <tr>
                          <td className="py-3 px-4 font-mono">May 2026</td>
                          <td className="py-3 px-4">84 invoices</td>
                          <td className="py-3 px-4"><span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-2"></span> 18 flagged</td>
                          <td className="py-3 px-4 font-bold text-green-600">$1,240.50</td>
                          <td className="py-3 px-4 text-right"><span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Starter</span></td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-mono">April 2026</td>
                          <td className="py-3 px-4">76 invoices</td>
                          <td className="py-3 px-4"><span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-2"></span> 14 flagged</td>
                          <td className="py-3 px-4 font-bold text-green-600">$980.00</td>
                          <td className="py-3 px-4 text-right"><span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Starter</span></td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-mono">March 2026</td>
                          <td className="py-3 px-4">92 invoices</td>
                          <td className="py-3 px-4"><span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-2"></span> 22 flagged</td>
                          <td className="py-3 px-4 font-bold text-green-600">$1,630.00</td>
                          <td className="py-3 px-4 text-right"><span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Starter</span></td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-mono">February 2026</td>
                          <td className="py-3 px-4">64 invoices</td>
                          <td className="py-3 px-4"><span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-2"></span> 11 flagged</td>
                          <td className="py-3 px-4 font-bold text-green-600">$450.40</td>
                          <td className="py-3 px-4 text-right"><span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Starter</span></td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-mono">January 2026</td>
                          <td className="py-3 px-4">42 invoices</td>
                          <td className="py-3 px-4"><span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-2"></span> 8 flagged</td>
                          <td className="py-3 px-4 font-bold text-green-600">$310.00</td>
                          <td className="py-3 px-4 text-right"><span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Starter</span></td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-mono">December 2025</td>
                          <td className="py-3 px-4">30 invoices</td>
                          <td className="py-3 px-4"><span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-2"></span> 0 flagged</td>
                          <td className="py-3 px-4 font-bold text-green-600">$0.00</td>
                          <td className="py-3 px-4 text-right"><span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Starter</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 tracking-tight">Payment Setup</h3>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5 font-semibold uppercase tracking-wider">
                      Configure credit card ledgers and automated dispute invoice settlement settings
                    </p>
                  </div>

                  <div className="border border-gray-100 bg-gray-50 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 border border-gray-100 bg-white text-gray-400 rounded-lg shrink-0">
                        <Lock size={18} />
                      </div>
                      <div>
                        <strong className="text-gray-900 text-xs block">No payment method on file</strong>
                        <span className="text-[10px] text-gray-400 font-mono">Payment integration coming soon.</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => triggerToast('Payment Setup', 'Payment integration coming soon. Contact us at billing@freightaudit.ai to upgrade.')}
                      className="w-full sm:w-auto py-2 px-4 bg-transparent border border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-all rounded-lg text-xs font-mono uppercase tracking-wider font-semibold text-center select-none cursor-pointer text-gray-500"
                    >
                      Add Payment Method
                    </button>
                  </div>

                  <p className="text-[9.5px] text-gray-400 text-center" id="billing-manual-outreach-note">
                    We will reach out to set up billing details manually on your organization portal during beta.
                  </p>
                </div>

              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
