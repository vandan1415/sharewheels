import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  IndianRupee,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCommissionConfig } from '@/hooks/useOwner';
import { Button } from '@/components/ui/button';

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Verified Identity & Custody',
    desc: 'Every owner and driver completes identity verification and documented handover inspections before keys change hands.',
  },
  {
    icon: Lock,
    title: 'Private Document Encryption',
    desc: 'PAN records, government IDs, RC copies, and insurance papers stay in private buckets accessible strictly via short-lived signed URLs.',
  },
  {
    icon: FileCheck2,
    title: 'Moderated Publication',
    desc: 'Listings remain private until your owner profile, mandatory vehicle documents, and 9-angle photographs pass verification.',
  },
  {
    icon: IndianRupee,
    title: 'Transparent Fee Disclosure',
    desc: 'Set your own daily tariff and preview exact marketplace commission, applicable taxes, and net owner payout upfront.',
  },
];

export function OwnerLandingPage() {
  const { user } = useAuth();
  const { data: commissionConfig } = useCommissionConfig();
  const commissionPct = commissionConfig
    ? (commissionConfig.commission_bps / 100).toFixed(0)
    : null;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F4F1EA]">
      <header className="border-b border-[#2A2A30]">
        <div className="mx-auto max-w-[1320px] h-16 px-6 lg:px-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="font-display text-sm sm:text-base font-semibold tracking-[0.22em] text-[#F4F1EA]">
              SHAREWHEELS
            </span>
            <span className="border border-[#C8A97E]/40 bg-[#C8A97E]/10 px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-[0.18em] text-[#C8A97E]">
              Owner Portal
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[#8E8E98] hover:text-[#F4F1EA]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Customer Site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-6 lg:px-10 py-16 sm:py-24 space-y-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7 space-y-6">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#C8A97E]">
              SHAREWHEELS Fleet Partner Program
            </p>
            <h1 className="font-display text-4xl sm:text-6xl font-semibold tracking-[-0.03em] leading-[1.06] text-[#F4F1EA]">
              Put Your Vehicle on a Verified Mobility Network.
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-[#8E8E98] max-w-2xl">
              List your well-maintained hatchback, SUV, EV, or luxury sedan across 8 Indian
              cities with documented inspection trails, identity verification, and transparent
              {commissionPct ? ` ${commissionPct}%` : ''} commission disclosure before you publish.
            </p>

            {user ? (
              <div className="flex flex-wrap gap-3 pt-2">
                <Link to="/owner/dashboard">
                  <Button variant="champagne" size="lg">
                    Open Owner Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/owner/vehicles/add">
                  <Button variant="primary" size="lg">
                    Submit a Vehicle
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 pt-2">
                <Link to="/owner/register">
                  <Button variant="champagne" size="lg">
                    Create Owner Account
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/owner/login">
                  <Button variant="primary" size="lg">
                    Already an Owner? Log In
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 border border-[#2A2A30] bg-[#111114] p-7 rounded-sm space-y-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#C8A97E]">
              How Owner Onboarding Works
            </p>
            <ol className="space-y-4 text-sm">
              {[
                'Register with legal details, residential address, and KYC documents.',
                'Complete owner identity review (PAN + Photo ID + Live Selfie).',
                'Submit vehicle details, RC, commercial-ready motor insurance, PUC & 9 photos.',
                'Once approved, manage availability, daily rates, and bookings from one portal.',
              ].map((stepText, idx) => (
                <li key={idx} className="flex items-start gap-3 text-[#E8E4DC]">
                  <span className="font-mono text-xs text-[#C8A97E] mt-0.5">
                    0{idx + 1}
                  </span>
                  <span className="leading-relaxed">{stepText}</span>
                </li>
              ))}
            </ol>
            <div className="border-t border-[#2A2A30] pt-4 flex items-center gap-2 text-xs text-[#8E8E98]">
              <CheckCircle2 className="h-4 w-4 text-[#C8A97E] shrink-0" />
              <span>Progress saves automatically as drafts if you pause midway.</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#2A2A30] border border-[#2A2A30]">
          {PILLARS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="bg-[#0A0A0B] p-7 space-y-3">
                <Icon className="h-5 w-5 text-[#C8A97E]" />
                <h2 className="font-display text-lg font-medium text-[#F4F1EA]">
                  {item.title}
                </h2>
                <p className="text-xs leading-relaxed text-[#8E8E98]">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
