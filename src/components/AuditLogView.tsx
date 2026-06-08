import { AuditLog } from '../../types';
import { Fingerprint, Clock, Activity, Terminal } from 'lucide-react';

interface AuditLogViewProps {
  logs: AuditLog[];
}

export default function AuditLogView({ logs }: AuditLogViewProps) {
  // Sort logs by newest first
  const sortedLogs = logs
    .slice()
    .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="bg-[#111827] border border-[#1f2d45] rounded-xl p-6 space-y-6" id="logs-history-board">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 uppercase">
          <Terminal className="text-[#2dd4bf] h-5 w-5" /> Audit Logging Ledger
        </h2>
        <p className="text-xs text-[#94a3b8] mt-1">
          Chronological ledger tracking all automated AI checks, user actions, contract edits, and carrier claims.
        </p>
      </div>

      <div className="bg-[#0a0f1e] rounded-xl border border-[#1f2d45] overflow-hidden divide-y divide-[#1f2d45]/40 text-xs">
        {sortedLogs.length === 0 ? (
          <div className="p-10 text-center text-zinc-500 font-mono">No actions registered in the current system session.</div>
        ) : (
          sortedLogs.map((log) => (
            <div key={log.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-[#1c2537] border border-[#1f2d45] rounded-lg text-teal-400 mt-0.5">
                  <Activity size={14} />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#f1f5f9] block">{log.action}</span>
                  <div className="flex gap-2.5 text-[10px] text-zinc-500">
                    <span>Scope: <span className="text-zinc-400 capitalize">{log.entity_type}</span></span>
                    <span>&bull;</span>
                    <span>Entity ID: <span className="text-zinc-400">{log.entity_id}</span></span>
                  </div>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="mt-1.5 p-2 bg-[#111827]/65 border border-[#1f2d45]/40 rounded text-[10px] text-teal-300 max-w-sm font-sans">
                      {Object.keys(log.metadata).map((key) => (
                        <div key={key} className="flex gap-1.5">
                          <span className="text-zinc-500">{key}:</span>
                          <span>{JSON.stringify(log.metadata[key])}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] shrink-0">
                <Clock size={12} />
                <span>{new Date(log.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
