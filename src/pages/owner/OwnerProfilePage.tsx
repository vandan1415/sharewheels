import { useEffect, useState, type FormEvent } from 'react';
import { LifeBuoy, Loader2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useOwnerAccount, useOwnerNotifications } from '@/hooks/useOwner';
import { isValidIndianMobile, isValidPinCode, normalizeIndianMobile } from '@/lib/owner';
import { OwnerAuthGate } from '@/components/owner/OwnerAuthGate';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { Button } from '@/components/ui/button';

export function OwnerProfilePage() {
  const { user } = useAuth();
  const { data: ownerData, invalidate } = useOwnerAccount();
  const { data: notifications = [], markAllRead } = useOwnerNotifications();

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pinCode, setPinCode] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSent, setTicketSent] = useState(false);

  useEffect(() => {
    if (!ownerData) return;
    if (ownerData.profile) {
      setFullName(ownerData.profile.full_legal_name || '');
      setMobile(ownerData.profile.mobile_number || '');
    }
    if (ownerData.address) {
      setAddress1(ownerData.address.address_line_1 || '');
      setAddress2(ownerData.address.address_line_2 || '');
      setCity(ownerData.address.city || '');
      setStateName(ownerData.address.state || '');
      setPinCode(ownerData.address.pin_code || '');
    }
  }, [ownerData]);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || !user?.id) return;
    setSaveErr(null);
    setSaveMsg(null);

    if (!isValidIndianMobile(mobile)) {
      setSaveErr('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!isValidPinCode(pinCode)) {
      setSaveErr('Enter a valid 6-digit Indian PIN code.');
      return;
    }

    setSaving(true);
    try {
      const { error: profErr } = await supabase
        .from('owner_profiles')
        .update({
          full_legal_name: fullName.trim(),
          mobile_number: normalizeIndianMobile(mobile),
        })
        .eq('id', user.id);
      if (profErr) throw new Error(profErr.message);

      const { error: addrErr } = await supabase.from('owner_addresses').upsert(
        {
          owner_id: user.id,
          address_line_1: address1.trim(),
          address_line_2: address2.trim(),
          city: city.trim(),
          state: stateName.trim(),
          pin_code: pinCode.trim(),
        },
        { onConflict: 'owner_id' }
      );
      if (addrErr) throw new Error(addrErr.message);

      setSaveMsg('Owner profile & private residential address updated.');
      await invalidate();
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSupportSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || !user?.id) return;
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    const { error } = await supabase.from('support_tickets').insert({
      user_id: user.id,
      subject: `[Owner Portal] ${ticketSubject.trim()}`,
      message: ticketMessage.trim(),
    });
    if (!error) {
      setTicketSubject('');
      setTicketMessage('');
      setTicketSent(true);
    }
  };

  return (
    <OwnerAuthGate>
      <OwnerLayout
        title="Profile Settings & Support"
        subtitle="Manage owner contact information, private residential address, and owner support requests."
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form
            onSubmit={handleSaveProfile}
            className="lg:col-span-7 border border-[#2A2A30] bg-[#111114] p-6 rounded-sm space-y-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-medium text-[#F4F1EA]">
                Owner Details & Private Address
              </h2>
              {ownerData?.profile?.pan_number_masked && (
                <span className="text-xs text-[#8E8E98]">
                  PAN: <strong className="text-[#E8E4DC]">{ownerData.profile.pan_number_masked}</strong>
                </span>
              )}
            </div>

            {saveErr && (
              <p className="text-xs text-red-300 border border-red-500/40 bg-red-950/20 px-3 py-2 rounded-sm">
                {saveErr}
              </p>
            )}
            {saveMsg && (
              <p className="text-xs text-emerald-300 border border-emerald-500/40 bg-emerald-950/20 px-3 py-2 rounded-sm">
                {saveMsg}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  Residential Address Line 1 (Private)
                </label>
                <input
                  type="text"
                  required
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                  className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={address2}
                  onChange={(e) => setAddress2(e.target.value)}
                  className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  State
                </label>
                <input
                  type="text"
                  required
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  PIN Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-sm rounded-sm focus:border-[#C8A97E] focus:outline-none"
                />
              </div>
            </div>

            <Button type="submit" variant="champagne" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save Profile Changes</span>
            </Button>
          </form>

          <div className="lg:col-span-5 space-y-6">
            <div
              id="support"
              className="border border-[#2A2A30] bg-[#111114] p-6 rounded-sm space-y-4"
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#C8A97E]">
                <LifeBuoy className="h-4 w-4" />
                <span>Owner Support Ticket</span>
              </div>
              <form onSubmit={handleSupportSubmit} className="space-y-3">
                <input
                  type="text"
                  required
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Subject (e.g. Verification or RC query)"
                  className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-xs rounded-sm focus:border-[#C8A97E] focus:outline-none"
                />
                <textarea
                  required
                  rows={3}
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Describe how SHAREWHEELS can assist..."
                  className="w-full bg-[#0A0A0B] border border-[#2A2A30] p-3 text-xs rounded-sm focus:border-[#C8A97E] focus:outline-none"
                />
                {ticketSent && (
                  <p className="text-xs text-emerald-300">
                    Support ticket submitted to your account history.
                  </p>
                )}
                <Button type="submit" variant="outline" size="sm">
                  Send Support Request
                </Button>
              </form>
            </div>

            <div className="border border-[#2A2A30] bg-[#111114] p-6 rounded-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-medium text-[#F4F1EA]">
                  Recent Notifications
                </h2>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-[11px] text-[#C8A97E] hover:underline cursor-pointer"
                  >
                    Mark read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="text-xs text-[#8E8E98]">No notifications yet.</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {notifications.slice(0, 5).map((n: any) => (
                    <div key={n.id} className="border border-[#2A2A30] bg-[#0A0A0B] p-3 text-xs rounded-sm">
                      <p className="font-medium text-[#F4F1EA]">{n.title}</p>
                      <p className="text-[#8E8E98] mt-0.5">{n.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </OwnerLayout>
    </OwnerAuthGate>
  );
}
