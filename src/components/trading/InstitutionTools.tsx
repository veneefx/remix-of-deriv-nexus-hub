import { useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, TrendingUp, TrendingDown, Minus, Zap, Eye, BarChart3, Shield, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface TickData {
  quote: number;
  digit: number;
  epoch: number;
}

interface InstitutionToolsProps {
  tickBuffer: TickData[];
  lastDigits: number[];
}

// ── Order Flow Analysis ───────────────────────────────────────────
const OrderFlowAnalysis = ({ tickBuffer }: { tickBuffer: TickData[] }) => {
  const data = useMemo(() => {
    if (tickBuffer.length < 30) return null;

    const ticks = tickBuffer.slice(-200);
    let buyVolume = 0, sellVolume = 0;
    const flowBars: { buy: number; sell: number; net: number; price: number }[] = [];

    for (let i = 1; i < ticks.length; i++) {
      const diff = ticks[i].quote - ticks[i - 1].quote;
      const absDiff = Math.abs(diff);
      if (diff > 0) buyVolume += absDiff;
      else if (diff < 0) sellVolume += absDiff;

      if (i % 10 === 0) {
        flowBars.push({ buy: buyVolume, sell: sellVolume, net: buyVolume - sellVolume, price: ticks[i].quote });
        buyVolume = 0; sellVolume = 0;
      }
    }

    const totalBuy = flowBars.reduce((s, b) => s + b.buy, 0);
    const totalSell = flowBars.reduce((s, b) => s + b.sell, 0);
    const netFlow = totalBuy - totalSell;
    const buyPct = totalBuy + totalSell > 0 ? (totalBuy / (totalBuy + totalSell)) * 100 : 50;
    const imbalance = Math.abs(buyPct - 50) * 2;

    // Absorption detection
    const lastBars = flowBars.slice(-5);
    let absorption = false;
    if (lastBars.length >= 3) {
      const priceRange = Math.abs(lastBars[lastBars.length - 1].price - lastBars[0].price);
      const totalVolume = lastBars.reduce((s, b) => s + b.buy + b.sell, 0);
      if (priceRange < 0.01 && totalVolume > 0) absorption = true;
    }

    // Delta divergence
    let divergence = false;
    if (flowBars.length >= 4) {
      const recent = flowBars.slice(-2);
      const older = flowBars.slice(-4, -2);
      const recentNet = recent.reduce((s, b) => s + b.net, 0);
      const olderNet = older.reduce((s, b) => s + b.net, 0);
      const priceDir = ticks[ticks.length - 1].quote - ticks[Math.max(0, ticks.length - 40)].quote;
      if ((priceDir > 0 && recentNet < olderNet * 0.5) || (priceDir < 0 && recentNet > olderNet * 0.5)) {
        divergence = true;
      }
    }

    return { flowBars: flowBars.slice(-10), buyPct, imbalance, netFlow, absorption, divergence };
  }, [tickBuffer]);

  if (!data) return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Order Flow Analysis</h3>
      </div>
      <p className="text-xs text-muted-foreground text-center py-4">Collecting order flow data...</p>
    </div>
  );

  const maxBar = Math.max(...data.flowBars.map(b => Math.max(b.buy, b.sell)), 0.001);

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Order Flow Analysis</h3>
        <span className={`ml-auto text-[10px] font-bold ${data.buyPct > 55 ? "text-buy" : data.buyPct < 45 ? "text-sell" : "text-muted-foreground"}`}>
          {data.buyPct > 55 ? "Buyers Leading" : data.buyPct < 45 ? "Sellers Leading" : "Balanced"}
        </span>
      </div>

      {/* Flow bars */}
      <div className="flex items-end gap-1 h-20 mb-3">
        {data.flowBars.map((bar, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex flex-col-reverse" style={{ height: "100%" }}>
              <motion.div
                className="w-full rounded-t-sm bg-buy/60"
                animate={{ height: `${(bar.buy / maxBar) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="w-full flex flex-col" style={{ height: "100%" }}>
              <motion.div
                className="w-full rounded-b-sm bg-sell/60"
                animate={{ height: `${(bar.sell / maxBar) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Pressure meter */}
      <div className="mb-3">
        <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
          <span>Sell Pressure</span>
          <span>Buy Pressure</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden flex">
          <motion.div className="h-full bg-sell/60 rounded-l-full" animate={{ width: `${100 - data.buyPct}%` }} />
          <motion.div className="h-full bg-buy/60 rounded-r-full" animate={{ width: `${data.buyPct}%` }} />
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-1">
          Buy: {data.buyPct.toFixed(0)}% | Sell: {(100 - data.buyPct).toFixed(0)}% | Imbalance: {data.imbalance.toFixed(0)}%
        </p>
      </div>

      {/* Alerts */}
      <div className="flex gap-2">
        {data.absorption && (
          <span className="text-[9px] px-2 py-1 rounded-full bg-warning/10 text-warning border border-warning/20 font-medium">
            ⚠️ Absorption Detected
          </span>
        )}
        {data.divergence && (
          <span className="text-[9px] px-2 py-1 rounded-full bg-sell/10 text-sell border border-sell/20 font-medium">
            📊 Delta Divergence
          </span>
        )}
      </div>
    </div>
  );
};

// ── Tick Velocity Divergence ──────────────────────────────────────
const TickVelocityDivergence = ({ tickBuffer }: { tickBuffer: TickData[] }) => {
  const data = useMemo(() => {
    if (tickBuffer.length < 50) return null;

    const ticks = tickBuffer.slice(-200);
    const velocities: { velocity: number; acceleration: number; epoch: number }[] = [];

    for (let i = 1; i < ticks.length; i++) {
      const dt = ticks[i].epoch - ticks[i - 1].epoch;
      if (dt <= 0) continue;
      const velocity = (ticks[i].quote - ticks[i - 1].quote) / dt;
      const prevVel = velocities.length > 0 ? velocities[velocities.length - 1].velocity : velocity;
      const acceleration = (velocity - prevVel) / dt;
      velocities.push({ velocity, acceleration, epoch: ticks[i].epoch });
    }

    if (velocities.length < 20) return null;

    const recent = velocities.slice(-20);
    const avgVelocity = recent.reduce((s, v) => s + v.velocity, 0) / recent.length;
    const avgAcceleration = recent.reduce((s, v) => s + v.acceleration, 0) / recent.length;

    // Velocity trend
    const firstHalf = velocities.slice(-20, -10);
    const secondHalf = velocities.slice(-10);
    const firstAvg = firstHalf.reduce((s, v) => s + Math.abs(v.velocity), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, v) => s + Math.abs(v.velocity), 0) / secondHalf.length;

    const velocityTrend = secondAvg > firstAvg * 1.3 ? "Accelerating" : secondAvg < firstAvg * 0.7 ? "Decelerating" : "Stable";

    // Price direction vs velocity direction
    const priceDir = ticks[ticks.length - 1].quote - ticks[ticks.length - 20].quote;
    const velocityDir = avgVelocity;
    const hasDivergence = (priceDir > 0 && velocityDir < 0) || (priceDir < 0 && velocityDir > 0);

    // Velocity spikes
    const absVelocities = recent.map(v => Math.abs(v.velocity));
    const meanVel = absVelocities.reduce((a, b) => a + b, 0) / absVelocities.length;
    const spikeCount = absVelocities.filter(v => v > meanVel * 2).length;

    return {
      avgVelocity, avgAcceleration, velocityTrend, hasDivergence, spikeCount,
      velocities: recent.map(v => v.velocity),
      priceDirection: priceDir > 0 ? "Up" : priceDir < 0 ? "Down" : "Flat",
    };
  }, [tickBuffer]);

  if (!data) return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Tick Velocity Divergence</h3>
      </div>
      <p className="text-xs text-muted-foreground text-center py-4">Building velocity profile...</p>
    </div>
  );

  const maxVel = Math.max(...data.velocities.map(Math.abs), 0.001);

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Tick Velocity Divergence</h3>
        {data.hasDivergence && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-sell/10 text-sell border border-sell/20 font-bold animate-pulse">
            DIVERGENCE
          </span>
        )}
      </div>

      {/* Velocity bars */}
      <div className="flex items-center gap-px h-16 mb-3">
        {data.velocities.map((v, i) => {
          const height = Math.abs(v) / maxVel * 100;
          return (
            <div key={i} className="flex-1 flex items-center justify-center" style={{ height: "100%" }}>
              <motion.div
                className={`w-full rounded-sm ${v >= 0 ? "bg-buy/50" : "bg-sell/50"}`}
                animate={{ height: `${Math.max(height, 4)}%` }}
                style={{ alignSelf: v >= 0 ? "flex-end" : "flex-start" }}
                transition={{ duration: 0.2 }}
              />
            </div>
          );
        })}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="p-2 rounded-lg bg-secondary/50 text-center">
          <p className="text-[9px] text-muted-foreground">Trend</p>
          <p className={`text-xs font-bold ${data.velocityTrend === "Accelerating" ? "text-buy" : data.velocityTrend === "Decelerating" ? "text-sell" : "text-foreground"}`}>
            {data.velocityTrend}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-secondary/50 text-center">
          <p className="text-[9px] text-muted-foreground">Price Dir</p>
          <p className="text-xs font-bold text-foreground flex items-center justify-center gap-1">
            {data.priceDirection === "Up" ? <ArrowUpRight className="w-3 h-3 text-buy" /> : data.priceDirection === "Down" ? <ArrowDownRight className="w-3 h-3 text-sell" /> : <Minus className="w-3 h-3" />}
            {data.priceDirection}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-secondary/50 text-center">
          <p className="text-[9px] text-muted-foreground">Spikes</p>
          <p className={`text-xs font-bold ${data.spikeCount >= 3 ? "text-warning" : "text-foreground"}`}>{data.spikeCount}</p>
        </div>
      </div>

      {data.hasDivergence && (
        <div className="p-2 rounded-lg bg-sell/5 border border-sell/20">
          <p className="text-[10px] text-sell font-medium">
            ⚠️ Price moving {data.priceDirection} but velocity suggests weakening. Potential reversal signal.
          </p>
        </div>
      )}
    </div>
  );
};

