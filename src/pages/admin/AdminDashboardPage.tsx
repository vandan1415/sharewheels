import { Link } from 'react-router-dom';
import { AlertTriangle, CheckSquare, ShieldCheck, UserCheck } from 'lucide-react';
import { useAdminDashboardStats, useAdminSession } from '@/hooks/useAdmin';
import { formatINR } from '@/lib/utils';
import { AdminAuthGate } from '@/components/admin/AdminAuthGate';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { HorizontalBarChartCard, MonthlyTrendCard } from '@/components/admin/AdminCharts';
import { Button } from '@/components/ui/button';

export function AdminDashboardPage() {
  const { data: adminSession } = useAdminSession();
  const { data: stats, isLoading } = useAdminDashboardStats(Boolean(adminSession));

  const k = stats?.kpis;
  const kpiCards = k
    ? [
        { label: 'Total Customers', value: k.totalCustomers, to: '/admin/customers' },
        { label: 'Total Owners', value: k.totalOwners, to: '/admin/owners' },
        {
          label: 'Pending Owner Verifications',
          value: k.pendingOwners,
          to: '/admin/owners/pending',
          highlight: k.pendingOwners > 0,
        },
        { label: 'Verified Owners', value: k.verifiedOwners, to: '/admin/owners' },
        {
          label: 'Pending Vehicle Approvals',
          value: k.pendingVehicles,
          to: '/admin/vehicles/pending',
          highlight: k.pendingVehicles > 0,
        },
        { label: 'Approved Vehicles', value: k.approvedVehicles, to: '/admin/vehicles' },
        { label: 'Suspended / Paused Listings', value: k.suspendedListings, to: '/admin/vehicles' },
        { label: 'Active Bookings', value: k.activeBookings, to: '/admin/bookings' },
        { label: 'Completed Bookings', value: k.completedBookings, to: '/admin/bookings' },
        {
          label: 'Overdue Bookings',
          value: k.overdueBookings,
          to: '/admin/bookings',
          alert: k.overdueBookings > 0,
        },
        {
          label: 'Total Booking Value',
          value: formatINR(k.totalBookingValueINR),
          to: '/admin/payments',
        },
        {
          label: `Platform Commission (${k.estimatedCommissionRatePct}%)`,
          value: formatINR(k.platformCommissionINR),
          to: '/admin/payments',
        },
        {
          label: 'Pending Owner Payouts',
          value: formatINR(k.pendingPayoutsINR),
          to: '/admin/payouts',
        },
        {
          label: 'Open Disputes & Cases',
          value: k.openDisputes,
          to: '/admin/disputes',
          highlight: k.openDisputes > 0,
        },
        {
          label: 'Security Incidents',
          value: k.securityIncidents,
          to: '/admin/incidents',
          alert: k.securityIncidents > 0,
        },
      ]
    : [];

  return (
    <AdminAuthGate>
      <AdminLayout
        title="Executive Marketplace Control"
        subtitle="Live database metrics across fleet moderation, bookings, SHIELD safety, and financials."
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/owners/pending">
              <Button variant="outline" size="sm">
                <UserCheck className="h-3.5 w-3.5 text-[#C8A97E]" />
                Owner Queue ({k?.pendingOwners ?? 0})
              </Button>
            </Link>
            <Link to="/admin/vehicles/pending">
              <Button variant="champagne" size="sm">
                <CheckSquare className="h-3.5 w-3.5" />
                Vehicle Queue ({k?.pendingVehicles ?? 0})
              </Button>
            </Link>
          </div>
        }
      >
        {isLoading || !stats ? (
          <p className="text-sm text-[#8E8E98]">Loading live Supabase dashboard metrics...</p>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {kpiCards.map((card) => (
                <Link
                  key={card.label}
                  to={card.to}
                  className={`border p-4 rounded-sm space-y-2 transition-colors ${
                    card.alert
                      ? 'border-red-500/40 bg-red-950/15 hover:border-red-400'
                      : card.highlight
                        ? 'border-[#C8A97E]/50 bg-[#C8A97E]/10 hover:border-[#C8A97E]'
                        : 'border-[#2A2A30] bg-[#111114] hover:border-[#C8A97E]/50'
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#8E8E98] leading-snug">
                    {card.label}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-2xl font-semibold text-[#F4F1EA]">
                      {card.value}
                    </span>
                    {card.alert ? (
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    ) : card.highlight ? (
                      <ShieldCheck className="h-4 w-4 text-[#C8A97E]" />
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MonthlyTrendCard
                title="Revenue Trends (By Month)"
                subtitle="Total non-cancelled booking value recorded in PostgreSQL"
                data={stats.charts.revenueTrends}
                unit="INR"
              />
              <MonthlyTrendCard
                title="Bookings Over Time"
                subtitle="Customer rental booking count per month"
                data={stats.charts.bookingsOverTime}
              />
              <HorizontalBarChartCard
                title="City-Wise Inventory"
                subtitle="Active non-archived listings across India markets"
                data={stats.charts.cityInventory}
              />
              <HorizontalBarChartCard
                title="Vehicle Category Distribution"
                subtitle="Fleet spread across vehicle classes"
                data={stats.charts.categoryDistribution}
              />
            </div>

            <MonthlyTrendCard
              title="Owner Registrations Over Time"
              subtitle="Verified and pending owner onboarding cohort volume"
              data={stats.charts.ownerRegistrations}
            />
          </div>
        )}
      </AdminLayout>
    </AdminAuthGate>
  );
}
