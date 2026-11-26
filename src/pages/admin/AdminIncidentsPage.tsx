import { useState, type FormEvent } from 'react';
import { AlertOctagon, Loader2, Plus, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAdminIncidents, useAdminSession } from '@/hooks/useAdmin';
import { INCIDENT_STATUS_COLORS, INCIDENT_TYPE_LABELS } from '@/lib/admin';
import { AdminAuthGate } from '@/components/admin/AdminAuthGate';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';

export function AdminIncidentsPage({ defaultDisputes = false }: { defaultDisputes?: boolean }) {
  const { user } = useAuth();
  const { data: adminSession } = useAdminSession();
  const { data: incidents = [], isLoading, invalidate } = useAdminIncidents(Boolean(adminSession));

  const [showCreate, setShowCreate] = useState(false);
  const [incType, setIncType] = useState(defaultDisputes ? 'damage_dispute' : 'theft_report');
  const [severity, setSeverity] = useState('high');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceText, setEvidenceText] = useState('');
  const [saving, setSaving] = useState(false);

  const [selected, setSelected] = useState<any | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [nextStatus, setNextStatus] = useState('investigating');
  const [err, setErr] = useState<string | null>(null);

  const visible = defaultDisputes
    ? incidents.filter((i: any) => ['damage_dispute', 'customer_complaint', 'fraud_report'].includes(i.incident_type))
    : incidents;

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || !user?.id) return;
    setErr(null);
    setSaving(true);
    try {
      const refs = evidenceText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const { data: created, error: crErr } = await supabase
        .from('shield_incidents')
        .insert({
          case_id: '',
          incident_type: incType,
          severity,
          status: 'open',
          assigned_admin_id: user.id,
          title: title.trim(),
          description: description.trim(),
          evidence_refs: refs,
        })
        .select('*')
        .single();

      if (crErr) throw new Error(crErr.message);

      await supabase.from('shield_incident_actions').insert({
        incident_id: created.id,
        actor_id: user.id,
        action: 'case_opened',
        notes: `Opened ${created.case_id} (${incType})`,
        from_status: null,
        to_status: 'open',
      });

      setTitle('');
      setDescription('');
      setEvidenceText('');
      setShowCreate(false);
      await invalidate();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Unable to create incident.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!supabase || !user?.id || !selected || !actionNotes.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      const { error: updErr } = await supabase
        .from('shield_incidents')
        .update({
          status: nextStatus,
          resolution_notes:
            nextStatus === 'resolved' || nextStatus === 'closed'
              ? actionNotes.trim()
              : selected.resolution_notes,
        })
        .eq('id', selected.id);
      if (updErr) throw new Error(updErr.message);

      await supabase.from('shield_incident_actions').insert({
        incident_id: selected.id,
        actor_id: user.id,
        action: `status_${nextStatus}`,
        notes: actionNotes.trim(),
        from_status: selected.status,
        to_status: nextStatus,
      });

      setActionNotes('');
      setSelected(null);
      await invalidate();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Unable to update incident.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminAuthGate>
      <AdminLayout
        title={defaultDisputes ? 'SHIELD Disputes Centre' : 'SHIELD Incident Management'}
        subtitle="Manage theft, overdue return, damage dispute, fraud, unauthorised driver, and customer complaint cases."
        action={
          <Button variant="champagne" size="sm" onClick={() => setShowCreate((v) => !v)}>
            <Plus className="h-4 w-4" />
            Log New Case
          </Button>
        }
      >
        {err && (
          <div className="border border-red-500/40 bg-red-950/20 px-4 py-3 text-xs text-red-200 rounded-sm">
            {err}
          </div>
        )}

        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="border border-[#C8A97E]/40 bg-[#111114] p-6 rounded-sm space-y-4 max-w-2xl"
          >
            <h2 className="font-display text-lg font-medium text-[#F4F1EA]">
              Open New SHIELD Case
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select
                value={incType}
                onChange={(e) => setIncType(e.target.value)}
                className="h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-xs rounded-sm"
              >
                {Object.entries(INCIDENT_TYPE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-xs rounded-sm"
              >
                <option value="low">Severity: Low</option>
                <option value="medium">Severity: Medium</option>
                <option value="high">Severity: High</option>
                <option value="critical">Severity: Critical</option>
              </select>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Case summary title..."
              className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-xs rounded-sm"
            />
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed incident / dispute description..."
              className="w-full bg-[#0A0A0B] border border-[#2A2A30] p-3 text-xs rounded-sm"
            />
            <textarea
              rows={2}
              value={evidenceText}
              onChange={(e) => setEvidenceText(e.target.value)}
              placeholder="Preserved evidence references (one storage path or URL per line)"
              className="w-full bg-[#0A0A0B] border border-[#2A2A30] p-3 text-xs rounded-sm"
            />
            <Button type="submit" variant="champagne" size="sm" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>Create SHIELD Case</span>
            </Button>
          </form>
        )}

        {isLoading ? (
          <p className="text-sm text-[#8E8E98]">Loading SHIELD cases...</p>
        ) : visible.length === 0 ? (
          <div className="border border-[#2A2A30] bg-[#111114] p-10 rounded-sm text-center space-y-2">
            <AlertOctagon className="h-6 w-6 text-[#C8A97E] mx-auto" />
            <p className="text-sm text-[#8E8E98]">No open cases or disputes recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((inc: any) => (
              <div
                key={inc.id}
                className="border border-[#2A2A30] bg-[#111114] p-5 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[#C8A97E]">{inc.case_id}</span>
                    <span className={`border px-2 py-0.5 rounded-sm uppercase ${INCIDENT_STATUS_COLORS[inc.status] || ''}`}>
                      {inc.status}
                    </span>
                    <span className="border border-[#2A2A30] bg-[#0A0A0B] px-2 py-0.5 rounded-sm uppercase text-[#8E8E98]">
                      {INCIDENT_TYPE_LABELS[inc.incident_type] || inc.incident_type}
                    </span>
                  </div>
                  <h2 className="font-display text-lg font-medium text-[#F4F1EA]">{inc.title}</h2>
                  <p className="text-[#8E8E98]">
                    Severity: {inc.severity.toUpperCase()} · Actions Logged: {inc.actions?.length ?? 0}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelected(inc);
                    setNextStatus(inc.status);
                    setActionNotes('');
                  }}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-[#C8A97E]" />
                  Manage Case
                </Button>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-2xl w-full border border-[#2A2A30] bg-[#111114] p-6 rounded-sm space-y-5 my-8">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-mono text-xs text-[#C8A97E]">{selected.case_id}</p>
                  <h2 className="font-display text-xl font-semibold text-[#F4F1EA]">{selected.title}</h2>
                </div>
                <button type="button" onClick={() => setSelected(null)} className="text-xs text-[#8E8E98] hover:text-[#F4F1EA]">
                  Close
                </button>
              </div>

              <p className="text-xs text-[#E8E4DC] leading-relaxed border border-[#2A2A30] bg-[#0A0A0B] p-3.5 rounded-sm">
                {selected.description}
              </p>

              {selected.evidence_refs?.length > 0 && (
                <div className="text-xs space-y-1">
                  <p className="uppercase tracking-[0.12em] text-[#8E8E98]">Preserved Evidence</p>
                  {selected.evidence_refs.map((ref: string, idx: number) => (
                    <p key={idx} className="font-mono text-[11px] text-[#C8A97E] break-all">
                      • {ref}
                    </p>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  Administrative Case History
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto text-xs">
                  {(selected.actions ?? []).map((a: any) => (
                    <div key={a.id} className="border border-[#2A2A30] bg-[#0A0A0B] p-2.5 rounded-sm">
                      <span className="text-[#C8A97E] uppercase">{a.action}</span> — {a.notes}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 border-t border-[#2A2A30] pt-4">
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-xs rounded-sm"
                >
                  {['open', 'investigating', 'awaiting_evidence', 'escalated', 'resolved', 'closed'].map((s) => (
                    <option key={s} value={s}>
                      Status: {s}
                    </option>
                  ))}
                </select>
                <textarea
                  rows={2}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Enter mandatory investigation notes / resolution details..."
                  className="w-full bg-[#0A0A0B] border border-[#2A2A30] p-3 text-xs rounded-sm"
                />
                <Button variant="champagne" size="sm" disabled={saving || !actionNotes.trim()} onClick={handleStatusUpdate}>
                  Update Case & Log Action
                </Button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminAuthGate>
  );
}