// ── Smart Money Detection ─────────────────────────────────────────
const SmartMoneyDetection = ({ tickBuffer, lastDigits }: { tickBuffer: TickData[]; lastDigits: number[] }) => {
  const data = useMemo(() => {
    if (tickBuffer.length < 80) return null;

    const ticks = tickBuffer.slice(-300);

    // Detect unusual tick clustering
    const intervals: number[] = [];
    for (let i = 1; i < ticks.length; i++) {
      intervals.push(ticks[i].epoch - ticks[i - 1].epoch);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const clusterCount = intervals.filter(i => i < avgInterval * 0.3).length;
    const clusterPct = (clusterCount / intervals.length) * 100;

    // Detect large price movements (whale detection proxy)
    const movements = ticks.slice(1).map((t, i) => Math.abs(t.quote - ticks[i].quote));
    const avgMove = movements.reduce((a, b) => a + b, 0) / movements.length;
    const largeMoves = movements.filter(m => m > avgMove * 3).length;
    const whaleActivity = largeMoves >= 3 ? "High" : largeMoves >= 1 ? "Moderate" : "Low";

    // Accumulation/Distribution
    let accum = 0;
    for (let i = 10; i < ticks.length; i += 10) {
      const window = ticks.slice(i - 10, i);
      const high = Math.max(...window.map(t => t.quote));
      const low = Math.min(...window.map(t => t.quote));
      const close = window[window.length - 1].quote;
      const range = high - low;
      if (range > 0) {
        const mfm = ((close - low) - (high - close)) / range;
        accum += mfm;
      }
    }
    const adLine = accum > 2 ? "Accumulation" : accum < -2 ? "Distribution" : "Neutral";

    // Liquidity zones (price levels with high tick concentration)
    const priceRound = (p: number) => Math.round(p * 100) / 100;
    const priceMap = new Map<number, number>();
    ticks.forEach(t => {
      const p = priceRound(t.quote);
      priceMap.set(p, (priceMap.get(p) || 0) + 1);
    });
    const liquidityZones = [...priceMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([price, count]) => ({ price, count, strength: Math.min((count / ticks.length) * 300, 100) }));

    // Institutional score
    const instScore = Math.min(
      (clusterPct * 0.3) + (largeMoves * 10) + (Math.abs(accum) * 5) + (liquidityZones[0]?.strength || 0) * 0.2,
      100
    );

    return { clusterPct, whaleActivity, adLine, liquidityZones, instScore, largeMoves };
  }, [tickBuffer]);

  if (!data) return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Smart Money Detection</h3>
      </div>
      <p className="text-xs text-muted-foreground text-center py-4">Analyzing institutional patterns...</p>
    </div>
  );

  const instColor = data.instScore >= 60 ? "text-buy" : data.instScore >= 30 ? "text-warning" : "text-muted-foreground";

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Smart Money Detection</h3>
        <span className={`ml-auto text-lg font-bold ${instColor}`}>{data.instScore.toFixed(0)}%</span>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2.5 rounded-lg bg-secondary/50">
          <p className="text-[9px] text-muted-foreground">Whale Activity</p>
          <p className={`text-xs font-bold ${data.whaleActivity === "High" ? "text-buy" : data.whaleActivity === "Moderate" ? "text-warning" : "text-muted-foreground"}`}>
            {data.whaleActivity}
          </p>
          <p className="text-[9px] text-muted-foreground">{data.largeMoves} large moves detected</p>
        </div>
        <div className="p-2.5 rounded-lg bg-secondary/50">
          <p className="text-[9px] text-muted-foreground">Accum/Distribution</p>
          <p className={`text-xs font-bold ${data.adLine === "Accumulation" ? "text-buy" : data.adLine === "Distribution" ? "text-sell" : "text-foreground"}`}>
            {data.adLine}
          </p>
          <p className="text-[9px] text-muted-foreground">
            {data.adLine === "Accumulation" ? "Smart money buying" : data.adLine === "Distribution" ? "Smart money selling" : "No clear direction"}
          </p>
        </div>
      </div>

      {/* Tick Clustering */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">Tick Clustering</span>
          <span className={data.clusterPct >= 30 ? "text-warning font-bold" : "text-foreground"}>{data.clusterPct.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${data.clusterPct >= 40 ? "bg-warning" : "bg-primary/50"}`}
            animate={{ width: `${data.clusterPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Liquidity Zones */}
      <div>
        <p className="text-[10px] text-muted-foreground font-medium mb-1">Key Liquidity Zones</p>
        <div className="space-y-1">
          {data.liquidityZones.map((z, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-foreground w-20">{z.price.toFixed(2)}</span>
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div className="h-full bg-primary/40 rounded-full" animate={{ width: `${z.strength}%` }} />
              </div>
              <span className="text-[9px] text-muted-foreground">{z.count}x</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Exported Container ────────────────────────────────────────────
const InstitutionTools = ({ tickBuffer, lastDigits }: InstitutionToolsProps) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2">
      <Shield className="w-4 h-4 text-primary" />
      <h3 className="text-sm font-bold text-foreground">Institutional Analysis Terminal</h3>
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Pro</span>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <OrderFlowAnalysis tickBuffer={tickBuffer} />
      <TickVelocityDivergence tickBuffer={tickBuffer} />
    </div>
    <SmartMoneyDetection tickBuffer={tickBuffer} lastDigits={lastDigits} />
  </div>
);

export default InstitutionTools;
