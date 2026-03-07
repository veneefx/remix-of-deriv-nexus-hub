import { motion } from "framer-motion";
import { Brain, BarChart3, Users, ChevronDown, Lock, CreditCard, Star, Activity, ExternalLink, ArrowRight, Zap, Shield, Globe } from "lucide-react";
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
    <div className="min-h-screen bg-[#141414] flex flex-col" style={{ colorScheme: "dark" }}>
      <Navbar />

      {/* Hero Section - Exact Centered Design */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center justify-center bg-[#141414]">
        {/* Background gradient effect */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-[#e41f28]/20 via-transparent to-transparent rounded-full blur-[150px]" />
        </div>

        <div className="w-full max-w-[1200px] mx-auto px-6 sm:px-8 relative py-20 lg:py-0">
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
              className="text-6xl sm:text-7xl md:text-8xl font-black leading-[1.0] tracking-[-3px] text-white max-w-5xl uppercase"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              Trading made easier
            </motion.h1>

            {/* Subheading */}
            <motion.p 
              className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-[700px]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              Experience AI-powered analytics, automated trading strategies, professional signals, and secure account management — all in one unified platform.
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
                className="inline-flex items-center justify-center gap-2 h-[56px] px-8 bg-[#e41f28] text-white font-semibold rounded-lg hover:bg-[#ff3333] transition-colors text-lg"
              >
                Start Trading Now <ArrowRight className="w-5 h-5" />
              </Link>
              <a 
                href={DERIV_AFFILIATE_LINK} 
                target="_blank" 
                rel="noopener" 
                className="inline-flex items-center justify-center gap-2 h-[56px] px-8 bg-[#e41f28] text-white font-semibold rounded-lg hover:bg-[#ff3333] transition-colors text-lg"
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
                  <div className="w-[56px] h-[56px] rounded-full bg-[#1a2332]/60 flex items-center justify-center border border-[#00d4ff]/20">
                    <f.icon className="w-6 h-6 text-[#00d4ff]" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">{f.title}</h3>
                  <p className="text-xs text-gray-400 text-center max-w-[120px]">{f.desc}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Hero Image Section */}
      <section className="relative py-12 bg-[#141414]">
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

      {/* Trade On Our Platform Section */}
      <section className="py-16 md:py-24 bg-[#141414] relative">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left side - Image */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <img 
                src={traderNight} 
                alt="Advanced trading platform interface" 
                className="w-full rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
              />
            </motion.div>

            {/* Right side - Content */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div>
                <span className="text-[#e41f28] font-medium text-sm">Trade On Our</span>
                <h2 className="text-4xl md:text-5xl font-bold text-white mt-2">Next-Gen Trading Platform</h2>
              </div>

              <p className="text-gray-300 leading-relaxed">
                Experience the future of trading with our cutting-edge platform powered by advanced algorithms and AI. From lightning-fast high-frequency trading to sophisticated quantitative strategies, our tools give you the edge in today's competitive markets. Execute with precision, analyze with clarity, and trade with confidence.
              </p>

              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-[#e41f28]/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-[#e41f28] text-sm">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">High-Frequency Trading</p>
                    <p className="text-gray-400 text-sm">Execute trades in microseconds</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-[#e41f28]/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-[#e41f28] text-sm">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Algorithmic Bots</p>
                    <p className="text-gray-400 text-sm">Automate your trading strategies 24/7</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-[#e41f28]/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-[#e41f28] text-sm">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Powerful Deriv Trading</p>
                    <p className="text-gray-400 text-sm">Access global derivatives markets</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-[#e41f28]/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-[#e41f28] text-sm">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">AI-Powered Quant Trading</p>
                    <p className="text-gray-400 text-sm">Machine learning models predict market movements</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <a 
                  href="#" 
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#e41f28] text-white font-semibold rounded-lg hover:bg-[#ff3333] transition-colors"
                >
                  Access Trading Hub <ArrowRight className="w-4 h-4" />
                </a>
                <a 
                  href={DERIV_AFFILIATE_LINK} 
                  target="_blank" 
                  rel="noopener" 
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#e41f28] text-white font-semibold rounded-lg hover:bg-[#ff3333] transition-colors"
                >
                  Sync With Deriv <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Platform Section */}
      <section className="py-16 md:py-24 bg-[#f5a5a5]">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8">
          <motion.div className="text-center mb-12" {...fadeUp}>
            <span className="text-sm text-[#e41f28] font-medium">Our Platform</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4">
              Access our comprehensive suite of trading tools
            </h2>
            <p className="text-gray-700 mt-4 max-w-2xl mx-auto">
              From AI-powered analytics to professional signals and secure account management.
            </p>
          </motion.div>

          {/* Stats Section */}
          <motion.div className="p-8 rounded-xl bg-gradient-to-r from-[#e41f28] to-[#ff6666] mb-12" {...fadeUp}>
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
                className="p-6 rounded-xl bg-white/10 border border-white/20 hover:border-white/40 transition-all"
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-white bg-[#e41f28]/30 px-3 py-1 rounded-full">{card.badge}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                <p className="text-gray-200 text-sm mb-4">{card.desc}</p>
                <ul className="space-y-2 mb-6">
                  {card.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-200">
                      <span className="text-[#00ff00]">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a 
                  href="#" 
                  className="inline-flex items-center justify-center w-full px-4 py-2 bg-[#e41f28] text-white font-semibold rounded-lg hover:bg-[#ff3333] transition-colors text-sm"
                >
                  Access Platform <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Centralized Account Management Section */}
      <section className="py-16 md:py-24 bg-[#f5a5a5]">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <motion.div
            className="bg-gray-900 rounded-2xl p-8 md:p-12"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">Centralized Account Management</h3>
                <p className="text-gray-300 mb-6">
                  Manage your account, billing, and preferences from one secure dashboard. Access all DNexus services with single sign-on authentication.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a 
                    href="#" 
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#e41f28] text-white font-semibold rounded-lg hover:bg-[#ff3333] transition-colors"
                  >
                    Account Dashboard
                  </a>
                  <a 
                    href="#" 
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#e41f28] text-white font-semibold rounded-lg hover:bg-[#ff3333] transition-colors"
                  >
                    Billing & Subscriptions
                  </a>
                </div>
              </div>
              <motion.div
                className="bg-gradient-to-br from-[#00d4ff]/20 to-transparent rounded-xl p-8 border border-[#00d4ff]/30"
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Shield className="w-12 h-12 text-[#00d4ff] mb-4" />
                <h4 className="text-xl font-bold text-white mb-2">Enterprise Security</h4>
                <p className="text-gray-300 text-sm">Bank-level encryption & compliance</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Trade With DNexus Section */}
      <section className="py-16 md:py-24 bg-[#f5a5a5]">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">Why Trade With DNexus</h2>
            <p className="text-gray-700 mt-4 max-w-2xl mx-auto">
              Experience lightning-fast execution, advanced automation, and data-driven insights at zero cost. Our platform combines cutting-edge technology with proven strategies to elevate your trading performance.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { title: "Lightning-Fast Execution", desc: "Execute trades in microseconds with our optimized infrastructure" },
              { title: "Advanced Automation", desc: "Set and forget with our intelligent trading bots" },
              { title: "Data-Driven Insights", desc: "Make informed decisions with real-time analytics" },
              { title: "Zero Hidden Fees", desc: "Transparent pricing with no surprise charges" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="p-6 rounded-xl bg-white/10 border border-white/20"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                <p className="text-gray-200 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <a 
              href="#" 
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              Learn More <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Trading Reimagined Section */}
      <section className="py-16 md:py-24 bg-[#f5a5a5]">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <img 
                src={derivGold} 
                alt="Trading Reimagined" 
                className="w-full rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.2)]"
              />
            </motion.div>

            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">Trading Reimagined</h2>
              <p className="text-gray-700 leading-relaxed">
                DNexus leverages AI and machine learning to deliver expert signals and quantitative analysis that professionals trust. Our comprehensive free learning materials help you master the markets while our automation tools execute with precision. With our proven track record of success and commitment to innovation, we're transforming how traders of all levels approach the markets.
              </p>
              <a 
                href="#" 
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors w-fit"
              >
                Learn More <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Market Tracker Section */}
      <section className="py-16 md:py-24 bg-[#141414]">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white">Comprehensive Currency Market Tracker</h2>
            <p className="text-gray-400 mt-4">Real-time market data and analysis at your fingertips</p>
          </motion.div>
          <MarketTracker />
        </div>
      </section>

      {/* Community Section */}
      <section className="py-16 md:py-24 bg-[#e41f28]">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white">Join a Growing Community of Success-Driven Traders</h2>
              <p className="text-white/90 leading-relaxed">
                DNexus is rapidly becoming the platform of choice for traders seeking an edge in today's dynamic markets. Our innovative approach combines powerful analytics, seamless automation, and a supportive community to help you navigate the complexities of trading with confidence.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Advanced Analytics", icon: "📊" },
                  { label: "AI-Powered", icon: "🤖" },
                  { label: "Expert Community", icon: "👥" },
                  { label: "24/7 Market Access", icon: "⏰" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-white font-semibold">{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 pt-4">
                <div className="flex flex-col">
                  <p className="text-3xl font-bold text-white">9K</p>
                  <p className="text-white/80 text-sm">Active Traders</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-3xl font-bold text-white">73K</p>
                  <p className="text-white/80 text-sm">Monthly Volume (USD)</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <img 
                src={partnerNetwork} 
                alt="Global Trading Network" 
                className="w-full rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.3)]"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-[#141414]">
        <div className="max-w-[1000px] mx-auto px-6 sm:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[#e41f28] font-medium text-sm">FAQ's</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4">Frequently Asked Questions</h2>
          </motion.div>

          <div className="space-y-4">
            {[
              { q: "What is trading?", a: "Trading is the buying and selling of financial instruments to generate profit." },
              { q: "How can I get started with trading?", a: "Create a free Deriv account, fund it, and start trading on our platform." },
              { q: "Who is Deriv?", a: "Deriv is a regulated online broker offering derivatives trading services." },
              { q: "Who is DNexus?", a: "DNexus is a next-gen trading platform built on top of Deriv's infrastructure." },
              { q: "What tools do you offer for market analysis?", a: "We offer AI-powered analytics, premium signals, and real-time market tracking." },
              { q: "How does DNexus link to Deriv?", a: "DNexus integrates with Deriv's API to provide seamless trading execution." },
              { q: "What trading options are available on Deriv?", a: "Forex, Commodities, Indices, Cryptocurrencies, and more." },
              { q: "Is there a demo account available for testing purposes?", a: "Yes, Deriv offers a free demo account with virtual funds." },
              { q: "Are profits guaranteed?", a: "No, trading involves risk. Past performance is not indicative of future results." },
              { q: "Is trading suitable for everyone?", a: "Trading requires knowledge and risk management. Please educate yourself first." },
              { q: "How does DNexus differ from other platforms?", a: "We combine AI, automation, and professional signals for a unique trading experience." },
            ].map((item, i) => (
              <motion.details
                key={i}
                className="group border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-[#e41f28] transition-colors"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.1 }}
              >
                <summary className="flex items-center justify-between font-semibold text-white">
                  {item.q}
                  <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="text-gray-400 mt-4 text-sm">{item.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gray-900">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8 text-center">
          <motion.div className="space-y-6" {...fadeUp}>
            <h2 className="text-4xl md:text-5xl font-bold text-white">New to trading?</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Sign up for a free demo account and start practicing today!
            </p>
            <a 
              href={DERIV_AFFILIATE_LINK} 
              target="_blank" 
              rel="noopener" 
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#e41f28] text-white font-semibold rounded-lg hover:bg-[#ff3333] transition-colors"
            >
              Create Deriv Account <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
