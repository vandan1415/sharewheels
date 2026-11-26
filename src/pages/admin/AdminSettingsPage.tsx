import { useEffect, useState } from 'react';
import { KeyRound, Loader2, ShieldAlert, ShieldCheck, UserPlus, UserX } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAdminSession } from '@/hooks/useAdmin';
import { callAdminApi } from '@/lib/admin';
import { AdminAuthGate } from '@/components/admin/AdminAuthGate';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';

export function AdminSettingsPage() {
  const { data: adminSession } = useAdminSession();

  const [roleRows, setRoleRows] = useState<any[]>([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [busyRole, setBusyRole] = useState(false);
  const [roleMsg, setRoleMsg] = useState<string | null>(null);
  const [roleErr, setRoleErr] = useState<string | null>(null);

  // Supabase TOTP MFA Enrollment
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [totpQrUri, setTotpQrUri] = useState<string | null>(null);
  const [totpFactorId, setTotpFactorId] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [mfaMsg, setMfaMsg] = useState<string | null>(null);
  const [mfaErr, setMfaErr] = useState<string | null>(null);

  const loadSettingsData = async () => {
    if (!supabase) return;
    const { data: r } = await supabase
      .from('user_roles')
      .select('id, user_id, role, created_at')
      .in('role', ['admin', 'super_admin'])
      .order('created_at', { ascending: true });
    setRoleRows(r ?? []);

    const { data: factors } = await supabase.auth.mfa.listFactors();
    setMfaFactors(factors?.totp ?? []);
  };

  useEffect(() => {
    if (adminSession) loadSettingsData();
  }, [adminSession]);

  const handleGrantRevoke = async (roleAction: 'grant_admin' | 'revoke_admin', uid: string) => {
    setRoleErr(null);
    setRoleMsg(null);
    setBusyRole(true);
    try {
      const res = await callAdminApi<{ action: string }>('manage_admin_role', {
        targetUserId: uid,
        roleAction,
      });
      setRoleMsg(`Administrative role ${res.action} successfully.`);
      setTargetUserId('');
      await loadSettingsData();
    } catch (e) {
      setRoleErr(e instanceof Error ? e.message : 'Role update rejected.');
    } finally {
      setBusyRole(false);
    }
  };

  const handleEnrollTotp = async () => {
    if (!supabase) return;
    setMfaErr(null);
    setMfaMsg(null);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'SHAREWHEELS Admin TOTP',
    });
    if (error || !data) {
      setMfaErr(error?.message || 'Unable to initialize TOTP factor.');
      return;
    }
    setTotpFactorId(data.id);
    setTotpQrUri(data.totp.qr_code);
  };

  const handleVerifyTotp = async () => {
    if (!supabase || !totpFactorId) return;
    setMfaErr(null);
    const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId: totpFactorId });
    if (chErr || !ch) {
      setMfaErr(chErr?.message || 'Challenge failed.');
      return;
    }
    const { error: verErr } = await supabase.auth.mfa.verify({
      factorId: totpFactorId,
      challengeId: ch.id,
      code: totpCode.trim(),
    });
    if (verErr) {
      setMfaErr(verErr.message);
      return;
    }
    setTotpQrUri(null);
    setTotpFactorId(null);
    setTotpCode('');
    setMfaMsg('TOTP Two-Factor Authentication verified & enabled on this Admin account.');
    await loadSettingsData();
  };

  return (
    <AdminAuthGate>
      <AdminLayout
        title="Security, MFA & Admin Roles"
        subtitle="Session security controls, optional TOTP two-factor enrollment, and SUPER_ADMIN role governance."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Session & TOTP 2FA */}
          <div className="border border-[#2A2A30] bg-[#111114] p-6 rounded-sm space-y-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#C8A97E]">
              <KeyRound className="h-4 w-4" />
              <span>Session & Two-Factor Authentication (TOTP)</span>
            </div>

            <div className="border border-[#2A2A30] bg-[#0A0A0B] p-4 rounded-sm text-xs space-y-1">
              <p>Active User ID: <span className="font-mono text-[#E8E4DC]">{adminSession?.userId}</span></p>
              <p>Verified Phone: <strong className="text-[#F4F1EA]">{adminSession?.phone || 'N/A'}</strong></p>
              <p>Assigned Role: <strong className="uppercase text-[#C8A97E]">{adminSession?.role}</strong></p>
            </div>

            {mfaMsg && (
              <p className="text-xs text-emerald-300 border border-emerald-500/40 bg-emerald-950/20 p-3 rounded-sm">
                {mfaMsg}
              </p>
            )}
            {mfaErr && (
              <p className="text-xs text-red-300 border border-red-500/40 bg-red-950/20 p-3 rounded-sm">
                {mfaErr}
              </p>
            )}

            <div className="space-y-2">
              <p className="text-xs text-[#8E8E98]">
                Enrolled Authenticator Factors: <strong className="text-[#F4F1EA]">{mfaFactors.length}</strong>
              </p>
              {!totpQrUri ? (
                <Button variant="outline" size="sm" onClick={handleEnrollTotp}>
                  <ShieldCheck className="h-3.5 w-3.5 text-[#C8A97E]" />
                  Enroll TOTP Two-Factor Authenticator
                </Button>
              ) : (
                <div className="border border-[#2A2A30] bg-[#0A0A0B] p-4 rounded-sm space-y-3">
                  <img src={totpQrUri} alt="TOTP QR Code" className="w-40 h-40 bg-white p-2 rounded-sm" />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      placeholder="6-digit code"
                      className="h-9 bg-[#111114] border border-[#2A2A30] px-3 text-xs rounded-sm"
                    />
                    <Button variant="champagne" size="sm" onClick={handleVerifyTotp}>
                      Confirm TOTP
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SUPER_ADMIN-only Role Governance */}
          <div className="border border-[#2A2A30] bg-[#111114] p-6 rounded-sm space-y-5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#C8A97E]">
                <ShieldAlert className="h-4 w-4" />
                Administrative Role Governance
              </span>
              <span className="text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                SUPER_ADMIN Exclusive
              </span>
            </div>

            {!adminSession?.isSuperAdmin ? (
              <p className="text-xs text-[#8E8E98] leading-relaxed border border-[#2A2A30] bg-[#0A0A0B] p-4 rounded-sm">
                Only <strong>SUPER_ADMIN</strong> accounts can grant or revoke administrative roles.
                Standard <strong>admin</strong> accounts cannot promote themselves or modify privileges.
              </p>
            ) : (
              <>
                {roleMsg && (
                  <p className="text-xs text-emerald-300 border border-emerald-500/40 bg-emerald-950/20 p-3 rounded-sm">
                    {roleMsg}
                  </p>
                )}
                {roleErr && (
                  <p className="text-xs text-red-300 border border-red-500/40 bg-red-950/20 p-3 rounded-sm">
                    {roleErr}
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    placeholder="Verified user UUID to grant ADMIN..."
                    className="flex-1 h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-xs rounded-sm"
                  />
                  <Button
                    variant="champagne"
                    size="sm"
                    disabled={busyRole || !targetUserId.trim()}
                    onClick={() => handleGrantRevoke('grant_admin', targetUserId.trim())}
                  >
                    {busyRole ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                    <span>Grant Admin</span>
                  </Button>
                </div>
              </>
            )}

            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                Current Admin Assignments ({roleRows.length})
              </p>
              {roleRows.map((r) => (
                <div
                  key={r.id}
                  className="border border-[#2A2A30] bg-[#0A0A0B] p-3 rounded-sm flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono text-[#E8E4DC]">{r.user_id}</span>
                    <span className="ml-2 uppercase text-[#C8A97E]">{r.role}</span>
                  </div>
                  {adminSession?.isSuperAdmin && r.role === 'admin' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busyRole}
                      onClick={() => handleGrantRevoke('revoke_admin', r.user_id)}
                      className="text-red-300"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminAuthGate>
  );
}
