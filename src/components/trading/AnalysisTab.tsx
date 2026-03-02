import { DIGIT_BARRIERS } from "@/lib/trading-constants";

interface SessionStats {
  totalTrades: number;
  wins: number;
  losses: number;
  totalProfit: number;
  peakBalance: number;
  maxDrawdown: number;
  startBalance: number;
}

interface AnalysisTabProps {
  lastDigits: number[];
  session: SessionStats;
  marketLabel: string;
}

const AnalysisTab = ({ lastDigits, session, marketLabel }: AnalysisTabProps) => {
  const total = lastDigits.length;
  const evenCount = lastDigits.filter((d) => d % 2 === 0).length;
  const oddCount = total - evenCount;
  const overCount = lastDigits.filter((d) => d >= 5).length;
  const underCount = total - overCount;

  const winRate = session.totalTrades > 0 ? ((session.wins / session.totalTrades) * 100).toFixed(1) : "0.0";

  const digitFrequencies = DIGIT_BARRIERS.map((d) => {
    const num = parseInt(d);
    const count = lastDigits.filter((x) => x === num).length;
    return { digit: num, count, pct: total > 0 ? (count / total) * 100 : 0 };
  });

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Ticks", value: total },
          { label: "Win Rate", value: `${winRate}%` },
          { label: "Total Profit", value: `$${session.totalProfit.toFixed(2)}` },
          { label: "Max Drawdown", value: `${session.maxDrawdown.toFixed(1)}%` },
          { label: "Wins", value: session.wins },
          { label: "Losses", value: session.losses },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl bg-card border border-border text-center">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-lg font-bold text-foreground mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Even/Odd & Over/Under */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl bg-card border border-border">
          <h4 className="text-sm font-semibold text-foreground mb-3">Even vs Odd</h4>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Even</span><span>{total > 0 ? ((evenCount / total) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-buy rounded-full transition-all" style={{ width: `${total > 0 ? (evenCount / total) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Odd</span><span>{total > 0 ? ((oddCount / total) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-sell rounded-full transition-all" style={{ width: `${total > 0 ? (oddCount / total) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border">
          <h4 className="text-sm font-semibold text-foreground mb-3">Over vs Under</h4>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Over 4</span><span>{total > 0 ? ((overCount / total) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-buy rounded-full transition-all" style={{ width: `${total > 0 ? (overCount / total) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Under 5</span><span>{total > 0 ? ((underCount / total) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-sell rounded-full transition-all" style={{ width: `${total > 0 ? (underCount / total) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Last 100 Digits — Tiny Circles */}
      <div className="p-5 rounded-xl bg-card border border-border">
        <h4 className="text-sm font-semibold text-foreground mb-4">Last 100 Digits — {marketLabel}</h4>
        <div className="flex flex-wrap gap-1.5">
          {(lastDigits.length > 0 ? lastDigits.slice(-100) : Array(100).fill(null)).map((digit, i) => (
            <div
              key={i}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-mono font-bold ${
                digit === null
                  ? "bg-secondary text-muted-foreground"
                  : digit >= 5
                    ? "bg-buy/20 text-buy border border-buy/30"
                    : "bg-sell/20 text-sell border border-sell/30"
              }`}
            >
              {digit !== null && digit !== undefined ? digit : "-"}
            </div>
          ))}
        </div>
      </div>

      {/* Digit Frequency — Deriv-style donut circles */}
      <div className="p-5 rounded-xl bg-card border border-border">
        <h4 className="text-sm font-semibold text-foreground mb-4">Digit Frequency</h4>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-4">
          {digitFrequencies.map((d) => {
            const circumference = 2 * Math.PI * 15;
            const dashLen = (d.pct / 100) * circumference;
            const gapLen = circumference - dashLen;
            return (
              <div key={d.digit} className="flex flex-col items-center gap-2">
                <div className="relative w-12 h-12">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--secondary))" strokeWidth="2.5" />
                    <circle
                      cx="18" cy="18" r="15" fill="none"
                      stroke={d.pct > 12 ? "hsl(var(--sell))" : d.pct > 8 ? "hsl(var(--warning))" : "hsl(var(--buy))"}
                      strokeWidth="2.5"
                      strokeDasharray={`${dashLen} ${gapLen}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">{d.digit}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{d.pct.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Session Stats */}
      <div className="p-5 rounded-xl bg-card border border-border">
        <h4 className="text-sm font-semibold text-foreground mb-3">Session Summary</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-foreground">{session.totalTrades}</p>
            <p className="text-xs text-muted-foreground">Total Trades</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${session.totalProfit >= 0 ? "text-buy" : "text-sell"}`}>${session.totalProfit.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Net Profit</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{winRate}%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-sell">{session.maxDrawdown.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Max Drawdown</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisTab;
