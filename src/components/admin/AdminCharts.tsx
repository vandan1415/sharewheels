interface ChartPoint {
  label: string;
  value: number;
}

export function HorizontalBarChartCard({
  title,
  subtitle,
  data,
  unit = '',
}: {
  title: string;
  subtitle?: string;
  data: ChartPoint[];
  unit?: string;
}) {
  const maxVal = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="border border-[#2A2A30] bg-[#111114] p-6 rounded-sm space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#C8A97E]">{title}</p>
        {subtitle && <p className="text-xs text-[#8E8E98] mt-0.5">{subtitle}</p>}
      </div>

      {data.length === 0 ? (
        <div className="h-36 flex items-center justify-center border border-[#2A2A30]/60 bg-[#0A0A0B] text-xs text-[#8E8E98]">
          No database records yet for this metric.
        </div>
      ) : (
        <div className="space-y-3">
          {data.slice(0, 8).map((item) => {
            const pct = Math.max(4, Math.round((item.value / maxVal) * 100));
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#E8E4DC] truncate pr-2">{item.label}</span>
                  <span className="font-mono text-[#C8A97E] shrink-0">
                    {unit === 'INR'
                      ? `₹${item.value.toLocaleString('en-IN')}`
                      : item.value.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="h-2 bg-[#0A0A0B] border border-[#2A2A30] rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-[#C8A97E] transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function MonthlyTrendCard({
  title,
  subtitle,
  data,
  unit = '',
}: {
  title: string;
  subtitle?: string;
  data: ChartPoint[];
  unit?: string;
}) {
  const maxVal = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="border border-[#2A2A30] bg-[#111114] p-6 rounded-sm space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#C8A97E]">{title}</p>
        {subtitle && <p className="text-xs text-[#8E8E98] mt-0.5">{subtitle}</p>}
      </div>

      {data.length === 0 ? (
        <div className="h-36 flex items-center justify-center border border-[#2A2A30]/60 bg-[#0A0A0B] text-xs text-[#8E8E98]">
          No activity recorded yet.
        </div>
      ) : (
        <div className="h-40 flex items-end gap-3 pt-4 border-b border-[#2A2A30] pb-2">
          {data.slice(-6).map((item) => {
            const hPct = Math.max(10, Math.round((item.value / maxVal) * 100));
            return (
              <div
                key={item.label}
                className="flex-1 flex flex-col items-center justify-end gap-2 h-full"
              >
                <span className="font-mono text-[10px] text-[#C8A97E]">
                  {unit === 'INR'
                    ? `₹${item.value.toLocaleString('en-IN')}`
                    : item.value}
                </span>
                <div
                  className="w-full max-w-[44px] bg-[#C8A97E]/85 hover:bg-[#C8A97E] rounded-t-sm transition-all"
                  style={{ height: `${hPct}%` }}
                />
                <span className="text-[10px] text-[#8E8E98] truncate max-w-full">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
