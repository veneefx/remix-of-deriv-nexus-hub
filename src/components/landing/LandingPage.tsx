import { motion } from "framer-motion";
import { TrendingUp, BarChart3, Users, Globe, Shield, Zap, Brain, ChevronDown, Lock, CreditCard, Star, Activity, ExternalLink, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import traderBidAsk from "@/assets/trader-bid-ask.webp";
import traderMobile from "@/assets/trader-mobile.webp";
import traderNight from "@/assets/trader-night.webp";
import partnerNetwork from "@/assets/partner-network.png";

const DERIV_AFFILIATE_LINK = "https://deriv.com/?t=xA1buvJrGeASmsCwn5r1F2Nd7ZgqdRLk&utm_source=affiliate_187242&utm_medium=affiliate&utm_campaign=MyAffiliates&utm_content=&referrer=";

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
    details: "Partner with DTNexus and earn competitive commissions while helping traders succeed.",
    features: ["Competitive commission rates", "Real-time tracking dashboard", "Advanced analytics", "Dedicated partner support"],
    link: "/partners",
  },
  {
    title: "AI Trading Assistant",
    badge: "New",
    badgeColor: "bg-accent/20 text-accent",
    desc: "Powered by advanced machine learning",
    details: "Our AI analyzes market patterns, predicts trends, and provides intelligent trading recommendations.",
    features: ["Market pattern recognition", "Predictive analytics", "Automated execution", "Risk management AI"],
    link: "/trading",
  },
  {
    title: "Premium Signals",
    badge: "Premium",
    badgeColor: "bg-primary/20 text-primary",
    desc: "Expert-curated trading opportunities",
    details: "Access professional-grade trading signals with high accuracy rates and detailed analysis.",
    features: ["High-accuracy signals", "Real-time notifications", "Detailed analysis", "24/7 coverage"],
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
  { q: "What is DTNexus?", a: "DTNexus is an advanced third-party trading platform built on the official Deriv API. It provides AI-powered trading tools, premium signals, educational resources, and an affiliate partners program." },
  { q: "How does DTNexus work?", a: "DTNexus connects securely to your Deriv account via OAuth2 authentication. Once connected, you can use our AI-powered digit analysis tools, premium signals, and automated trading strategies." },
  { q: "Is my money safe?", a: "Absolutely. DTNexus never holds your funds — all money stays in your personal Deriv account. We use Deriv's official OAuth2 authentication, so we never see your password." },
  { q: "Can I use a demo account?", a: "Yes! You can switch between real (CR) and demo (VRTC) accounts. Demo accounts come with $10,000 in virtual funds for practicing risk-free." },
  { q: "What markets can I trade?", a: "DTNexus supports all Deriv Volatility Indices — from V10 to V250, both standard and 1-second variants. We specialize in digit trading contracts." },
  { q: "What is the commission structure?", a: "DTNexus applies a transparent 3% commission on trades. No hidden fees or subscription costs. All tools are included." },
  { q: "How does the AI trading bot work?", a: "Our AI analyzes 100+ market ticks to identify statistical patterns, frequency imbalances, and streak behaviors using mean reversion and probability-based recovery strategies." },
  { q: "What are Premium Signals?", a: "Premium Signals provide real-time RSI, MACD, Stochastic, CCI, and multiple Moving Averages calculated from live tick data, displayed as intuitive gauge charts." },
  { q: "How do I become a partner?", a: "Visit our Partners Program page and sign up for free. You earn lifetime commissions on every trade your referrals make — starting at 25% up to 40%." },
  { q: "Is DTNexus affiliated with Deriv?", a: "No. DTNexus is an independent third-party platform built using Deriv's official public API. We are not affiliated with Deriv Group." },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />

      {/* Hero - 2 column grid */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-grid-pattern" />
        <div className="absolute inset-0">
          <div className="absolute top-[40%] left-[30%] w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px]" />
        </div>

        <div className="container relative py-20 lg:py-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text */}
            <div className="space-y-8">
              <motion.div className="inline-block px-3 py-1.5 rounded-full border border-border/30 bg-secondary/50" {...fadeUp}>
                <span className="text-xs font-medium text-secondary-foreground">🚀 Next-Gen Trading Platform</span>
              </motion.div>

              <motion.h1 className="text-5xl md:text-6xl lg:text-[64px] font-bold leading-[1.1] tracking-[-1px]" {...fadeUp} transition={{ duration: 0.6, delay: 0.1 }}>
                Trading made <br />easier
              </motion.h1>

              <motion.p className="text-lg text-muted-foreground leading-relaxed max-w-[540px]" {...fadeUp} transition={{ duration: 0.6, delay: 0.2 }}>
                Experience AI-powered analytics, automated trading strategies, professional signals, and secure account management — all in one platform.
              </motion.p>

              <motion.div className="flex flex-col sm:flex-row gap-4" {...fadeUp} transition={{ duration: 0.6, delay: 0.3 }}>
                <Link to="/trading" className="inline-flex items-center justify-center gap-2 h-[52px] px-7 bg-gradient-brand text-primary-foreground font-semibold rounded-[10px] hover-lift glow-red">
                  Start Trading Now <ArrowRight className="w-5 h-5" />
                </Link>
                <a href={DERIV_AFFILIATE_LINK} target="_blank" rel="noopener" className="inline-flex items-center justify-center gap-2 h-[52px] px-7 bg-secondary/80 border border-border text-foreground font-semibold rounded-[10px] hover:bg-secondary transition-colors">
                  Create Free Account
                </a>
              </motion.div>

              {/* Feature icon row */}
              <motion.div className="flex gap-12 pt-4" {...fadeUp} transition={{ duration: 0.6, delay: 0.4 }}>
                {features.map((f) => (
                  <div key={f.title} className="flex flex-col items-center gap-2">
                    <div className="w-[42px] h-[42px] rounded-full bg-secondary/60 flex items-center justify-center">
                      <f.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                    <p className="text-xs text-muted-foreground text-center">{f.desc}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right - Images */}
            <motion.div
              className="relative hidden lg:block"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="relative">
                {/* Green glow behind */}
                <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,255,100,0.15)_0%,transparent_60%)] blur-[40px] animate-glow-pulse" />

                {/* Main trader image */}
                <img
                  src={traderNight}
                  alt="Trader using DTNexus platform at night"
                  className="relative z-10 w-full max-w-[480px] mx-auto rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] float-animation"
                />

                {/* Floating bid/ask card */}
                <motion.img
                  src={traderBidAsk}
                  alt="Trading interface showing bid and ask prices"
                  className="absolute -bottom-4 -left-8 w-32 rounded-xl shadow-xl border border-border/20 z-20"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Platform Section */}
      <section className="py-[120px]">
        <div className="container">
          <motion.div className="text-center mb-6" {...fadeUp}>
            <span className="text-sm text-primary font-medium">Our Platform</span>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
              Access our comprehensive suite of trading tools, from AI-powered analytics to professional signals.
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

      {/* Why Trade - 2 column with image */}
      <section className="py-[120px]">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div className="relative" {...fadeUp}>
              <img src={traderMobile} alt="Trader checking markets on mobile" className="w-full max-w-md mx-auto rounded-2xl shadow-2xl" />
              <div className="absolute -bottom-6 -right-6 w-48 rounded-xl overflow-hidden shadow-xl border border-border/20 hidden md:block">
                <img src={partnerNetwork} alt="Partner network growth" className="w-full" />
              </div>
            </motion.div>
            <motion.div className="space-y-8" {...fadeUp}>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  Why Trade With <span className="text-gradient-brand">DTNexus</span>
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Experience lightning-fast execution, advanced automation, and data-driven insights. Our platform combines cutting-edge technology with proven strategies.
                </p>
                <Link to="/education" className="inline-flex items-center gap-2 mt-4 text-primary font-medium hover:underline">Learn More →</Link>
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  Trading <span className="text-gradient-brand">Reimagined</span>
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  DTNexus leverages AI and machine learning to deliver expert signals and quantitative analysis. Our free learning materials help you master the markets.
                </p>
                <Link to="/education" className="inline-flex items-center gap-2 mt-4 text-primary font-medium hover:underline">Learn More →</Link>
              </div>
            </motion.div>
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
                Manage your account, billing, and preferences from one secure dashboard.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/trading" className="px-5 py-2.5 bg-gradient-brand text-primary-foreground text-sm font-semibold rounded-lg">
                  Account Dashboard
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

      {/* Market Tracker Table */}
      <section className="py-[120px] bg-card/30">
        <div className="container text-center">
          <motion.h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2" {...fadeUp}>
            Comprehensive Currency Market Tracker
          </motion.h2>
          <motion.p className="text-muted-foreground max-w-xl mx-auto mb-8" {...fadeUp}>
            Real-time market data with technical ratings.
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
      <section className="py-[120px]">
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
      <section className="py-[120px] bg-gradient-brand relative overflow-hidden">
        <div className="absolute inset-0 bg-background/90" />
        <div className="container relative">
          <motion.div className="text-center mb-12" {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold">Join a Growing Community of<br />Success-Driven Traders</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              DTnexus is rapidly becoming the platform of choice for traders seeking an edge.
            </p>
            <div className="flex flex-wrap gap-6 justify-center mt-6 text-sm text-muted-foreground">
              {["Advanced Analytics", "AI-Powered", "Expert Community", "24/7 Access"].map((f) => (
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
      <section className="py-[120px]">
        <div className="container max-w-2xl">
          <motion.div className="text-center mb-12" {...fadeUp}>
            <span className="text-sm text-primary font-medium">FAQ's</span>
            <h2 className="text-3xl font-bold mt-2">Frequently Asked Questions</h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.details key={i} className="group p-4 rounded-lg bg-card border border-border" {...fadeUp} transition={{ delay: i * 0.03 }}>
                <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-foreground">
                  {faq.q}
                  <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform shrink-0 ml-2" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* Create Deriv Account CTA */}
      <section className="py-[120px]">
        <div className="container">
          <motion.div className="rounded-2xl overflow-hidden" {...fadeUp}>
            <div className="bg-gradient-brand p-8 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
                    Create Your Free Deriv Account
                  </h2>
                  <p className="text-primary-foreground/80 leading-relaxed">
                    Don't have a Deriv account yet? Sign up in minutes and get $10,000 in virtual funds to practice with.
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Free $10,000 demo account",
                      "Trade 24/7 on synthetic indices",
                      "Instant deposits & withdrawals",
                      "Regulated & secure platform",
                      "No minimum deposit required",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-primary-foreground/90">
                        <span className="text-primary-foreground">✓</span> {item}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={DERIV_AFFILIATE_LINK}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-background text-foreground font-semibold rounded-lg hover:bg-secondary transition-colors"
                  >
                    Create Account Now <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <div className="space-y-4">
                  {[
                    { step: "1", title: "Sign Up", desc: "Create your free Deriv account in under 2 minutes" },
                    { step: "2", title: "Fund Your Account", desc: "Deposit using crypto, bank transfer, or e-wallets" },
                    { step: "3", title: "Connect to DTNexus", desc: "Link your account and start trading with AI" },
                  ].map((s) => (
                    <div key={s.step} className="flex gap-4 items-start p-4 rounded-xl bg-background/10 backdrop-blur-sm">
                      <div className="w-8 h-8 rounded-full bg-background/20 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary-foreground">{s.step}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-primary-foreground">{s.title}</h4>
                        <p className="text-xs text-primary-foreground/70 mt-1">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-[120px] bg-card/50">
        <div className="container text-center">
          <motion.h2 className="text-3xl md:text-4xl font-bold" {...fadeUp}>
            Ready to Take Your Trading to the Next Level?
          </motion.h2>
          <motion.p className="mt-4 text-muted-foreground max-w-xl mx-auto" {...fadeUp}>
            Unlock the full potential of your trading journey.
          </motion.p>
          <motion.div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center" {...fadeUp}>
            <Link to="/trading" className="px-8 py-3.5 bg-gradient-brand text-primary-foreground font-semibold rounded-lg glow-red">
              Start Trading Now
            </Link>
            <a href={DERIV_AFFILIATE_LINK} target="_blank" rel="noopener" className="px-8 py-3.5 border border-border text-foreground font-semibold rounded-lg hover:bg-secondary transition-colors">
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
