import { Bell, Radar, ShieldAlert, Siren, Target } from "lucide-react";

interface SentinelHubProps {
  selectedMarket: string;
  connected: boolean;
  authorized: boolean;
}

const liveRules = [
  {
    name: "Digit compression break",
    scope: "Volatility 100 / 1HZ100V",
    status: "Armed",
    detail: "Waits for 3-tick squeeze, then flags momentum release if odd/even pressure flips.",
  },
  {
    name: "Pressure exhaustion watch",
    scope: "Digit Edge core markets",
    status: "Monitoring",
    detail: "Tracks absent-digit pressure spikes and raises reversal alerts before full entry confirmation.",
  },
  {
    name: "Cross-market confluence",
    scope: "Scanner + DAT alignment",
    status: "Standby",
    detail: "Pairs scanner trend bias with local execution confidence before escalating to priority alert.",
  },
];

const SentinelHub = ({ selectedMarket, connected, authorized }: SentinelHubProps) => {
  const statusTone = !connected
    ? "text-sell"
    : authorized
      ? "text-buy"
      : "text-warning";

  const statusLabel = !connected ? "Offline" : authorized ? "Live" : "Linking";

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 lg:p-6">
        <section className="rounded-2xl border border-border bg-card p-5 lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Sentinel Hub</p>
              <h1 className="text-2xl font-bold text-foreground lg:text-3xl">No-code alert engine for high-probability setups</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Run layered market surveillance rules, monitor live trigger states, and surface only the setups that deserve attention.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[360px]">
              <div className="rounded-xl border border-border bg-secondary/40 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Core market</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{selectedMarket}</p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Alert state</p>
                <p className={`mt-1 text-sm font-semibold ${statusTone}`}>{statusLabel}</p>
              </div>
              <div className="col-span-2 rounded-xl border border-border bg-secondary/40 p-3 sm:col-span-1">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Escalation</p>
                <p className="mt-1 text-sm font-semibold text-foreground">Push + in-app banner</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-border bg-card p-5 lg:p-6">
            <div className="flex items-center gap-2">
              <Radar className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Live rule matrix</h2>
            </div>
            <div className="mt-5 space-y-3">
              {liveRules.map((rule) => (
                <div key={rule.name} className="rounded-xl border border-border bg-secondary/30 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{rule.name}</p>
                      <p className="text-xs text-muted-foreground">{rule.scope}</p>
                    </div>
                    <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      {rule.status}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{rule.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-5 lg:p-6">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Trigger ladder</h2>
              </div>
              <div className="mt-5 space-y-3 text-sm">
                {[
                  ["Tier 1", "Scanner sees directional agreement across watched markets."],
                  ["Tier 2", "Digit pressure reaches reversal threshold on your active market."],
                  ["Tier 3", "Execution engine confirms confluence and pushes immediate alert."],
                ].map(([tier, text]) => (
                  <div key={tier} className="rounded-xl border border-border bg-secondary/30 p-4">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{tier}</p>
                    <p className="mt-2 text-sm text-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 lg:p-6">
              <div className="flex items-center gap-2">
                <Siren className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Protection logic</h2>
              </div>
              <div className="mt-5 space-y-4">
                {[
                  { Icon: ShieldAlert, text: "Suppress alerts during unstable authorization or disconnect states." },
                  { Icon: Target, text: "Prioritize only setups that align with your current active market context." },
                ].map(({ Icon, text }, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-xl border border-border bg-secondary/30 p-4">
                    <div className="rounded-xl bg-secondary p-2"><Icon className="h-4 w-4 text-primary" /></div>
                    <p className="text-sm leading-relaxed text-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SentinelHub;