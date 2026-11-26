import { Link, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useVehicles, useVehiclesBySlugs } from '@/hooks/useVehicles';
import { useLocationContext } from '@/context/LocationContext';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { VehicleImage } from '@/components/ui/VehicleImage';

export function ComparePage() {
  const [searchParams] = useSearchParams();
  const { selectedCity } = useLocationContext();
  const { data: cityVehicles = [] } = useVehicles();
  const initialSlugs = (searchParams.get('slugs') || '')
    .split(',')
    .filter(Boolean)
    .slice(0, 3);

  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(initialSlugs);
  const activeSlugs =
    selectedSlugs.length > 0
      ? selectedSlugs
      : cityVehicles.slice(0, 3).map((v) => v.id);

  const { data: slugVehicles = [] } = useVehiclesBySlugs(activeSlugs);
  const compared = activeSlugs
    .map((slug) => slugVehicles.find((v) => v.id === slug) ?? cityVehicles.find((v) => v.id === slug))
    .filter((v): v is NonNullable<typeof v> => Boolean(v));

  return (
    <main className="min-h-screen bg-[#0A0A0B] pt-24 pb-24">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 space-y-10">
        <div className="border-b border-[#2A2A30] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#C8A97E]">
              {selectedCity ? `${selectedCity.name} · ` : ''}Specification Matrix
            </p>
            <h1 className="mt-2 font-display text-3xl sm:text-5xl font-semibold text-[#F4F1EA]">
              Compare Vehicles
            </h1>
          </div>
          <Link to="/explore">
            <Button variant="outline">Browse Fleet</Button>
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {cityVehicles.map((v) => {
            const active = activeSlugs.includes(v.id);
            return (
              <button
                key={v.id}
                type="button"
                onClick={() =>
                  setSelectedSlugs((prev) => {
                    const base = prev.length ? prev : activeSlugs;
                    if (base.includes(v.id)) return base.filter((s) => s !== v.id);
                    return base.length < 3 ? [...base, v.id] : [...base.slice(1), v.id];
                  })
                }
                className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] border rounded-sm cursor-pointer ${
                  active
                    ? 'border-[#C8A97E] bg-[#C8A97E] text-[#0A0A0B] font-medium'
                    : 'border-[#2A2A30] bg-[#111114] text-[#8E8E98] hover:text-[#F4F1EA]'
                }`}
              >
                {v.brand} {v.model}
              </button>
            );
          })}
        </div>

        {compared.length > 0 && (
          <div className="overflow-x-auto border border-[#2A2A30] bg-[#111114]">
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="border-b border-[#2A2A30]">
                  <th className="p-5 text-[11px] uppercase tracking-[0.14em] text-[#8E8E98] w-48">
                    Attribute
                  </th>
                  {compared.map((v) => (
                    <th key={v.id} className="p-5 border-l border-[#2A2A30] align-top">
                      <div className="aspect-[16/10] bg-[#0A0A0B] mb-3 overflow-hidden">
                        <VehicleImage
                          src={v.image}
                          alt={v.name}
                          label={`${v.brand} ${v.model}`}
                          className="h-full w-full"
                        />
                      </div>
                      <Link to={`/vehicles/${v.id}`} className="font-display text-base text-[#F4F1EA] hover:text-[#C8A97E]">
                        {v.name}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A30] text-xs">
                <tr>
                  <td className="p-4 text-[#8E8E98]">Daily Rate</td>
                  {compared.map((v) => (
                    <td key={v.id} className="p-4 border-l border-[#2A2A30] font-semibold text-[#C8A97E]">
                      {formatINR(v.pricePerDay)} / day
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 text-[#8E8E98]">Location</td>
                  {compared.map((v) => (
                    <td key={v.id} className="p-4 border-l border-[#2A2A30] text-[#F4F1EA]">
                      {v.location}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 text-[#8E8E98]">Transmission / Fuel</td>
                  {compared.map((v) => (
                    <td key={v.id} className="p-4 border-l border-[#2A2A30] text-[#F4F1EA]">
                      {v.transmission} · {v.fuelType}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 text-[#8E8E98]">Seating</td>
                  {compared.map((v) => (
                    <td key={v.id} className="p-4 border-l border-[#2A2A30] text-[#F4F1EA]">
                      {v.seats} Seats
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 text-[#8E8E98]">Drivetrain / Clearance</td>
                  {compared.map((v) => (
                    <td key={v.id} className="p-4 border-l border-[#2A2A30] text-[#F4F1EA]">
                      {v.drivetrain}
                      {v.offRoadSpecs ? ` · ${v.offRoadSpecs.groundClearanceMm}mm` : ''}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 text-[#8E8E98]">Efficiency / Range</td>
                  {compared.map((v) => (
                    <td key={v.id} className="p-4 border-l border-[#2A2A30] text-[#F4F1EA]">
                      {v.mileageOrRange || '—'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
