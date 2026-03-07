import { motion } from "framer-motion";
import { TrendingUp, BarChart3, Users, Globe, Shield, Zap, Brain, ChevronDown, Lock, CreditCard, Star, Activity, ExternalLink, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import MarketTracker from "@/components/trading/MarketTracker";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import derivRiseFall from "@/assets/deriv-risefall.webp";
import derivAccumulators from "@/assets/deriv-accumulators.webp";
import derivGold from "@/assets/deriv-gold.webp";
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
    details: "Partner with DNexus and earn competitive commissions while helping traders succeed.",
    features: ["Competitive commission rates", "Real-time tracking dashboard", "Advanced analytics", "Dedicated partner support", "Marketing materials & tools"],
    link: "/partners",
    image: derivRiseFall,
  },
  {
    title: "AI Trading Assistant",
    badge: "New",
    badgeColor: "bg-accent/20 text-accent",
    desc: "Powered by advanced machine learning",
    details: "Our AI analyzes market patterns, predicts trends, and provides intelligent trading recommendations.",
    features: ["Market pattern recognition", "Predictive analytics", "Automated execution", "Risk management AI", "Real-time market insights"],
    link: "/trading",
    image: derivAccumulators,
  },
  {
    title: "Premium Signals",
    badge: "Premium",
    badgeColor: "bg-primary/20 text-primary",
    desc: "Expert-curated trading opportunities",
    details: "Access professional-grade trading signals with high accuracy rates and detailed analysis.",
    features: ["High-accuracy signals", "Real-time notifications", "Detailed analysis", "Risk-reward ratios", "24/7 market coverage"],
    link: "/signals",
    image: derivGold,
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Section 1: Hero with Background Image */}
      <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={derivAccumulators}
            alt="Hero section"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/30 to-background" />
        </div>
        <div className="relative z-10 text-center px-6 space-y-6 max-w-2xl">
          <motion.h1
            className="text-5xl md:text-7xl font-bold text-foreground leading-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Trading Made Easier
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            AI-powered analytics, automated strategies, and professional signals
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link to="/trading" className="px-8 py-3 bg-gradient-brand text-primary-foreground font-semibold rounded-lg hover-lift">
              Start Trading Now
            </Link>
            <a href={DERIV_AFFILIATE_LINK} target="_blank" rel="noopener" className="px-8 py-3 bg-secondary border border-border text-foreground font-semibold rounded-lg hover:bg-secondary/80">
              Create Free Account
            </a>
          </motion.div>
        </div>
      </section>

      {/* Section 2: Platform Features */}
      <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={derivRiseFall}
            alt="Platform features"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/30 to-background" />
        </div>
        <div className="relative z-10 text-center px-6 space-y-6 max-w-2xl">
          <motion.h2
            className="text-5xl md:text-6xl font-bold text-foreground leading-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Advanced Trading Tools
          </motion.h2>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Digit Edge, DAT Analyzer, AI Signals, and Real-Time Market Data
          </motion.p>
          <motion.div
            className="flex flex-wrap gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {features.map((f) => (
              <div key={f.title} className="px-4 py-2 bg-card/80 backdrop-blur border border-border rounded-full text-sm font-medium text-foreground">
                {f.title}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Section 3: Trading Dashboard Preview */}
      <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={derivGold}
            alt="Trading dashboard"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/30 to-background" />
        </div>
        <div className="relative z-10 text-center px-6 space-y-6 max-w-2xl">
          <motion.h2
            className="text-5xl md:text-6xl font-bold text-foreground leading-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Professional Dashboard
          </motion.h2>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Real-time charts, analytics, and trade execution in one place
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link to="/trading" className="inline-block px-8 py-3 bg-gradient-brand text-primary-foreground font-semibold rounded-lg hover-lift">
              Access Trading Hub
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Section 4: Pricing */}
      <section className="py-24 px-6 sm:px-8">
        <div className="max-w-[1400px] mx-auto">
          <motion.div className="text-center mb-16" {...fadeUp}>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your trading style. All plans include access to our complete platform.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Daily", price: "$7", duration: "1 day" },
              { name: "3 Days", price: "$17", duration: "3 days" },
              { name: "Weekly", price: "$25.49", duration: "7 days" },
              { name: "Bi-Weekly", price: "$37", duration: "14 days" },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all"
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
              >
                <h3 className="text-lg font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-3xl font-bold text-primary mb-1">{plan.price}</p>
                <p className="text-sm text-muted-foreground mb-4">{plan.duration}</p>
                <button className="w-full py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity">
                  Subscribe
                </button>
              </motion.div>
            ))}
          </div>

          <motion.div className="mt-12 p-8 rounded-xl bg-card border border-border" {...fadeUp}>
            <h3 className="text-2xl font-bold text-foreground mb-4">Premium Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: "Monthly", price: "$37", duration: "30 days" },
                { name: "6 Months", price: "$199", duration: "180 days" },
                { name: "Lifetime", price: "$570", duration: "Forever" },
              ].map((plan, i) => (
                <div key={plan.name} className="p-4 rounded-lg bg-secondary border border-border">
                  <h4 className="text-lg font-semibold text-foreground mb-2">{plan.name}</h4>
                  <p className="text-2xl font-bold text-primary mb-1">{plan.price}</p>
                  <p className="text-sm text-muted-foreground">{plan.duration}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 5: Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
