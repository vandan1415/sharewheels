import { useState, type FormEvent } from 'react';
import { Bell, Loader2, Send } from 'lucide-react';
import { useAdminNotifications, useAdminSession } from '@/hooks/useAdmin';
import { callAdminApi } from '@/lib/admin';
import { AdminAuthGate } from '@/components/admin/AdminAuthGate';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';

export function AdminNotificationsPage() {
  const { data: adminSession } = useAdminSession();
  const { data: logs = [], isLoading, invalidate } = useAdminNotifications(Boolean(adminSession));

  const [audience, setAudience] = useState<'all_owners' | 'all_customers' | 'all_users' | 'single_user'>(
    'all_owners'
  );
  const [targetUserId, setTargetUserId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setSending(true);
    try {
      const res = await callAdminApi<{ recipientCount: number }>('send_notification', {
        audience,
        targetUserId: audience === 'single_user' ? targetUserId.trim() : null,
        title: title.trim(),
        body: body.trim(),
      });
      setTitle('');
      setBody('');
      setTargetUserId('');
      setMsg(`Notification dispatched to ${res.recipientCount} account(s) and logged.`);
      await invalidate();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Unable to send notification.');
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminAuthGate>
      <AdminLayout
        title="Notifications & Communication History"
        subtitle="Dispatch platform announcements to owners or customers with complete communication history."
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleSend}
            className="lg:col-span-5 border border-[#2A2A30] bg-[#111114] p-6 rounded-sm space-y-4"
          >
            <h2 className="font-display text-lg font-medium text-[#F4F1EA]">
              Compose Notification
            </h2>
            {msg && (
              <p className="text-xs text-emerald-300 border border-emerald-500/40 bg-emerald-950/20 p-3 rounded-sm">
                {msg}
              </p>
            )}
            {err && (
              <p className="text-xs text-red-300 border border-red-500/40 bg-red-950/20 p-3 rounded-sm">
                {err}
              </p>
            )}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                Target Audience
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as any)}
                className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-xs rounded-sm"
              >
                <option value="all_owners">All Registered Owners</option>
                <option value="all_customers">All Customers</option>
                <option value="all_users">All Platform Users</option>
                <option value="single_user">Specific User UUID</option>
              </select>
            </div>
            {audience === 'single_user' && (
              <input
                type="text"
                required
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Target auth user UUID..."
                className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-xs rounded-sm"
              />
            )}
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title..."
              className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-xs rounded-sm"
            />
            <textarea
              required
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Notification message body..."
              className="w-full bg-[#0A0A0B] border border-[#2A2A30] p-3 text-xs rounded-sm"
            />
            <Button type="submit" variant="champagne" className="w-full" disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span>Dispatch Notification</span>
            </Button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            <h2 className="font-display text-lg font-medium text-[#F4F1EA]">
              Sent Communication History
            </h2>
            {isLoading ? (
              <p className="text-sm text-[#8E8E98]">Loading communication logs...</p>
            ) : logs.length === 0 ? (
              <div className="border border-[#2A2A30] bg-[#111114] p-8 rounded-sm text-center space-y-2">
                <Bell className="h-6 w-6 text-[#C8A97E] mx-auto" />
                <p className="text-sm text-[#8E8E98]">No admin broadcasts dispatched yet.</p>
              </div>
            ) : (
              logs.map((l: any) => (
                <div key={l.id} className="border border-[#2A2A30] bg-[#111114] p-4 rounded-sm space-y-1 text-xs">
                  <div className="flex justify-between text-[#8E8E98]">
                    <span className="uppercase text-[#C8A97E]">{l.audience.replace(/_/g, ' ')}</span>
                    <span>
                      {l.recipient_count} recipient(s) · {new Date(l.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="font-medium text-[#F4F1EA] text-sm">{l.title}</p>
                  <p className="text-[#8E8E98]">{l.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </AdminLayout>
    </AdminAuthGate>
  );
}
