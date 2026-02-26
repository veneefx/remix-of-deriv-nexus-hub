import { motion } from "framer-motion";
import { TrendingUp, BarChart3, Users, Globe, Shield, Zap, Brain, ChevronDown, Lock, CreditCard, Star, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import excitedTrader from "@/assets/excited-trader.png";
import marketGrowth from "@/assets/market-growth.png";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const features = [
  { icon: Brain, title: "AI Trading", desc: "Advanced machine learning algorithms" },
  { icon: BarChart3, title: "Premium Signals", desc: "Expert-curated trading opportunities" },
  { icon: Users, title: "Partners Program", desc: "Earn commissions with our affiliate network" },
];

const platformCards = [
  {
    title: "Partners Program",
    badge: "Popular",
    badgeColor: "bg-buy/20 text-buy",
    desc: "Join our affiliate network and earn commissions",
    details: "Partner with DTNexus and earn competitive commissions while helping traders succeed. Access advanced tracking, real-time analytics, and dedicated support.",
    features: ["Competitive commission rates", "Real-time tracking dashboard", "Advanced analytics & reporting", "Dedicated partner support", "Marketing materials & tools"],
    link: "/partners",
  },
  {
    title: "AI Trading Assistant",
    badge: "New",
    badgeColor: "bg-accent/20 text-accent",
    desc: "Powered by advanced machine learning",
    details: "Our AI system analyzes market patterns, predicts trends, and provides intelligent trading recommendations. Get real-time insights and automated strategy execution.",
    features: ["Market pattern recognition", "Predictive analytics", "Automated strategy execution", "Risk management AI", "Real-time market insights"],
    link: "/trading",
  },
  {
    title: "Premium Signals",
    badge: "Premium",
    badgeColor: "bg-primary/20 text-primary",
    desc: "Expert-curated trading opportunities",
    details: "Access professional-grade trading signals with high accuracy rates. Our expert analysts provide detailed analysis and entry/exit points for optimal trading performance.",
    features: ["High-accuracy signals", "Real-time notifications", "Detailed analysis reports", "Risk-reward ratios", "24/7 market coverage"],
    link: "/signals",
  },
];

const whatYouGet = [
  { icon: BarChart3, title: "Advanced Analytics", desc: "Get detailed insights and analysis to make informed trading decisions." },
  { icon: Shield, title: "AI-Powered Signals", desc: "Leverage artificial intelligence for accurate market predictions." },
  { icon: Zap, title: "Real-Time Updates", desc: "Stay ahead with instant notifications and live market data." },
  { icon: Globe, title: "Risk Management", desc: "Built-in tools to help you manage risk and protect your investments." },
];

const faqs = [
  { q: "What is trading?", a: "Trading involves buying and selling financial instruments to profit from price movements." },
  { q: "How does Dnexus work?", a: "Dnexus connects to the Deriv API to provide real-time trading, signals, and analytics in one platform." },
  { q: "Is my money safe?", a: "We use official Deriv OAuth for authentication. Funds are held in your Deriv account, not ours." },
  { q: "Can I use a demo account?", a: "Yes! Log in with your Deriv demo account (VRTC) to practice risk-free." },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
        </div>

        <div className="container relative py-24 md:py-36 text-center">
          <motion.div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-primary/30 bg-primary/5" {...fadeUp}>
            <span className="text-xs font-medium text-primary">🚀 Next-Gen Trading Platform</span>
          </motion.div>

          <motion.h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight" {...fadeUp} transition={{ duration: 0.6, delay: 0.1 }}>
            Trading made <span className="text-gradient-brand">easier</span>
          </motion.h1>

          <motion.p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed" {...fadeUp} transition={{ duration: 0.6, delay: 0.2 }}>
            Experience AI-powered analytics, automated trading strategies, professional signals, and secure account management - all in one unified platform.
          </motion.p>

          <motion.div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4" {...fadeUp} transition={{ duration: 0.6, delay: 0.3 }}>
            <Link to="/trading" className="flex items-center gap-2 px-8 py-3.5 bg-gradient-brand text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity glow-red">
              Start Trading Now <TrendingUp className="w-5 h-5" />
            </Link>
            <a href="https://deriv.com/signup/" target="_blank" rel="noopener" className="px-8 py-3.5 border border-border text-foreground font-semibold rounded-lg hover:bg-secondary transition-colors">
              Create Free Deriv Account
            </a>
          </motion.div>

          <motion.div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto" {...fadeUp} transition={{ duration: 0.6, delay: 0.4 }}>
            {features.map((f) => (
              <div key={f.title} className="flex flex-col items-center gap-3 p-6">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Our Platform Section */}
      <section className="py-20">
        <div className="container">
          <motion.div className="text-center mb-6" {...fadeUp}>
            <span className="text-sm text-primary font-medium">Our Platform</span>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
              Access our comprehensive suite of trading tools, from AI-powered analytics to professional signals and secure account management.
            </p>
          </motion.div>

          {/* Stats bar */}
          <motion.div className="p-6 rounded-xl bg-gradient-brand mb-12" {...fadeUp}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { icon: Activity, value: "12K+", label: "Active Traders" },
                { icon: Zap, value: "99.9%", label: "Uptime" },
                { icon: Star, value: "4.9/5", label: "User Rating" },
                { icon: Lock, value: "256-bit", label: "Encryption" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-1">
                  <s.icon className="w-5 h-5 text-primary-foreground/80" />
                  <p className="text-xl font-bold text-primary-foreground">{s.value}</p>
                  <p className="text-xs text-primary-foreground/70">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Platform cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {platformCards.map((card, i) => (
              <motion.div
                key={card.title}
                className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-foreground">{card.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.badgeColor}`}>{card.badge}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{card.details}</p>
                <ul className="space-y-1.5 mb-5">
                  {card.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="text-success">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link to={card.link} className="block text-center py-2.5 bg-gradient-brand text-primary-foreground text-sm font-semibold rounded-lg">
                  Access Platform →
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Centralized Account Management */}
      <section className="py-16">
        <div className="container">
          <motion.div className="p-8 rounded-2xl bg-card border border-border flex flex-col md:flex-row items-center gap-8" {...fadeUp}>
            <div className="flex-1 space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Centralized Account Management</h2>
              <p className="text-muted-foreground">
                Manage your account, billing, and preferences from one secure dashboard. Access all DTNexus services with single sign-on authentication.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/trading" className="px-5 py-2.5 bg-gradient-brand text-primary-foreground text-sm font-semibold rounded-lg">
                  ♡ Account Dashboard
                </Link>
                <Link to="/trading" className="px-5 py-2.5 bg-primary/20 text-primary text-sm font-semibold rounded-lg">
                  📊 Billing & Subscriptions
                </Link>
              </div>
            </div>
            <div className="w-full md:w-64 p-6 rounded-xl bg-secondary border border-border text-center">
              <Lock className="w-8 h-8 text-primary mx-auto mb-3" />
              <h4 className="text-sm font-bold text-primary">Enterprise Security</h4>
              <p className="text-xs text-muted-foreground mt-1">Bank-level encryption & compliance</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Trade With DTNexus + Trading Reimagined */}
      <section className="py-20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeUp}>
              <img src={excitedTrader} alt="Excited trader celebrating profits" className="w-full max-w-md mx-auto rounded-2xl" />
            </motion.div>
            <motion.div className="space-y-8" {...fadeUp}>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Why Trade With <span className="text-gradient-brand">DTNexus</span>
                </h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  Experience lightning-fast execution, advanced automation, and data-driven insights at zero cost. Our platform combines cutting-edge technology with proven strategies to elevate your trading performance.
                </p>
                <Link to="/education" className="inline-flex items-center gap-2 mt-4 text-primary font-medium hover:underline">Learn More →</Link>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Trading <span className="text-gradient-brand">Reimagined</span>
                </h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  DTNexus leverages AI and machine learning to deliver expert signals and quantitative analysis that professionals trust. Our comprehensive free learning materials help you master the markets while our automation tools execute with precision.
                </p>
                <Link to="/education" className="inline-flex items-center gap-2 mt-4 text-primary font-medium hover:underline">Learn More →</Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Comprehensive Market Tracker */}
      <section className="py-20 bg-card/30">
        <div className="container text-center">
          <motion.div className="flex items-center justify-center gap-3 mb-6" {...fadeUp}>
            <img src={marketGrowth} alt="Market growth" className="w-16 h-16 rounded-lg" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Comprehensive Currency Market Tracker</h2>
          </motion.div>
          <motion.p className="text-muted-foreground max-w-xl mx-auto mb-8" {...fadeUp}>
            Real-time market data with technical ratings, powered by live feeds. Track forex pairs, crypto, and synthetic indices.
          </motion.p>
          <motion.div className="p-1 rounded-xl bg-card border border-border overflow-hidden" {...fadeUp}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    {["TICKER", "PRICE", "CHG %", "CHG", "BID", "ASK", "HIGH", "LOW", "RATING"].map((h) => (
                      <th key={h} className="py-3 px-4 text-xs font-semibold text-muted-foreground text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { ticker: "EURUSD", price: "1.18080", chgPct: "0.31%", chg: "0.00362", bid: "1.18056", ask: "1.18063", high: "1.18143", low: "1.17710", rating: "Buy", rColor: "text-buy" },
                    { ticker: "GBPUSD", price: "1.90292", chgPct: "-0.37%", chg: "-0.007100", bid: "1.903620", ask: "1.903810", high: "1.912360", low: "1.900690", rating: "Sell", rColor: "text-sell" },
                    { ticker: "USDJPY", price: "184.660", chgPct: "0.61%", chg: "1.127", bid: "184.589", ask: "184.604", high: "184.760", low: "183.206", rating: "Strong Buy", rColor: "text-buy" },
                    { ticker: "AUDCAD", price: "0.971800", chgPct: "0.51%", chg: "0.004960", bid: "0.971180", ask: "0.971240", high: "0.973170", low: "0.966460", rating: "Buy", rColor: "text-buy" },
                    { ticker: "EURGBP", price: "0.87119", chgPct: "-0.12%", chg: "-0.00105", bid: "0.87114", ask: "0.87117", high: "0.87320", low: "0.87079", rating: "Buy", rColor: "text-buy" },
                  ].map((row) => (
                    <tr key={row.ticker} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 text-xs font-medium text-primary">{row.ticker}</td>
                      <td className="py-3 px-4 text-xs text-foreground">{row.price}</td>
                      <td className={`py-3 px-4 text-xs ${row.chgPct.startsWith("-") ? "text-sell" : "text-buy"}`}>{row.chgPct}</td>
                      <td className={`py-3 px-4 text-xs ${row.chg.startsWith("-") ? "text-sell" : "text-buy"}`}>{row.chg}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{row.bid}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{row.ask}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{row.high}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{row.low}</td>
                      <td className={`py-3 px-4 text-xs font-medium ${row.rColor}`}>{row.rating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What You'll Get */}
      <section className="py-20">
        <div className="container">
          <motion.h2 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-12" {...fadeUp}>
            What You'll Get
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whatYouGet.map((item, i) => (
              <motion.div key={item.title} className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors" {...fadeUp} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community */}
      <section className="py-20 bg-gradient-brand relative overflow-hidden">
        <div className="absolute inset-0 bg-background/90" />
        <div className="container relative">
          <motion.div className="text-center mb-12" {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold">Join a Growing Community of<br />Success-Driven Traders</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              DTnexus is rapidly becoming the platform of choice for traders seeking an edge in today's dynamic markets. Our innovative approach combines powerful analytics, seamless automation, and a supportive community.
            </p>
            <div className="flex flex-wrap gap-6 justify-center mt-6 text-sm text-muted-foreground">
              {["Advanced Analytics", "AI-Powered", "Expert Community", "24/7 Market Access"].map((f) => (
                <span key={f} className="flex items-center gap-1.5"><span className="text-success">⊙</span> {f}</span>
              ))}
            </div>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "12K", label: "Active Traders" },
              { value: "99K", label: "Monthly Volume (USD)" },
              { value: "24/7", label: "Market Access" },
              { value: "AI", label: "Powered Analytics" },
            ].map((stat, i) => (
              <motion.div key={stat.label} className="text-center" {...fadeUp} transition={{ delay: i * 0.1 }}>
                <div className="text-3xl md:text-4xl font-bold text-gradient-brand">{stat.value}</div>
                <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container max-w-2xl">
          <motion.div className="text-center mb-12" {...fadeUp}>
            <span className="text-sm text-primary font-medium">FAQ's</span>
            <h2 className="text-3xl font-bold mt-2">Frequently Asked Questions</h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.details key={i} className="group p-4 rounded-lg bg-card border border-border" {...fadeUp} transition={{ delay: i * 0.05 }}>
                <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-foreground">
                  {faq.q}
                  <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-card/50">
        <div className="container text-center">
          <motion.h2 className="text-3xl md:text-4xl font-bold" {...fadeUp}>
            Ready to Take Your Trading to the Next Level?
          </motion.h2>
          <motion.p className="mt-4 text-muted-foreground max-w-xl mx-auto" {...fadeUp}>
            Unlock the full potential of your trading journey with our powerful tools and expert guidance.
          </motion.p>
          <motion.div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center" {...fadeUp}>
            <Link to="/trading" className="px-8 py-3.5 bg-gradient-brand text-primary-foreground font-semibold rounded-lg glow-red">
              Start Trading Now
            </Link>
            <a href="https://deriv.com/signup/" target="_blank" rel="noopener" className="px-8 py-3.5 border border-border text-foreground font-semibold rounded-lg hover:bg-secondary transition-colors">
              Create Deriv Account
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
