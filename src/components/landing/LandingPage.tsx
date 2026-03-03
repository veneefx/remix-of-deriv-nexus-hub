import { motion } from "framer-motion";
import { TrendingUp, BarChart3, Users, Globe, Shield, Zap, Brain, ChevronDown, Lock, CreditCard, Star, Activity, ExternalLink, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import MarketTracker from "@/components/trading/MarketTracker";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import traderBidAsk from "@/assets/trader-bid-ask.webp";
import traderMobile from "@/assets/trader-mobile.webp";
import traderNight from "@/assets/trader-night.webp";
import partnerNetwork from "@/assets/partner-network.png";
import phoneTrade1 from "@/assets/phone-trading-1.webp";
import phoneTrade2 from "@/assets/phone-trading-2.webp";
import phoneChart from "@/assets/phone-chart.webp";

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
    details: "Partner with DNexus and earn competitive commissions while helping traders succeed.",
    features: ["Competitive commission rates", "Real-time tracking dashboard", "Advanced analytics", "Dedicated partner support", "Marketing materials & tools"],
    link: "/partners",
    image: phoneTrade1,
  },
  {
    title: "AI Trading Assistant",
    badge: "New",
    badgeColor: "bg-accent/20 text-accent",
    desc: "Powered by advanced machine learning",
    details: "Our AI analyzes market patterns, predicts trends, and provides intelligent trading recommendations.",
    features: ["Market pattern recognition", "Predictive analytics", "Automated execution", "Risk management AI", "Real-time market insights"],
    link: "/trading",
    image: phoneTrade2,
  },
  {
    title: "Premium Signals",
    badge: "Premium",
    badgeColor: "bg-primary/20 text-primary",
    desc: "Expert-curated trading opportunities",
    details: "Access professional-grade trading signals with high accuracy rates and detailed analysis.",
    features: ["High-accuracy signals", "Real-time notifications", "Detailed analysis", "Risk-reward ratios", "24/7 market coverage"],
    link: "/signals",
    image: phoneChart,
  },
];

const whatYouGet = [
  { icon: BarChart3, title: "Advanced Analytics", desc: "Get detailed insights and analysis to make informed trading decisions." },
  { icon: Shield, title: "AI-Powered Signals", desc: "Leverage artificial intelligence for accurate market predictions." },
  { icon: Zap, title: "Real-Time Updates", desc: "Stay ahead with instant notifications and live market data." },
  { icon: Globe, title: "Risk Management", desc: "Built-in tools to help you manage risk and protect your investments." },
];

