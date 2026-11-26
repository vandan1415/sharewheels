import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ensureOwnerProfileExists } from '@/lib/owner';
import { Button } from '@/components/ui/button';

export function OwnerLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || loading) return;
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInErr || !data.user) {
        setError(signInErr?.message || 'Unable to sign in with these credentials.');
        return;
      }

      // Ensure owner role and owner profile baseline exist cleanly (never sets verified status)
      await ensureOwnerProfileExists({
        id: data.user.id,
        email: data.user.email || email.trim(),
        fullLegalName: (data.user.user_metadata?.full_name as string) || '',
      });

      const { data: existingProfile } = await supabase
        .from('owner_profiles')
        .select('id, full_legal_name, pan_number_masked, verification_status')
        .eq('id', data.user.id)
        .maybeSingle();

      if (
        !existingProfile ||
        (!existingProfile.full_legal_name && !existingProfile.pan_number_masked)
      ) {
        navigate('/owner/register');
        return;
      }

      navigate('/owner/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F4F1EA] flex flex-col">
      <header className="border-b border-[#2A2A30]">
        <div className="mx-auto max-w-[1320px] h-16 px-6 lg:px-10 flex items-center justify-between">
          <Link to="/owner" className="flex items-center gap-2.5">
            <span className="font-display text-sm sm:text-base font-semibold tracking-[0.22em] text-[#F4F1EA]">
              SHAREWHEELS
            </span>
            <span className="border border-[#C8A97E]/40 bg-[#C8A97E]/10 px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-[0.18em] text-[#C8A97E]">
              Owner Portal
            </span>
          </Link>
          <Link
            to="/owner"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-[#8E8E98] hover:text-[#F4F1EA]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Owner Overview
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full border border-[#2A2A30] bg-[#111114] p-8 rounded-sm space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#C8A97E]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Owner Access</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#F4F1EA]">
              Already an Owner? Log In
            </h1>
            <p className="text-xs text-[#8E8E98] leading-relaxed">
              Manage your verification status, vehicle submissions, rental pricing, and bookings.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.16em] text-[#8E8E98]">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@example.com"
                className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] focus:border-[#C8A97E] px-3.5 text-sm text-[#F4F1EA] rounded-sm focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-[0.16em] text-[#8E8E98]">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full h-11 bg-[#0A0A0B] border border-[#2A2A30] focus:border-[#C8A97E] px-3.5 text-sm text-[#F4F1EA] rounded-sm focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-xs text-red-300 border border-red-500/40 bg-red-950/20 px-3 py-2 rounded-sm">
                {error}
              </p>
            )}

            <Button type="submit" variant="champagne" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>Sign In to Owner Portal</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="border-t border-[#2A2A30] pt-4 text-xs text-[#8E8E98] flex items-center justify-between">
            <span>New vehicle owner?</span>
            <Link to="/owner/register" className="text-[#C8A97E] hover:underline">
              Create Owner Account →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
