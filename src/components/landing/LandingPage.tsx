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
import heroMobile from "@/assets/hero-mobile.png";

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
    <div className="min-h-screen bg-black flex flex-col" style={{ colorScheme: "dark" }}>
      <Navbar />

      {/* Hero Section - Left Text + Right Image */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center justify-center bg-black">
        {/* Background gradient effect */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-[#ff3333]/20 via-transparent to-transparent rounded-full blur-[150px]" />
        </div>

        <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-8 relative py-20 lg:py-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="flex flex-col items-start text-left space-y-8">
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
              className="text-6xl sm:text-7xl md:text-8xl font-black leading-[1.0] tracking-[-3px] text-white uppercase"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <span className="text-[1.2em]">T</span>rading made easier
            </motion.h1>

            {/* Subheading */}
            <motion.p 
              className="text-base sm:text-lg text-gray-300 leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              Experience AI-powered analytics, automated trading strategies, professional signals, and secure account management — all in one unified platform.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 pt-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <Link 
                to="/trading" 
                className="inline-flex items-center justify-center gap-2 h-[56px] px-8 bg-[#ff3333] text-white font-semibold rounded-lg hover:bg-[#ff4444] transition-colors text-lg"
              >
                Start Trading Now <ArrowRight className="w-5 h-5" />
              </Link>
              <a 
                href={DERIV_AFFILIATE_LINK} 
                target="_blank" 
                rel="noopener" 
                className="inline-flex items-center justify-center gap-2 h-[56px] px-8 bg-[#ff3333] text-white font-semibold rounded-lg hover:bg-[#ff4444] transition-colors text-lg"
              >
                Create Free Deriv Account
              </a>
            </motion.div>

            {/* Feature Icons */}
            <motion.div 
              className="flex flex-wrap gap-8 sm:gap-12 pt-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              {features.map((f) => (
                <div key={f.title} className="flex flex-col items-start gap-2">
                  <div className="w-[48px] h-[48px] rounded-full bg-[#1a2332]/60 flex items-center justify-center border border-[#00d4ff]/20">
                    <f.icon className="w-5 h-5 text-[#00d4ff]" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                  <p className="text-xs text-gray-400 max-w-[140px]">{f.desc}</p>
                </div>
              ))}
            </motion.div>
            </div>

            {/* Right Image */}
            <motion.div
              className="hidden lg:flex justify-center items-center"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative">
                {/* Glow effect behind image */}
                <div className="absolute -inset-4 bg-gradient-to-br from-[#00d4ff]/30 via-[#ff3333]/20 to-transparent rounded-[3rem] blur-3xl" />
                {/* Mobile image */}
                <img
                  src={heroMobile}
                  alt="DNexus mobile trading app"
                  className="relative z-10 w-full max-w-[320px] rounded-[2.5rem] shadow-2xl object-contain"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trade On Our - Next-Gen Platform Section */}
      <section className="relative py-20 md:py-32 bg-black overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[#00d4ff]/20 via-transparent to-transparent rounded-full blur-[150px]" />
        </div>
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Illustration */}
            <motion.div
              className="hidden lg:flex justify-center"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative w-full max-w-[400px]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00d4ff]/20 via-[#ff3333]/20 to-transparent rounded-full blur-[100px]" />
                <img 
                  src={derivGold} 
                  alt="Trading Platform" 
                  className="relative z-10 w-full object-contain"
                />
              </div>
            </motion.div>

            {/* Right: Content */}
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div>
                <span className="text-sm text-[#ff3333] font-medium">Trade On Our</span>
                <h2 className="text-5xl md:text-6xl font-black text-white mt-4 leading-tight">
                  Next-Gen Trading Platform
                </h2>
              </div>
              <p className="text-lg text-gray-300 leading-relaxed">
                Experience the future of trading with our cutting-edge platform powered by advanced algorithms and AI. From lightning-fast high-frequency trading to sophisticated quantitative strategies, our tools give you the edge in today's competitive markets. Execute with precision, analyze with clarity, and trade with confidence.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Zap, title: "High-Frequency Trading", desc: "Execute trades in microseconds" },
                  { icon: TrendingUp, title: "Algorithmic Bots", desc: "Automate your trading strategies 24/7" },
                  { icon: BarChart3, title: "Powerful Deriv Trading", desc: "Access global derivatives markets" },
                  { icon: Brain, title: "AI-Powered Quant Trading", desc: "Machine learning models predict market movements" },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    className="flex items-start gap-4"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#ff3333]/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <item.icon className="w-5 h-5 text-[#ff3333]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{item.title}</h3>
                      <p className="text-sm text-gray-400">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link 
                  to="/trading" 
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#ff3333] text-white font-semibold rounded-lg hover:bg-[#ff4444] transition-colors"
                >
                  Access Trading Hub <ArrowRight className="w-5 h-5" />
                </Link>
                <a 
                  href={DERIV_AFFILIATE_LINK} 
                  target="_blank" 
                  rel="noopener" 
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#ff3333] text-white font-semibold rounded-lg hover:bg-[#ff4444] transition-colors"
                >
                  Sync With Deriv <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Hero Image Section */}
      <section className="relative py-12 bg-black">
        <div className="w-full max-w-[1200px] mx-auto px-6 sm:px-8">
          <motion.div
            className="relative flex justify-center"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,212,255,0.1)_0%,transparent_70%)] blur-[60px]" />
            <img 
              src={derivAccumulators} 
              alt="DNexus mobile trading interface" 
              className="relative z-10 w-full max-w-[500px] rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] object-contain"
            />
          </motion.div>
        </div>
      </section>

      {/* Rest of the landing page sections will follow */}
      <section className="py-16 md:py-24 bg-black">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8">
          <motion.div className="text-center mb-12" {...fadeUp}>
            <span className="text-sm text-[#ff3333] font-medium">Our Platform</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-4">
              Access our comprehensive suite of trading tools
            </h2>
            <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
              From AI-powered analytics to professional signals and secure account management.
            </p>
          </motion.div>

          {/* Stats Section */}
          <motion.div className="p-8 rounded-xl bg-gradient-to-r from-[#ff3333] to-[#ff6666] mb-12" {...fadeUp}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { icon: Activity, value: "12K+", label: "Active Traders" },
                { icon: Zap, value: "99.9%", label: "Uptime" },
                { icon: Star, value: "4.9/5", label: "User Rating" },
                { icon: Lock, value: "256-bit", label: "Encryption" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-2">
                  <s.icon className="w-6 h-6 text-white/80" />
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-white/70">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Platform Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "AI Trading",
                icon: Brain,
                desc: "Advanced machine learning algorithms for intelligent trading decisions",
                features: ["Pattern recognition", "Predictive analytics", "Automated execution"],
              },
              {
                title: "Premium Signals",
                icon: BarChart3,
                desc: "Expert-curated trading opportunities with high accuracy rates",
                features: ["High-accuracy signals", "Real-time notifications", "Detailed analysis"],
              },
              {
                title: "Partners Program",
                icon: Users,
                desc: "Earn commissions with our affiliate network",
                features: ["Competitive rates", "Real-time tracking", "Dedicated support"],
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                className="p-6 rounded-xl bg-[#1a2332] border border-[#00d4ff]/20 hover:border-[#00d4ff]/50 transition-all"
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-12 h-12 rounded-lg bg-[#00d4ff]/20 flex items-center justify-center mb-4">
                  <card.icon className="w-6 h-6 text-[#00d4ff]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{card.desc}</p>
                <ul className="space-y-2">
                  {card.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="text-[#00ff00]">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-[#ff3333] to-[#ff6666]">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8 text-center">
          <motion.div className="space-y-6" {...fadeUp}>
            <h2 className="text-4xl md:text-5xl font-bold text-white">Ready to Start Trading?</h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Join thousands of traders using DNexus to automate their strategies and maximize profits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/trading" 
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-[#ff3333] font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Access Trading Hub <ArrowRight className="w-5 h-5" />
              </Link>
              <a 
                href={DERIV_AFFILIATE_LINK} 
                target="_blank" 
                rel="noopener" 
                className="inline-flex items-center justify-center gap-2 px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
              >
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
