"use client";

import React, { useState, useEffect } from 'react';
import { 
  User, CheckCircle, Clock, AlertTriangle, Trash2, 
  ShieldAlert, Loader2, ChevronDown, Check, UserMinus 
} from 'lucide-react';
import { useRole } from '@/lib/auth/RoleContext';

interface TeamMember {
  id: string;
  org_id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'logistics_manager' | 'finance_clerk' | 'operations_coordinator';
  status: 'active' | 'invited' | 'suspended';
  created_at: string;
}

interface TeamMemberListProps {
  refreshTrigger: number;
  onRefreshCompleted: () => void;
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'logistics_manager', label: 'Logistics Manager' },
  { value: 'finance_clerk', label: 'Finance Clerk' },
  { value: 'operations_coordinator', label: 'Operations Coord.' },
];

export default function TeamMemberList({ refreshTrigger, onRefreshCompleted }: TeamMemberListProps) {
  const { role: currentSimRole } = useRole();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMutatingId, setIsMutatingId] = useState<string | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  
  // Custom dialog state for member removal
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<TeamMember | null>(null);

  // Default current logged-in emails
  const currentUserEmail = 'audit@atlaslogistics.com';

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/team/members', {
        headers: {
          'x-simulated-role': currentSimRole
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMembers(data.data || []);
      }
    } catch (err) {
      console.error('Failed fetching members:', err);
    } finally {
      setLoading(false);
      onRefreshCompleted();
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [refreshTrigger, currentSimRole]);

  const handleChangeRole = async (memberId: string, newRole: string) => {
    setIsMutatingId(memberId);
    setActiveDropdownId(null);
    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-simulated-role': currentSimRole
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        const resData = await response.json();
        // Update local state
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole as any } : m));
        
        const toastEvent = new CustomEvent('toast-message', {
          detail: {
            title: 'Role Updated',
            message: `Permissions modified successfully.`
          }
        });
        window.dispatchEvent(toastEvent);
      } else {
        const resData = await response.json();
        const toastError = new CustomEvent('toast-message', {
          detail: {
            title: 'Action Restrained',
            message: resData.error || 'Unable to update role permissions'
          }
        });
        window.dispatchEvent(toastError);
      }
    } catch (e) {
      console.error('Failed updating role:', e);
    } finally {
      setIsMutatingId(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirmRemoveMember) return;
    setIsMutatingId(memberId);
    setConfirmRemoveMember(null);

    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: 'DELETE',
        headers: {
          'x-simulated-role': currentSimRole
        }
      });

      if (response.ok) {
        // Mark as suspended in state as requested to keep audit trail
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, status: 'suspended' } : m));
        
        const toastEvent = new CustomEvent('toast-message', {
          detail: {
            title: 'Team Member Suspended',
            message: `${confirmRemoveMember.email} has been suspended from organization access.`
          }
        });
        window.dispatchEvent(toastEvent);
      } else {
        const resData = await response.json();
        const toastError = new CustomEvent('toast-message', {
          detail: {
            title: 'Access Restricted',
            message: resData.error || 'Failed to revoke permissions.'
          }
        });
        window.dispatchEvent(toastError);
      }
    } catch (e) {
      console.error('Failed revoking access:', e);
    } finally {
      setIsMutatingId(null);
    }
  };

  // Avatar and color configs per role
  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', pillStyle: 'border-[#2DD4BF]/25 bg-[#2DD4BF]/5 text-[#2DD4BF]', dotColor: 'bg-[#2DD4BF]' };
      case 'logistics_manager':
        return { label: 'Logistics Mgr', pillStyle: 'border-blue-500/25 bg-blue-500/5 text-[#3B82F6]', dotColor: 'bg-[#3B82F6]' };
      case 'finance_clerk':
        return { label: 'Finance Clerk', pillStyle: 'border-amber-500/25 bg-amber-500/5 text-[#F59E0B]', dotColor: 'bg-[#F59E0B]' };
      case 'operations_coordinator':
        return { label: 'Operations Coord', pillStyle: 'border-slate-500/25 bg-slate-500/5 text-[#94A3B8]', dotColor: 'bg-[#94A3B8]' };
      default:
        return { label: 'Auditor', pillStyle: 'border-zinc-700/30 bg-zinc-800 text-zinc-400', dotColor: 'bg-zinc-500' };
    }
  };

  // Initials generator
  const getInitials = (name: string, email: string) => {
    const fallback = email ? email.substring(0, 2).toUpperCase() : 'US';
    if (!name) return fallback;
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  // Status visual configurations
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
            <CheckCircle size={10} />
            <span>ACTIVE</span>
          </span>
        );
      case 'invited':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
            <Clock size={10} />
            <span>INVITED</span>
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 animate-pulse">
            <AlertTriangle size={10} />
            <span>SUSPENDED</span>
          </span>
        );
      default:
        return null;
    }
  };

  if (loading && members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3 bg-[#0D1324] rounded-xl border border-teal-900/40" id="members-list-loading">
        <Loader2 className="animate-spin text-[#2DD4BF]" size={24} />
        <p className="text-xs text-[#94A3B8] font-mono uppercase tracking-widest">LOADING TEAM MEMBERS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" id="team-members-list-container">
      <div className="overflow-x-auto rounded-xl border border-[#1F2D45] bg-[#0E1324] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <table className="w-full border-collapse font-sans text-xs">
          <thead>
            <tr className="bg-[#111827] border-b border-[#1F2D45] text-left text-[9px] uppercase font-mono font-black tracking-widest text-[#94A3B8]">
              <th className="p-4 pl-5">Member Avatar</th>
              <th className="p-4">Contact Details</th>
              <th className="p-4">Current Organization Role</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right pr-5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F2D45]/40 text-slate-100">
            {members.map((member) => {
              // Row constraints: cannot demote/suspend yourself
              const isCurrentUser = member.email === currentUserEmail || member.id === 'member-1' || member.user_id === 'user-alpha';
              const rConfig = getRoleConfig(member.role);
              const initials = getInitials(member.full_name, member.email);

              return (
                <tr key={member.id} className="hover:bg-[#1C2537]/35 transition-colors duration-150">
                  {/* Column 1: Avatar */}
                  <td className="p-4 pl-5 shrink-0">
                    <div className="flex items-center">
                      <div className={`h-8 w-8 rounded-full border border-teal-900/60 ${rConfig.dotColor} bg-opacity-20 text-[#F1F5F9] font-mono flex items-center justify-center font-black text-[10px] uppercase shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]`}>
                        {initials}
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Name + Email */}
                  <td className="p-4">
                    <div className="flex flex-col leading-snug">
                      <span className="font-extrabold text-white text-xs">{member.full_name || member.email.split('@')[0]}</span>
                      <span className="text-[10px] text-[#94A3B8] font-mono mt-0.5">{member.email}</span>
                    </div>
                  </td>

                  {/* Column 3: Role selector */}
                  <td className="p-4">
                    {isCurrentUser ? (
                      <span className={`inline-block px-2.5 py-1 rounded text-[9px] uppercase tracking-wider font-extrabold font-mono border ${rConfig.pillStyle}`}>
                        {rConfig.label} (yourself)
                      </span>
                    ) : member.status === 'suspended' ? (
                      <span className="text-[10px] text-[#475569] font-mono uppercase tracking-wider">SUSPENDED ACCOUNT</span>
                    ) : (
                      /* Customized change role inline custom selector drop */
                      <div className="relative inline-block w-[180px]">
                        <button
                          type="button"
                          onClick={() => setActiveDropdownId(activeDropdownId === member.id ? null : member.id)}
                          disabled={isMutatingId !== null}
                          className="w-full flex items-center justify-between text-left text-[10px] font-mono uppercase tracking-wider font-extrabold bg-[#111827] border border-[#1F2D45] text-white py-1.5 px-3 rounded-lg focus:outline-none transition-all cursor-pointer disabled:opacity-40"
                        >
                          <span className="truncate">{rConfig.label}</span>
                          <ChevronDown size={12} className="text-[#94A3B8]" />
                        </button>

                        {activeDropdownId === member.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActiveDropdownId(null)} />
                            <div className="absolute top-[calc(100%+4px)] left-0 bg-[#111827] border border-[#1F2D45] rounded-lg z-50 py-1 shadow-[0_10px_20px_rgba(0,0,0,0.7)] animate-fade-in w-full">
                              {ROLE_OPTIONS.map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => handleChangeRole(member.id, opt.value)}
                                  className="w-full text-left py-1.5 px-3 hover:bg-[#1C2537] text-[10px] font-mono uppercase tracking-wide text-white flex items-center justify-between cursor-pointer"
                                >
                                  <span>{opt.label}</span>
                                  {member.role === opt.value && <Check size={10} className="text-[#2DD4BF]" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Column 4: Status Badge */}
                  <td className="p-4">
                    {getStatusBadge(member.status)}
                  </td>

                  {/* Column 5: Action Button Removers */}
                  <td className="p-4 text-right pr-5">
                    {isCurrentUser ? (
                      <span className="text-[10px] font-mono text-[#475569] uppercase tracking-wider">SYSTEM ROOT</span>
                    ) : member.status === 'suspended' ? (
                      <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded uppercase">ARCHIVED</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmRemoveMember(member)}
                        disabled={isMutatingId !== null}
                        className="p-2 bg-red-500/10 border border-red-500/20 text-[#EF4444] hover:bg-[#EF4444] hover:text-white rounded-lg transition-all cursor-pointer inline-flex items-center justify-center gap-1 disabled:opacity-40"
                        title="Suspend user seat usage"
                      >
                        <Trash2 size={12} />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Remove</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Elegant Backdrop Confirmer Modal overlay */}
      {confirmRemoveMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="remove-member-modal">
          <div className="bg-[#111827] border border-red-500/30 rounded-xl max-w-md w-full p-6 space-y-5 animate-scale-up shadow-[0_0_50px_rgba(239,68,68,0.15)]">
            <div className="flex items-center gap-3 border-b border-[#1F2D45] pb-3 text-red-400">
              <ShieldAlert size={22} className="shrink-0" />
              <div>
                <h3 className="text-sm font-black uppercase font-display tracking-wide text-white leading-tight">Confirm Member Removal</h3>
                <p className="text-[10px] text-[#94A3B8] font-mono mt-0.5">ACTION TRANSGRESES AUTHENTICATION BOUNDARIES</p>
              </div>
            </div>

            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Are you absolute you wish to suspend <strong>{confirmRemoveMember.full_name || confirmRemoveMember.email}</strong> (<code className="bg-[#0E1324] px-1 py-0.5 rounded text-[10px] font-mono text-red-300">{confirmRemoveMember.email}</code>) from your company org?
              This revokes their system credentials instantly but retains documents for billing archives.
            </p>

            <div className="flex items-center justify-end gap-3 font-mono text-xs uppercase tracking-wider font-extrabold pt-2">
              <button
                type="button"
                onClick={() => setConfirmRemoveMember(null)}
                className="px-4 py-2 hover:bg-[#1C2537] border border-[#1F2D45] text-[#94A3B8] rounded-lg transition-all cursor-pointer text-[10px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRemoveMember(confirmRemoveMember.id)}
                className="px-4 py-2 bg-[#EF4444] hover:bg-red-500 text-white rounded-lg transition-all cursor-pointer text-[10px] flex items-center gap-1.5"
              >
                <UserMinus size={12} />
                <span>Verify Suspension</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
