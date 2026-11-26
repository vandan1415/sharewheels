import { AlertTriangle, CheckCircle2, Circle, Clock } from 'lucide-react';
import { computeOnboardingMilestones, type OwnerIdentityDoc, type OwnerProfile, type OwnerVehicleRow } from '@/lib/owner';

interface OnboardingProgressTrackerProps {
  profile: OwnerProfile | null;
  documents: OwnerIdentityDoc[];
  vehicles: OwnerVehicleRow[];
}

export function OnboardingProgressTracker({
  profile,
  documents,
  vehicles,
}: OnboardingProgressTrackerProps) {
  const milestones = computeOnboardingMilestones(profile, documents, vehicles);

  return (
    <div className="border border-[#2A2A30] bg-[#111114] p-6 rounded-sm space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#C8A97E]">
            Owner Journey Progress
          </p>
          <h2 className="font-display text-lg font-medium text-[#F4F1EA] mt-1">
            Six-Stage Verification & Publishing Track
          </h2>
        </div>
        <span className="text-xs text-[#8E8E98]">
          {milestones.filter((m) => m.status === 'completed').length} / 6 Completed
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {milestones.map((m) => (
          <div
            key={m.step}
            className={`border p-3.5 rounded-sm space-y-2 transition-colors ${
              m.status === 'completed'
                ? 'border-emerald-500/40 bg-emerald-950/15'
                : m.status === 'action_needed'
                  ? 'border-red-500/40 bg-red-950/15'
                  : m.status === 'current'
                    ? 'border-[#C8A97E]/60 bg-[#C8A97E]/5'
                    : 'border-[#2A2A30] bg-[#0A0A0B]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-[#8E8E98]">0{m.step}</span>
              {m.status === 'completed' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : m.status === 'action_needed' ? (
                <AlertTriangle className="h-4 w-4 text-red-400" />
              ) : m.status === 'current' ? (
                <Clock className="h-4 w-4 text-[#C8A97E]" />
              ) : (
                <Circle className="h-4 w-4 text-[#2A2A30]" />
              )}
            </div>
            <p className="text-xs font-medium text-[#F4F1EA] leading-snug">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
