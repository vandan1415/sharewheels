import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  Check,
  Copy,
  CopyPlus,
  Lock,
  Share2,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSavedJourneys, type SavedJourneyRow } from '@/hooks/useRouteCraft';
import { formatDurationMinutes } from '@/lib/routecraft';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StateNotice } from '@/components/ui/StateNotice';

export function SavedJourneysPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    data: saved = [],
    isLoading,
    duplicateJourney,
    deleteJourney,
    toggleShare,
    saveJourney,
  } = useSavedJourneys();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleRename = async (row: SavedJourneyRow) => {
    if (!titleDraft.trim()) return;
    await saveJourney({
      id: row.id,
      is_shared: row.is_shared,
      title: titleDraft.trim(),
      origin_label: row.origin_label,
      origin_lat: row.origin_lat,
      origin_lng: row.origin_lng,
      origin_place_id: row.origin_place_id,
      destination_label: row.destination_label,
      destination_lat: row.destination_lat,
      destination_lng: row.destination_lng,
      destination_place_id: row.destination_place_id,
      stops: row.stops,
      vehicle_id: row.vehicle_id,
      vehicle_slug: row.vehicle_slug,
      departure_date: row.departure_date,
      return_date: row.return_date,
      departure_time: row.departure_time,
      passengers: row.passengers,
      preferences: row.preferences,
      max_budget_inr: row.max_budget_inr,
      route_preference: row.route_preference,
      distance_km: row.distance_km,
      duration_minutes: row.duration_minutes,
      route_summary: row.route_summary,
      budget_assumptions: row.budget_assumptions,
      estimated_totals: row.estimated_totals,
    });
    setEditingId(null);
  };

  const copyShareUrl = async (row: SavedJourneyRow) => {
    if (!row.is_shared) {
      await toggleShare({ journeyId: row.id, isShared: true });
    }
    const shareUrl = `${window.location.origin}/route-planner?share=${row.share_token}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(row.id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#0A0A0B] pt-28 px-6 text-xs uppercase tracking-[0.16em] text-[#8E8E98]">
        Loading saved journeys...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#0A0A0B] pt-28 px-6 flex items-center justify-center">
        <div className="max-w-md w-full border border-[#2A2A30] bg-[#111114] p-8 rounded-sm text-center space-y-5">
          <Lock className="h-7 w-7 text-[#C8A97E] mx-auto" />
          <h1 className="font-display text-2xl font-semibold text-[#F4F1EA]">
            Sign in to Access Saved Journeys
          </h1>
          <p className="text-sm text-[#8E8E98]">
            Your private itineraries, waypoints, and budget assumptions are protected by customer-only Row Level Security.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/login">
              <Button variant="champagne">Customer Sign In</Button>
            </Link>
            <Link to="/route-planner">
              <Button variant="outline">Open Planner</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0B] pt-24 pb-24">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-10 space-y-8">
        <div className="border-b border-[#2A2A30] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#C8A97E]">
              <Bookmark className="h-3.5 w-3.5" />
              ROUTECRAFT · Customer Itineraries
            </p>
            <h1 className="font-display text-3xl sm:text-5xl font-semibold text-[#F4F1EA]">
              Saved Journeys ({saved.length})
            </h1>
          </div>
          <Link to="/route-planner">
            <Button variant="champagne">
              Plan New Journey
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <StateNotice variant="loading" title="Loading your saved journeys..." />
        ) : saved.length === 0 ? (
          <StateNotice
            variant="empty"
            icon={<Bookmark className="h-7 w-7 text-[#C8A97E] mx-auto" />}
            title="No saved road trips yet"
            description="Configure a route in ROUTECRAFT or pick a curated India journey to save routes, stops, and cost estimates to your account."
            action={
              <>
                <Link to="/route-planner"><Button variant="champagne">Open Route Planner</Button></Link>
                <Link to="/journeys"><Button variant="outline">Browse Curated Journeys</Button></Link>
              </>
            }
          />
        ) : (
          <div className="space-y-4">
            {saved.map((row) => (
              <div
                key={row.id}
                className="border border-[#2A2A30] bg-[#111114] p-6 rounded-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  {editingId === row.id ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={titleDraft}
                        onChange={(e) => setTitleDraft(e.target.value)}
                        className="h-9 bg-[#0A0A0B] border border-[#C8A97E] px-3 text-xs text-[#F4F1EA] rounded-sm flex-1"
                      />
                      <Button size="sm" variant="champagne" onClick={() => handleRename(row)}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-xl font-medium text-[#F4F1EA]">
                        {row.title}
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(row.id);
                          setTitleDraft(row.title);
                        }}
                        className="text-[11px] text-[#8E8E98] hover:text-[#C8A97E] underline cursor-pointer"
                      >
                        Rename
                      </button>
                      {row.is_shared && (
                        <span className="border border-emerald-500/40 bg-emerald-950/30 px-2 py-0.5 rounded-sm text-[10px] uppercase text-emerald-300">
                          Shared Link Active
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-[#E8E4DC]">
                    {row.origin_label} → {row.stops?.length ? `${row.stops.length} stops → ` : ''}
                    {row.destination_label}
                  </p>

                  <div className="flex flex-wrap gap-4 text-xs text-[#8E8E98]">
                    {row.distance_km && <span>{row.distance_km} km</span>}
                    {row.duration_minutes && <span>{formatDurationMinutes(row.duration_minutes)} drive</span>}
                    <span>{row.passengers} passengers</span>
                    {row.estimated_totals?.totalTripCostInr ? (
                      <span className="text-[#C8A97E]">
                        Est. Total: {formatINR(Number(row.estimated_totals.totalTripCostInr))}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Link to={`/route-planner?saved=${row.id}`}>
                    <Button size="sm" variant="champagne">
                      Open in Planner
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => duplicateJourney(row)}
                  >
                    <CopyPlus className="h-3.5 w-3.5" />
                    Duplicate
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => copyShareUrl(row)}
                  >
                    {copiedId === row.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                    ) : (
                      <Share2 className="h-3.5 w-3.5" />
                    )}
                    <span>{copiedId === row.id ? 'Copied Link' : 'Share'}</span>
                  </Button>
                  {row.is_shared && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleShare({ journeyId: row.id, isShared: false })}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Unshare
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteJourney(row.id)}
                    className="text-red-300 hover:text-red-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
