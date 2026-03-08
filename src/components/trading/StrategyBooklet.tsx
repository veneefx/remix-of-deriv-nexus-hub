import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, X, ChevronRight, Brain, Target, Activity, Gauge, Scan, Eye, Zap,
  BarChart3, Flame, Shield, FlaskConical, TrendingUp, AlertTriangle, HelpCircle,
  Lightbulb, CheckCircle2, XCircle, ArrowRight
} from "lucide-react";

interface Section {
  title: string;
  icon: React.ReactNode;
  content: (string | { type: "heading"; text: string } | { type: "example"; text: string } | { type: "tip"; text: string } | { type: "warning"; text: string })[];
}

const BOOKLET_SECTIONS: Section[] = [
  {
    title: "🟢 Getting Started — How DNexus Works",
    icon: <HelpCircle className="w-4 h-4" />,
    content: [
      { type: "heading", text: "What is DNexus?" },
      "DNexus is a digit trading intelligence platform. It connects to Deriv's synthetic markets (like Volatility 10, 75, 100, etc.) and analyzes the last digit of every price tick.",
      { type: "example", text: "If the price is 1234.56, the last digit is 6. DNexus tracks thousands of these digits to find patterns." },
      { type: "heading", text: "What are Synthetic Indices?" },
      "These are 24/7 markets created by Deriv using mathematical algorithms. They don't follow real-world news — they have predictable volatility levels, making them ideal for digit analysis.",
      "Volatility 10 = calm, small movements. Volatility 100 = wild, big swings. Volatility 250 = extreme.",
      { type: "heading", text: "How do I start?" },
      "1. Go to the Digit Edge tab — this is your main trading screen.",
      "2. Select a market from the dropdown (e.g., Volatility 75).",
      "3. Watch the digits flow in real-time. The system analyzes them automatically.",
      "4. To actually trade, click 'Connect Account' and link your Deriv account.",
      "5. Choose a strategy (Balanced, Aggressive, or ELIT), set your stake, and press START.",
      { type: "tip", text: "Start with a Demo account! It uses virtual money so you can practice risk-free." },
    ],
  },
  {
    title: "📊 Digit Edge — Your Main Trading Screen",
    icon: <Activity className="w-4 h-4" />,
    content: [
      { type: "heading", text: "What you see" },
      "Digit Edge is the heart of DNexus. It shows live digit data from whichever market you've selected.",
      { type: "heading", text: "Digit Circles" },
      "The colored circles at the top show the last 100 digits. Each circle = one digit from a tick.",
      "Colors indicate frequency: darker = that digit appears more often, lighter = less often.",
      { type: "example", text: "If digit 7 keeps appearing, its circle gets brighter/darker. This means digit 7 is 'hot' right now." },
      { type: "heading", text: "Signal Strength Bar" },
      "The bar shows a composite score (0-100%) combining 5 factors:",
      "• Frequency (25%) — How unbalanced the digit distribution is",
      "• Pressure (30%) — How long certain digits have been absent (higher = likely to appear soon)",
      "• Streak (15%) — Whether the same digit keeps repeating",
      "• Pattern (15%) — Whether recognizable sequences are forming",
      "• Volatility (15%) — How much the price is moving between ticks",
      { type: "tip", text: "When the signal bar turns green and shows >30%, the market has a detectable pattern. Below 15%, it's mostly random." },
      { type: "heading", text: "Digit Pressure" },
      "Each digit (0-9) has a 'pressure' score. When a digit hasn't appeared for many ticks, its pressure rises.",
      { type: "example", text: "If digit 3 hasn't appeared in 18 ticks, its pressure is 18. Statistically, it's 'overdue' and more likely to appear soon." },
      "This is the core of the Pressure Strategy — the bot watches for high-pressure digits and trades when they're about to break through.",
    ],
  },
  {
    title: "⚖️ Balanced Strategy (Default)",
    icon: <Target className="w-4 h-4" />,
    content: [
      { type: "heading", text: "How it works" },
      "Balanced is the default strategy. It uses a weighted confidence score from 5 data sources before deciding to trade.",
      "The formula: Signal = Frequency × 0.25 + Pressure × 0.30 + Streak × 0.15 + Pattern × 0.15 + Volatility × 0.15",
      "When this combined score exceeds 15%, the bot considers it a valid trading signal.",
      { type: "heading", text: "When does it trade?" },
      "Only when the signal score ≥ 15%. This means it waits for moderate evidence before acting.",
      { type: "example", text: "Signal at 22%: Digit 5 has high pressure (absent for 15 ticks), odd digits are dominant (frequency imbalance), and there's a streak of even digits (reversal likely). → Bot trades ODD." },
      { type: "heading", text: "Martingale Recovery" },
      "If a trade loses, the next trade's stake increases by the multiplier (default 2.2x).",
      { type: "example", text: "Stake: $3 → Loss → Next stake: $6.60 → Loss → Next stake: $14.52 → Win → recovers all losses + profit → resets to $3." },
      "Max recovery steps limit how deep this goes (default: 10 steps).",
      { type: "warning", text: "Martingale can recover losses quickly, but stakes grow fast. A long losing streak can wipe your balance. ALWAYS set a Stop Loss." },
      { type: "heading", text: "Best for" },
      "Traders who want steady, reliable performance with controlled risk. Good for beginners.",
    ],
  },
  {
    title: "🔥 Aggressive Strategy",
    icon: <Flame className="w-4 h-4" />,
    content: [
      { type: "heading", text: "How it works" },
      "Aggressive uses the same signal scoring as Balanced, but with a MUCH lower threshold: only 5%.",
      "This means it trades on almost every tick — it doesn't wait for strong confirmation.",
      { type: "heading", text: "Speed" },
      "In continuous mode, Aggressive can execute up to 10 trades per second with up to 15 concurrent open contracts.",
      { type: "example", text: "In 1 minute, Aggressive might place 200+ trades. Most will be small wins/losses, but the volume creates many opportunities." },
      { type: "heading", text: "When to use" },
      "• When the market is highly volatile (Volatility 75, 100, 250)",
      "• When you want maximum trade frequency",
      "• When you're comfortable with higher risk for potentially faster gains",
      { type: "warning", text: "This strategy burns through balance fast if the market isn't cooperative. Use with small stakes and tight Stop Loss." },
      { type: "heading", text: "Best for" },
      "Experienced traders who understand that high volume = high variance. Not recommended for beginners.",
    ],
  },
  {
    title: "👑 ELIT Strategy (Elite)",
    icon: <Brain className="w-4 h-4" />,
    content: [
      { type: "heading", text: "How it works" },
      "ELIT is the most intelligent strategy. Instead of using one score, it runs 5 independent analysis layers and only trades when they align.",
      { type: "heading", text: "The 5 Layers" },
      "Layer 1 — Frequency Analysis (25 points max): Counts how often each digit appears. If any digit is below 5% (rare) or above 15% (dominant), this layer activates.",
      { type: "example", text: "Digit 2 appears only 3% of the time → Rare digit detected → Layer 1 scores 20/25." },
      "Layer 2 — Momentum Shift (20 points max): Compares the last 50 ticks vs previous 50 ticks. If odd digits went from 45% to 65%, that's a strong momentum shift.",
      { type: "example", text: "Recent: 68% odd, 32% even. Previous: 50/50. → Strong odd momentum → Layer 2 scores 18/20." },
      "Layer 3 — Streak Detection (20 points max): Looks for repeating digits. If digit 7 appeared 3 times in a row, reversal probability increases.",
      "Layer 4 — Digit Clustering (20 points max): Checks if high digits (7,8,9) or low digits (0,1,2) are dominating. If 60%+ of recent 30 ticks are all high digits, cluster is active.",
      "Layer 5 — Tick Speed (15 points max): Faster tick speed = more rapid pattern formation. If ticks are arriving at 5+/sec, this layer boosts the score.",
      { type: "heading", text: "Trade Decision" },
      "All 5 layers combine: max score = 100. ELIT only trades when score ≥ 70.",
      "This means at least 3-4 layers must agree before a trade fires.",
      { type: "heading", text: "Auto Contract Selection" },
      "ELIT automatically picks the best contract type:",
      "• Odd momentum detected → trades ODD",
      "• Even momentum detected → trades EVEN",
      "• Rare digit found → trades DIFFERS",
      "• High cluster → trades OVER",
      "• Low cluster → trades UNDER",
      "• Streak detected → trades reversal (DIFFERS)",
      { type: "tip", text: "ELIT fires less often than Balanced/Aggressive, but when it does fire, the probability of winning is significantly higher because 3+ independent signals agree." },
      { type: "heading", text: "Best for" },
      "Premium users who want the highest win rate and are okay with fewer trades. Quality over quantity.",
    ],
  },
  {
    title: "🛡️ Conservative Strategy",
    icon: <Shield className="w-4 h-4" />,
    content: [
      { type: "heading", text: "How it works" },
      "Uses the same signal scoring as Balanced but requires 25% threshold — only trades when there's strong evidence.",
      "Fewest trades of all strategies, but highest confidence per trade.",
      { type: "heading", text: "When to use" },
      "• When you have a small balance and can't afford many losses",
      "• When the market is choppy/sideways",
      "• When you want to preserve capital while still participating",
      { type: "tip", text: "Conservative + small stake + tight stop loss = the safest way to learn live trading." },
    ],
  },
  {
    title: "🎯 Live Probability Engine",
    icon: <Eye className="w-4 h-4" />,
    content: [
      { type: "heading", text: "What it does" },
      "Calculates the probability of each digit (0-9) appearing next based on historical frequency.",
      { type: "heading", text: "How to read it" },
      "Each digit shows two bars:",
      "• Short-Term (last 50 ticks) — recent momentum",
      "• Long-Term (last 300 ticks) — overall statistical average",
      { type: "example", text: "Digit 7: Short-term 18%, Long-term 12%. This means digit 7 is appearing MORE than usual right now (momentum rising). It might continue, or it might reverse." },
      { type: "heading", text: "Top 3 Predictions" },
      "The top section shows the three most likely digits with their confidence percentages.",
      { type: "heading", text: "Rare Digit Alert" },
      "If a digit hasn't appeared in the last 20 ticks, a ⚠️ alert appears. This is a 'mean reversion' signal — statistically, that digit is overdue.",
      { type: "heading", text: "Bias Meters" },
      "Odd/Even Bias: Shows if the market favors odd (1,3,5,7,9) or even (0,2,4,6,8) digits.",
      "High/Low Bias: Shows if digits 5-9 or 0-4 are more common.",
      { type: "tip", text: "Use the bias meters to decide between ODD/EVEN or OVER/UNDER contracts. If Odd Bias shows 63%, ODD contracts have an edge." },
    ],
  },
  {
    title: "🌡️ Digit Heatmap Matrix",
    icon: <Scan className="w-4 h-4" />,
    content: [
      { type: "heading", text: "What it shows" },
      "A color-coded grid where rows are digits (0-9) and columns are time blocks (every 20 ticks).",
      "Dark squares = that digit appeared frequently in that block. Light squares = rare.",
      { type: "heading", text: "How to use it" },
      "Look for 'hot zones' — streaks of dark cells in a row. This means a digit was dominant during that period.",
      "Look for 'cold zones' — streaks of light cells. This means a digit was absent, building pressure.",
      { type: "example", text: "If digit 3 has 5 dark squares in a row, it's been consistently frequent. If suddenly a light square appears, it might be shifting." },
      { type: "tip", text: "The heatmap reveals patterns invisible in raw numbers. It's like seeing the 'weather map' of digit behavior." },
    ],
  },
  {
    title: "🧭 Confluence Engine",
    icon: <Gauge className="w-4 h-4" />,
    content: [
      { type: "heading", text: "What is confluence?" },
      "Confluence means 'multiple signals agreeing.' When 3+ independent indicators point the same direction, the probability of being right increases dramatically.",
      { type: "heading", text: "The 6 Signals" },
      "1. Digit Imbalance (20%): How far the digit distribution is from expected 10% each",
      "2. Momentum Shift (20%): Whether odd or even digits are gaining/losing ground",
      "3. Pattern Strength (20%): How many repeating structures exist",
      "4. Volatility (15%): How much the price jumps between ticks",
      "5. Tick Speed (15%): How fast ticks are arriving",
      "6. Probability Bias (10%): Gap between the most and least common digit",
      { type: "heading", text: "Score Meaning" },
      "0-29%: Weak — market is random, no clear pattern",
      "30-49%: Developing — patterns forming but not confirmed",
      "50-69%: Moderate — good trading conditions, multiple signals active",
      "70-100%: Strong — excellent conditions, high-probability trades",
      { type: "tip", text: "Only trade when confluence is 50%+. The higher the confluence, the more confident the signal. This is what professional trading desks use." },
    ],
  },
  {
    title: "🔬 Strategy Lab (Backtester)",
    icon: <FlaskConical className="w-4 h-4" />,
    content: [
      { type: "heading", text: "What it does" },
      "Lets you test trading strategies on PAST data before risking real money. Like a flight simulator for trading.",
      { type: "heading", text: "How to use it step by step" },
      "1. Select a market (e.g., Volatility 75)",
      "2. Click 'Load Ticks' — downloads up to 5,000 historical ticks",
      "3. Configure your strategy: Choose contract type (Odd/Even/Over/Under), stake amount, and entry conditions",
      "4. Set entry conditions — when should the bot trade? Options include:",
      "   • Odd Dominance > 60%: Trade when odd digits are dominant",
      "   • Digit Streak ≥ 2: Trade when a digit repeats",
      "   • High Volatility: Trade during big price movements",
      "   • Digit Imbalance: Trade when distribution is uneven",
      "5. Click 'Run Simulation' — the system replays all ticks and simulates every trade",
      { type: "heading", text: "Understanding Results" },
      "Win Rate: Percentage of trades won. Above 55% is good.",
      "Max Drawdown: The biggest loss streak in dollar terms. Lower = better.",
      "Net Profit: Total wins minus total losses.",
      "Strategy Score (0-100): Overall rating. 70+ = strong strategy.",
      { type: "example", text: "You test ODD contracts with 'Odd Dominance > 60%' on Volatility 75. Result: 62% win rate, $84 profit, Score: 74. This strategy works!" },
      { type: "heading", text: "Playback" },
      "Use Play/Pause/Step to watch trades happen one by one. Green = win, Red = loss. See exactly when and why each trade fired.",
      { type: "tip", text: "Always backtest a strategy before using it live. If it doesn't work on historical data, it probably won't work in real-time either." },
    ],
  },
  {
    title: "📡 Market Scanner",
    icon: <Zap className="w-4 h-4" />,
    content: [
      { type: "heading", text: "What it does" },
      "Scans ALL volatility markets simultaneously and ranks them by trading opportunity.",
      { type: "heading", text: "How to use it" },
      "1. Click 'Start Scan' — connects to multiple markets at once",
      "2. Watch the table fill with real-time data for each market",
      "3. Markets are ranked by Confluence Score — highest = best opportunity right now",
      { type: "heading", text: "Opportunity Levels" },
      "🔥 Hot: Strong patterns detected, multiple signals aligned",
      "⚡ Active: Good conditions, worth monitoring",
      "💤 Quiet: Market is random, no clear opportunity",
      { type: "heading", text: "Deep Analysis" },
      "Click any market row to see detailed analysis: digit distribution, momentum, patterns, cycles, and probability projections.",
      { type: "tip", text: "Use the scanner to find the BEST market before trading. Don't just stick with one — move to where the opportunities are." },
    ],
  },
  {
    title: "📈 DAT — Dynamic Analysis Terminal",
    icon: <BarChart3 className="w-4 h-4" />,
    content: [
      { type: "heading", text: "What it does" },
      "DAT is a premium analysis dashboard that shows deep statistical metrics for any selected market.",
      { type: "heading", text: "Key Features" },
      "• Digit Frequency Table: Shows each digit's appearance percentage with color-coded bars",
      "• Mini Heatmap: Compact version of the digit heatmap for quick visual scanning",
      "• Frequency Sparkline: Tiny chart showing how odd/even ratio changes over time",
      "• Confluence Mini: Quick view of the combined signal strength",
      "• Strategy Signals: Shows which strategies (Aggressive/Balanced/ELIT) would fire right now",
      "• Pattern Grid: Visual O/U/N grid showing over/under distribution",
      "• Sequence Analysis: Finds the most common patterns in the grid",
      { type: "heading", text: "Thresholds" },
      "You can set custom Over/Under thresholds to see how different digit splits affect the analysis.",
      { type: "example", text: "Over threshold = 4: Any digit > 4 counts as 'Over' (5,6,7,8,9). Under threshold = 5: Any digit < 5 counts as 'Under' (0,1,2,3,4)." },
      { type: "tip", text: "DAT is best for detailed research. Use it alongside Digit Edge for the most complete picture." },
    ],
  },
  {
    title: "⚡ Continuous Execution Mode",
    icon: <Zap className="w-4 h-4" />,
    content: [
      { type: "heading", text: "What it is" },
      "The trading engine fires trades continuously — on every tick that meets the strategy's conditions — without waiting for previous trades to finish.",
      { type: "heading", text: "How it's different from normal mode" },
      "Normal: Trade → Wait for result → Trade again (slow, sequential)",
      "Continuous: Trade → Trade → Trade → Trade (fast, parallel, results tracked separately)",
      { type: "heading", text: "Speed" },
      "The engine processes each tick in under 5ms and can trigger trades within 10ms.",
      "Rate limited to 10 trades/second and 15 simultaneous open contracts for WebSocket stability.",
      { type: "heading", text: "What stops the bot?" },
      "Only 3 things:",
      "1. You press STOP",
      "2. Take Profit is reached (session profit hits your target)",
      "3. Stop Loss is reached (session loss hits your limit)",
      "The bot NEVER stops because of loss streaks. It keeps going until one of these conditions is met.",
      { type: "warning", text: "Continuous mode with no Stop Loss can drain your balance. ALWAYS set a Stop Loss before starting." },
    ],
  },
  {
    title: "📦 Single & Bulk Trade Mode",
    icon: <Target className="w-4 h-4" />,
    content: [
      { type: "heading", text: "Single Trade Mode (Default)" },
      "The bot places one trade per tick. This is the safest and most controlled mode.",
      "Each trade follows your selected strategy and applies martingale only if the previous trade lost.",
      { type: "example", text: "Tick arrives → Signal detected → 1 trade placed → Wait for next tick → Repeat." },
      { type: "heading", text: "Bulk Trade Mode" },
      "Toggle 'Bulk' in the trading controls. This lets you fire multiple trades per tick (2–10).",
      "Each trade in the batch executes independently with its own contract. Martingale applies to the shared loss counter — NOT per individual bulk trade.",
      { type: "example", text: "Bulk count = 5. Tick arrives → Signal detected → 5 trades fire simultaneously. Each resolves independently. If 3 win and 2 lose, the loss counter increments by 2." },
      { type: "heading", text: "When to use Bulk Mode" },
      "• When the signal is very strong (confluence 70%+) and you want maximum exposure",
      "• When using Aggressive strategy on highly volatile markets",
      "• When you want to accumulate profits faster during a hot streak",
      { type: "warning", text: "Bulk mode multiplies your risk! 5 bulk trades × $3 stake = $15 exposed per tick. Combined with martingale, this can escalate very fast. Use small stakes and tight Stop Loss." },
      { type: "heading", text: "How martingale works with Bulk" },
      "Martingale tracks consecutive LOSING trades across all trades (single or bulk). When a trade wins, the loss counter resets and stake returns to base.",
      "If you're in Bulk mode and 3 out of 5 trades lose, the loss counter goes up by 3. The next batch will use the martingale-adjusted stake.",
      { type: "tip", text: "Start with Bulk count = 2 and small stakes to understand the behavior before scaling up." },
    ],
  },
  {
    title: "🛡️ Risk Management — MUST READ",
    icon: <Shield className="w-4 h-4" />,
    content: [
      { type: "heading", text: "Why this matters" },
      "Risk management is the MOST important skill in trading. Even the best strategy will lose money without proper risk controls.",
      { type: "heading", text: "Take Profit (TP)" },
      "Sets a profit target. When your session profit reaches this amount, the bot stops automatically.",
      { type: "example", text: "TP = $50. You start trading. After winning several trades, your total profit hits $50. Bot stops. You lock in the profit." },
      { type: "heading", text: "Stop Loss (SL)" },
      "Sets a maximum loss. When your session loss reaches this amount, the bot stops.",
      { type: "example", text: "SL = $20. Bad streak happens. Total loss hits $20. Bot stops. You only lost $20 instead of your entire balance." },
      { type: "warning", text: "NEVER trade without Stop Loss. This is the #1 rule. Even professional traders use stop losses." },
      { type: "heading", text: "Martingale" },
      "After a losing trade, the next trade uses a higher stake to recover the loss.",
      "Multiplier (default 2.2x): Each loss multiplies the stake. Win resets to original.",
      "Max Steps (default 10): Limits how many times the stake can multiply. After max steps, stake resets.",
      { type: "example", text: "Stake: $3 → Loss → $6.60 → Loss → $14.52 → Loss → $31.94 → Win ($31.94 × payout) → Recovers all losses + profit → Reset to $3" },
      { type: "warning", text: "Martingale works BUT stakes grow exponentially. 10 consecutive losses at 2.2x multiplier means your stake is 2655x the original! Use with max step limits and ALWAYS have Stop Loss." },
      { type: "heading", text: "Smart Risker" },
      "Automatically secures 50% of your profits at milestone amounts.",
      { type: "example", text: "You reach $100 profit. Smart Risker locks in $50. Even if you lose from here, you keep at least $50." },
      { type: "heading", text: "Golden Rules" },
      "1. Always set Stop Loss BEFORE starting the bot",
      "2. Never risk more than 5% of your balance per session",
      "3. Start with small stakes until you understand the market",
      "4. Use Demo account first to practice",
      "5. If you hit Stop Loss, STOP for the day. Don't chase losses.",
      { type: "tip", text: "Professional traders risk 1-2% of their capital per trade. If your balance is $100, trade with $1-2 stakes maximum." },
    ],
  },
  {
    title: "💡 Analysis Terminal (Premium)",
    icon: <TrendingUp className="w-4 h-4" />,
    content: [
      { type: "heading", text: "Overview" },
      "The Analysis tab contains advanced tools used by professional trading systems. Available to premium members.",
      { type: "heading", text: "Volatility Scanner" },
      "Measures how much the price moves between ticks. Levels: Low → Moderate → High → Extreme.",
      "Low volatility = stable market, fewer opportunities. High = volatile, more opportunities (and risks).",
      { type: "heading", text: "Tick Speed Monitor" },
      "Shows how many ticks arrive per second. Normal is ~1-2/sec. Above 3 = fast market.",
      { type: "heading", text: "Pattern Recognition Engine" },
      "Detects specific patterns: Alternating (odd-even-odd-even), Pairs (5-5, 3-3), and Cycles.",
      { type: "heading", text: "AI Optimizer" },
      "Uses all analysis data to recommend the best contract type and timing.",
      { type: "example", text: "AI says: 'ODD contracts recommended (58% odd bias, rising momentum, 72% confluence)'. This means the AI sees a strong odd signal." },
      { type: "heading", text: "Institution Tools" },
      "Order Flow: Shows buy vs sell pressure in the tick stream.",
      "Tick Velocity: Detects price/momentum divergence — when price moves one way but tick patterns suggest reversal.",
      "Smart Money: Identifies unusual tick patterns that suggest large-scale activity.",
      { type: "tip", text: "Analysis tools don't trade for you — they give you information. Use them to decide WHEN and WHAT to trade." },
    ],
  },
  {
    title: "❓ Common Questions",
    icon: <HelpCircle className="w-4 h-4" />,
    content: [
      { type: "heading", text: "Can I lose money?" },
      "Yes. Trading involves real financial risk. Never trade with money you can't afford to lose. Use Demo accounts to practice first.",
      { type: "heading", text: "Which strategy should I start with?" },
      "Start with Balanced + small stakes ($1-3) + Stop Loss of $10-20. This gives you a safe learning environment.",
      { type: "heading", text: "Which market is best?" },
      "There's no single best market. Use the Market Scanner to find which one has the strongest signals right now. Popular choices: Volatility 75 (good balance), Volatility 10 (calm), Volatility 100 (volatile).",
      { type: "heading", text: "Why does the bot lose sometimes?" },
      "No strategy wins 100% of the time. Even a 60% win rate is excellent. The key is that your wins are bigger than your losses over time.",
      { type: "heading", text: "What's the difference between Demo and Real?" },
      "Demo uses virtual money — completely risk-free. Real uses your actual deposited funds. Always test on Demo first.",
      { type: "heading", text: "Can I run DNexus on my phone?" },
      "Yes! The interface is fully responsive. The bottom navigation bar gives you quick access to all features on mobile.",
    ],
  },
];

