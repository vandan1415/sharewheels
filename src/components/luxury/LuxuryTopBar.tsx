import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Menu, User, X } from 'lucide-react';
import { useLocationContext } from '@/context/LocationContext';
import { useAuth } from '@/context/AuthContext';

export function LuxuryTopBar() {
  const { selectedCity, openLocationModal } = useLocationContext();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="relative z-40 w-full border-b border-white/[0.06] bg-[#070709]/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1480px] items-center justify-between gap-2 px-4 sm:px-8">
        {/* Left: SHAREWHEELS Brand */}
        <Link
          to="/"
          className="font-display text-xs sm:text-sm font-semibold tracking-[0.18em] sm:tracking-[0.26em] uppercase text-[#F4F1EA] hover:text-[#C8A97E] transition-colors shrink-0"
        >
          SHAREWHEELS
        </Link>

        {/* Center: Minimal Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-7 lg:gap-8">
          <Link
            to="/explore"
            className="text-[11px] uppercase tracking-[0.18em] text-[#B8B6BE] hover:text-[#F4F1EA] transition-colors"
          >
            Explore
          </Link>
          <Link
            to="/luxury"
            className="text-[11px] uppercase tracking-[0.18em] text-[#C8A97E] border-b border-[#C8A97E] pb-0.5"
          >
            Luxury Collection
          </Link>
          <button
            type="button"
            onClick={openLocationModal}
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-[#E8E4DC] hover:text-[#C8A97E] transition-colors cursor-pointer"
          >
            <MapPin className="h-3.5 w-3.5 text-[#C8A97E]" />
            <span>{selectedCity ? selectedCity.name : 'Select City'}</span>
          </button>
          <Link
            to="/owner"
            className="text-[11px] uppercase tracking-[0.18em] text-[#B8B6BE] hover:text-[#F4F1EA] transition-colors"
          >
            List Your Vehicle
          </Link>
        </nav>

        {/* Right: Desktop Account CTA + Compact Mobile City & Menu */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={openLocationModal}
            aria-label="Select City"
            className="md:hidden inline-flex items-center gap-1 border border-white/15 bg-black/50 px-2 py-1 rounded-sm text-[10px] uppercase tracking-[0.12em] text-[#E8E4DC] hover:border-[#C8A97E] cursor-pointer"
          >
            <MapPin className="h-3 w-3 text-[#C8A97E] shrink-0" />
            <span className="max-w-[92px] truncate">
              {selectedCity ? selectedCity.name : 'City'}
            </span>
          </button>

          <Link
            to={user ? '/dashboard' : '/login'}
            className="hidden md:inline-flex items-center gap-1.5 border border-[#C8A97E]/45 bg-[#111114]/80 hover:border-[#C8A97E] px-3 py-1.5 rounded-sm text-[11px] uppercase tracking-[0.16em] text-[#F4F1EA] hover:text-[#C8A97E] transition-colors"
          >
            <User className="h-3.5 w-3.5 text-[#C8A97E]" />
            <span>{user ? 'Account' : 'Sign In'}</span>
          </Link>

          <button
            type="button"
            aria-label="Toggle luxury menu"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden inline-flex h-8 w-8 items-center justify-center border border-white/15 bg-[#111114]/85 text-[#F4F1EA] hover:border-[#C8A97E] rounded-sm cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Clean Obsidian Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.08] bg-[#0A0A0D]/95 px-4 py-3 flex flex-col gap-2 text-xs uppercase tracking-[0.16em]">
          <Link
            to="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="py-1.5 text-[#E8E4DC] hover:text-[#C8A97E]"
          >
            Explore
          </Link>
          <Link
            to="/luxury"
            onClick={() => setMobileMenuOpen(false)}
            className="py-1.5 text-[#C8A97E]"
          >
            Luxury Collection
          </Link>
          <Link
            to="/owner"
            onClick={() => setMobileMenuOpen(false)}
            className="py-1.5 text-[#E8E4DC] hover:text-[#C8A97E]"
          >
            List Your Vehicle
          </Link>
          <Link
            to={user ? '/dashboard' : '/login'}
            onClick={() => setMobileMenuOpen(false)}
            className="py-1.5 text-[#C8A97E] border-t border-white/[0.06] pt-2.5"
          >
            {user ? 'Account' : 'Sign In'}
          </Link>
        </div>
      )}
    </header>
  );
}
