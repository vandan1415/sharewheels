import { useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  GitCompare,
  Lock,
  Share2,
  Users,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import {
  PROVENANCE_META,
  type AdditionalExpensesInput,
  type TripBudgetSummary,
} from '@/lib/routecraft';
import { Button } from '@/components/ui/button';

interface BudgetBreakdownCardProps {
  tripTitle: string;
  summary: TripBudgetSummary;
  additional: AdditionalExpensesInput;
  onChangeAdditional: (next: AdditionalExpensesInput) => void;
  manualTollText: string;
  onChangeManualTollText: (val: string) => void;
  onChangePassengers: (count: number) => void;
  maxBudgetText: string;
  onChangeMaxBudgetText: (val: string) => void;
  onQuickSuggest?: (action: 'reduce_stops' | 'add_passenger' | 'compare_vehicles') => void;
}

export function BudgetBreakdownCard({
  tripTitle,
  summary,
  additional,
  onChangeAdditional,
  manualTollText,
  onChangeManualTollText,
  onChangePassengers,
  maxBudgetText,
  onChangeMaxBudgetText,
  onQuickSuggest,
}: BudgetBreakdownCardProps) {
  const [baselineTotal, setBaselineTotal] = useState<number | null>(null);
  const [baselineLabel, setBaselineLabel] = useState<string>('');
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [customShares, setCustomShares] = useState<number[]>([]);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const ensureCustomShares = () => {
    const n = summary.passengers;
    if (customShares.length === n) return customShares;
    const evenPct = Math.floor(100 / n);
    const arr = Array.from({ length: n }, (_, i) =>
      i === n - 1 ? 100 - evenPct * (n - 1) : evenPct
    );
    return arr;
  };

  const activeShares = ensureCustomShares();
  const totalSharePct = activeShares.reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0);

  const handleShareChange = (idx: number, pct: number) => {
    const base = [...activeShares];
    base[idx] = Math.max(0, Math.min(100, pct));
    setCustomShares(base);
  };

  const copySummaryText = async () => {
    const lines = [
      `SHAREWHEELS ROUTECRAFT — ${tripTitle}`,
      `Total Estimated Trip Cost: ${formatINR(summary.totalTripCostInr)}`,
      `Rental (${summary.rentalCostInr > 0 ? 'Confirmed rate' : 'N/A'}): ${formatINR(summary.rentalCostInr)}`,
      `Fuel / Charging: ${formatINR(summary.fuelOrChargingCostInr)}`,
      `Tolls: ${summary.tollProvenance === 'unavailable' ? 'Unavailable / Not entered' : formatINR(summary.tollCostInr)}`,
      `Additional Expenses: ${formatINR(summary.additionalExpensesInr)}`,
      `Passengers: ${summary.passengers} | Equal Cost/Person: ${formatINR(summary.costPerPersonInr)}`,
      `Refundable Security Deposit (separate): ${formatINR(summary.refundableSecurityDepositInr)}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedSummary(true);
      window.setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  const updateField = (key: keyof AdditionalExpensesInput, raw: string) => {
    const num = Math.max(0, Number(raw) || 0);
    onChangeAdditional({ ...additional, [key]: num });
  };

  const delta = baselineTotal !== null ? summary.totalTripCostInr - baselineTotal : null;

  return (
    <div className="space-y-6 border border-[#2A2A30] bg-[#111114] p-6 rounded-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A30] pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#C8A97E]">
            ROUTECRAFT Budget Intelligence
          </p>
          <h2 className="font-display text-2xl font-semibold text-[#F4F1EA]">
            Complete Trip Cost Breakdown
          </h2>
        </div>

        {/* What-If Baseline Control */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setBaselineTotal(summary.totalTripCostInr);
              setBaselineLabel(tripTitle);
            }}
          >
            <GitCompare className="h-3.5 w-3.5" />
            {baselineTotal === null ? 'Lock What-If Baseline' : 'Reset Baseline'}
          </Button>
          {baselineTotal !== null && delta !== null && (
            <span
              className={`border px-2.5 py-1 rounded-sm text-xs font-medium ${
                delta <= 0
                  ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                  : 'border-amber-500/40 bg-amber-950/30 text-amber-300'
              }`}
            >
              What-If vs {baselineLabel}: {delta > 0 ? `+${formatINR(delta)}` : formatINR(delta)}
            </span>
          )}
        </div>
      </div>

      {/* Smart Budget Alert */}
      {summary.budgetExceededByInr > 0 && (
        <div className="border border-red-500/40 bg-red-950/20 p-4 rounded-sm space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-red-300 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-medium text-red-200">
                Smart Budget Alert: Estimated trip exceeds your {formatINR(summary.maxBudgetInr || 0)} cap by{' '}
                {formatINR(summary.budgetExceededByInr)}
              </p>
              <p className="text-[#E8E4DC]/80">
                Your choices were not modified automatically. Consider one of these adjustments:
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {onQuickSuggest && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onQuickSuggest('compare_vehicles')}
                >
                  Compare Lower-Cost Vehicles
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onQuickSuggest('reduce_stops')}
                >
                  Trim Optional Stops
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onQuickSuggest('add_passenger')}
                >
                  Add 1 Co-Traveller ({summary.passengers + 1})
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* KPI Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border border-[#2A2A30] divide-y sm:divide-y-0 sm:divide-x divide-[#2A2A30] bg-[#0A0A0B]">
        <div className="p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#8E8E98]">Total Trip Cost</p>
          <p className="mt-1 font-display text-3xl font-semibold text-[#F4F1EA]">
            {formatINR(summary.totalTripCostInr)}
          </p>
        </div>
        <div className="p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#C8A97E]">
            Cost Per Person ({summary.passengers} Pax)
          </p>
          <p className="mt-1 font-display text-3xl font-semibold text-[#C8A97E]">
            {formatINR(summary.costPerPersonInr)}
          </p>
        </div>
        <div className="p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#8E8E98]">
            Refundable Deposit (Separate)
          </p>
          <p className="mt-1 font-display text-2xl font-medium text-[#E8E4DC]">
            {formatINR(summary.refundableSecurityDepositInr)}
          </p>
        </div>
      </div>

      {/* Editable Assumptions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-[0.12em] text-[#8E8E98]">
            Manual Tolls (₹)
          </label>
          <input
            type="number"
            min={0}
            value={manualTollText}
            onChange={(e) => onChangeManualTollText(e.target.value)}
            placeholder={
              summary.tollProvenance === 'provider_estimate'
                ? `Auto: ${summary.tollCostInr}`
                : 'Enter estimate'
            }
            className="w-full h-9 bg-[#0A0A0B] border border-[#2A2A30] px-2.5 text-xs text-[#F4F1EA] rounded-sm focus:border-[#C8A97E] focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-[0.12em] text-[#8E8E98]">
            Parking (₹)
          </label>
          <input
            type="number"
            min={0}
            value={additional.parkingInr || ''}
            onChange={(e) => updateField('parkingInr', e.target.value)}
            placeholder="0"
            className="w-full h-9 bg-[#0A0A0B] border border-[#2A2A30] px-2.5 text-xs text-[#F4F1EA] rounded-sm focus:border-[#C8A97E] focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-[0.12em] text-[#8E8E98]">
            Stay / Hotels (₹)
          </label>
          <input
            type="number"
            min={0}
            value={additional.accommodationInr || ''}
            onChange={(e) => updateField('accommodationInr', e.target.value)}
            placeholder="0"
            className="w-full h-9 bg-[#0A0A0B] border border-[#2A2A30] px-2.5 text-xs text-[#F4F1EA] rounded-sm focus:border-[#C8A97E] focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-[0.12em] text-[#8E8E98]">
            Food & Stops (₹)
          </label>
          <input
            type="number"
            min={0}
            value={additional.foodInr || ''}
            onChange={(e) => updateField('foodInr', e.target.value)}
            placeholder="0"
            className="w-full h-9 bg-[#0A0A0B] border border-[#2A2A30] px-2.5 text-xs text-[#F4F1EA] rounded-sm focus:border-[#C8A97E] focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-[0.12em] text-[#8E8E98]">
            Driver / Extra Km (₹)
          </label>
          <input
            type="number"
            min={0}
            value={additional.driverChargesInr + additional.extraKmChargesInr || ''}
            onChange={(e) =>
              onChangeAdditional({
                ...additional,
                driverChargesInr: Math.max(0, Number(e.target.value) || 0),
                extraKmChargesInr: 0,
              })
            }
            placeholder="0"
            className="w-full h-9 bg-[#0A0A0B] border border-[#2A2A30] px-2.5 text-xs text-[#F4F1EA] rounded-sm focus:border-[#C8A97E] focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-[0.12em] text-[#8E8E98]">
            Misc / Services (₹)
          </label>
          <input
            type="number"
            min={0}
            value={additional.miscInr || ''}
            onChange={(e) => updateField('miscInr', e.target.value)}
            placeholder="0"
            className="w-full h-9 bg-[#0A0A0B] border border-[#2A2A30] px-2.5 text-xs text-[#F4F1EA] rounded-sm focus:border-[#C8A97E] focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-[0.12em] text-[#C8A97E]">
            Max Budget (₹)
          </label>
          <input
            type="number"
            min={0}
            value={maxBudgetText}
            onChange={(e) => onChangeMaxBudgetText(e.target.value)}
            placeholder="Optional cap"
            className="w-full h-9 bg-[#0A0A0B] border border-[#C8A97E]/40 px-2.5 text-xs text-[#F4F1EA] rounded-sm focus:border-[#C8A97E] focus:outline-none"
          />
        </div>
      </div>

      {/* Expense Provenance Table */}
      <div className="overflow-x-auto border border-[#2A2A30] rounded-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0A0A0B] border-b border-[#2A2A30] text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
            <tr>
              <th className="py-3 px-4">Expense</th>
              <th className="py-3 px-4">Accuracy Classification</th>
              <th className="py-3 px-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2A30]">
            {summary.lines.map((line) => {
              const meta = PROVENANCE_META[line.provenance];
              return (
                <tr key={line.id}>
                  <td className="py-3 px-4">
                    <p className="font-medium text-[#F4F1EA]">{line.label}</p>
                    {line.detail && (
                      <p className="text-[11px] text-[#8E8E98] mt-0.5">{line.detail}</p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block border px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-[0.1em] ${meta.badgeClass}`}
                    >
                      {meta.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-[#F4F1EA]">
                    {line.amountInr === null ? 'Unavailable' : formatINR(line.amountInr)}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-[#0A0A0B] font-semibold">
              <td className="py-3.5 px-4 text-[#C8A97E]">Total Trip Expense</td>
              <td className="py-3.5 px-4 text-[11px] text-[#8E8E98]">
                Excludes {formatINR(summary.refundableSecurityDepositInr)} refundable security deposit
              </td>
              <td className="py-3.5 px-4 text-right text-base font-display text-[#C8A97E]">
                {formatINR(summary.totalTripCostInr)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Split the Bill */}
      <div className="border border-[#2A2A30] bg-[#0A0A0B] p-4 rounded-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#C8A97E]" />
            <span className="text-xs uppercase tracking-[0.14em] text-[#F4F1EA] font-medium">
              Split the Bill ({summary.passengers} Travellers)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center border border-[#2A2A30] rounded-sm overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => onChangePassengers(Math.max(1, summary.passengers - 1))}
                className="px-2.5 py-1 text-[#8E8E98] hover:text-[#F4F1EA] cursor-pointer"
              >
                −
              </button>
              <span className="px-2 text-[#F4F1EA]">{summary.passengers} Pax</span>
              <button
                type="button"
                onClick={() => onChangePassengers(Math.min(12, summary.passengers + 1))}
                className="px-2.5 py-1 text-[#8E8E98] hover:text-[#F4F1EA] cursor-pointer"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSplitMode((m) => (m === 'equal' ? 'custom' : 'equal'))}
              className="border border-[#2A2A30] hover:border-[#C8A97E] px-2.5 py-1 rounded-sm text-[11px] text-[#E8E4DC] cursor-pointer"
            >
              {splitMode === 'equal' ? 'Custom Shares' : 'Equal Split'}
            </button>
            <Button type="button" size="sm" variant="outline" onClick={copySummaryText}>
              {copiedSummary ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedSummary ? 'Copied' : 'Copy Summary'}</span>
            </Button>
          </div>
        </div>

        {splitMode === 'equal' ? (
          <p className="text-xs text-[#8E8E98]">
            Equal contribution per person:{' '}
            <strong className="text-[#C8A97E] text-sm">
              {formatINR(summary.costPerPersonInr)}
            </strong>{' '}
            ({formatINR(summary.totalTripCostInr)} ÷ {summary.passengers})
          </p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {activeShares.map((pct, idx) => (
                <div
                  key={idx}
                  className="border border-[#2A2A30] bg-[#111114] p-2.5 rounded-sm text-xs space-y-1"
                >
                  <div className="flex justify-between text-[#8E8E98]">
                    <span>Traveller {idx + 1}</span>
                    <span className="text-[#C8A97E]">
                      {formatINR(Math.round((summary.totalTripCostInr * pct) / 100))}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={pct}
                      onChange={(e) => handleShareChange(idx, Number(e.target.value))}
                      className="w-full h-7 bg-[#0A0A0B] border border-[#2A2A30] px-2 text-xs text-[#F4F1EA] rounded-sm"
                    />
                    <span className="text-[#8E8E98]">%</span>
                  </div>
                </div>
              ))}
            </div>
            {totalSharePct !== 100 && (
              <p className="text-[11px] text-amber-300">
                Custom shares currently total {totalSharePct}% (adjust to 100% for exact reconciliation).
              </p>
            )}
          </div>
        )}

        <p className="flex items-center gap-1.5 text-[11px] text-[#8E8E98]">
          <Share2 className="h-3 w-3 text-[#C8A97E]" />
          <Lock className="h-3 w-3 text-[#C8A97E]" />
          Expense sharing computes contributions cleanly without initiating external payment requests.
        </p>
      </div>
    </div>
  );
}
