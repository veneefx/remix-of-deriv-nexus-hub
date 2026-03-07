import { motion } from "framer-motion";
import { Brain, BarChart3, Users, ChevronDown, Lock, CreditCard, Star, Activity, ExternalLink, ArrowRight, Zap, Shield, Globe, Play } from "lucide-react";
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

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#141414] flex flex-col font-['Poppins']" style={{ colorScheme: "dark" }}>
      <Navbar />

      {/* Hero Section - Exact Centered Design */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center justify-center bg-[#141414]">
        {/* Grid Background */}
        <div className="absolute inset-0 z-0 opacity-20" 
             style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

        {/* Background gradient effect */}
        <div className="absolute inset-0 opacity-30 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-[#e41f28]/20 via-transparent to-transparent rounded-full blur-[150px]" />
        </div>

        <div className="w-full max-w-[1200px] mx-auto px-6 sm:px-8 relative py-20 lg:py-0 z-10">
          <div className="flex flex-col items-center text-center space-y-8">
            {/* Badge */}
            <motion.div 
              className="inline-block px-4 py-2 rounded-full border border-[#00d4ff]/30 bg-[#00d4ff]/5"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-xs font-medium text-[#00d4ff]">🚀 Next-Gen Trading Platform</span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1 
              className="text-5xl sm:text-7xl md:text-8xl font-bold leading-[1.1] tracking-tight text-white max-w-5xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              Trading made easier
            </motion.h1>

            {/* Subheading */}
            <motion.p 
              className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-[750px]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              Experience AI-powered analytics, automated trading strategies, professional signals, and secure account management - all in one unified platform.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <Link 
                to="/trading" 
                className="inline-flex items-center justify-center gap-2 h-[56px] px-8 bg-[#e41f28] text-white font-semibold rounded-xl hover:bg-[#ff3333] transition-all transform hover:scale-105 text-lg"
              >
                Start Trading Now <ArrowRight className="w-5 h-5" />
              </Link>
              <a 
                href={DERIV_AFFILIATE_LINK} 
                target="_blank" 
                rel="noopener" 
                className="inline-flex items-center justify-center gap-2 h-[56px] px-8 bg-[#e41f28] text-white font-semibold rounded-xl hover:bg-[#ff3333] transition-all transform hover:scale-105 text-lg"
              >
                Create Free Deriv Account
              </a>
            </motion.div>

            {/* Feature Icons */}
            <motion.div 
              className="flex flex-wrap gap-8 sm:gap-16 justify-center pt-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              {features.map((f) => (
                <div key={f.title} className="flex flex-col items-center gap-3">
                  <div className="w-[64px] h-[64px] rounded-2xl bg-[#1a2332]/60 flex items-center justify-center border border-[#00d4ff]/20">
                    <f.icon className="w-7 h-7 text-[#00d4ff]" />
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">{f.title}</h3>
                  <p className="text-xs text-gray-400 text-center max-w-[140px] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </motion.div>

            {/* Video Preview Button */}
            <motion.div
              className="pt-12 flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                   <div className="absolute inset-0 bg-[#e41f28] rounded-full animate-ping opacity-20"></div>
                   <button className="w-12 h-12 rounded-full bg-[#e41f28] flex items-center justify-center relative z-10">
                     <Play className="w-5 h-5 text-white fill-white" />
                   </button>
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Let's See how</p>
                  <p className="text-gray-400 text-sm">we did it</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Next-Gen Platform Section */}
      <section className="py-24 bg-[#141414] relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Rocket Illustration & Charts */}
            <motion.div
              className="relative flex justify-center lg:justify-start"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative w-full max-w-[500px]">
                <div className="absolute inset-0 bg-gradient-to-r from-[#e41f28]/10 to-transparent blur-3xl rounded-full"></div>
                <img 
                  src={derivRiseFall} 
                  alt="Next-Gen Trading Platform" 
                  className="relative z-10 w-full"
                />
              </div>
            </motion.div>

            {/* Right side - Content */}
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div>
                <span className="text-[#e41f28] font-bold text-sm uppercase tracking-[0.2em]">Trade On Our</span>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mt-4 leading-tight">Next-Gen Trading Platform</h2>
              </div>

              <p className="text-gray-400 leading-relaxed text-lg">
                Experience the future of trading with our cutting-edge platform powered by advanced algorithms and AI. From lightning-fast high-frequency trading to sophisticated quantitative strategies, our tools give you the edge in today's competitive markets.
              </p>

              <div className="space-y-6">
                {[
                  { title: "High-Frequency Trading", desc: "Execute trades in microseconds" },
                  { title: "Algorithmic Bots", desc: "Automate your trading strategies 24/7" },
                  { title: "Powerful Deriv Trading", desc: "Access global derivatives markets" },
                  { title: "AI-Powered Quant Trading", desc: "Machine learning models predict market movements" },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start group">
                    <div className="w-10 h-10 rounded-xl bg-[#e41f28]/10 flex items-center justify-center flex-shrink-0 mt-1 group-hover:bg-[#e41f28]/20 transition-colors">
                      <Zap className="w-5 h-5 text-[#e41f28]" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">{item.title}</p>
                      <p className="text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Link 
                  to="/trading" 
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#e41f28] text-white font-bold rounded-xl hover:bg-[#ff3333] transition-all transform hover:translate-y-[-2px]"
                >
                  Access Trading Hub <ArrowRight className="w-5 h-5" />
                </Link>
                <a 
                  href={DERIV_AFFILIATE_LINK} 
                  target="_blank" 
                  rel="noopener" 
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#e41f28] text-white font-bold rounded-xl hover:bg-[#ff3333] transition-all transform hover:translate-y-[-2px]"
                >
                  Sync With Deriv <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Platform Section (Stats & Cards) */}
      <section className="py-24 bg-[#f5a5a5]">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8">
          <motion.div className="text-center mb-16" {...fadeUp}>
            <span className="text-sm text-[#e41f28] font-bold uppercase tracking-[0.3em]">Our Platform</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-6 max-w-3xl mx-auto leading-tight">
              Access our comprehensive suite of trading tools
            </h2>
            <p className="text-gray-700 mt-6 text-lg max-w-2xl mx-auto">
              From AI-powered analytics to professional signals and secure account management.
            </p>
          </motion.div>

          {/* Stats Section */}
          <motion.div className="p-10 rounded-[2rem] bg-gray-900 mb-20 shadow-2xl" {...fadeUp}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { icon: Activity, value: "12K+", label: "Active Traders" },
                { icon: Zap, value: "99.9%", label: "Uptime" },
                { icon: Star, value: "4.9/5", label: "User Rating" },
                { icon: Lock, value: "256-bit", label: "Encryption" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#e41f28]/20 flex items-center justify-center mb-2">
                    <s.icon className="w-6 h-6 text-[#e41f28]" />
                  </div>
                  <p className="text-3xl font-bold text-white">{s.value}</p>
                  <p className="text-sm text-gray-400 uppercase tracking-widest">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Platform Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Partners Program",
                icon: Users,
                badge: "Popular",
                desc: "Partner with DNexus and earn competitive commissions while helping traders succeed. Access advanced tracking, real-time analytics, and dedicated support.",
                features: ["Competitive commission rates", "Real-time tracking dashboard", "Advanced analytics & reporting", "Dedicated partner support", "Marketing materials & tools"],
              },
              {
                title: "AI Trading Assistant",
                icon: Brain,
                badge: "New",
                desc: "Our AI system analyzes market patterns, predicts trends, and provides intelligent trading recommendations. Get real-time insights and automated strategy execution.",
                features: ["Market pattern recognition", "Predictive analytics", "Automated strategy execution", "Risk management AI", "Real-time market insights"],
              },
              {
                title: "Premium Signals",
                icon: BarChart3,
                badge: "Premium",
                desc: "Access professional-grade trading signals with high accuracy rates. Our expert analysts provide detailed analysis and entry/exit points for optimal trading performance.",
                features: ["High-accuracy signals", "Real-time notifications", "Detailed analysis reports", "Risk-reward ratios", "24/7 market coverage"],
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                className="p-8 rounded-[2rem] bg-white border border-gray-100 shadow-xl hover:shadow-2xl transition-all group"
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-[#e41f28]/10 flex items-center justify-center group-hover:bg-[#e41f28] transition-colors">
                    <card.icon className="w-8 h-8 text-[#e41f28] group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-xs font-bold text-[#e41f28] bg-[#e41f28]/10 px-4 py-1.5 rounded-full uppercase tracking-wider">{card.badge}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{card.title}</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">{card.desc}</p>
                <ul className="space-y-4 mb-10">
                  {card.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-gray-600">
                      <span className="text-[#e41f28] font-bold">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link 
                  to="/trading" 
                  className="inline-flex items-center justify-center w-full px-6 py-4 bg-[#e41f28] text-white font-bold rounded-xl hover:bg-[#ff3333] transition-all"
                >
                  Access Platform <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Account Management Section */}
      <section className="py-24 bg-[#f5a5a5]">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <motion.div
            className="bg-gray-900 rounded-[3rem] p-12 md:p-16 shadow-2xl relative overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00d4ff]/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
              <div className="space-y-8">
                <h3 className="text-4xl md:text-5xl font-bold text-white leading-tight">Centralized Account Management</h3>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Manage your account, billing, and preferences from one secure dashboard. Access all DNexus services with single sign-on authentication.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    to="/trading" 
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#e41f28] text-white font-bold rounded-xl hover:bg-[#ff3333] transition-all"
                  >
                    Account Dashboard
                  </Link>
                  <Link 
                    to="/trading" 
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-gray-700 text-white font-bold rounded-xl hover:bg-gray-800 transition-all"
                  >
                    Billing & Subscriptions
                  </Link>
                </div>
              </div>
              <motion.div
                className="bg-white/5 backdrop-blur-sm rounded-3xl p-10 border border-white/10"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-[#00d4ff]/20 flex items-center justify-center mb-6">
                  <Shield className="w-8 h-8 text-[#00d4ff]" />
                </div>
                <h4 className="text-2xl font-bold text-white mb-4">Enterprise Security</h4>
                <p className="text-gray-400 text-lg leading-relaxed">Bank-level encryption & compliance to keep your assets and data safe 24/7.</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Market Tracker Section */}
      <section className="py-24 bg-[#141414]" id="market-tracker">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm text-[#e41f28] font-bold uppercase tracking-[0.3em]">Live Markets</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-6 leading-tight">Comprehensive Currency Market Tracker</h2>
            <p className="text-gray-400 mt-6 text-lg">Real-time market data and technical analysis at your fingertips</p>
          </motion.div>
          <div className="rounded-[2rem] overflow-hidden border border-gray-800 shadow-2xl bg-gray-900/50 p-4">
            <MarketTracker />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-[#141414]">
        <div className="max-w-[900px] mx-auto px-6 sm:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[#e41f28] font-bold text-sm uppercase tracking-[0.3em]">Faq’s</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-6">Frequently Asked Questions</h2>
          </motion.div>

          <div className="space-y-4">
            {[
              { q: "What is trading?", a: "Trading is the buying and selling of financial instruments to generate profit." },
              { q: "How can I get started with trading?", a: "Create a free Deriv account, fund it, and start trading on our platform." },
              { q: "Who is Deriv?", a: "Deriv is a regulated online broker offering derivatives trading services." },
              { q: "Who is DTNexus?", a: "DNexus is a next-gen trading platform built on top of Deriv's infrastructure." },
              { q: "What tools do you offer for market analysis?", a: "We offer AI-powered analytics, premium signals, and real-time market tracking." },
              { q: "How does DTNexus link to Deriv?", a: "DNexus integrates with Deriv's API to provide seamless trading execution." },
              { q: "What trading options are available on Deriv?", a: "Forex, Commodities, Indices, Cryptocurrencies, and more." },
              { q: "Is there a demo account available for testing purposes?", a: "Yes, Deriv offers a free demo account with virtual funds." },
              { q: "Are profits guaranteed?", a: "No, trading involves risk. Past performance is not indicative of future results." },
              { q: "Is trading suitable for everyone?", a: "Trading requires knowledge and risk management. Please educate yourself first." },
              { q: "How does DTNexus differ from other platforms?", a: "We combine AI, automation, and professional signals for a unique trading experience." },
            ].map((item, i) => (
              <motion.details
                key={i}
                className="group border border-gray-800 rounded-2xl p-6 cursor-pointer hover:border-[#e41f28]/50 bg-gray-900/30 transition-all"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.1 }}
              >
                <summary className="flex items-center justify-between font-bold text-white text-lg list-none">
                  {item.q}
                  <div className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center group-open:rotate-180 transition-transform">
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </div>
                </summary>
                <p className="text-gray-400 mt-6 leading-relaxed">{item.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
