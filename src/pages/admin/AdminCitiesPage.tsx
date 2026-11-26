import { useState, type FormEvent } from 'react';
import { Loader2, MapPin, Plus } from 'lucide-react';
import { useAdminCities, useAdminSession } from '@/hooks/useAdmin';
import { callAdminApi } from '@/lib/admin';
import { AdminAuthGate } from '@/components/admin/AdminAuthGate';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';

export function AdminCitiesPage() {
  const { data: adminSession } = useAdminSession();
  const { data: cities = [], isLoading, invalidate } = useAdminCities(Boolean(adminSession));

  const [cityName, setCityName] = useState('');
  const [cityState, setCityState] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const handleAddCity = async (e: FormEvent) => {
    e.preventDefault();
    if (!cityName.trim() || !cityState.trim()) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      await callAdminApi('manage_city', {
        cityAction: 'create',
        name: cityName.trim(),
        state: cityState.trim(),
      });
      setCityName('');
      setCityState('');
      setMsg('New market city configured in Supabase.');
      await invalidate();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Unable to add city.');
    } finally {
      setBusy(false);
    }
  };

  const toggleCity = async (locationId: string, currentActive: boolean) => {
    setErr(null);
    setMsg(null);
    try {
      await callAdminApi('manage_city', {
        cityAction: 'toggle',
        locationId,
        isActive: !currentActive,
      });
      setMsg(`Market visibility updated and audit-logged.`);
      await invalidate();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Unable to update city.');
    }
  };

  return (
    <AdminAuthGate>
      <AdminLayout
        title="City Market Management"
        subtitle="Manage the 8 active Indian launch markets and enable expansion cities."
      >
        {err && (
          <div className="border border-red-500/40 bg-red-950/20 px-4 py-3 text-xs text-red-200 rounded-sm">
            {err}
          </div>
        )}
        {msg && (
          <div className="border border-emerald-500/40 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-200 rounded-sm">
            {msg}
          </div>
        )}

        <form
          onSubmit={handleAddCity}
          className="border border-[#2A2A30] bg-[#111114] p-5 rounded-sm flex flex-wrap items-end gap-3 max-w-2xl"
        >
          <div className="space-y-1 flex-1 min-w-[180px]">
            <label className="text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
              Expansion City Name
            </label>
            <input
              type="text"
              required
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              placeholder="e.g. Ahmedabad"
              className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-xs rounded-sm"
            />
          </div>
          <div className="space-y-1 flex-1 min-w-[180px]">
            <label className="text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
              State / Region
            </label>
            <input
              type="text"
              required
              value={cityState}
              onChange={(e) => setCityState(e.target.value)}
              placeholder="e.g. Gujarat"
              className="w-full h-10 bg-[#0A0A0B] border border-[#2A2A30] px-3 text-xs rounded-sm"
            />
          </div>
          <Button type="submit" variant="champagne" size="sm" disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            <span>Add Market</span>
          </Button>
        </form>

        {isLoading ? (
          <p className="text-sm text-[#8E8E98]">Loading cities...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cities.map((c: any) => (
              <div
                key={c.id}
                className="border border-[#2A2A30] bg-[#111114] p-5 rounded-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <MapPin className="h-4 w-4 text-[#C8A97E]" />
                    <span
                      className={`border px-2 py-0.5 rounded-sm text-[10px] uppercase ${
                        c.is_active
                          ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                          : 'border-[#2A2A30] bg-[#0A0A0B] text-[#8E8E98]'
                      }`}
                    >
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h2 className="font-display text-lg font-medium text-[#F4F1EA]">{c.name}</h2>
                  <p className="text-xs text-[#8E8E98]">{c.state}</p>
                  <p className="text-xs text-[#C8A97E]">{c.vehicleCount} vehicles</p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleCity(c.id, c.is_active)}
                >
                  {c.is_active ? 'Disable Market' : 'Enable Market'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </AdminLayout>
    </AdminAuthGate>
  );
}
