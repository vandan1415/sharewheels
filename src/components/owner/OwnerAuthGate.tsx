import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export function OwnerAuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center gap-3 text-xs uppercase tracking-[0.18em] text-[#C8A97E]">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading Owner Portal...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center px-6">
        <div className="max-w-md w-full border border-[#2A2A30] bg-[#111114] p-8 rounded-sm space-y-6 text-center">
          <div className="mx-auto h-11 w-11 rounded-sm border border-[#C8A97E]/40 bg-[#C8A97E]/10 flex items-center justify-center">
            <Lock className="h-5 w-5 text-[#C8A97E]" />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#C8A97E]">
              Owner Authentication Required
            </p>
            <h1 className="font-display text-2xl font-semibold text-[#F4F1EA]">
              Sign in to the Owner Portal
            </h1>
            <p className="text-sm text-[#8E8E98]">
              Access your fleet verification, documents, bookings, and earnings through your
              SHAREWHEELS Owner account.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/owner/login">
              <Button variant="champagne" className="w-full sm:w-auto">
                Log In as Owner
              </Button>
            </Link>
            <Link to="/owner/register">
              <Button variant="primary" className="w-full sm:w-auto">
                Create Owner Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
