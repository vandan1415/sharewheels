import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useAdminAuditLogs, useAdminSession } from '@/hooks/useAdmin';
import { AdminAuthGate } from '@/components/admin/AdminAuthGate';
import { AdminLayout } from '@/components/admin/AdminLayout';

export function AdminAuditLogsPage() {
  const { data: adminSession } = useAdminSession();
  const { data, isLoading } = useAdminAuditLogs(Boolean(adminSession));
  const [tab, setTab] = useState<'admin' | 'verification'>('admin');

  const adminLogs = data?.adminLogs ?? [];
  const verificationLogs = data?.verificationLogs ?? [];

  return (
    <AdminAuthGate>
      <AdminLayout
        title="Security & Immutable Audit Trail"
        subtitle="Append-only log of admin moderation decisions, sensitive KYC views, role changes, and commission updates."
      >
        <div className="border border-[#C8A97E]/30 bg-[#C8A97E]/5 p-4 rounded-sm flex items-center gap-3 text-xs text-[#E8E4DC]">
          <Lock className="h-4 w-4 text-[#C8A97E] shrink-0" />
          <span>
            PostgreSQL trigger <code className="text-[#C8A97E]">trg_prevent_admin_audit_mutation</code>{' '}
            forbids UPDATE and DELETE operations on <code>admin_audit_logs</code>.
          </span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab('admin')}
            className={`px-4 py-2 rounded-sm text-xs uppercase tracking-[0.14em] cursor-pointer ${
              tab === 'admin'
                ? 'bg-[#C8A97E] text-[#0A0A0B] font-medium'
                : 'border border-[#2A2A30] bg-[#111114] text-[#E8E4DC]'
            }`}
          >
            Admin Activity & Document Access ({adminLogs.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('verification')}
            className={`px-4 py-2 rounded-sm text-xs uppercase tracking-[0.14em] cursor-pointer ${
              tab === 'verification'
                ? 'bg-[#C8A97E] text-[#0A0A0B] font-medium'
                : 'border border-[#2A2A30] bg-[#111114] text-[#E8E4DC]'
            }`}
          >
            Verification State History ({verificationLogs.length})
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-[#8E8E98]">Loading immutable logs...</p>
        ) : tab === 'admin' ? (
          <div className="border border-[#2A2A30] bg-[#111114] rounded-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#2A2A30] text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Actor Role</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Entity</th>
                  <th className="p-3.5">Reason / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A30] text-[#E8E4DC]">
                {adminLogs.map((l: any) => (
                  <tr key={l.id}>
                    <td className="p-3.5 whitespace-nowrap text-[#8E8E98]">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td className="p-3.5 uppercase text-[#C8A97E]">{l.actor_role}</td>
                    <td className="p-3.5 font-mono">{l.action}</td>
                    <td className="p-3.5 text-[#8E8E98]">
                      {l.entity_type} {l.entity_id ? `(${String(l.entity_id).slice(0, 8)})` : ''}
                    </td>
                    <td className="p-3.5">{l.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-[#2A2A30] bg-[#111114] rounded-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#2A2A30] text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Entity</th>
                  <th className="p-3.5">Transition</th>
                  <th className="p-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A30] text-[#E8E4DC]">
                {verificationLogs.map((v: any) => (
                  <tr key={v.id}>
                    <td className="p-3.5 whitespace-nowrap text-[#8E8E98]">
                      {new Date(v.created_at).toLocaleString()}
                    </td>
                    <td className="p-3.5">{v.entity_type}</td>
                    <td className="p-3.5 text-[#C8A97E]">
                      {v.from_status || 'INIT'} → {v.to_status}
                    </td>
                    <td className="p-3.5">{v.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminLayout>
    </AdminAuthGate>
  );
}
