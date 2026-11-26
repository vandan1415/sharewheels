import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Gauge,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import {
  useVehiclePassport,
  type DocumentHealthStatus,
} from '@/hooks/useVehiclePassport';
import { useLocationContext } from '@/context/LocationContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VehicleImage } from '@/components/ui/VehicleImage';

const SOURCE_LABELS: Record<string, string> = {
  owner_submission: 'Owner Submitted',
  inspection_pickup: 'Pickup Inspection',
  inspection_return: 'Return Inspection',
  service_record: 'Service Log',
  admin_verified: 'Admin Verified',
  document_reviewed: 'Document Reviewed',
  independently_verified: 'Independently Verified',
  platform_recorded: 'Platform Recorded',
};

function formatDate(iso?: string | null) {
  if (!iso) return 'Not available';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatKm(km?: number | null) {
  if (km == null || !Number.isFinite(km)) return 'Not available';
  return `${km.toLocaleString('en-IN')} km`;
}

function docStatusTone(status: DocumentHealthStatus): string {
  switch (status) {
    case 'Valid':
      return 'border-emerald-500/40 bg-emerald-950/25 text-emerald-300';
    case 'Expiring soon':
      return 'border-amber-500/40 bg-amber-950/25 text-amber-300';
    case 'Expired':
      return 'border-red-500/40 bg-red-950/25 text-red-300';
    case 'Pending verification':
      return 'border-[#C8A97E]/40 bg-[#C8A97E]/10 text-[#C8A97E]';
    default:
      return 'border-[#2A2A30] bg-[#16161A] text-[#8E8E98]';
  }
}

export function VehiclePassportPage() {
  const { vehicleId } = useParams();
  const { selectedCity, openLocationModal } = useLocationContext();
  const { data: cityVehicles = [], isLoading: loadingList } = useVehicles();
  const targetSlug = vehicleId || cityVehicles[0]?.id;
  const { data: passport, isLoading: loadingPassport } = useVehiclePassport(targetSlug);

  const selectedListVehicle =
    cityVehicles.find((v) => v.id === targetSlug) || cityVehicles[0] || null;

  const activeIndicators = passport
    ? [
        passport.trust_indicators.owner_identity_verified && 'Owner Identity Verified',
        passport.trust_indicators.vehicle_documents_verified && 'Vehicle Documents Verified',
        passport.trust_indicators.vehicle_inspected && 'Vehicle Inspected',
        passport.trust_indicators.odometer_updated && 'Odometer Updated',
        passport.trust_indicators.maintenance_history_available && 'Maintenance History Available',
      ].filter((x): x is string => Boolean(x))
    : [];

  return (
    <main className="min-h-screen bg-[#0A0A0B] pt-24 pb-24">
      <div className="mx-auto max-w-[1160px] px-6 lg:px-10 space-y-12">
        {/* Editorial Masthead */}
        <header className="space-y-4 border-b border-[#2A2A30] pb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#C8A97E]">
              Vehicle Passport · Digital Dossier {selectedCity ? `· ${selectedCity.name}` : ''}
            </p>
            {passport?.vehicle.slug && (
              <Link to={`/vehicles/${passport.vehicle.slug}`}>
                <Button variant="champagne" size="sm">
                  <span>View &amp; Book Vehicle</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-[-0.02em] text-[#F4F1EA]">
            {passport
              ? passport.vehicle.name
              : selectedListVehicle
                ? selectedListVehicle.name
                : 'Select a City or Vehicle'}
          </h1>

          <p className="max-w-2xl text-xs leading-relaxed text-[#8E8E98]">
            Transparent record of specifications, odometer readings, condition reports, inspections,
            maintenance logs, and document validity status. Private registration numbers, original
            document files, and owner contact details are never disclosed publicly.
          </p>

          {!selectedCity && !vehicleId && (
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={openLocationModal}>
                Select City to Browse Passports
              </Button>
            </div>
          )}
        </header>

        {/* Vehicle Switcher Strip */}
        {cityVehicles.length > 0 && (
          <section className="space-y-2.5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#8E8E98]">
              Select a Vehicle in {selectedCity?.name || 'City'} ({cityVehicles.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {cityVehicles.slice(0, 12).map((v) => (
                <Link key={v.id} to={`/passport/${v.id}`}>
                  <Button
                    variant={targetSlug === v.id ? 'champagne' : 'outline'}
                    size="sm"
                  >
                    {v.brand} {v.model}
                  </Button>
                </Link>
              ))}
            </div>
          </section>
        )}

        {(loadingPassport || (loadingList && !targetSlug)) && (
          <div className="border-t border-b border-[#2A2A30] py-12 text-xs uppercase tracking-[0.16em] text-[#8E8E98]">
            Loading verified passport dossier...
          </div>
        )}

        {!loadingPassport && targetSlug && !passport && (
          <div className="border border-[#2A2A30] bg-[#111114] p-8 rounded-sm space-y-2">
            <h2 className="font-display text-xl text-[#F4F1EA]">Passport Not Found</h2>
            <p className="text-xs text-[#8E8E98]">
              This vehicle is unavailable, unapproved, or has been archived. Select an active listing
              above or explore available vehicles.
            </p>
            <div className="pt-3">
              <Link to="/explore">
                <Button variant="outline" size="sm">Explore Fleet</Button>
              </Link>
            </div>
          </div>
        )}

        {passport && (
          <div className="space-y-12">
            {/* Hero Identity + Genuine Verification Indicators */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-b border-[#2A2A30] pb-10">
              <div className="lg:col-span-5 aspect-[16/10] bg-[#111114] border border-[#2A2A30] rounded-sm overflow-hidden">
                <VehicleImage
                  src={passport.vehicle.image_url || selectedListVehicle?.image || ''}
                  alt={passport.vehicle.name}
                  label={`${passport.vehicle.brand} ${passport.vehicle.model}`}
                  className="h-full w-full"
                />
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 border-b border-[#2A2A30] pb-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#8E8E98]">
                      Total Distance Travelled
                    </p>
                    <p className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-[#F4F1EA] tabular-nums">
                      {formatKm(passport.usage.total_distance_km)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#8E8E98]">
                      Updated: {formatDate(passport.usage.last_updated_at)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#8E8E98]">
                      Masked Registration
                    </p>
                    <p className="mt-1 font-display text-lg font-medium text-[#F4F1EA] tracking-wider">
                      {passport.vehicle.masked_registration_number || 'Not available'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#8E8E98]">
                      {passport.vehicle.registration_city || passport.vehicle.location}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[#8E8E98]">
                      Overall Condition
                    </p>
                    <p className="mt-1 font-display text-lg font-medium text-[#C8A97E]">
                      {passport.condition.overall_condition || 'Not available'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#8E8E98]">
                      {passport.condition.inspection_count} inspection
                      {passport.condition.inspection_count === 1 ? '' : 's'} on file
                    </p>
                  </div>
                </div>

                {/* Genuine Trust Indicators */}
                <div className="space-y-2.5">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#C8A97E] flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verification Indicators
                  </p>
                  {activeIndicators.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {activeIndicators.map((label) => (
                        <span
                          key={label}
                          className="inline-flex items-center gap-1.5 border border-[#C8A97E]/40 bg-[#C8A97E]/10 px-3 py-1.5 rounded-sm text-[11px] text-[#F4F1EA]"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#C8A97E]" />
                          {label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#8E8E98]">
                      No third-party verification badges are displayed until supporting documents,
                      inspections, or service records are verified for this listing.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* A. Basic Vehicle Information */}
            <section className="space-y-5 border-b border-[#2A2A30] pb-10">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-xl font-medium text-[#F4F1EA] flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-[#C8A97E]" />
                  <span>Vehicle Specifications &amp; Identity</span>
                </h2>
                <span className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  {passport.vehicle.category}
                </span>
              </div>

              <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-5 pt-2">
                {[
                  ['Manufacturer', passport.vehicle.brand],
                  ['Model', passport.vehicle.model],
                  ['Variant', passport.vehicle.variant || 'Not available'],
                  ['Manufacturing Year', String(passport.vehicle.year)],
                  [
                    'Registration Year',
                    passport.vehicle.registration_year
                      ? String(passport.vehicle.registration_year)
                      : 'Not available',
                  ],
                  [
                    'Registration No.',
                    passport.vehicle.masked_registration_number || 'Not available',
                  ],
                  ['Category', passport.vehicle.category],
                  ['Exterior Colour', passport.vehicle.colour || 'Not available'],
                  ['Fuel Type', passport.vehicle.fuel_type],
                  ['Transmission', passport.vehicle.transmission],
                  ['Seating Capacity', `${passport.vehicle.seats} Seats`],
                  ['Engine Capacity', passport.vehicle.engine_capacity || 'Not available'],
                  [
                    'Horsepower / Torque',
                    passport.vehicle.horsepower || passport.vehicle.torque
                      ? [passport.vehicle.horsepower, passport.vehicle.torque]
                          .filter(Boolean)
                          .join(' · ')
                      : 'Not available',
                  ],
                  ['Drivetrain', passport.vehicle.drivetrain || 'Not available'],
                  ['Efficiency / Range', passport.vehicle.mileage_or_range || 'Not available'],
                  ['Operating City', passport.vehicle.location],
                ].map(([label, val]) => (
                  <div key={label} className="border-t border-[#2A2A30]/70 pt-3">
                    <dt className="text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      {label}
                    </dt>
                    <dd
                      className={`mt-1 text-sm ${
                        val === 'Not available' ? 'text-[#8E8E98]' : 'text-[#F4F1EA]'
                      }`}
                    >
                      {val}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* B. Vehicle Usage & Odometer History */}
            <section className="space-y-5 border-b border-[#2A2A30] pb-10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl font-medium text-[#F4F1EA] flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-[#C8A97E]" />
                  <span>Vehicle Usage &amp; Odometer History</span>
                </h2>
                <span className="text-xs text-[#8E8E98]">
                  Current Reading:{' '}
                  <strong className="text-[#F4F1EA]">
                    {formatKm(passport.usage.total_distance_km)}
                  </strong>
                </span>
              </div>

              {passport.usage.odometer_logs.length > 0 ? (
                <div className="overflow-x-auto border border-[#2A2A30] rounded-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#111114] border-b border-[#2A2A30] text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      <tr>
                        <th className="px-4 py-3 font-medium">Recorded Date</th>
                        <th className="px-4 py-3 font-medium">Odometer Reading</th>
                        <th className="px-4 py-3 font-medium">Source</th>
                        <th className="px-4 py-3 font-medium">Verification</th>
                        <th className="px-4 py-3 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2A30]/70">
                      {passport.usage.odometer_logs.map((log) => (
                        <tr key={log.id} className="hover:bg-[#111114]/60">
                          <td className="px-4 py-3 text-[#E8E4DC] whitespace-nowrap">
                            {formatDate(log.recorded_at)}
                          </td>
                          <td className="px-4 py-3 font-medium text-[#F4F1EA] tabular-nums whitespace-nowrap">
                            {formatKm(log.odometer_km)}
                          </td>
                          <td className="px-4 py-3 text-[#8E8E98]">
                            {SOURCE_LABELS[log.source_type] || log.source_type}
                          </td>
                          <td className="px-4 py-3">
                            {log.verified ? (
                              <span className="text-emerald-300">Verified</span>
                            ) : (
                              <span className="text-[#8E8E98]">Recorded</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[#8E8E98]">{log.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-[#8E8E98]">
                  {passport.usage.total_distance_km != null
                    ? `Current baseline odometer is recorded at ${formatKm(passport.usage.total_distance_km)}. Detailed trip-by-trip odometer logs will appear here after rental handovers and service updates.`
                    : 'No odometer readings have been logged for this vehicle yet.'}
                </p>
              )}
            </section>

            {/* C. Vehicle Condition */}
            <section className="space-y-5 border-b border-[#2A2A30] pb-10">
              <h2 className="font-display text-xl font-medium text-[#F4F1EA] flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-[#C8A97E]" />
                <span>Vehicle Condition Assessment</span>
              </h2>

              <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
                {[
                  ['Overall', passport.condition.overall_condition || 'Not available'],
                  ['Exterior', passport.condition.exterior_condition || 'Not available'],
                  ['Interior', passport.condition.interior_condition || 'Not available'],
                  ['Tyres', passport.condition.tyre_condition || 'Not available'],
                  ['Inspections', String(passport.condition.inspection_count)],
                  [
                    'Last Inspection',
                    passport.condition.last_inspection_at
                      ? formatDate(passport.condition.last_inspection_at)
                      : 'Not available',
                  ],
                ].map(([label, val]) => (
                  <div key={label} className="border-t border-[#2A2A30]/70 pt-3">
                    <dt className="text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                      {label}
                    </dt>
                    <dd
                      className={`mt-1 text-sm ${
                        val === 'Not available' ? 'text-[#8E8E98]' : 'text-[#F4F1EA]'
                      }`}
                    >
                      {val}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="border border-[#2A2A30] bg-[#111114]/60 p-4 rounded-sm">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  Documented Damage / Observations
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-[#E8E4DC]">
                  {passport.condition.documented_damage ||
                    (passport.condition.inspection_count > 0
                      ? 'No pre-existing damage recorded across documented inspections.'
                      : 'No damage disclosure or condition inspection report has been recorded yet.')}
                </p>
              </div>
            </section>

            {/* D. Chronological Maintenance & Service History */}
            <section className="space-y-5 border-b border-[#2A2A30] pb-10">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-xl font-medium text-[#F4F1EA] flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-[#C8A97E]" />
                  <span>Maintenance &amp; Service History</span>
                </h2>
                <span className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  {passport.service_records.length} Record
                  {passport.service_records.length === 1 ? '' : 's'}
                </span>
              </div>

              {passport.service_records.length > 0 ? (
                <ol className="relative border-l border-[#2A2A30] ml-2 space-y-7">
                  {passport.service_records.map((rec) => (
                    <li key={rec.id} className="pl-6 relative">
                      <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#C8A97E]" />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#8E8E98]">
                          <span className="inline-flex items-center gap-1 text-[#F4F1EA]">
                            <Calendar className="h-3 w-3 text-[#C8A97E]" />
                            {formatDate(rec.service_date)}
                          </span>
                          {rec.odometer_km != null && (
                            <span className="tabular-nums">· {formatKm(rec.odometer_km)}</span>
                          )}
                          {rec.service_centre && <span>· {rec.service_centre}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{rec.service_type}</Badge>
                          {rec.is_verified && (
                            <Badge variant="outline" className="border-emerald-500/40 text-emerald-300">
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-[#F4F1EA]">{rec.maintenance_performed}</p>
                      {(rec.next_recommended_service_date ||
                        rec.next_recommended_odometer_km != null) && (
                        <p className="mt-1.5 text-[11px] text-[#C8A97E]">
                          Next Recommended Service:{' '}
                          {[
                            rec.next_recommended_service_date
                              ? formatDate(rec.next_recommended_service_date)
                              : null,
                            rec.next_recommended_odometer_km != null
                              ? formatKm(rec.next_recommended_odometer_km)
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' or ')}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-[#8E8E98]">
                  No maintenance or service records have been logged for this vehicle yet.
                </p>
              )}
            </section>

            {/* E. Documentation Status (Strict Privacy: Statuses Only) */}
            <section className="space-y-5 border-b border-[#2A2A30] pb-10">
              <div className="space-y-1">
                <h2 className="font-display text-xl font-medium text-[#F4F1EA]">
                  Documentation Compliance Status
                </h2>
                <p className="text-xs text-[#8E8E98]">
                  Verification summary only. Original certificate files, policy numbers, and owner
                  details remain strictly private.
                </p>
              </div>

              <div className="divide-y divide-[#2A2A30] border border-[#2A2A30] rounded-sm">
                {passport.document_statuses.map((doc) => (
                  <div
                    key={doc.document_type}
                    className="flex flex-wrap items-center justify-between gap-4 px-4 py-3.5 text-xs"
                  >
                    <div>
                      <p className="font-medium text-[#F4F1EA]">{doc.label}</p>
                      {doc.expiry_month_year && (
                        <p className="text-[11px] text-[#8E8E98] mt-0.5">
                          Valid through: {doc.expiry_month_year}
                        </p>
                      )}
                    </div>
                    <span
                      className={`border px-2.5 py-1 rounded-sm text-[10px] uppercase tracking-[0.14em] ${docStatusTone(doc.status)}`}
                    >
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* F. Vehicle Inspection History */}
            <section className="space-y-5 border-b border-[#2A2A30] pb-10">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-xl font-medium text-[#F4F1EA] flex items-center gap-2">
                  <Camera className="h-4 w-4 text-[#C8A97E]" />
                  <span>Inspection History</span>
                </h2>
                <span className="text-[11px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  {passport.inspections.length} Completed
                </span>
              </div>

              {passport.inspections.length > 0 ? (
                <div className="space-y-4">
                  {passport.inspections.map((insp) => (
                    <div
                      key={insp.id}
                      className="border border-[#2A2A30] bg-[#111114]/60 p-5 rounded-sm space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="uppercase">
                            {insp.phase === 'pickup'
                              ? 'Before Rental'
                              : insp.phase === 'return'
                                ? 'After Rental'
                                : insp.phase}
                          </Badge>
                          <span className="text-[#8E8E98]">{formatDate(insp.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-[#E8E4DC]">
                          {insp.odometer_km != null && (
                            <span className="tabular-nums">{formatKm(insp.odometer_km)}</span>
                          )}
                          {insp.fuel_level && <span>Fuel: {insp.fuel_level}</span>}
                        </div>
                      </div>
                      {(insp.damage_observations || insp.notes) && (
                        <p className="text-xs text-[#E8E4DC] leading-relaxed">
                          {insp.damage_observations || insp.notes}
                        </p>
                      )}
                      {insp.photo_urls && insp.photo_urls.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          {insp.photo_urls.map((url, idx) => (
                            <img
                              key={`${insp.id}-${idx}`}
                              src={url}
                              alt={`Inspection ${idx + 1}`}
                              className="h-24 w-full object-cover rounded-sm border border-[#2A2A30]"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#8E8E98]">
                  No completed pre-rental or post-rental inspections have been recorded yet.
                </p>
              )}
            </section>

            {/* G. Provenance Events (if present) */}
            {passport.passport_events.length > 0 && (
              <section className="space-y-5">
                <h2 className="font-display text-xl font-medium text-[#F4F1EA]">
                  Platform Provenance Log
                </h2>
                <ol className="relative border-l border-[#2A2A30] ml-2 space-y-6">
                  {passport.passport_events.map((ev) => (
                    <li key={ev.id} className="pl-6 relative">
                      <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#C8A97E]" />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs text-[#8E8E98]">{ev.event_date}</span>
                        <Badge variant="outline">
                          {SOURCE_LABELS[ev.source_label] || ev.source_label}
                        </Badge>
                      </div>
                      <p className="mt-1 font-display text-base font-medium text-[#F4F1EA]">
                        {ev.title}
                      </p>
                      <p className="mt-1 text-xs text-[#8E8E98]">{ev.summary}</p>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
