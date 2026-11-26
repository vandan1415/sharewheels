import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAdminSession } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const { loading: authLoading, signOut } = useAuth();
  const { data: adminSession, isLoading: adminLoading } = useAdminSession();

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center gap-3 text-xs uppercase tracking-[0.18em] text-[#C8A97E]">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Verifying Administrator Privileges...</span>
      </div>
    );
  }

  if (!adminSession) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-[#F4F1EA] flex items-center justify-center px-6">
        <div className="max-w-md w-full border border-red-500/40 bg-[#111114] p-8 rounded-sm space-y-6 text-center">
          <div className="mx-auto h-11 w-11 rounded-sm border border-red-500/40 bg-red-950/30 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5 text-red-400" />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-red-400">
              Restricted Administrative Control Centre
            </p>
            <h1 className="font-display text-2xl font-semibold text-[#F4F1EA]">
              Authorised Admin Session Required
            </h1>
            <p className="text-sm text-[#8E8E98] leading-relaxed">
              This portal is closed to ordinary customers and vehicle owners. Sign in with your
              authorised administrator mobile number and password.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/admin/login">
              <Button variant="champagne" className="w-full sm:w-auto">
                Admin Sign In
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={async () => {
                await signOut();
                window.location.href = '/';
              }}
            >
              Return to Marketplace
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
