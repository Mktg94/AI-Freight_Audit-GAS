import { useState, useEffect } from 'react';
import { Contract, Invoice, Dispute, AuditLog, LineItem, AuditResult } from '../types';
import ContractList from './components/ContractList';
import ContractPageClient from '../components/contracts/ContractPageClient';
import ContractForm from '../components/contracts/ContractForm';
import InvoiceList from './components/InvoiceList';
import DisputesPage from '../app/disputes/page';
import DisputeDetailPage from '../app/disputes/[id]/page';
import ReportsPage from '../app/reports/page';
import SettingsPage from '../app/settings/page';
import LandingPage from '../app/page';
import AuditLogView from './components/AuditLogView';
import LoginPage from '../app/auth/login/page';
import SignupPage from '../app/auth/signup/page';
import DashboardLayout from '../app/dashboard/layout';
import DashboardPage from '../app/dashboard/page';
import InvoiceUploadPage from '../app/invoices/upload/page';
import InvoiceDetailPage from '../app/invoices/[id]/page';
import InvoicesPage from '../app/invoices/page';
import { createClient } from '../lib/supabase/client';
import { 
  ShieldCheck, Landmark, FileText, Mail, PieChart, Terminal, User, Sparkles, X
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'contracts' | 'disputes' | 'analytics' | 'logs'>('invoices');

  // Authentication states
  const [session, setSession] = useState<any>(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [welcomeToast, setWelcomeToast] = useState<{ show: boolean; title: string; message: string } | null>(null);

  // Unified State Engine
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Global theme persistence loader
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('fa_theme') || 'navy';
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  // Sync route and check sessions
  useEffect(() => {
    // 1. Reactive router listener for popstate pushes
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    const handleCreated = (e: Event) => {
      const newContract = (e as CustomEvent).detail;
      setContracts(prev => {
        if (prev.some(c => c.id === newContract.id)) return prev;
        return [newContract, ...prev];
      });
      handleAddAuditLog({
        action: `Registered Contract: ${newContract.carrier_name}`,
        entity_type: "contract",
        entity_id: newContract.id,
        metadata: newContract
      });
    };

    const handleUpdated = (e: Event) => {
      const updatedContract = (e as CustomEvent).detail;
      setContracts(prev => prev.map(c => c.id === updatedContract.id ? updatedContract : c));
      handleAddAuditLog({
        action: `Updated Contract Rates: ${updatedContract.carrier_name}`,
        entity_type: "contract",
        entity_id: updatedContract.id,
        metadata: updatedContract
      });
    };

    const handleToastEvent = (e: Event) => {
      const info = (e as CustomEvent).detail;
      triggerToast(info.title, info.message);
    };

    const handleInvoiceCreated = (e: Event) => {
      const data = (e as CustomEvent).detail;
      const { invoice, lineItems: newLines } = data;
      setInvoices(prev => {
        if (prev.some(inv => inv.id === invoice.id)) return prev;
        return [invoice, ...prev];
      });
      setLineItems(prev => {
        const rest = prev.filter(li => li.invoice_id !== invoice.id);
        return [...newLines, ...rest];
      });
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('contracts-created', handleCreated);
    window.addEventListener('contracts-updated', handleUpdated);
    window.addEventListener('invoice-created', handleInvoiceCreated);
    window.addEventListener('show-toast', handleToastEvent);
    
    // 2. Load active Supabase Auth sessions if variables exist
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    
    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder') && !supabaseKey.includes('placeholder')) {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
        if (existingSession) {
          setSession(existingSession);
          if (window.location.pathname.startsWith('/auth')) {
            window.history.pushState({}, '', '/dashboard');
            setCurrentPath('/dashboard');
          }
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
        if (newSession && window.location.pathname.startsWith('/auth')) {
          window.history.pushState({}, '', '/dashboard');
          setCurrentPath('/dashboard');
        }
      });

      return () => {
        window.removeEventListener('popstate', handleLocationChange);
        window.removeEventListener('contracts-created', handleCreated);
        window.removeEventListener('contracts-updated', handleUpdated);
        window.removeEventListener('invoice-created', handleInvoiceCreated);
        window.removeEventListener('show-toast', handleToastEvent);
        subscription.unsubscribe();
      };
    } else {
      // Offline local storage fallback
      const cached = localStorage.getItem('fa_mock_session');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setSession(parsed);
          if (window.location.pathname.startsWith('/auth')) {
            window.history.pushState({}, '', '/dashboard');
            setCurrentPath('/dashboard');
          }
        } catch (e) {}
      }
    }

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('contracts-created', handleCreated);
      window.removeEventListener('contracts-updated', handleUpdated);
      window.removeEventListener('invoice-created', handleInvoiceCreated);
      window.removeEventListener('show-toast', handleToastEvent);
    };
  }, []);

  const triggerToast = (title: string, message: string) => {
    setWelcomeToast({ show: true, title, message });
    setTimeout(() => {
      setWelcomeToast(null);
    }, 5000);
  };

  // Handlers for state updates
  const handleAddContract = (c: Contract) => {
    setContracts(prev => [c, ...prev]);
  };

  const handleEditContract = (c: Contract) => {
    setContracts(prev => prev.map(item => item.id === c.id ? c : item));
  };

  const handleAuditInvoice = (invoiceId: string, result: AuditResult, auditedItems: LineItem[]) => {
    // 1. Update invoice in array with audited results
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          status: result.status,
          total_approved: result.calculated_total_expected,
          total_savings: result.total_discrepancy,
          audited_at: new Date().toISOString()
        };
      }
      return inv;
    }));

    // 2. Insert audited line items for this invoice (replacing static default items if matching)
    setLineItems(prev => {
      const rest = prev.filter(li => li.invoice_id !== invoiceId);
      return [...auditedItems, ...rest];
    });
  };

  const handleUpdateInvoiceStatus = (invoiceId: string, status: 'pending' | 'auditing' | 'flagged' | 'approved' | 'disputed') => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        return { 
          ...inv, 
          status,
          // Re-adjust mock analytics if marked approved or disputed
          total_approved: status === 'approved' ? inv.total_billed : inv.total_approved,
          total_savings: status === 'approved' ? 0 : inv.total_savings
        };
      }
      return inv;
    }));
  };

  const handleAddManualInvoice = (invoice: Invoice, calculatedItems: {description: string, billed: number}[]) => {
    setInvoices(prev => [invoice, ...prev]);
    
    // Add raw extracted base line items for pending view before AI trigger
    const generatedRawLines: LineItem[] = calculatedItems.map((item, index) => ({
      id: `li-raw-${Date.now()}-${index}`,
      invoice_id: invoice.id,
      description: item.description,
      billed_amount: item.billed,
      expected_amount: item.billed, // matches in pending until auditor runs
      discrepancy: 0,
      confidence_score: 1.0,
      status: 'pending',
      created_at: new Date().toISOString()
    }));

    setLineItems(prev => [...generatedRawLines, ...prev]);
  };

  const handleAddDispute = (disp: Dispute) => {
    setDisputes(prev => [disp, ...prev]);
    // Synchronize target invoice status to disputed
    handleUpdateInvoiceStatus(disp.invoice_id, 'disputed');
  };

  const handleUpdateDisputeStatus = (disputeId: string, status: 'draft' | 'sent' | 'resolved' | 'rejected', resolutionAmount?: number) => {
    setDisputes(prev => prev.map(d => {
      if (d.id === disputeId) {
        const resolvedStamp = status === 'resolved' || status === 'rejected' ? new Date().toISOString() : undefined;
        return {
          ...d,
          status,
          resolution_amount: resolutionAmount ?? d.resolution_amount,
          resolved_at: resolvedStamp,
          sent_at: status === 'sent' ? new Date().toISOString() : d.sent_at
        };
      }
      return d;
    }));

    // If resolved, update corresponding invoice to closed/resolved
    const targetDisp = disputes.find(d => d.id === disputeId);
    if (targetDisp) {
      if (status === 'resolved') {
        setInvoices(prev => prev.map(inv => {
          if (inv.id === targetDisp.invoice_id) {
            return {
              ...inv,
              status: 'approved',
              total_approved: inv.total_billed - (resolutionAmount ?? 0),
              total_savings: resolutionAmount ?? 0
            };
          }
          return inv;
        }));
      } else if (status === 'rejected') {
        handleUpdateInvoiceStatus(targetDisp.invoice_id, 'approved');
      }
    }
  };

  const handleAddAuditLog = (logData: {action: string, entity_type: string, entity_id: string, metadata?: any}) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      org_id: "org-101",
      user_id: session?.user?.id || "user-alpha",
      action: logData.action,
      entity_type: logData.entity_type,
      entity_id: logData.entity_id,
      metadata: logData.metadata || {},
      created_at: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Auth Action handlers
  const handleLoginSuccess = (userSession: any) => {
    setSession(userSession);
    localStorage.setItem('fa_mock_session', JSON.stringify(userSession));
    
    // Add audit log
    const userEmail = userSession.user?.email || 'Anonymous user';
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      org_id: "org-101",
      user_id: userSession.user?.id || 'usr-mock',
      action: `Corporate user authenticated successfully: ${userEmail}`,
      entity_type: "user",
      entity_id: userSession.user?.id || "unknown",
      metadata: { method: "Supabase authentication", email: userEmail },
      created_at: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);

    triggerToast("Authentication Success", `Signed in securely as ${userEmail}. Ledger initialized!`);

    window.history.pushState({}, '', '/dashboard');
    setCurrentPath('/dashboard');
  };

  const handleSignupSuccess = (userSession: any, customCompanyName: string) => {
    setSession(userSession);
    localStorage.setItem('fa_mock_session', JSON.stringify(userSession));

    const userEmail = userSession.user?.email || 'Registered corporate user';
    
    // Insert custom audit log for newly created company organization
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      org_id: "org-custom",
      user_id: userSession.user?.id || "usr-reg",
      action: `Created new organization ledger: '${customCompanyName}' owned by ${userEmail}`,
      entity_type: "organization",
      entity_id: userSession.user?.id || "unknown",
      metadata: { owner: userEmail, org_name: customCompanyName },
      created_at: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);

    triggerToast("Account Created", `Tenant '${customCompanyName}' provisioned. Enjoy full auditing capabilities!`);

    window.history.pushState({}, '', '/dashboard');
    setCurrentPath('/dashboard');
  };

  const handleLogOut = async () => {
    localStorage.removeItem('fa_mock_session');
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder') && !supabaseKey.includes('placeholder')) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    
    setSession(null);
    window.history.pushState({}, '', '/auth/login');
    setCurrentPath('/auth/login');
  };

  // Route calculation
  const normalizedPath = currentPath.toLowerCase();

  if (normalizedPath === '/' || normalizedPath === '' || normalizedPath === '/index.html') {
    return (
      <LandingPage />
    );
  }

  if (!session) {
    if (currentPath === '/auth/signup' || currentPath === '/app/auth/signup') {
      return (
        <SignupPage 
          onSignupSuccess={handleSignupSuccess}
          onNavigateToLogin={() => {
            window.history.pushState({}, '', '/auth/login');
            setCurrentPath('/auth/login');
          }}
        />
      );
    }
    // Default fallback is always login
    return (
      <LoginPage 
        onLoginSuccess={handleLoginSuccess}
        onNavigateToSignup={() => {
          window.history.pushState({}, '', '/auth/signup');
          setCurrentPath('/auth/signup');
        }}
      />
    );
  }

  // Path routing mapping
  let pageContent = null;

  if (normalizedPath === '/invoices' || normalizedPath.startsWith('/invoices/')) {
    if (normalizedPath === '/invoices/upload') {
      pageContent = (
        <InvoiceUploadPage />
      );
    } else if (normalizedPath !== '/invoices') {
      // Dynamic detail page routing
      const invoiceId = currentPath.split('/').pop() || '';
      pageContent = (
        <InvoiceDetailPage 
          invoiceId={invoiceId}
          onBack={() => {
            window.history.pushState({}, '', '/invoices');
            window.dispatchEvent(new Event('popstate'));
          }}
        />
      );
    } else {
      pageContent = (
        <InvoicesPage />
      );
    }
  } else if (normalizedPath === '/contracts') {
    pageContent = (
      <ContractPageClient 
        initialContracts={contracts} 
      />
    );
  } else if (normalizedPath === '/contracts/new') {
    pageContent = (
      <ContractForm contract={null} />
    );
  } else if (normalizedPath.startsWith('/contracts/')) {
    const editId = currentPath.split('/').pop() || '';
    const editingContract = contracts.find(c => c.id === editId) || null;
    pageContent = (
      <ContractForm contract={editingContract} />
    );
  } else if (normalizedPath === '/disputes' || normalizedPath.startsWith('/disputes/')) {
    if (normalizedPath === '/disputes') {
      pageContent = (
        <DisputesPage />
      );
    } else {
      const disputeId = currentPath.split('/').pop() || '';
      pageContent = (
        <DisputeDetailPage 
          disputeId={disputeId}
          onBack={() => {
            window.history.pushState({}, '', '/disputes');
            window.dispatchEvent(new Event('popstate'));
          }}
        />
      );
    }
  } else if (normalizedPath === '/reports') {
    pageContent = (
      <ReportsPage />
    );
  } else if (normalizedPath === '/logs') {
    pageContent = (
      <AuditLogView 
        logs={auditLogs}
      />
    );
  } else if (normalizedPath === '/settings') {
    pageContent = (
      <SettingsPage />
    );
  } else {
    // Default fallback to /dashboard
    pageContent = <DashboardPage />;
  }

  // Loaded user dashboard view (when authenticated)
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased relative">
      
      {/* Visual notification toasts */}
      {welcomeToast && (
        <div className="fixed top-6 right-6 bg-white border border-gray-200 rounded-xl p-4 max-w-sm w-full shadow-lg z-[999] flex gap-3">
          <div className="bg-green-50 text-green-600 p-1.5 h-8 w-8 rounded-lg flex items-center justify-center font-bold shrink-0">
            ✓
          </div>
          <div className="flex-grow space-y-0.5">
            <span className="text-xs font-bold text-gray-900 block uppercase tracking-wide">{welcomeToast.title}</span>
            <span className="text-[10px] text-gray-500 block">{welcomeToast.message}</span>
          </div>
          <button onClick={() => setWelcomeToast(null)} className="text-gray-400 hover:text-gray-600 p-0.5 self-start cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Path Routing Shell */}
      <DashboardLayout>
        {pageContent}
      </DashboardLayout>

    </div>
  );
}
