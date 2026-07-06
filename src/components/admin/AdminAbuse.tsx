import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { ShieldAlert, AlertTriangle, Info, CheckCircle, X, RefreshCw } from 'lucide-react';

interface Warning {
  type: string;
  rule: string;
  severity: string;
  org_id: string;
  org_name: string;
  description: string;
  detected_at: string;
}

export default function AdminAbuse() {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>('');

  const fetchWarnings = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/abuse', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setWarnings(data.warnings || []);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWarnings();
    const interval = setInterval(fetchWarnings, 30000);
    return () => clearInterval(interval);
  }, [fetchWarnings]);

  async function dismissWarning(w: Warning) {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: w.org_id,
          note_text: `dismissed_warning:${w.rule}:${w.org_id}`,
        }),
      });
      setWarnings(prev => prev.filter(x => x.rule !== w.rule || x.org_id !== w.org_id));
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-20 justify-center">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-zinc-400 text-sm">Running abuse detection...</span>
      </div>
    );
  }

  const activeWarnings = warnings.filter(w => w.severity === 'warning');
  const infoNotices = warnings.filter(w => w.severity === 'info');
  const allClear = warnings.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <span className="text-[11px] font-medium rounded-full px-3 py-1 bg-red-400/10 text-red-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" /> {activeWarnings.length} active warnings
          </span>
          <span className="text-[11px] font-medium rounded-full px-3 py-1 bg-blue-400/10 text-blue-400 flex items-center gap-1.5">
            <Info className="w-3 h-3" /> {infoNotices.length} info notices
          </span>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && <span className="text-[10px] font-mono text-zinc-600">Last: {lastRefresh}</span>}
          <button onClick={fetchWarnings}
            className="text-zinc-600 hover:text-zinc-300 p-1 transition-colors duration-200"
            title="Refresh now"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {allClear && (
        <div className="bg-[#121212] rounded-2xl p-10 flex flex-col items-center gap-3">
          <CheckCircle className="w-10 h-10 text-green-400" />
          <p className="text-green-400 text-sm font-medium">All Clear</p>
          <p className="text-zinc-500 text-xs">No abuse patterns detected across the platform</p>
        </div>
      )}

      <div className="space-y-3">
        {warnings.map((w) => {
          const id = w.rule + w.org_id;
          return (
            <div key={id} className={`bg-[#121212] rounded-2xl p-5 flex items-start gap-3 ${w.severity === 'warning' ? 'ring-1 ring-red-400/15' : 'ring-1 ring-blue-400/15'}`}>
              <div className={`mt-0.5 ${w.severity === 'warning' ? 'text-red-400' : 'text-blue-400'}`}>
                {w.severity === 'warning' ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-zinc-200">{w.rule}</h4>
                <p className="text-xs text-zinc-500 mt-1">{w.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <a
                    href={`/admin/organizations/${w.org_id}`}
                    onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', `/admin/organizations/${w.org_id}`); window.dispatchEvent(new Event('popstate')); }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {w.org_name}
                  </a>
                  <span className="text-[10px] font-mono text-zinc-600">
                    {new Date(w.detected_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => dismissWarning(w)}
                className="text-zinc-600 hover:text-zinc-400 p-1 transition-colors duration-200 shrink-0"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
