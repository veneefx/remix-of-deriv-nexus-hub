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
    <div className="min-h-screen bg-[#0f1419] flex flex-col" style={{ colorScheme: "dark" }}>
      <Navbar />

      {/* Hero Section - Classic Dark Theme */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center bg-[#0f1419]">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: "linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "50px 50px"
          }} />
        </div>

        <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-8 relative py-20 lg:py-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <motion.div className="inline-block px-4 py-2 rounded-full border border-[#00d4ff]/30 bg-[#00d4ff]/5" {...fadeUp}>
                <span className="text-xs font-medium text-[#00d4ff]">🚀 Next-Gen Trading Platform</span>
              </motion.div>

              <motion.h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.1] tracking-[-1px] text-white" {...fadeUp} transition={{ duration: 0.6, delay: 0.1 }}>
                Trading made <br />easier
              </motion.h1>

              <motion.p className="text-base sm:text-lg text-gray-400 leading-relaxed max-w-[540px]" {...fadeUp} transition={{ duration: 0.6, delay: 0.2 }}>
                Experience AI-powered analytics, automated trading strategies, professional signals, and secure account management — all in one platform.
              </motion.p>

              <motion.div className="flex flex-col sm:flex-row gap-4" {...fadeUp} transition={{ duration: 0.6, delay: 0.3 }}>
                <Link to="/trading" className="inline-flex items-center justify-center gap-2 h-[52px] px-7 bg-[#ff3333] text-white font-semibold rounded-lg hover:bg-[#ff4444] transition-colors">
                  Start Trading Now <ArrowRight className="w-5 h-5" />
                </Link>
                <a href={DERIV_AFFILIATE_LINK} target="_blank" rel="noopener" className="inline-flex items-center justify-center gap-2 h-[52px] px-7 bg-[#1a2332] border border-[#00d4ff]/20 text-white font-semibold rounded-lg hover:bg-[#232d3f] transition-colors">
                  Create Free Deriv Account
                </a>
              </motion.div>

              <motion.div className="flex flex-wrap gap-6 sm:gap-12 pt-4" {...fadeUp} transition={{ duration: 0.6, delay: 0.4 }}>
                {features.map((f) => (
                  <div key={f.title} className="flex flex-col items-center gap-2">
                    <div className="w-[42px] h-[42px] rounded-full bg-[#1a2332] flex items-center justify-center">
                      <f.icon className="w-5 h-5 text-[#00d4ff]" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                    <p className="text-xs text-gray-400 text-center">{f.desc}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              className="relative flex justify-center"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,212,255,0.15)_0%,transparent_60%)] blur-[40px]" />
              <img src={derivAccumulators} alt="DNexus mobile trading interface" className="relative z-10 w-[280px] sm:w-[340px] rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.6)] transform -rotate-[4deg] object-contain" />
              <motion.img src={derivRiseFall} alt="Rise/Fall trading" className="absolute -bottom-6 -left-4 w-24 sm:w-28 rounded-xl shadow-xl border border-[#00d4ff]/20 z-20 object-cover" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 1 }} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trade On Our Next-Gen Platform */}
      <section className="py-16 md:py-24 bg-[#0f1419]">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div className="relative" {...fadeUp}>
              <img src={derivGold} alt="Gold/USD trading on mobile" className="w-full max-w-sm mx-auto rounded-2xl shadow-2xl object-cover" />
              <div className="absolute -bottom-6 -right-6 w-40 sm:w-48 rounded-xl overflow-hidden shadow-xl border border-[#00d4ff]/20 hidden md:block">
                <img src={partnerNetwork} alt="Partner network growth" className="w-full object-cover" />
              </div>
            </motion.div>
            <motion.div className="space-y-6" {...fadeUp}>
              <span className="text-sm text-[#ff3333] font-medium">Trade On Our</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                Next-Gen Trading Platform
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Experience the future of trading with our cutting-edge platform powered by advanced algorithms and AI. From lightning-fast high-frequency trading to sophisticated quantitative strategies, our tools give you the edge.
              </p>
              <ul className="space-y-3">
                {[
                  "High-Frequency Trading — Execute trades in microseconds",
                  "Algorithmic Bots — Automate your strategies 24/7",
                  "Powerful Deriv Trading — Access global derivatives markets",
                  "AI-Powered Quant Trading — Machine learning predictions",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-400">
                    <span className="text-[#ff3333] mt-0.5">⊕</span> {item}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <Link to="/trading" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#ff3333] text-white text-sm font-semibold rounded-lg hover:bg-[#ff4444] transition-colors">
                  Access Trading Hub →
                </Link>
                <a href={DERIV_AFFILIATE_LINK} target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1a2332] border border-[#00d4ff]/20 text-white text-sm font-semibold rounded-lg hover:bg-[#232d3f] transition-colors">
                  Sync With Deriv →
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Platform Section */}
      <section className="py-16 md:py-24 bg-[#0f1419]">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8">
          <motion.div className="text-center mb-6" {...fadeUp}>
            <span className="text-sm text-[#ff3333] font-medium">Our Platform</span>
            <p className="text-gray-400 mt-2 max-w-lg mx-auto">
              Access our comprehensive suite of trading tools, from AI-powered analytics to professional signals.
            </p>
          </motion.div>

          <motion.div className="p-6 rounded-xl bg-gradient-to-r from-[#ff3333] to-[#ff6666] mb-12" {...fadeUp}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { icon: Activity, value: "12K+", label: "Active Traders" },
                { icon: Zap, value: "99.9%", label: "Uptime" },
                { icon: Star, value: "4.9/5", label: "User Rating" },
                { icon: Lock, value: "256-bit", label: "Encryption" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-1">
                  <s.icon className="w-5 h-5 text-white/80" />
                  <p className="text-xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-white/70">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Phone mockups */}
          <motion.div className="flex justify-center gap-4 sm:gap-6 mb-12 overflow-hidden" {...fadeUp}>
            {[derivRiseFall, derivAccumulators, derivGold].map((img, i) => (
              <motion.img
                key={i}
                src={img}
                alt={`Platform screenshot ${i + 1}`}
                className="w-32 sm:w-44 md:w-56 rounded-2xl shadow-2xl shadow-black/30 border border-[#00d4ff]/20 object-cover"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              />
            ))}
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {platformCards.map((card, i) => (
              <motion.div key={card.title} className="rounded-2xl bg-[#1a2332] border border-[#00d4ff]/20 hover:border-[#00d4ff]/50 transition-all overflow-hidden group" {...fadeUp} transition={{ delay: i * 0.1 }}>
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={card.image} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-white">{card.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.badgeColor}`}>{card.badge}</span>
                  </div>
                  <p className="text-sm text-gray-400">{card.details}</p>
                  <ul className="space-y-1.5">
                    {card.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="text-[#00ff00]">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link to={card.link} className="block text-center py-2.5 bg-[#ff3333] text-white text-sm font-semibold rounded-lg hover:bg-[#ff4444] transition-colors">
                    Access Platform →
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Centralized Account Management */}
      <section className="py-16 bg-[#0f1419]">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8">
          <motion.div className="p-6 sm:p-8 rounded-2xl bg-[#1a2332] border border-[#00d4ff]/20 flex flex-col md:flex-row items-center gap-8" {...fadeUp}>
            <div className="flex-1 space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-white">Centralized Account Management</h2>
              <p className="text-gray-400">
                Manage your account, billing, and preferences from one secure dashboard. Access all DNexus services with single sign-on authentication.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/trading" className="px-5 py-2.5 bg-[#ff3333] text-white text-sm font-semibold rounded-lg hover:bg-[#ff4444] transition-colors">
                  ◎ Account Dashboard
                </Link>
                <Link to="/trading" className="px-5 py-2.5 bg-[#00d4ff]/20 text-[#00d4ff] text-sm font-semibold rounded-lg hover:bg-[#00d4ff]/30 transition-colors">
                  📊 Billing & Subscriptions
                </Link>
              </div>
            </div>
            <div className="w-full md:w-64 p-6 rounded-xl bg-[#232d3f] border border-[#00d4ff]/20 text-center">
              <Lock className="w-8 h-8 text-[#00d4ff] mx-auto mb-3" />
              <h4 className="text-sm font-bold text-[#00d4ff]">Enterprise Security</h4>
              <p className="text-xs text-gray-400 mt-1">Bank-level encryption & compliance</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Trade With DNexus */}
      <section className="py-16 md:py-24 bg-[#0f1419]">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div className="relative" {...fadeUp}>
              <img src={traderNight} alt="Trader working" className="w-full max-w-md mx-auto rounded-2xl shadow-2xl object-cover" />
            </motion.div>
            <motion.div className="space-y-8" {...fadeUp}>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                  Why Trade With <span className="text-[#ff3333]">DNexus</span>
                </h2>
                <p className="mt-4 text-gray-400 leading-relaxed">
                  Experience lightning-fast execution, advanced automation, and data-driven insights at zero cost. Our platform combines cutting-edge technology with proven strategies to elevate your trading performance.
                </p>
              </div>
              <div className="space-y-4">
                {whatYouGet.map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#ff3333]/20 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-[#ff3333]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{item.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-[#0f1419]">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8">
          <motion.div className="text-center mb-12" {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Everything you need to know about DNexus and how to get started.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                className="p-6 rounded-xl bg-[#1a2332] border border-[#00d4ff]/20 hover:border-[#00d4ff]/50 transition-all"
                {...fadeUp}
                transition={{ delay: (i % 4) * 0.1 }}
              >
                <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-400">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-[#ff3333] to-[#ff6666]">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 text-center">
          <motion.div className="space-y-6" {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to Start Trading?</h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Join thousands of traders using DNexus to automate their strategies and maximize profits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/trading" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-[#ff3333] font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                Access Trading Hub <ArrowRight className="w-5 h-5" />
              </Link>
              <a href={DERIV_AFFILIATE_LINK} target="_blank" rel="noopener" className="inline-flex items-center justify-center gap-2 px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">
                Create Deriv Account
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
