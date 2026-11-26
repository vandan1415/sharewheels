import { useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertOctagon,
  ArrowUpRight,
  Bell,
  Calendar,
  Car,
  CheckSquare,
  FileWarning,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Scale,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAdminSession } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';

const NAV_GROUPS = [
  {
    heading: 'Overview',
    items: [{ label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard }],
  },
  {
    heading: 'Moderation Queues',
    items: [
      { label: 'Pending Owners', to: '/admin/owners/pending', icon: UserCheck },
      { label: 'All Owners', to: '/admin/owners', icon: Users },
      { label: 'Pending Vehicles', to: '/admin/vehicles/pending', icon: CheckSquare },
      { label: 'All Vehicles', to: '/admin/vehicles', icon: Car },
    ],
  },
  {
    heading: 'Operations & Finance',
    items: [
      { label: 'Customers', to: '/admin/customers', icon: Users },
      { label: 'Bookings', to: '/admin/bookings', icon: Calendar },
      { label: 'Payments & Config', to: '/admin/payments', icon: IndianRupee },
      { label: 'Owner Payouts', to: '/admin/payouts', icon: Wallet },
    ],
  },
  {
    heading: 'SHIELD & Governance',
    items: [
      { label: 'Incidents', to: '/admin/incidents', icon: AlertOctagon },
      { label: 'Disputes', to: '/admin/disputes', icon: Scale },
      { label: 'Cities', to: '/admin/cities', icon: MapPin },
      { label: 'Notifications', to: '/admin/notifications', icon: Bell },
      { label: 'Audit Logs', to: '/admin/audit-logs', icon: Activity },
      { label: 'Settings & Roles', to: '/admin/settings', icon: Settings },
    ],
  },
];

export function AdminLayout({
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
  const { signOut } = useAuth();
  const { data: adminSession } = useAdminSession();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F4F1EA] flex flex-col">
      <header className="sticky top-0 z-40 border-b border-[#2A2A30] bg-[#0A0A0B]/95 backdrop-blur-md">
        <div className="mx-auto max-w-[1520px] h-16 px-5 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden text-[#E8E4DC] hover:text-[#C8A97E]"
              aria-label="Toggle Admin Navigation"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/admin/dashboard" className="flex items-center gap-2.5">
              <span className="font-display text-sm sm:text-base font-semibold tracking-[0.22em] text-[#F4F1EA]">
                SHAREWHEELS
              </span>
              <span className="border border-[#C8A97E]/50 bg-[#C8A97E]/15 px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-[0.18em] text-[#C8A97E]">
                Admin Control
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 border border-emerald-500/40 bg-emerald-950/30 px-2.5 py-1 rounded-sm text-[10px] uppercase tracking-[0.14em] text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              {adminSession?.role?.toUpperCase() || 'ADMIN'}
              {adminSession?.phone ? ` · ${adminSession.phone}` : ''}
            </span>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.14em] text-[#8E8E98] hover:text-[#F4F1EA]"
            >
              <span className="hidden sm:inline">Public Site</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 mx-auto w-full max-w-[1520px] flex">
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-[#2A2A30] bg-[#0D0D0F] p-5 justify-between space-y-6">
          <nav className="space-y-6">
            {NAV_GROUPS.map((grp) => (
              <div key={grp.heading} className="space-y-1.5">
                <p className="px-3 text-[10px] uppercase tracking-[0.18em] text-[#8E8E98]">
                  {grp.heading}
                </p>
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/admin/owners' || item.to === '/admin/vehicles'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-sm text-xs tracking-[0.06em] transition-colors ${
                          isActive
                            ? 'bg-[#1A1A1F] text-[#C8A97E] border border-[#2A2A30]'
                            : 'text-[#8E8E98] hover:text-[#F4F1EA] hover:bg-[#111114]'
                        }`
                      }
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="border-t border-[#2A2A30] pt-4 text-[11px] text-[#8E8E98] space-y-1">
            <p className="inline-flex items-center gap-1.5 text-[#E8E4DC]">
              <FileWarning className="h-3.5 w-3.5 text-[#C8A97E]" />
              Immutable Audit Trail Active
            </p>
            <p>All moderation decisions and KYC views are logged.</p>
          </div>
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 top-16 z-30 lg:hidden bg-[#0A0A0B]/95 p-6 overflow-y-auto space-y-6">
            {NAV_GROUPS.map((grp) => (
              <div key={grp.heading} className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#8E8E98]">
                  {grp.heading}
                </p>
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/admin/owners' || item.to === '/admin/vehicles'}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-sm text-xs ${
                          isActive
                            ? 'bg-[#1A1A1F] text-[#C8A97E] border border-[#2A2A30]'
                            : 'text-[#E8E4DC]'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        <main className="flex-1 min-w-0 px-5 sm:px-8 lg:px-10 py-8 space-y-8">
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