const faqs = [
  { q: "What is DNexus?", a: "DNexus is an advanced third-party trading platform built on the official Deriv API. It provides AI-powered trading tools, premium signals, educational resources, and an affiliate partners program." },
  { q: "How does DNexus work?", a: "DNexus connects securely to your Deriv account via OAuth2 authentication. Once connected, you can use our AI-powered digit analysis tools, premium signals, and automated trading strategies." },
  { q: "Is my money safe?", a: "Absolutely. DNexus never holds your funds — all money stays in your personal Deriv account. We use Deriv's official OAuth2 authentication, so we never see your password." },
  { q: "Can I use a demo account?", a: "Yes! You can switch between real (CR) and demo (VRTC) accounts. Demo accounts come with $10,000 in virtual funds for practicing risk-free." },
  { q: "What markets can I trade?", a: "DNexus supports all Deriv Volatility Indices — from V10 to V250, both standard and 1-second variants. We specialize in digit trading contracts." },
  { q: "What is the commission structure?", a: "DNexus applies a transparent 3% commission on trades. No hidden fees or subscription costs. All tools are included." },
  { q: "How does the AI trading bot work?", a: "Our AI analyzes 100+ market ticks to identify statistical patterns, frequency imbalances, and streak behaviors using mean reversion and probability-based recovery strategies." },
  { q: "What are Premium Signals?", a: "Premium Signals provide real-time RSI, MACD, Stochastic, CCI, and multiple Moving Averages calculated from live tick data, displayed as intuitive gauge charts." },
  { q: "How do I become a partner?", a: "Visit our Partners Program page and sign up for free. You earn lifetime commissions on every trade your referrals make — starting at 25% up to 40%." },
  { q: "Is DNexus affiliated with Deriv?", a: "No. DNexus is an independent third-party platform built using Deriv's official public API. We are not affiliated with Deriv Group." },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-dark flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-grid-pattern" />
        <div className="absolute inset-0">
          <div className="absolute top-[40%] left-[30%] w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px]" />
        </div>

        <div className="w-full max-w-[1400px] mx-auto px-8 relative py-20 lg:py-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <motion.div className="inline-block px-3 py-1.5 rounded-full border border-border/30 bg-secondary/50" {...fadeUp}>
                <span className="text-xs font-medium text-secondary-foreground font-sans">🚀 Next-Gen Trading Platform</span>
              </motion.div>

              <motion.h1 className="text-5xl md:text-6xl lg:text-[64px] font-bold leading-[1.1] tracking-[-1px]" {...fadeUp} transition={{ duration: 0.6, delay: 0.1 }}>
                Trading made <br />easier
              </motion.h1>

              <motion.p className="text-lg text-muted-foreground leading-relaxed max-w-[540px] font-sans" {...fadeUp} transition={{ duration: 0.6, delay: 0.2 }}>
                Experience AI-powered analytics, automated trading strategies, professional signals, and secure account management — all in one platform.
              </motion.p>

              <motion.div className="flex flex-col sm:flex-row gap-4" {...fadeUp} transition={{ duration: 0.6, delay: 0.3 }}>
                <Link to="/trading" className="inline-flex items-center justify-center gap-2 h-[52px] px-7 bg-gradient-brand text-primary-foreground font-semibold rounded-[10px] hover-lift glow-red font-sans">
                  Start Trading Now <ArrowRight className="w-5 h-5" />
                </Link>
                <a href={DERIV_AFFILIATE_LINK} target="_blank" rel="noopener" className="inline-flex items-center justify-center gap-2 h-[52px] px-7 bg-secondary/80 border border-border text-foreground font-semibold rounded-[10px] hover:bg-secondary transition-colors font-sans">
                  Create Free Account
                </a>
              </motion.div>

              <motion.div className="flex flex-wrap gap-8 sm:gap-12 pt-4" {...fadeUp} transition={{ duration: 0.6, delay: 0.4 }}>
                {features.map((f) => (
                  <div key={f.title} className="flex flex-col items-center gap-2">
                    <div className="w-[42px] h-[42px] rounded-full bg-secondary/60 flex items-center justify-center">
                      <f.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground font-sans">{f.title}</h3>
                    <p className="text-xs text-muted-foreground text-center font-sans">{f.desc}</p>
                  </div>
                ))}
              </motion.div>

              <motion.div className="mt-6 hidden md:block" {...fadeUp} transition={{ duration: 0.6, delay: 0.5 }}>
                <img src={traderNight} alt="Trader using DNexus" className="w-72 rounded-2xl shadow-2xl float-animation object-cover" />
              </motion.div>
            </div>

            <motion.div
              className="relative hidden lg:flex justify-center"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,255,100,0.20)_0%,transparent_60%)] blur-[40px] animate-glow-pulse" />
              <img src={phoneTrade2} alt="DNexus mobile trading interface" className="relative z-10 w-[340px] rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.6)] transform -rotate-[4deg] float-animation object-contain" />
              <motion.img src={traderBidAsk} alt="Bid and ask prices" className="absolute -bottom-6 -left-4 w-28 rounded-xl shadow-xl border border-border/20 z-20 object-cover" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 1 }} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Platform Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-8">
          <motion.div className="text-center mb-6" {...fadeUp}>
            <span className="text-sm text-primary font-medium font-sans">Our Platform</span>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto font-sans">
              Access our comprehensive suite of trading tools, from AI-powered analytics to professional signals.
            </p>
          </motion.div>

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
                  <p className="text-xl font-bold text-primary-foreground font-sans">{s.value}</p>
                  <p className="text-xs text-primary-foreground/70 font-sans">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div className="flex justify-center gap-6 mb-12 overflow-hidden" {...fadeUp}>
            {[phoneTrade1, phoneTrade2, phoneChart].map((img, i) => (
              <motion.img
                key={i}
                src={img}
                alt={`Platform screenshot ${i + 1}`}
                className="w-40 sm:w-48 md:w-56 rounded-2xl shadow-2xl shadow-black/30 border border-border/20 object-cover"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              />
            ))}
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {platformCards.map((card, i) => (
              <motion.div key={card.title} className="rounded-2xl bg-card border border-border hover:border-primary/30 transition-all overflow-hidden group" {...fadeUp} transition={{ delay: i * 0.1 }}>
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-foreground font-sans">{card.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.badgeColor} font-sans`}>{card.badge}</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-sans">{card.details}</p>
                  <ul className="space-y-1.5">
                    {card.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
                        <span className="text-success">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link to={card.link} className="block text-center py-2.5 bg-gradient-brand text-primary-foreground text-sm font-semibold rounded-lg font-sans">
                    Access Platform →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trade On Our Next-Gen Platform */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div className="relative" {...fadeUp}>
              <img src={traderMobile} alt="Trader checking markets on mobile" className="w-full max-w-md mx-auto rounded-2xl shadow-2xl object-cover" />
              <div className="absolute -bottom-6 -right-6 w-48 rounded-xl overflow-hidden shadow-xl border border-border/20 hidden md:block">
                <img src={partnerNetwork} alt="Partner network growth" className="w-full object-cover" />
              </div>
            </motion.div>
            <motion.div className="space-y-6" {...fadeUp}>
              <span className="text-sm text-primary font-medium font-sans">Trade On Our</span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                Next-Gen Trading Platform
              </h2>
              <p className="text-muted-foreground leading-relaxed font-sans">
                Experience the future of trading with our cutting-edge platform powered by advanced algorithms and AI. From lightning-fast high-frequency trading to sophisticated quantitative strategies, our tools give you the edge.
              </p>
              <ul className="space-y-3">
                {[
                  "High-Frequency Trading — Execute trades in microseconds",
                  "Algorithmic Bots — Automate your strategies 24/7",
                  "Powerful Deriv Trading — Access global derivatives markets",
                  "AI-Powered Quant Trading — Machine learning predictions",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground font-sans">
                    <span className="text-primary mt-0.5">⊕</span> {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <Link to="/trading" className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-brand text-primary-foreground text-sm font-semibold rounded-lg font-sans">
                  Access Trading Hub →
                </Link>
                <a href={DERIV_AFFILIATE_LINK} target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-6 py-2.5 bg-secondary border border-border text-foreground text-sm font-semibold rounded-lg font-sans">
                  Sync With Deriv →
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Centralized Account Management */}
      <section className="py-16">
        <div className="max-w-[1400px] mx-auto px-8">
          <motion.div className="p-8 rounded-2xl bg-card border border-border flex flex-col md:flex-row items-center gap-8" {...fadeUp}>
            <div className="flex-1 space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Centralized Account Management</h2>
              <p className="text-muted-foreground font-sans">
                Manage your account, billing, and preferences from one secure dashboard. Access all DNexus services with single sign-on authentication.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/trading" className="px-5 py-2.5 bg-gradient-brand text-primary-foreground text-sm font-semibold rounded-lg font-sans">
                  ◎ Account Dashboard
                </Link>
                <Link to="/trading" className="px-5 py-2.5 bg-primary/20 text-primary text-sm font-semibold rounded-lg font-sans">
                  📊 Billing & Subscriptions
                </Link>
              </div>
            </div>
            <div className="w-full md:w-64 p-6 rounded-xl bg-secondary border border-border text-center">
              <Lock className="w-8 h-8 text-primary mx-auto mb-3" />
              <h4 className="text-sm font-bold text-primary font-sans">Enterprise Security</h4>
              <p className="text-xs text-muted-foreground mt-1 font-sans">Bank-level encryption & compliance</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Trade With DNexus */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div className="relative" {...fadeUp}>
              <img src={traderNight} alt="Trader working" className="w-full max-w-md mx-auto rounded-2xl shadow-2xl float-animation object-cover" />
            </motion.div>
            <motion.div className="space-y-8" {...fadeUp}>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  Why Trade With <span className="text-gradient-brand">DNexus</span>
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed font-sans">
                  Experience lightning-fast execution, advanced automation, and data-driven insights at zero cost. Our platform combines cutting-edge technology with proven strategies to elevate your trading performance.
                </p>
                <Link to="/education" className="inline-flex items-center gap-2 mt-4 text-primary font-medium hover:underline font-sans">Learn More →</Link>
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  Trading <span className="text-gradient-brand">Reimagined</span>
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed font-sans">
                  DNexus leverages AI and machine learning to deliver expert signals and quantitative analysis. Our free learning materials help you master the markets.
                </p>
                <Link to="/education" className="inline-flex items-center gap-2 mt-4 text-primary font-medium hover:underline font-sans">Learn More →</Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Market Tracker */}
      <section className="py-16 md:py-24 bg-card/30">
        <div className="max-w-[1400px] mx-auto px-8 text-center">
          <motion.h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2" {...fadeUp}>
            Comprehensive Currency Market Tracker
          </motion.h2>
          <motion.p className="text-muted-foreground max-w-xl mx-auto mb-8 font-sans" {...fadeUp}>
            Real-time market data with technical ratings.
          </motion.p>
          <motion.div {...fadeUp}>
            <MarketTracker />
          </motion.div>
        </div>
      </section>

      {/* What You'll Get */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-8">
          <motion.h2 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-12 font-sans" {...fadeUp}>
            What You'll Get
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whatYouGet.map((item, i) => (
              <motion.div key={item.title} className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors" {...fadeUp} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 font-sans">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community */}
      <section className="py-16 md:py-24 bg-gradient-brand relative overflow-hidden">
        <div className="absolute inset-0 bg-background/90" />
        <div className="max-w-[1400px] mx-auto px-8 relative">
          <motion.div className="text-center mb-12" {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold">Join a Growing Community of<br />Success-Driven Traders</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto font-sans">
              DNexus is rapidly becoming the platform of choice for traders seeking an edge.
            </p>
            <div className="flex flex-wrap gap-6 justify-center mt-6 text-sm text-muted-foreground font-sans">
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
                <div className="text-3xl md:text-4xl font-bold text-gradient-brand font-sans">{stat.value}</div>
                <div className="mt-2 text-sm text-muted-foreground font-sans">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24">
        <div className="max-w-2xl mx-auto px-8">
          <motion.div className="text-center mb-12" {...fadeUp}>
            <span className="text-sm text-primary font-medium font-sans">FAQ's</span>
            <h2 className="text-3xl font-bold mt-2">Frequently Asked Questions</h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.details key={i} className="group p-4 rounded-xl bg-card border border-border" {...fadeUp} transition={{ delay: i * 0.03 }}>
                <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-foreground font-sans">
                  {faq.q}
                  <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform shrink-0 ml-2" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed font-sans">{faq.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* Create Deriv Account CTA */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-8">
          <motion.div className="rounded-2xl overflow-hidden" {...fadeUp}>
            <div className="bg-gradient-brand p-8 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
                    Create Your Free Deriv Account
                  </h2>
                  <p className="text-primary-foreground/80 leading-relaxed font-sans">
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
                      <li key={item} className="flex items-center gap-2 text-sm text-primary-foreground/90 font-sans">
                        <span className="text-primary-foreground">✓</span> {item}
                      </li>
                    ))}
                  </ul>
                  <a href={DERIV_AFFILIATE_LINK} target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-8 py-3.5 bg-background text-foreground font-semibold rounded-lg hover:bg-secondary transition-colors font-sans">
                    Create Account Now <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <div className="space-y-4">
                  {[
                    { step: "1", title: "Sign Up", desc: "Create your free Deriv account in under 2 minutes" },
                    { step: "2", title: "Fund Your Account", desc: "Deposit using crypto, bank transfer, or e-wallets" },
                    { step: "3", title: "Connect to DNexus", desc: "Link your account and start trading with AI" },
                  ].map((s) => (
                    <div key={s.step} className="flex gap-4 items-start p-4 rounded-xl bg-background/10 backdrop-blur-sm">
                      <div className="w-8 h-8 rounded-full bg-background/20 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary-foreground font-sans">{s.step}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-primary-foreground font-sans">{s.title}</h4>
                        <p className="text-xs text-primary-foreground/70 mt-1 font-sans">{s.desc}</p>
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
      <section className="py-16 md:py-24 bg-card/50">
        <div className="max-w-[1400px] mx-auto px-8 text-center">
          <motion.h2 className="text-3xl md:text-4xl font-bold" {...fadeUp}>
            Ready to Take Your Trading to the Next Level?
          </motion.h2>
          <motion.p className="mt-4 text-muted-foreground max-w-xl mx-auto font-sans" {...fadeUp}>
            Unlock the full potential of your trading journey.
          </motion.p>
          <motion.div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center" {...fadeUp}>
            <Link to="/trading" className="px-8 py-3.5 bg-gradient-brand text-primary-foreground font-semibold rounded-lg glow-red font-sans">
              Start Trading Now
            </Link>
            <a href={DERIV_AFFILIATE_LINK} target="_blank" rel="noopener" className="px-8 py-3.5 border border-border text-foreground font-semibold rounded-lg hover:bg-secondary transition-colors font-sans">
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
