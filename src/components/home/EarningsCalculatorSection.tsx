import { useState } from 'react';
import { formatINR } from '@/lib/utils';

const COMMISSION_RATE = 0.15;

export function EarningsCalculatorSection() {
  const [dailyPrice, setDailyPrice] = useState(3000);
  const [rentalDays, setRentalDays] = useState(10);

  const grossRevenue = dailyPrice * rentalDays;
  const commission = Math.round(grossRevenue * COMMISSION_RATE);
  const ownerEarnings = grossRevenue - commission;

  return (
    <section className="border-t border-[#2A2A30] bg-[#0A0A0B] py-24">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#C8A97E]">
              09 / Owner Earnings Calculator
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.02em] text-[#F4F1EA]">
              Estimate Your Monthly Potential
            </h2>
            <p className="text-sm leading-relaxed text-[#8E8E98]">
              Model your expected return using our illustrative 15% platform commission before
              maintenance, insurance, fuel, or applicable taxes.
            </p>
            <p className="text-xs text-[#8E8E98] border-l-2 border-[#2A2A30] pl-3">
              Estimates only — actual bookings, utilisation, and earnings are not guaranteed.
            </p>
          </div>

          <div className="lg:col-span-7 border border-[#2A2A30] bg-[#111114] rounded-sm p-6 sm:p-8 space-y-8">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <label htmlFor="daily-price-slider" className="uppercase tracking-[0.14em] text-[#8E8E98]">
                    Daily Rental Price
                  </label>
                  <span className="font-display font-semibold text-[#F4F1EA]">
                    {formatINR(dailyPrice)} / day
                  </span>
                </div>
                <input
                  id="daily-price-slider"
                  type="range"
                  min={500}
                  max={12000}
                  step={100}
                  value={dailyPrice}
                  onChange={(e) => setDailyPrice(Number(e.target.value))}
                  className="w-full accent-[#C8A97E] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-2">
                  <label htmlFor="rental-days-slider" className="uppercase tracking-[0.14em] text-[#8E8E98]">
                    Estimated Booked Days / Month
                  </label>
                  <span className="font-display font-semibold text-[#F4F1EA]">
                    {rentalDays} days
                  </span>
                </div>
                <input
                  id="rental-days-slider"
                  type="range"
                  min={1}
                  max={28}
                  step={1}
                  value={rentalDays}
                  onChange={(e) => setRentalDays(Number(e.target.value))}
                  className="w-full accent-[#C8A97E] cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#2A2A30] pt-6">
              <div className="border border-[#2A2A30] bg-[#0A0A0B] p-4 rounded-sm">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  Gross Revenue
                </p>
                <p className="mt-1 font-display text-xl font-semibold text-[#F4F1EA]">
                  {formatINR(grossRevenue)}
                </p>
              </div>
              <div className="border border-[#2A2A30] bg-[#0A0A0B] p-4 rounded-sm">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#8E8E98]">
                  Platform Commission (15%)
                </p>
                <p className="mt-1 font-display text-xl font-semibold text-[#8E8E98]">
                  − {formatINR(commission)}
                </p>
              </div>
              <div className="border border-[#C8A97E]/50 bg-[#1A1A1F] p-4 rounded-sm">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#C8A97E]">
                  Est. Owner Earnings
                </p>
                <p className="mt-1 font-display text-2xl font-semibold text-[#F4F1EA]">
                  {formatINR(ownerEarnings)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
