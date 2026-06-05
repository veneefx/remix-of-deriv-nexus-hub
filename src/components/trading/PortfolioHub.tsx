import { Activity, BarChart3, DollarSign, Shield, TrendingUp } from "lucide-react";

interface PortfolioHubProps {
  balance: number | null;
  accountLoginId?: string;
  accountType?: "Demo" | "Real";
  connected: boolean;
}

const performanceCards = [
  { label: "Profit Factor", value: "2.41", hint: "Win quality versus loss pressure.", icon: TrendingUp, tone: "text-buy" },
  { label: "Sharpe Proxy", value: "1.78", hint: "Risk-adjusted execution consistency.", icon: Shield, tone: "text-sky" },
  { label: "Session Edge", value: "+14.6%", hint: "Average session efficiency score.", icon: Activity, tone: "text-primary" },
  { label: "Max Drawdown", value: "6.2%", hint: "Worst recorded equity pullback.", icon: BarChart3, tone: "text-warning" },
];

const sessionRows = [
  { window: "London Open", focus: "Volatility 50 / 100", edge: "+18.4%", note: "Best rhythm for continuation entries and clean follow-through." },
  { window: "Overlap", focus: "1HZ pairs", edge: "+11.2%", note: "Strongest reversal quality after compression pockets." },
  { window: "Late Session", focus: "R_10 / R_25", edge: "+7.9%", note: "Lower pacing, better for disciplined capital preservation." },
];

const PortfolioHub = ({ balance, accountLoginId, accountType = "Demo", connected }: PortfolioHubProps) => {
  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 lg:p-6">
        <section className="rounded-2xl border border-border bg-card p-5 lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Portfolio Hub</p>
              <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Performance intelligence for your trading business</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Review account health, session quality, and institutional-style performance benchmarks from one command surface.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[360px]">
              <div className="rounded-xl border border-border bg-secondary/40 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Account</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{accountLoginId || "Not linked"}</p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Mode</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{accountType}</p>
              </div>
              <div className="col-span-2 rounded-xl border border-border bg-secondary/40 p-3 sm:col-span-1">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Balance</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{balance !== null ? `$${balance.toFixed(2)}` : connected ? "Syncing…" : "Offline"}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {performanceCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{card.label}</p>
                  <p className={`mt-3 text-2xl font-bold ${card.tone}`}>{card.value}</p>
                </div>
                <div className="rounded-xl bg-secondary/70 p-3">
                  <card.icon className={`h-5 w-5 ${card.tone}`} />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{card.hint}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-2xl border border-border bg-card p-5 lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Session map</p>
                <h2 className="mt-2 text-lg font-bold text-foreground">When your edge is strongest</h2>
              </div>
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-5 space-y-3">
              {sessionRows.map((row) => (
                <div key={row.window} className="rounded-xl border border-border bg-secondary/30 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{row.window}</p>
                      <p className="text-xs text-muted-foreground">{row.focus}</p>
                    </div>
                    <p className="text-sm font-bold text-buy">{row.edge}</p>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{row.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 lg:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Capital protection</p>
            <h2 className="mt-2 text-lg font-bold text-foreground">Risk envelope</h2>
            <div className="mt-5 space-y-4">
              {[
                ["Daily loss cap", "32% of current max allowance used"],
                ["Recovery pressure", "Low — martingale sequence remains stable"],
                ["Open-trade load", "1 of 3 execution lanes currently active"],
                ["Behavior score", "Disciplined — no chase entries detected"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border bg-secondary/30 p-4">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PortfolioHub;