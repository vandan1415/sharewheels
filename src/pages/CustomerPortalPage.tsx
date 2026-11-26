import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  CreditCard,
  FileText,
  Heart,
  HelpCircle,
  LayoutDashboard,
  ShieldCheck,
  Star,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatBookingDateTime, formatBookingDuration, type RentalMode } from '@/lib/pricing';
import { formatINR } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type CustomerTab =
  | 'overview'
  | 'bookings'
  | 'saved'
  | 'payments'
  | 'agreements'
  | 'inspections'
  | 'reviews'
  | 'notifications'
  | 'support'
  | 'profile';

const TABS: { id: CustomerTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'bookings', label: 'My Bookings', icon: Calendar },
  { id: 'saved', label: 'Saved Vehicles', icon: Heart },
  { id: 'payments', label: 'Payments & Deposits', icon: CreditCard },
  { id: 'agreements', label: 'Rental Agreements', icon: FileText },
  { id: 'inspections', label: 'Inspections', icon: ShieldCheck },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'support', label: 'Support', icon: HelpCircle },
  { id: 'profile', label: 'Profile & Verification', icon: UserCheck },
];

export function CustomerPortalPage({ initialTab = 'overview' }: { initialTab?: CustomerTab }) {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<CustomerTab>(initialTab);
  const [bookings, setBookings] = useState<any[]>([]);
  const [saved, setSaved] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [simStatus, setSimStatus] = useState('');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!user || !supabase) return;
    supabase
      .from('bookings')
      .select('*, vehicles(name, slug, location)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setBookings(data ?? []));

    supabase
      .from('favourites')
      .select('*, vehicles(slug, name, location, price_per_day_paise)')
      .eq('user_id', user.id)
      .then(({ data }) => setSaved(data ?? []));

    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setNotifications(data ?? []));

    supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setTickets(data ?? []));
  }, [user]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0A0A0B] pt-28 px-6 text-xs text-[#8E8E98]">
        Checking customer session...
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSimulatedDigiLocker = async () => {
    if (!supabase) return;
    await supabase
      .from('profiles')
      .update({
        verification_status: 'Simulated DigiLocker Verified',
        dl_verification_status: 'Simulated DigiLocker Verified',
      })
      .eq('id', user.id);
    await refreshProfile();
    setSimStatus('Simulated DigiLocker identity & DL verification updated for prototype demo.');
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !ticketSubject.trim() || !ticketMessage.trim()) return;
    const { data } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject: ticketSubject,
        message: ticketMessage,
      })
      .select('*')
      .single();
    if (data) setTickets((prev) => [data, ...prev]);
    setTicketSubject('');
    setTicketMessage('');
  };

  return (
    <main className="min-h-screen bg-[#0A0A0B] pt-24 pb-24">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="border-b border-[#2A2A30] pb-6 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#C8A97E]">
              Customer Account · SHAREWHEELS India
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-[#F4F1EA]">
              {profile?.full_name || user.email}
            </h1>
          </div>
          <Badge variant="champagne">
            ID & DL: {profile?.verification_status || 'Pending'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3 space-y-1 border-r border-[#2A2A30] pr-4">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs uppercase tracking-[0.14em] rounded-sm transition-colors cursor-pointer ${
                    activeTab === t.id
                      ? 'bg-[#1A1A1F] text-[#C8A97E]'
                      : 'text-[#8E8E98] hover:text-[#F4F1EA]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </aside>

          <section className="lg:col-span-9 space-y-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 border border-[#2A2A30] divide-y sm:divide-y-0 sm:divide-x divide-[#2A2A30] bg-[#111114]">
                  <div className="p-6">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">Total Bookings</p>
                    <p className="mt-2 font-display text-3xl text-[#F4F1EA]">{bookings.length}</p>
                  </div>
                  <div className="p-6">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">Saved Vehicles</p>
                    <p className="mt-2 font-display text-3xl text-[#F4F1EA]">{saved.length}</p>
                  </div>
                  <div className="p-6">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">Verification</p>
                    <p className="mt-2 font-display text-lg text-[#C8A97E]">
                      {profile?.verification_status || 'Pending'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link to="/explore"><Button variant="primary">Explore Fleet</Button></Link>
                  <Link to="/ai-assistant"><Button variant="outline">Ask AI Concierge</Button></Link>
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="space-y-4">
                <h2 className="font-display text-xl text-[#F4F1EA]">My Bookings & History</h2>
                {bookings.length === 0 ? (
                  <p className="text-xs text-[#8E8E98] border border-[#2A2A30] p-6 bg-[#111114]">
                    No bookings yet. Select a vehicle in Explore to submit a simulated request.
                  </p>
                ) : (
                  <div className="divide-y divide-[#2A2A30] border border-[#2A2A30] bg-[#111114]">
                    {bookings.map((b) => {
                      const totalINR = Math.round(Number(b.rental_total_paise ?? 0) / 100);
                      const advanceINR = Math.round(Number(b.advance_paid_paise ?? 0) / 100);
                      const balanceINR = Math.round(Number(b.balance_due_paise ?? 0) / 100);
                      const mode: RentalMode = b.rental_mode === 'HOURLY' ? 'HOURLY' : 'DAILY';
                      const units = Math.max(1, Number(b.billable_units ?? 1));
                      const rateINR = Math.round(Number(b.applied_rate_paise ?? 0) / 100);
                      return (
                        <div key={b.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-display text-base text-[#F4F1EA]">{b.vehicles?.name}</p>
                              <span className="border border-[#C8A97E]/40 bg-[#C8A97E]/10 px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-[0.12em] text-[#C8A97E]">
                                {mode} · {formatBookingDuration(mode, units)}
                              </span>
                            </div>
                            <p className="text-xs text-[#8E8E98]">
                              {formatBookingDateTime(b.start_at)} → {formatBookingDateTime(b.end_at)} · Status:{' '}
                              <span className="uppercase text-[#C8A97E]">{b.status}</span>
                            </p>
                            {rateINR > 0 && (
                              <p className="text-[11px] text-[#8E8E98]">
                                Applied Rate: {formatINR(rateINR)} / {mode === 'HOURLY' ? 'hr' : 'day'}
                              </p>
                            )}
                            {b.razorpay_payment_id && (
                              <p className="text-[11px] text-emerald-300">
                                Razorpay Paid: {formatINR(advanceINR)} · Balance Due: {formatINR(balanceINR)} · ID: {b.razorpay_payment_id}
                              </p>
                            )}
                          </div>
                          <div className="sm:text-right space-y-0.5">
                            <span className="text-sm font-medium text-[#C8A97E] block">
                              {formatINR(totalINR)}
                            </span>
                            <span className="text-[11px] uppercase tracking-[0.12em] text-[#8E8E98]">
                              {b.payment_status === 'advance_50_paid' ? '50% Advance Paid' : b.payment_status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="space-y-4">
                <h2 className="font-display text-xl text-[#F4F1EA]">Saved Vehicles</h2>
                {saved.length === 0 ? (
                  <p className="text-xs text-[#8E8E98] border border-[#2A2A30] p-6 bg-[#111114]">
                    No saved vehicles yet. Click the heart icon on any vehicle in Explore.
                  </p>
                ) : (
                  <div className="divide-y divide-[#2A2A30] border border-[#2A2A30] bg-[#111114]">
                    {saved.map((item) => (
                      <Link
                        key={item.id}
                        to={`/vehicles/${item.vehicles?.slug}`}
                        className="p-4 flex items-center justify-between hover:bg-[#1A1A1F]"
                      >
                        <div>
                          <p className="text-sm text-[#F4F1EA]">{item.vehicles?.name}</p>
                          <p className="text-xs text-[#8E8E98]">{item.vehicles?.location}</p>
                        </div>
                        <span className="text-xs text-[#C8A97E]">
                          {formatINR(Math.round((item.vehicles?.price_per_day_paise ?? 0) / 100))}/day
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="border border-[#2A2A30] bg-[#111114] p-6 space-y-4">
                <h2 className="font-display text-xl text-[#F4F1EA]">Payments & Razorpay Receipts</h2>
                {bookings.length === 0 ? (
                  <p className="text-xs text-[#8E8E98]">
                    No bookings or advance payments recorded yet.
                  </p>
                ) : (
                  <div className="divide-y divide-[#2A2A30] border border-[#2A2A30] bg-[#0A0A0B]">
                    {bookings.map((b) => (
                      <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div>
                          <p className="text-sm font-medium text-[#F4F1EA]">{b.vehicles?.name}</p>
                          <p className="text-[#8E8E98]">
                            {b.razorpay_payment_id
                              ? `Razorpay Payment ID: ${b.razorpay_payment_id}`
                              : `Order ID: ${b.razorpay_order_id || 'Pending'}`}
                          </p>
                        </div>
                        <div className="sm:text-right">
                          <p className="text-[#C8A97E] font-medium">
                            Advance Paid: {formatINR(Math.round(Number(b.advance_paid_paise ?? 0) / 100))}
                          </p>
                          <p className="text-[#8E8E98]">
                            Balance Due: {formatINR(Math.round(Number(b.balance_due_paise ?? 0) / 100))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(activeTab === 'agreements' || activeTab === 'inspections' || activeTab === 'reviews') && (
              <div className="border border-[#2A2A30] bg-[#111114] p-6 space-y-3">
                <h2 className="font-display text-xl text-[#F4F1EA] capitalize">{activeTab}</h2>
                <p className="text-xs text-[#8E8E98] leading-relaxed">
                  {bookings.length > 0
                    ? `Active records for ${bookings.length} customer booking(s) are linked to your account. Digital rental agreements, pickup/return inspections, and post-trip reviews execute per booking lifecycle.`
                    : 'No completed or active trips yet. Book a vehicle on any listing page to populate agreement and inspection records.'}
                </p>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-3">
                <h2 className="font-display text-xl text-[#F4F1EA]">Notifications</h2>
                <div className="divide-y divide-[#2A2A30] border border-[#2A2A30] bg-[#111114]">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-4 space-y-1">
                      <p className="text-xs font-medium text-[#F4F1EA]">{n.title}</p>
                      <p className="text-xs text-[#8E8E98]">{n.body}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="p-6 text-xs text-[#8E8E98]">No notifications.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="space-y-6">
                <h2 className="font-display text-xl text-[#F4F1EA]">Customer Support</h2>
                <form onSubmit={handleSubmitTicket} className="border border-[#2A2A30] bg-[#111114] p-5 space-y-4">
                  <Input
                    placeholder="Subject"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    required
                  />
                  <textarea
                    rows={3}
                    placeholder="Describe your issue..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    required
                    className="w-full rounded-sm border border-[#2A2A30] bg-[#0A0A0B] p-3 text-xs text-[#F4F1EA]"
                  />
                  <Button type="submit" variant="champagne">Submit Support Ticket</Button>
                </form>

                <div className="divide-y divide-[#2A2A30] border border-[#2A2A30] bg-[#111114]">
                  {tickets.map((t) => (
                    <div key={t.id} className="p-4 flex justify-between text-xs">
                      <div>
                        <p className="text-[#F4F1EA] font-medium">{t.subject}</p>
                        <p className="text-[#8E8E98] mt-0.5">{t.message}</p>
                      </div>
                      <Badge variant="outline">{t.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="border border-[#2A2A30] bg-[#111114] p-6 space-y-5">
                <h2 className="font-display text-xl text-[#F4F1EA]">Profile & Simulated DigiLocker Verification</h2>
                <p className="text-xs text-[#8E8E98]">
                  Prototype Disclosure: Official DigiLocker verification requires institutional API
                  approval. Triggering the check below updates your customer profile status to{' '}
                  <strong>Simulated DigiLocker Verified</strong> in Supabase.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-y border-[#2A2A30] py-4">
                  <div>
                    <p className="text-[#8E8E98]">Identity Status</p>
                    <p className="text-[#C8A97E] font-medium mt-1">{profile?.verification_status}</p>
                  </div>
                  <div>
                    <p className="text-[#8E8E98]">Driving Licence Status</p>
                    <p className="text-[#C8A97E] font-medium mt-1">{profile?.dl_verification_status}</p>
                  </div>
                </div>
                <Button variant="champagne" onClick={handleSimulatedDigiLocker}>
                  Run Simulated DigiLocker Check
                </Button>
                {simStatus && <p className="text-xs text-[#C8A97E]">{simStatus}</p>}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
