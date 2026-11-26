import { useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Car,
  Clock,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  ShieldCheck,
  UserCheck,
  UserCog,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useOwnerAccount } from '@/hooks/useOwner';
import { OWNER_STATUS_META } from '@/lib/owner';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/owner/dashboard', icon: LayoutDashboard },
  { label: 'Verification', to: '/owner/verification', icon: UserCheck },
  { label: 'My Vehicles', to: '/owner/vehicles', icon: Car },
  { label: 'Add a Vehicle', to: '/owner/vehicles/add', icon: PlusCircle },
  { label: 'Bookings', to: '/owner/bookings', icon: Calendar },
  { label: 'Earnings', to: '/owner/earnings', icon: IndianRupee },
  { label: 'Profile & Support', to: '/owner/profile', icon: UserCog },
];

export function OwnerLayout({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const { user, signOut } = useAuth();
  const { data: ownerData } = useOwnerAccount();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const profile = ownerData?.profile ?? null;
  const status = profile?.verification_status ?? 'INCOMPLETE';
  const meta = OWNER_STATUS_META[status];

  const handleSignOut = async () => {
    await signOut();
    navigate('/owner');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F4F1EA] flex flex-col">
      <header className="sticky top-0 z-40 border-b border-[#2A2A30] bg-[#0A0A0B]/95 backdrop-blur-md">
        <div className="mx-auto max-w-[1440px] h-16 px-5 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden text-[#E8E4DC] hover:text-[#C8A97E]"
              aria-label="Toggle Owner Navigation"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/owner/dashboard" className="flex items-center gap-2.5">
              <span className="font-display text-sm sm:text-base font-semibold tracking-[0.22em] text-[#F4F1EA]">
                SHAREWHEELS
              </span>
              <span className="border border-[#C8A97E]/40 bg-[#C8A97E]/10 px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-[0.18em] text-[#C8A97E]">
                Owner Portal
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/owner/verification"
              className={`hidden sm:inline-flex items-center gap-1.5 border px-2.5 py-1 rounded-sm text-[11px] uppercase tracking-[0.14em] ${meta.badgeClass}`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {meta.label}
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.14em] text-[#8E8E98] hover:text-[#F4F1EA]"
            >
              <span className="hidden sm:inline">Customer Site</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            {user && (
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 mx-auto w-full max-w-[1440px] flex">
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-[#2A2A30] bg-[#0D0D0F] p-5 justify-between">
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-xs uppercase tracking-[0.14em] transition-colors ${
                      isActive
                        ? 'bg-[#1A1A1F] text-[#C8A97E] border border-[#2A2A30]'
                        : 'text-[#8E8E98] hover:text-[#F4F1EA] hover:bg-[#111114]'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-[#2A2A30] pt-4 space-y-2 text-xs text-[#8E8E98]">
            <p className="text-[#E8E4DC] font-medium truncate">
              {profile?.full_legal_name || user?.email || 'Owner Account'}
            </p>
            <p className="text-[11px] leading-relaxed">
              Owner verification & listing moderation protect every handover.
            </p>
          </div>
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 top-16 z-30 lg:hidden bg-[#0A0A0B]/95 p-6 space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-sm text-xs uppercase tracking-[0.16em] ${
                      isActive
                        ? 'bg-[#1A1A1F] text-[#C8A97E] border border-[#2A2A30]'
                        : 'text-[#E8E4DC] border border-transparent'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}

        <main className="flex-1 min-w-0 px-5 sm:px-8 lg:px-10 py-8 sm:py-10 space-y-8">
          {profile &&
            (status === 'PENDING_VERIFICATION' ||
              status === 'UNDER_REVIEW' ||
              status === 'DOCUMENTS_SUBMITTED') && (
              <div className="border border-[#C8A97E]/40 bg-[#C8A97E]/10 px-5 py-4 rounded-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-sm text-[#F4F1EA]">
                  <Clock className="h-4 w-4 text-[#C8A97E] shrink-0" />
                  <span>Your owner profile is being reviewed.</span>
                </div>
                <Link
                  to="/owner/verification"
                  className="text-xs uppercase tracking-[0.14em] text-[#C8A97E] hover:underline"
                >
                  View Verification Status →
                </Link>
              </div>
            )}

          {profile &&
            (status === 'REJECTED' || status === 'RESUBMISSION_REQUIRED') && (
              <div className="border border-red-500/40 bg-red-950/20 px-5 py-4 rounded-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3 text-sm text-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Owner verification requires updated documents.</p>
                    {profile.rejection_reason && (
                      <p className="text-xs text-red-200/80 mt-0.5">
                        Reason: {profile.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  to="/owner/verification"
                  className="text-xs uppercase tracking-[0.14em] text-[#C8A97E] hover:underline"
                >
                  Resubmit Documents →
                </Link>
              </div>
            )}

          {(!profile || status === 'INCOMPLETE') && (
            <div className="border border-[#2A2A30] bg-[#111114] px-5 py-4 rounded-sm flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-[#E8E4DC]">
                Complete your identity verification before submitting a vehicle for listing.
              </div>
              <Link
                to="/owner/register"
                className="text-xs uppercase tracking-[0.14em] text-[#C8A97E] hover:underline"
              >
                Complete Registration →
              </Link>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#2A2A30] pb-6">
            <div>
              <h1 className="font-display text-2xl sm:text-4xl font-semibold tracking-[-0.02em] text-[#F4F1EA]">
                {title}
              </h1>
              {subtitle && <p className="text-sm text-[#8E8E98] mt-1.5">{subtitle}</p>}
            </div>
            {action}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
