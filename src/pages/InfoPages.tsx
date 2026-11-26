import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { EarningsCalculatorSection } from '@/components/home/EarningsCalculatorSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { TrustSafetySection } from '@/components/home/TrustSafetySection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0B] pt-20">
      <HowItWorksSection />
      <section className="border-t border-[#2A2A30] bg-[#0A0A0B] py-20">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 space-y-8">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#F4F1EA]">
            From Booking Request to Return Settlement
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed text-[#8E8E98]">
            <div className="border border-[#2A2A30] bg-[#111114] p-6 space-y-2">
              <p className="text-[#C8A97E] uppercase tracking-[0.14em]">1. Request & Hold</p>
              <p>Select pickup and return dates, review itemized daily pricing plus refundable deposit, and submit a booking request.</p>
            </div>
            <div className="border border-[#2A2A30] bg-[#111114] p-6 space-y-2">
              <p className="text-[#C8A97E] uppercase tracking-[0.14em]">2. Agreement & Handover</p>
              <p>Accept digital rental terms and log timestamped pickup photographs before driving off.</p>
            </div>
            <div className="border border-[#2A2A30] bg-[#111114] p-6 space-y-2">
              <p className="text-[#C8A97E] uppercase tracking-[0.14em]">3. Return & Deposit</p>
              <p>Complete return inspection photographs, settle simulated deposit release, and review your trip.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export function ListVehiclePage() {
  return (
    <main className="min-h-screen bg-[#0A0A0B] pt-24 pb-20">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 mb-12 space-y-4">
        <Badge variant="champagne">Separate Owner Portal · Coming Soon</Badge>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#F4F1EA]">
          List Your Vehicle on SHAREWHEELS
        </h1>
        <p className="text-sm text-[#8E8E98] max-w-2xl leading-relaxed">
          To keep customer discovery and owner fleet operations cleanly separated, the dedicated
          SHAREWHEELS Owner Portal is being launched as a separate connected application sharing
          this same Supabase database and authentication infrastructure.
        </p>
      </div>
      <EarningsCalculatorSection />
    </main>
  );
}

export function TrustSafetyPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0B] pt-20">
      <TrustSafetySection />
      <section className="border-t border-[#2A2A30] bg-[#111114] py-20">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed text-[#8E8E98]">
          <div className="border border-[#2A2A30] bg-[#0A0A0B] p-6 space-y-2">
            <h3 className="font-display text-base text-[#F4F1EA]">Simulated DigiLocker Notice</h3>
            <p>Identity and driving licence verification separates Simulated DigiLocker checks from Manually Uploaded and Admin Reviewed records — never claiming live government verification without official API access.</p>
          </div>
          <div className="border border-[#2A2A30] bg-[#0A0A0B] p-6 space-y-2">
            <h3 className="font-display text-base text-[#F4F1EA]">Off-Road & Insurance Limitations</h3>
            <p>Standard motor insurance does not automatically cover off-road trails, river crossings, or mountain passes. Trail eligibility requires owner consent and explicit coverage terms.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0B] pt-28 pb-24">
      <div className="mx-auto max-w-[900px] px-6 space-y-6">
        <Badge variant="prototype">Innovation in Society Academic Project</Badge>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#F4F1EA]">
          About SHAREWHEELS
        </h1>
        <p className="text-sm sm:text-base leading-relaxed text-[#E8E4DC]/85">
          SHAREWHEELS is an Indian peer-to-peer vehicle marketplace prototype focused on turning
          idle private cars, EVs, two-wheelers, and expedition-capable 4x4s in
          Chandigarh–Tricity into accountable community mobility.
        </p>
        <Link to="/explore" className="inline-block pt-4">
          <Button variant="primary">Explore Demonstration Fleet</Button>
        </Link>
      </div>
    </main>
  );
}

export function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <main className="min-h-screen bg-[#0A0A0B] pt-28 pb-24">
      <div className="mx-auto max-w-[680px] px-6 space-y-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#C8A97E]">
          Chandigarh–Tricity Prototype Desk
        </p>
        <h1 className="font-display text-4xl font-semibold text-[#F4F1EA]">Contact & Support</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="space-y-4 border border-[#2A2A30] bg-[#111114] p-6 rounded-sm"
        >
          <Input placeholder="Full Name" required />
          <Input type="email" placeholder="Email Address" required />
          <textarea
            rows={4}
            required
            placeholder="How can we help?"
            className="w-full rounded-sm border border-[#2A2A30] bg-[#0A0A0B] p-3 text-sm text-[#F4F1EA] placeholder:text-[#8E8E98] focus:border-[#C8A97E] focus:outline-none"
          />
          <Button type="submit" variant="champagne">
            {sent ? 'Prototype Inquiry Logged' : 'Submit Inquiry'}
          </Button>
        </form>
      </div>
    </main>
  );
}

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setNotice(null);

    if (!supabase) {
      setErrorMsg('Supabase client not configured.');
      return;
    }

    setBusy(true);
    if (mode === 'register') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      setBusy(false);
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      if (data.session) {
        navigate('/dashboard');
      } else {
        setNotice('Account created. Check your email for confirmation or sign in.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      navigate('/dashboard');
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0B] pt-28 pb-24">
      <div className="mx-auto max-w-[460px] px-6 space-y-6">
        <Badge variant="champagne">Customer Account · Supabase Auth</Badge>
        <h1 className="font-display text-3xl font-semibold text-[#F4F1EA]">
          {mode === 'login' ? 'Customer Sign In' : 'Create Customer Account'}
        </h1>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 border border-[#2A2A30] bg-[#111114] p-6 rounded-sm"
        >
          {mode === 'register' && (
            <Input
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          )}
          <Input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}
          {notice && <p className="text-xs text-[#C8A97E]">{notice}</p>}
          <Button type="submit" variant="primary" className="w-full" disabled={busy}>
            {busy ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
          <p className="text-xs text-[#8E8E98] text-center pt-1">
            {mode === 'login' ? (
              <>
                New customer?{' '}
                <Link to="/register" className="text-[#C8A97E] hover:underline">
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already registered?{' '}
                <Link to="/login" className="text-[#C8A97E] hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </form>
      </div>
    </main>
  );
}
