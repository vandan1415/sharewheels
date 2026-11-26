import { Link } from 'react-router-dom';
import { ArrowRight, Calculator, Compass, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RouteCraftSpotlightSection() {
  return (
    <section className="border-t border-[#2A2A30] bg-[#111114] py-24">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-6">
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#C8A97E]">
              <Route className="h-3.5 w-3.5" />
              <span>ROUTECRAFT · Complete Road Trip Intelligence</span>
            </p>
            <h2 className="font-display text-3xl sm:text-5xl font-semibold tracking-[-0.025em] leading-[1.02] text-[#F4F1EA]">
              Discover → Plan → Calculate → Book → Drive.
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-[#8E8E98] max-w-xl">
              Compare routes, estimate fuel or EV charging stops, calculate exact rental plus trip
              expenses per passenger, and choose the ideal SHAREWHEELS vehicle in one unified workspace.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/route-planner">
                <Button variant="champagne" size="lg">
                  Open Route Planner
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link to="/journeys">
                <Button variant="outline" size="lg">
                  Explore Curated Journeys
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/journeys"
              className="border border-[#2A2A30] bg-[#0A0A0B] hover:border-[#C8A97E] p-6 rounded-sm space-y-3 transition-colors"
            >
              <Compass className="h-5 w-5 text-[#C8A97E]" />
              <h3 className="font-display text-lg font-medium text-[#F4F1EA]">
                8 Curated India Drives
              </h3>
              <p className="text-xs text-[#8E8E98] leading-relaxed">
                Chandigarh → Manali, Delhi → Jaipur, Mumbai → Goa, Bengaluru → Coorg and more with pre-loaded stops.
              </p>
            </Link>

            <Link
              to="/trip-budget"
              className="border border-[#2A2A30] bg-[#0A0A0B] hover:border-[#C8A97E] p-6 rounded-sm space-y-3 transition-colors"
            >
              <Calculator className="h-5 w-5 text-[#C8A97E]" />
              <h3 className="font-display text-lg font-medium text-[#F4F1EA]">
                Budget & Bill Split
              </h3>
              <p className="text-xs text-[#8E8E98] leading-relaxed">
                Real DB rental pricing, fuel or EV charging cost, tolls, What-If comparison, and cost per person.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