// ── Renderer for rich content ──
const ContentLine = ({ item }: { item: Section["content"][number] }) => {
  if (typeof item === "string") {
    return <p className="text-[11px] text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/10">{item}</p>;
  }
  if (item.type === "heading") {
    return <p className="text-xs font-bold text-foreground mt-3 mb-1 flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-primary" />{item.text}</p>;
  }
  if (item.type === "example") {
    return (
      <div className="ml-3 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
        <p className="text-[10px] text-primary font-medium flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Example</p>
        <p className="text-[11px] text-foreground mt-0.5">{item.text}</p>
      </div>
    );
  }
  if (item.type === "tip") {
    return (
      <div className="ml-3 px-3 py-2 rounded-lg bg-buy/5 border border-buy/10">
        <p className="text-[10px] text-buy font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Pro Tip</p>
        <p className="text-[11px] text-foreground mt-0.5">{item.text}</p>
      </div>
    );
  }
  if (item.type === "warning") {
    return (
      <div className="ml-3 px-3 py-2 rounded-lg bg-sell/5 border border-sell/10">
        <p className="text-[10px] text-sell font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Warning</p>
        <p className="text-[11px] text-foreground mt-0.5">{item.text}</p>
      </div>
    );
  }
  return null;
};

const StrategyBooklet = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  return (
    <>
      {/* Floating Booklet Button — bottom-left */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 left-4 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:shadow-xl"
        whileHover={{ scale: 1.1, rotate: -5 }}
        whileTap={{ scale: 0.9 }}
        animate={{ y: [0, -4, 0] }}
        transition={{ y: { repeat: Infinity, duration: 2.5, ease: "easeInOut" } }}
        title="Strategy Guide"
      >
        <BookOpen className="w-5 h-5" />
      </motion.button>

      {/* Booklet Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/40 backdrop-blur-[2px]"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-4 left-4 right-4 z-50 max-w-lg max-h-[75vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">DNexus Complete Guide</h2>
                    <p className="text-[10px] text-muted-foreground">{BOOKLET_SECTIONS.length} topics — tap any to learn</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
                {BOOKLET_SECTIONS.map((section, idx) => (
                  <div key={idx} className="rounded-xl border border-border overflow-hidden">
                    <button
                      onClick={() => setExpandedSection(expandedSection === idx ? null : idx)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${expandedSection === idx ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                        {section.icon}
                      </div>
                      <span className="text-xs font-semibold text-foreground flex-1">{section.title}</span>
                      <motion.div animate={{ rotate: expandedSection === idx ? 90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {expandedSection === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                            {section.content.map((item, li) => (
                              <ContentLine key={li} item={item} />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                <p className="text-[9px] text-muted-foreground text-center pt-3 pb-1">
                  ⚠️ All analysis is for guidance only. Not financial advice. Trade responsibly.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default StrategyBooklet;
