import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  Calendar,
  Car,
  IndianRupee,
  LifeBuoy,
  Lock,
  PlusCircle,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import {
  useOwnerAccount,
  useOwnerBookings,
  useOwnerNotifications,
  useOwnerPayouts,
  useOwnerVehicles,
} from '@/hooks/useOwner';
import { OWNER_STATUS_META, VEHICLE_STATUS_META } from '@/lib/owner';
import { formatINR } from '@/lib/utils';
import { OwnerAuthGate } from '@/components/owner/OwnerAuthGate';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { OnboardingProgressTracker } from '@/components/owner/OnboardingProgressTracker';
import { Button } from '@/components/ui/button';

export function OwnerDashboardPage() {
  const { data: ownerData } = useOwnerAccount();
  const { data: vehicles = [] } = useOwnerVehicles();
  const { data: bookings = [] } = useOwnerBookings();
  const { data: payouts = [] } = useOwnerPayouts();
  const { data: notifications = [], markAllRead } = useOwnerNotifications();

  const profile = ownerData?.profile ?? null;
  const documents = ownerData?.documents ?? [];
  const status = profile?.verification_status ?? 'INCOMPLETE';
  const statusMeta = OWNER_STATUS_META[status];
  const isVerified = status === 'VERIFIED';

  const nowMs = Date.now();
  const activeBookings = bookings.filter((b) => b.status === 'active');
  const upcomingBookings = bookings.filter(
    (b) =>
      (b.status === 'pending' || b.status === 'accepted' || b.status === 'confirmed') &&
      new Date(b.end_at).getTime() >= nowMs
  );
  const totalNetPayoutINR = Math.round(
    payouts.reduce((sum, p) => sum + Number(p.net_payout_paise), 0) / 100
  );
  const publishedCount = vehicles.filter(
    (v) => v.listing_status === 'APPROVED' && v.available && !v.is_paused
  ).length;

  return (
    <OwnerAuthGate>
      <OwnerLayout
        title="Owner Dashboard"
        subtitle="Overview of your verification status, vehicle fleet, bookings, and transparent payouts."
        action={
          isVerified ? (
            <Link to="/owner/vehicles/add">
              <Button variant="champagne">
                <PlusCircle className="h-4 w-4" />
                Add a Vehicle
              </Button>
            </Link>
          ) : (
            <Link to="/owner/verification">
              <Button variant="outline">
                <ShieldCheck className="h-4 w-4 text-[#C8A97E]" />
                View Verification
              </Button>
            </Link>
          )
        }
      >
        <OnboardingProgressTracker
          profile={profile}
          documents={documents}
          vehicles={vehicles}
        />

        {/* Real Metrics Grid (no fabricated stats) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/owner/verification"
            className="border border-[#2A2A30] bg-[#111114] hover:border-[#C8A97E]/60 p-5 rounded-sm space-y-2 transition-colors"
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-[#8E8E98]">
              <span>Verification Status</span>
              <ShieldCheck className="h-4 w-4 text-[#C8A97E]" />
            </div>
            <p className="font-display text-lg font-medium text-[#F4F1EA]">
              {statusMeta.label}
            </p>
            <p className="text-xs text-[#8E8E98]">
              {documents.length} private KYC document{documents.length === 1 ? '' : 's'} on file
            </p>
          </Link>

          <Link
            to="/owner/vehicles"
            className="border border-[#2A2A30] bg-[#111114] hover:border-[#C8A97E]/60 p-5 rounded-sm space-y-2 transition-colors"
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-[#8E8E98]">
              <span>My Vehicles</span>
              <Car className="h-4 w-4 text-[#C8A97E]" />
            </div>
            <p className="font-display text-2xl font-semibold text-[#F4F1EA]">
              {vehicles.length}
            </p>
            <p className="text-xs text-[#8E8E98]">
              {publishedCount} published live · {vehicles.length - publishedCount} draft / in review
            </p>
          </Link>

          <Link
            to="/owner/bookings"
            className="border border-[#2A2A30] bg-[#111114] hover:border-[#C8A97E]/60 p-5 rounded-sm space-y-2 transition-colors"
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-[#8E8E98]">
              <span>Active & Upcoming Trips</span>
              <Calendar className="h-4 w-4 text-[#C8A97E]" />
            </div>
            <p className="font-display text-2xl font-semibold text-[#F4F1EA]">
              {activeBookings.length} active · {upcomingBookings.length} upcoming
            </p>
            <p className="text-xs text-[#8E8E98]">
              {bookings.length === 0 ? 'No customer bookings yet' : `${bookings.length} total bookings`}
            </p>
          </Link>

          <Link
            to="/owner/earnings"
            className="border border-[#2A2A30] bg-[#111114] hover:border-[#C8A97E]/60 p-5 rounded-sm space-y-2 transition-colors"
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-[#8E8E98]">
              <span>Owner Earnings</span>
              <IndianRupee className="h-4 w-4 text-[#C8A97E]" />
            </div>
            <p className="font-display text-2xl font-semibold text-[#C8A97E]">
              {formatINR(totalNetPayoutINR)}
            </p>
            <p className="text-xs text-[#8E8E98]">
              {payouts.length === 0
                ? 'No payout records yet'
                : `${payouts.length} payout statement${payouts.length === 1 ? '' : 's'}`}
            </p>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* My Vehicles + Empty State */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-medium text-[#F4F1EA]">
                Fleet Submissions
              </h2>
              <Link
                to="/owner/vehicles"
                className="text-xs uppercase tracking-[0.14em] text-[#C8A97E] hover:underline"
              >
                Manage All →
              </Link>
            </div>

            {vehicles.length === 0 ? (
              <div className="border border-[#2A2A30] bg-[#111114] p-7 rounded-sm space-y-4">
                <p className="font-display text-lg text-[#F4F1EA]">
                  {isVerified
                    ? 'Ready to Submit Your First Vehicle'
                    : 'Vehicle Submission Unlocks Upon Verification'}
                </p>
                <p className="text-sm text-[#8E8E98] leading-relaxed">
                  {isVerified
                    ? 'Your identity is verified. Add vehicle specs, RC, insurance, PUC, 9 photographs, condition disclosure, and daily tariff.'
                    : 'Unverified owners cannot publish vehicles. Complete owner KYC verification first so renters and SHAREWHEELS can verify custody.'}
                </p>
                {isVerified ? (
                  <Link to="/owner/vehicles/add">
                    <Button variant="champagne">
                      Add a Vehicle
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/owner/verification">
                    <Button variant="outline">
                      <Lock className="h-3.5 w-3.5 text-[#C8A97E]" />
                      Check Verification Progress
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-[#2A2A30] border border-[#2A2A30] bg-[#111114] rounded-sm">
                {vehicles.slice(0, 4).map((v) => {
                  const vMeta = VEHICLE_STATUS_META[v.listing_status];
                  return (
                    <div
                      key={v.id}
                      className="p-4 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-medium text-sm text-[#F4F1EA]">
                          {v.name} ({v.year})
                        </p>
                        <p className="text-xs text-[#8E8E98]">
                          {v.location} · {formatINR(Math.round(v.price_per_day_paise / 100))}/day
                          {v.is_paused ? ' · Paused' : ''}
                        </p>
                      </div>
                      <span
                        className={`border px-2.5 py-0.5 rounded-sm text-[11px] uppercase tracking-[0.12em] ${vMeta.badgeClass}`}
                      >
                        {vMeta.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Portal Navigation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Link
                to="/owner/bookings"
                className="border border-[#2A2A30] bg-[#111114] hover:border-[#C8A97E]/60 p-4 rounded-sm flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-medium text-[#F4F1EA]">Upcoming & Active Bookings</p>
                  <p className="text-[11px] text-[#8E8E98] mt-0.5">
                    {bookings.length === 0 ? 'Empty state ready' : `${bookings.length} recorded`}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#C8A97E]" />
              </Link>
              <Link
                to="/owner/earnings"
                className="border border-[#2A2A30] bg-[#111114] hover:border-[#C8A97E]/60 p-4 rounded-sm flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-medium text-[#F4F1EA]">Payment History & Payouts</p>
                  <p className="text-[11px] text-[#8E8E98] mt-0.5">
                    Transparent commission statements
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-[#C8A97E]" />
              </Link>
            </div>
          </div>

          {/* Notifications + Profile & Support */}
          <div className="lg:col-span-5 space-y-5">
            <div className="border border-[#2A2A30] bg-[#111114] p-5 rounded-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#C8A97E]">
                  <Bell className="h-3.5 w-3.5" />
                  Notifications
                </span>
                {notifications.some((n: any) => !n.is_read) && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-[11px] text-[#8E8E98] hover:text-[#F4F1EA] cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="text-xs text-[#8E8E98]">No notifications yet.</p>
              ) : (
                <div className="space-y-3 max-h-[260px] overflow-y-auto">
                  {notifications.slice(0, 6).map((n: any) => (
                    <div
                      key={n.id}
                      className={`border p-3 rounded-sm text-xs ${
                        n.is_read
                          ? 'border-[#2A2A30] bg-[#0A0A0B] text-[#8E8E98]'
                          : 'border-[#C8A97E]/40 bg-[#C8A97E]/5 text-[#E8E4DC]'
                      }`}
                    >
                      <p className="font-medium text-[#F4F1EA]">{n.title}</p>
                      <p className="mt-1 leading-relaxed">{n.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-[#2A2A30] bg-[#111114] p-5 rounded-sm space-y-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[#C8A97E]">
                Account & Support
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/owner/profile">
                  <Button variant="outline" size="sm">
                    <UserCog className="h-3.5 w-3.5" />
                    Profile Settings
                  </Button>
                </Link>
                <Link to="/owner/profile#support">
                  <Button variant="outline" size="sm">
                    <LifeBuoy className="h-3.5 w-3.5" />
                    Owner Support
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </OwnerLayout>
    </OwnerAuthGate>
  );
}
