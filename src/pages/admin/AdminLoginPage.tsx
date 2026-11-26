import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, Lock, Phone, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import {
  adminAuthPassword,
  adminPhoneToAuthEmail,
  callAdminApi,
  normalizePhoneForOtpInput,
} from '@/lib/admin';
import { Button } from '@/components/ui/button';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [phoneInput, setPhoneInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || loading) return;
    setError(null);

    const normalized = normalizePhoneForOtpInput(phoneInput);
    if (!/^\+[1-9][0-9]{9,14}$/.test(normalized)) {
      setError('Enter a valid 10-digit Indian mobile number (e.g. 9803722777).');
      return;
    }

    if (!password) {
      setError('Please enter your admin password.');
      return;
    }

    setLoading(true);
    try {
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: adminPhoneToAuthEmail(normalized),
        password: adminAuthPassword(normalized, password),
      });

      if (signInErr || !signInData.session) {
        setError('Invalid admin mobile number or password.');
        return;
      }

      // Confirm active administrator / super_admin privileges strictly server-side
      await callAdminApi('check_admin_session');
      navigate('/admin/dashboard');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'This account is not authorised for Admin Portal access.'
      );
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  const handleExistingSessionVerify = async () => {
    setError(null);
    setLoading(true);
    try {
      await callAdminApi('check_admin_session');
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Session is not authorised for Admin access.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F4F1EA] flex flex-col">
      <header className="border-b border-[#2A2A30]">
        <div className="mx-auto max-w-[1320px] h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-display text-sm sm:text-base font-semibold tracking-[0.22em]">
              SHAREWHEELS
            </span>
            <span className="border border-[#C8A97E]/40 bg-[#C8A97E]/10 px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-[0.18em] text-[#C8A97E]">
              Admin Control
            </span>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-[#8E8E98] hover:text-[#F4F1EA]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Public Site
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full border border-[#2A2A30] bg-[#111114] p-8 rounded-sm space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#C8A97E]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Restricted Administrative Access</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold">
              SHAREWHEELS Admin Login
            </h1>
            <p className="text-xs text-[#8E8E98] leading-relaxed">
              Authorised administrators only. Sign in with your designated admin mobile number and
              password. Public admin registration is disabled.
            </p>
          </div>

          {user && (
            <div className="border border-[#2A2A30] bg-[#0A0A0B] p-4 rounded-sm space-y-3 text-xs">
              <p className="text-[#E8E4DC]">
                Active session detected ({user.phone || user.email}). Check server admin status or
                switch accounts:
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={handleExistingSessionVerify}
                >
                  Verify Admin Session
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-300 border border-red-500/40 bg-red-950/20 px-3.5 py-2.5 rounded-sm leading-relaxed">
              {error}
            </p>
          )}

          <form onSubmit={handlePasswordLogin} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.16em] text-[#8E8E98]">
                Admin Mobile Number *
              </label>
              <div className="relative">
                <Phone className="h-4 w-4 text-[#C8A97E] absolute left-3 top-3.5" />
                <input
                  type="tel"
                  required
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="9803722777"
                  className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] focus:border-[#C8A97E] pl-10 pr-3.5 text-sm rounded-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.16em] text-[#8E8E98]">
                Password *
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-[#C8A97E] absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] focus:border-[#C8A97E] pl-10 pr-3.5 text-sm rounded-sm focus:outline-none"
                />
              </div>
            </div>

            <Button type="submit" variant="champagne" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>Sign In to Admin Portal</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
