import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown, Zap, TrendingUp, BarChart3, Brain, ArrowRight, Lock, Shield, Heart, Users, Rocket, Lightbulb, CheckCircle2, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import derivAccumulators from "@/assets/deriv-accumulators.webp";
import derivGold from "@/assets/deriv-gold.webp";
import heroMobile from "@/assets/hero-mobile.png";

const DERIV_AFFILIATE_LINK = "https://deriv.com/?affiliate_token=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6";

export default function LandingPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  const faqItems = [
    { q: "What is trading?", a: "Trading is the buying and selling of financial instruments like currencies, commodities, and indices to profit from price movements." },
    { q: "How can I get started with trading?", a: "Create a Deriv account, fund it, and start trading with our advanced tools and AI-powered signals." },
    { q: "Who is Deriv?", a: "Deriv is a licensed online broker offering trading on forex, commodities, indices, and cryptocurrencies." },
    { q: "Who is DTNexus?", a: "DTNexus is a next-gen trading platform that combines AI analytics, automated strategies, and professional signals." },
    { q: "What tools do you offer for market analysis?", a: "We offer Digit Edge AI, Premium Signals, DAT Analyzer, and real-time market tracking." },
    { q: "How does DTNexus link to Deriv?", a: "DTNexus integrates seamlessly with Deriv's API for secure, real-time trading execution." },
    { q: "What trading options are available on Deriv?", a: "Forex, commodities, indices, cryptocurrencies, and synthetic indices." },
    { q: "Is there a demo account available?", a: "Yes, Deriv offers free demo accounts with virtual funds for practice." },
    { q: "Are profits guaranteed?", a: "No. Trading involves risk. Always use proper risk management and stop losses." },
    { q: "Is trading suitable for everyone?", a: "Trading requires knowledge and risk tolerance. We recommend learning first through our education resources." },
    { q: "How does DTNexus differ from other platforms?", a: "We combine AI-powered analysis, aggressive automation, and expert signals with zero platform fees." },
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="DTNexus" className="h-8" />
            <span className="font-bold text-lg hidden sm:inline">
              <span className="text-white">DT</span>
              <span className="text-[#ff3333]">NEXUS</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-8">
            <a href="#" className="text-[#ff3333] font-semibold hover:text-[#ff4444]">Home</a>
            <div className="group relative">
              <button className="flex items-center gap-1 hover:text-gray-300">Platforms <ChevronDown className="w-4 h-4" /></button>
              <div className="absolute top-full left-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <a href="#" className="block px-4 py-2 hover:bg-gray-800">Digit Edge</a>
                <a href="#" className="block px-4 py-2 hover:bg-gray-800">DAT Analyzer</a>
                <a href="#" className="block px-4 py-2 hover:bg-gray-800">AI Signals</a>
              </div>
            </div>
            <a href="#" className="hover:text-gray-300">Education</a>
            <a href="#" className="hover:text-gray-300">Market Tracker</a>
            <a href="#" className="hover:text-gray-300">Charts</a>
            <div className="group relative">
              <button className="flex items-center gap-1 hover:text-gray-300">Account <ChevronDown className="w-4 h-4" /></button>
              <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <a href="#" className="block px-4 py-2 hover:bg-gray-800">Dashboard</a>
                <a href="#" className="block px-4 py-2 hover:bg-gray-800">Billing</a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/trading" className="px-6 py-2 bg-[#ff3333] text-white font-semibold rounded-lg hover:bg-[#ff4444] transition-colors">
                  Trading Hub →
                </Link>
                <button onClick={handleLogout} className="text-gray-300 hover:text-white">Sign Out</button>
              </>
            ) : (
              <Link to="/trading" className="px-6 py-2 bg-[#ff3333] text-white font-semibold rounded-lg hover:bg-[#ff4444] transition-colors">
                Trading Hub →
              </Link>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-gray-900 border-t border-gray-800 p-4 space-y-3">
            <a href="#" className="block text-[#ff3333]">Home</a>
            <a href="#" className="block hover:text-gray-300">Platforms</a>
            <a href="#" className="block hover:text-gray-300">Education</a>
            <a href="#" className="block hover:text-gray-300">Market Tracker</a>
            <a href="#" className="block hover:text-gray-300">Charts</a>
            <a href="#" className="block hover:text-gray-300">Account</a>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 right-1/4 w-[800px] h-[800px] bg-gradient-to-br from-[#00d4ff]/20 via-transparent to-transparent rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#ff3333]/10 via-transparent to-transparent rounded-full blur-[150px]" />
        </div>

        <div className="max-w-[1400px] mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30">
                <Rocket className="w-4 h-4 text-[#00d4ff]" />
                <span className="text-sm text-[#00d4ff] font-medium">🚀 Next-Gen Trading Platform</span>
              </div>

              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black leading-tight uppercase">
                TRADING <br /> made easier
              </h1>

              <p className="text-lg text-gray-300 leading-relaxed max-w-lg">
                Experience AI-powered analytics, automated trading strategies, professional signals, and secure account management - all in one unified platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/trading"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#ff3333] text-white font-bold rounded-lg hover:bg-[#ff4444] transition-colors text-lg"
                >
                  Start Trading Now <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href={DERIV_AFFILIATE_LINK}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#ff3333] text-white font-bold rounded-lg hover:bg-[#ff4444] transition-colors text-lg"
                >
                  Create Free Deriv Account
                </a>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                {[
                  { icon: Brain, title: "AI Trading", desc: "Advanced machine learning algorithms" },
                  { icon: TrendingUp, title: "Premium Signals", desc: "Expert-curated trading opportunities" },
                  { icon: Users, title: "Partners Program", desc: "Earn commissions with our affiliate network" },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    className="p-4 rounded-lg border border-gray-700 bg-gray-900/50 hover:bg-gray-800/50 transition-colors"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <item.icon className="w-6 h-6 text-[#00d4ff] mb-2" />
                    <h3 className="font-bold text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right: Mobile Image */}
            <motion.div
              className="hidden lg:flex justify-center"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00d4ff]/30 via-[#ff3333]/20 to-transparent rounded-[2rem] blur-[80px]" />
                <img
                  src={heroMobile}
                  alt="DTNexus Trading App"
                  className="relative z-10 w-full max-w-[400px] rounded-[2rem] shadow-2xl"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trade On Our Section */}
      <section className="relative py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-[#00d4ff]/20 via-transparent to-transparent rounded-full blur-[150px]" />
        </div>

        <div className="max-w-[1400px] mx-auto relative">
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

      {/* Our Platform Section - PINK BACKGROUND */}
      <section className="relative py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-[#ff9999]">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-black text-white mb-4">Our Platform</h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Access our comprehensive suite of trading tools, from AI-powered analytics to professional signals and secure account management.
            </p>
          </motion.div>

          {/* Stats Box */}
          <motion.div
            className="bg-gray-900 rounded-2xl p-8 mb-16 grid grid-cols-2 md:grid-cols-4 gap-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {[
              { value: "12K+", label: "Active Traders" },
              { value: "99.9%", label: "Uptime" },
              { value: "4.9/5", label: "User Rating" },
              { value: "256-bit", label: "Encryption" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-white mb-2">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Platform Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                title: "Partners Program",
                desc: "Partner with DTNexus and earn competitive commissions while helping traders succeed. Access advanced tracking, real-time analytics, and dedicated support.",
                features: ["Competitive commission rates", "Real-time tracking dashboard", "Advanced analytics & reporting", "Dedicated partner support", "Marketing materials & tools"],
              },
              {
                title: "AI Trading Assistant",
                desc: "Our AI system analyzes market patterns, predicts trends, and provides intelligent trading recommendations. Get real-time insights and automated strategy execution.",
                features: ["Market pattern recognition", "Predictive analytics", "Automated strategy execution", "Risk management AI", "Real-time market insights"],
                badge: "New",
              },
              {
                title: "Premium Signals",
                desc: "Access professional-grade trading signals with high accuracy rates. Our expert analysts provide detailed analysis and entry/exit points for optimal trading performance.",
                features: ["High-accuracy signals", "Real-time notifications", "Detailed analysis reports", "Risk-reward ratios", "24/7 market coverage"],
                badge: "Premium",
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                className="bg-gray-900 rounded-2xl p-8 space-y-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                {card.badge && (
                  <div className="inline-block px-3 py-1 bg-[#ff3333] text-white text-xs font-bold rounded-full">
                    {card.badge}
                  </div>
                )}
                <h3 className="text-2xl font-bold text-white">{card.title}</h3>
                <p className="text-gray-300">{card.desc}</p>
                <ul className="space-y-2">
                  {card.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-[#00d4ff] flex-shrink-0 mt-1" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className="w-full mt-6 px-6 py-3 bg-[#ff3333] text-white font-bold rounded-lg hover:bg-[#ff4444] transition-colors">
                  Access Platform →
                </button>
              </motion.div>
            ))}
          </div>

          {/* Centralized Account Management */}
          <motion.div
            className="bg-gray-900 rounded-2xl p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div>
              <h3 className="text-3xl font-black text-white mb-4">Centralized Account Management</h3>
              <p className="text-gray-300 mb-6">
                Manage your account, billing, and preferences from one secure dashboard. Access all DTNexus services with single sign-on authentication.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-6 py-3 bg-[#ff3333] text-white font-bold rounded-lg hover:bg-[#ff4444] transition-colors flex items-center gap-2">
                  <Heart className="w-5 h-5" /> Account Dashboard
                </button>
                <button className="px-6 py-3 bg-[#ff3333] text-white font-bold rounded-lg hover:bg-[#ff4444] transition-colors flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" /> Billing & Subscriptions
                </button>
              </div>
            </div>
            <div className="bg-[#c8e6c9] rounded-2xl p-8 text-center">
              <Shield className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h4 className="text-2xl font-black text-gray-900 mb-2">Enterprise Security</h4>
              <p className="text-gray-700">Bank-level encryption & compliance</p>
            </div>
          </motion.div>

          {/* Why Trade With DTNexus */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-4xl font-black text-white mb-6">Why Trade With DTNexus</h3>
            <p className="text-lg text-white/90 max-w-3xl mx-auto mb-8">
              Experience lightning-fast execution, advanced automation, and data-driven insights at zero cost. Our platform combines cutting-edge technology with proven strategies to elevate your trading performance.
            </p>
            <button className="px-8 py-3 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-colors">
              Learn more →
            </button>
          </motion.div>

          {/* Community Stats */}
          <motion.div
            className="bg-gray-900 rounded-2xl p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-black text-white mb-8">Join a Growing Community of Success-Driven Traders</h3>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              DTNexus is rapidly becoming the platform of choice for traders seeking an edge in today's dynamic markets. Our innovative approach combines powerful analytics, seamless automation, and a supportive community.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              {[
                { icon: Lightbulb, label: "Advanced Analytics" },
                { icon: Brain, label: "AI-Powered" },
                { icon: Users, label: "Expert Community" },
                { icon: Clock, label: "24/7 Market Access" },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <item.icon className="w-8 h-8 text-[#00d4ff] mx-auto mb-2" />
                  <p className="text-sm text-gray-300">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-4xl font-black text-white">12K</div>
                <div className="text-gray-400">Active Traders</div>
              </div>
              <div>
                <div className="text-4xl font-black text-white">97K</div>
                <div className="text-gray-400">Monthly Volume (USD)</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-black">
        <div className="max-w-[1000px] mx-auto">
          <motion.h2
            className="text-5xl md:text-6xl font-black text-white text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Frequently Asked Questions
          </motion.h2>

          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <motion.div
                key={i}
                className="border border-gray-700 rounded-lg overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full px-6 py-4 bg-gray-900 hover:bg-gray-800 transition-colors flex items-center justify-between"
                >
                  <h3 className="font-semibold text-white text-left">{item.q}</h3>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {expandedFaq === i && (
                  <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-700">
                    <p className="text-gray-300">{item.a}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#ff3333] to-[#ff5555]">
        <div className="max-w-[1000px] mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Ready to Start Trading?</h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of successful traders using DTNexus. Get instant access to AI-powered analytics, professional signals, and automated trading strategies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/trading"
              className="px-8 py-4 bg-white text-[#ff3333] font-bold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Start Trading Now
            </Link>
            <a
              href={DERIV_AFFILIATE_LINK}
              target="_blank"
              rel="noopener"
              className="px-8 py-4 bg-white/20 text-white font-bold rounded-lg hover:bg-white/30 transition-colors border border-white"
            >
              Create Deriv Account
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-bold text-white mb-4">Platform</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Trading Hub</a></li>
              <li><a href="#" className="hover:text-white">AI Trading</a></li>
              <li><a href="#" className="hover:text-white">Premium Signals</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">About</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Help Center</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
              <li><a href="#" className="hover:text-white">Status</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Privacy</a></li>
              <li><a href="#" className="hover:text-white">Terms</a></li>
              <li><a href="#" className="hover:text-white">Disclaimer</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-gray-400 text-sm">© 2024 DTNexus. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white">Twitter</a>
            <a href="#" className="text-gray-400 hover:text-white">Discord</a>
            <a href="#" className="text-gray-400 hover:text-white">Telegram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper component for Clock icon if not available
const Clock = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
