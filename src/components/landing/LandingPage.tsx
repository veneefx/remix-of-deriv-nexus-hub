import { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Brain, BarChart3, Users, ChevronDown, ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import MarketTracker from "@/components/trading/MarketTracker";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdSlot from "@/components/ads/AdSlot";
import heroHandAsset from "@/assets/landing-hero-hand.png.asset.json";
import datLeftAsset from "@/assets/landing-dat-left.png.asset.json";
import scannerLeftAsset from "@/assets/landing-scanner-left.png.asset.json";
import tradingViewPortraitAsset from "@/assets/landing-tradingview-portrait.png.asset.json";
import aiCommandPortraitAsset from "@/assets/landing-ai-command-portrait.png.asset.json";

const DERIV_AFFILIATE_LINK = "https://deriv.com/?t=xA1buvJrGeASmsCwn5r1F2Nd7ZgqdRLk&utm_source=affiliate_187242&utm_medium=affiliate&utm_campaign=MyAffiliates&utm_content=&referrer=";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const platformShowcaseCards = [
  {
    title: "Dynamic Analysis Terminal",
    image: datLeftAsset.url,
    badge: "Live",
    badgeClass: "bg-red-500",
    description: "Monitor live volatility, tick speed, frequency pressure, and confluence from the same DNexus analysis surface.",
  },
  {
    title: "Deep Market Scanner",
    image: scannerLeftAsset.url,
    badge: "Scanner",
    badgeClass: "bg-emerald-500",
    description: "Track multi-market confluence, digit distribution, cycle detection, and odd-even bias using your own interface screenshots.",
  },
  {
    title: "TradingView + AI Command Center",
    image: tradingViewPortraitAsset.url,
    badge: "AI",
    badgeClass: "bg-sky-500",
    description: "Review full-chart setups alongside the floating AI command center and live performance log from your actual DNexus screens.",
  },
];

const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: phoneScroll } = useScroll({ target: phoneRef, offset: ["start end", "end start"] });
  const phoneRotateY = useTransform(phoneScroll, [0, 0.5, 1], [-25, 0, 25]);
  const phoneScale = useTransform(phoneScroll, [0, 0.5, 1], [0.85, 1.05, 0.9]);

  const faqs = [
    { q: "What is trading?", a: "Trading involves buying and selling financial instruments to profit from price movements. On DNexus, we specialize in synthetic indices and digit contracts — fast-paced instruments that trade 24/7 with instant results." },
    { q: "How can I get started with trading?", a: "Create a free Deriv account, then connect it to DNexus via our Trading Hub. You can start with a $10,000 demo account to practice risk-free before trading with real funds." },
    { q: "Who is Deriv?", a: "Deriv is a regulated online broker offering synthetic indices, forex, and derivatives trading. DNexus connects to Deriv via their official API to provide enhanced trading tools and analytics." },
    { q: "Who is DNexus?", a: "DNexus is an independent third-party trading platform that enhances your Deriv experience with AI-powered analysis, automated bots, digit analysis tools, and professional signals — all in one unified interface." },
    { q: "What tools do you offer for market analysis?", a: "We offer a Digit Edge terminal with frequency heatmaps, momentum trackers, streak detectors, pressure meters, a Confluence Radar, pattern recognition, volatility scanners, and probability projection engines." },
    { q: "How does DNexus link to Deriv?", a: "DNexus uses Deriv's official OAuth2 API (App ID 129344) for secure authentication. We never store your password — only temporary session tokens that are cleared when you log out." },
    { q: "Is DNexus safe to use?", a: "Yes. We use 256-bit encryption, secure OAuth2 authentication, and never hold your funds. All trades execute directly on your Deriv account. DNexus cannot withdraw or transfer your money." },
    { q: "What is the Digit Edge bot?", a: "Our AI-powered bot analyzes real-time tick data to detect statistical patterns and digit imbalances. It uses confluence scoring, frequency analysis, and adaptive strategies to find high-probability trading opportunities." },
    { q: "Do I need to pay to use DNexus?", a: "DNexus is free to use. We apply a transparent 3% commission on trades executed through our platform. All analysis tools, educational content, and signal features are included at no extra cost." },
    { q: "Can I trade on mobile?", a: "Yes! DNexus is fully responsive and optimized for mobile devices. Access all trading tools, analysis dashboards, and bot features from your phone's browser — no app download required." },
  ];

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col font-['Poppins'] text-[#b6b6b6]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-[#141414]">
        <div className="absolute inset-0 z-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '60px 60px' }}>
        </div>
        
        <div className="max-w-[1320px] mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center text-center">
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/20 mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="text-xs font-bold text-[#00d4ff] uppercase tracking-wider">🚀 Next-Gen Trading Platform</span>
            </motion.div>

            <motion.h1 
              className="text-5xl md:text-7xl lg:text-[72px] font-bold text-white leading-[1.2] mb-8 max-w-[900px] font-['Open_Sans']"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Trading made easier
            </motion.h1>

            <motion.p 
              className="text-lg md:text-xl text-[#b6b6b6] max-w-[800px] mb-12 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Experience AI-powered analytics, automated trading strategies, professional signals, and secure account management - all in one unified platform.
            </motion.p>

            <motion.div 
              className="flex flex-wrap justify-center gap-4 mb-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Link to="/trading" className="px-8 py-4 bg-[#e41f28] text-white font-bold rounded-xl hover:bg-[#ff3333] transition-all flex items-center gap-2">
                Start Trading Now <ArrowRight className="w-5 h-5" />
              </Link>
              <a href={DERIV_AFFILIATE_LINK} target="_blank" rel="noopener" className="px-8 py-4 bg-[#e41f28] text-white font-bold rounded-xl hover:bg-[#ff3333] transition-all">
                Create Free Deriv Account
              </a>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-[1000px] mb-20">
              {[
                { icon: Brain, title: "AI Trading", desc: "Advanced machine learning algorithms" },
                { icon: BarChart3, title: "Premium Signals", desc: "Expert-curated trading opportunities" },
                { icon: Users, title: "Partners Program", desc: "Earn commissions with our affiliate network" }
              ].map((f, i) => (
                <motion.div key={i} className="flex flex-col items-center p-6 rounded-2xl bg-white/5 border border-white/10" {...fadeUp}>
                  <div className="w-12 h-12 rounded-xl bg-[#00d4ff]/10 flex items-center justify-center mb-4">
                    <f.icon className="w-6 h-6 text-[#00d4ff]" />
                  </div>
                  <h3 className="text-white font-bold mb-2 uppercase tracking-wider text-sm">{f.title}</h3>
                  <p className="text-sm text-[#b6b6b6]">{f.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Hero mockup from uploaded reference */}
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              <img src={heroHandAsset.url} alt="DNexus Digit Edge screen shown inside a hand-held phone mockup" className="w-full max-w-[420px] mx-auto drop-shadow-2xl" />
            </motion.div>

            <motion.div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3" {...fadeUp}>
              <span className="h-2.5 w-2.5 rounded-full bg-[#e41f28]" />
              <div className="text-left">
                <p className="text-white font-bold">Real DNexus interfaces</p>
                <p className="text-sm text-[#b6b6b6]">Your own screenshots, preserved in the original mockup style</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AdSense — Header / above-the-fold strip */}
      <div className="bg-[#141414] py-4">
        <div className="max-w-[1320px] mx-auto px-6">
          <AdSlot label="Sponsored" format="auto" responsive className="w-full" />
        </div>
      </div>

      {/* Trade On Our Platform */}
      <section className="py-32 bg-black relative">
        <div className="max-w-[1320px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div {...fadeUp}>
              <img src={datLeftAsset.url} alt="DNexus Dynamic Analysis Terminal inside an angled phone mockup" className="w-full max-w-[520px] mx-auto drop-shadow-2xl" />
            </motion.div>
            <motion.div {...fadeUp} className="space-y-8">
              <div>
                <span className="text-[#e41f28] font-bold uppercase tracking-[0.2em] text-sm">Trade On Our</span>
                <h2 className="text-4xl md:text-6xl font-bold text-white mt-4 font-['Open_Sans']">Next-Gen Trading Platform</h2>
              </div>
              <p className="text-lg leading-relaxed">
                Experience the future of trading with our cutting-edge platform powered by advanced algorithms and AI. From lightning-fast high-frequency trading to sophisticated quantitative strategies, our tools give you the edge in today's competitive markets.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { title: "High-Frequency Trading", desc: "Execute trades in microseconds" },
                  { title: "Algorithmic Bots", desc: "Automate your trading strategies 24/7" },
                  { title: "Powerful Deriv Trading", desc: "Access global derivatives markets" },
                  { title: "AI-Powered Quant Trading", desc: "Machine learning models predict market movements" }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <Zap className="w-6 h-6 text-[#e41f28] shrink-0" />
                    <div>
                      <h4 className="text-white font-bold mb-1">{item.title}</h4>
                      <p className="text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 pt-4">
                <Link to="/trading" className="px-8 py-4 bg-[#e41f28] text-white font-bold rounded-xl hover:bg-[#ff3333] transition-all">Access Trading Hub</Link>
                <a href={DERIV_AFFILIATE_LINK} target="_blank" rel="noopener" className="px-8 py-4 border border-[#e41f28] text-white font-bold rounded-xl hover:bg-[#e41f28] transition-all">Sync With Deriv</a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Platform (Pink Section) */}
      <section className="py-32 bg-[#f38589] text-black">
        <div className="max-w-[1320px] mx-auto px-6">
          <div className="text-center mb-20">
            <span className="font-bold uppercase tracking-[0.2em] text-sm">Our Platform</span>
            <h2 className="text-4xl md:text-6xl font-bold mt-4 font-['Open_Sans']">Access our comprehensive suite of trading tools</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            {[
              { val: "12K+", label: "Active Traders" },
              { val: "99.9%", label: "Uptime" },
              { val: "4.9/5", label: "User Rating" },
              { val: "256-bit", label: "Encryption" }
            ].map((s, i) => (
              <div key={i} className="text-center p-8 rounded-3xl bg-black/5">
                <div className="text-3xl md:text-5xl font-bold mb-2 font-['Open_Sans']">{s.val}</div>
                <div className="font-medium text-black/60 uppercase tracking-wider text-xs">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {platformShowcaseCards.map((p, i) => (
              <motion.div key={i} className="bg-white rounded-[32px] overflow-hidden flex flex-col" {...fadeUp}>
                <div className="p-8 pb-0">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-bold font-['Open_Sans']">{p.title}</h3>
                    <span className={`${p.badgeClass} text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase`}>{p.badge}</span>
                  </div>
                  <p className="text-sm text-black/60 mb-8 leading-relaxed">{p.description}</p>
                </div>
                <div className="mt-auto px-8 pb-8">
                   <Link to="/trading" className="w-full py-4 bg-black text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-black/80 transition-all">Access Platform</Link>
                </div>
                <img src={p.image} alt={p.title} className="w-full h-auto object-cover" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Trade Section */}
      <section className="py-32 bg-[#f38589] text-black">
        <div className="max-w-[1320px] mx-auto px-6">
          <div className="bg-[#141414] rounded-[40px] p-8 md:p-20 text-white relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
              <div className="space-y-8">
                <div>
                  <span className="text-[#e41f28] font-bold uppercase tracking-[0.2em] text-sm">Why Trade With DNexus</span>
                  <h2 className="text-4xl md:text-6xl font-bold mt-4 font-['Open_Sans']">Experience lightning-fast execution</h2>
                </div>
                <p className="text-lg text-[#b6b6b6] leading-relaxed">
                  Our platform combines cutting-edge technology with proven strategies to elevate your trading performance. Experience lightning-fast execution, advanced automation, and data-driven insights at zero cost.
                </p>
                <Link to="/trading" className="inline-flex px-8 py-4 bg-[#e41f28] text-white font-bold rounded-xl hover:bg-[#ff3333] transition-all">Learn More</Link>
              </div>
               <img src={scannerLeftAsset.url} alt="DNexus Deep Market Scanner inside an angled phone mockup" className="w-full max-w-[520px] mx-auto drop-shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Trading Reimagined */}
      <section className="py-32 bg-[#e41f28] text-white">
        <div className="max-w-[1320px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <img src={aiCommandPortraitAsset.url} alt="DNexus trading chart with AI Command Center overlay on mobile" className="w-full max-w-[520px] mx-auto drop-shadow-2xl" />
            <div className="space-y-8">
              <h2 className="text-4xl md:text-6xl font-bold font-['Open_Sans']">Trading Reimagined</h2>
              <p className="text-xl leading-relaxed opacity-90">
                DNexus leverages AI and machine learning to deliver expert signals and quantitative analysis that professionals trust. Our comprehensive free learning materials help you master the markets while our automation tools execute with precision.
              </p>
              <Link to="/trading" className="inline-flex px-8 py-4 bg-white text-[#e41f28] font-bold rounded-xl hover:bg-gray-100 transition-all">Learn More</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Scroll-Rotating Phone Showcase */}
      <section className="py-32 bg-[#141414] overflow-hidden">
        <div className="max-w-[1320px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <span className="text-[#00d4ff] font-bold uppercase tracking-[0.2em] text-sm">Built For Mobile</span>
              <h2 className="text-4xl md:text-6xl font-bold text-white font-['Open_Sans'] leading-tight">Your trading desk fits in your pocket</h2>
              <p className="text-lg text-[#b6b6b6] leading-relaxed">
                Every chart, every signal, every automation surface inside DNexus is tuned for one-handed use on the device you already carry. Scroll, swipe, fire trades — no lag, no compromise.
              </p>
            </div>
            <div ref={phoneRef} className="relative h-[560px] flex items-center justify-center" style={{ perspective: "1200px" }}>
              <motion.img
                src={heroHandAsset.url}
                alt="DNexus mobile trading interface in a realistic hand-held mockup"
                style={{ rotateY: phoneRotateY, scale: phoneScale, transformStyle: "preserve-3d" }}
                className="w-full max-w-[320px] drop-shadow-[0_25px_60px_rgba(0,212,255,0.35)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Community */}
      <section className="py-24 bg-black">
        <div className="max-w-[1320px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
            <motion.div className="lg:col-span-2" {...fadeUp}>
              <img src={tradingViewPortraitAsset.url} alt="DNexus branded mobile trading chart screenshot for the community showcase" loading="lazy" className="w-full max-w-[420px] mx-auto drop-shadow-2xl" />
            </motion.div>
            <motion.div className="lg:col-span-3 space-y-6" {...fadeUp}>
              <span className="text-[#00d4ff] font-bold uppercase tracking-[0.2em] text-sm">Community</span>
              <h2 className="text-4xl md:text-5xl font-bold text-white font-['Open_Sans']">Built around the DNexus experience</h2>
              <p className="text-lg text-[#b6b6b6] leading-relaxed">
                The landing page now showcases your real product views instead of generic placeholders — from charting and scanner states to the AI command center users actually recognize inside DNexus.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white">
                  <p className="text-[#00d4ff] font-bold uppercase tracking-[0.2em] text-xs mb-2">Authentic visuals</p>
                  <p>Your uploaded screens are now the primary story across the landing experience.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white">
                  <p className="text-[#00d4ff] font-bold uppercase tracking-[0.2em] text-xs mb-2">Brand match</p>
                  <p>The mockups keep the premium feel, but the content shown is now unmistakably DNexus.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Market Tracker */}
      <section className="py-32 bg-black">
        <div className="max-w-[1320px] mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[#e41f28] font-bold uppercase tracking-[0.2em] text-sm">Live Markets</span>
            <h2 className="text-4xl md:text-6xl font-bold text-white mt-4 font-['Open_Sans']">Comprehensive Currency Market Tracker</h2>
          </div>
          <MarketTracker />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 bg-[#141414]">
        <div className="max-w-[1320px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div>
              <span className="text-[#e41f28] font-bold uppercase tracking-[0.2em] text-sm">Faq's</span>
              <h2 className="text-4xl md:text-6xl font-bold text-white mt-4 mb-12 font-['Open_Sans']">Frequently Asked Questions</h2>
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <div 
                    key={i} 
                    className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden cursor-pointer hover:bg-white/10 transition-all"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <div className="p-5 flex justify-between items-center">
                      <span className="text-white font-bold text-sm">{faq.q}</span>
                      <ChevronDown className={`w-5 h-5 text-[#e41f28] shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} />
                    </div>
                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 pb-5 text-sm text-[#b6b6b6] leading-relaxed">{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <img src={heroHandAsset.url} alt="DNexus mobile interface mockup beside the frequently asked questions" className="w-full max-w-[420px] drop-shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* AdSense — Mid/Sidebar strip before footer */}
      <div className="bg-[#141414] py-6">
        <div className="max-w-[1320px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <AdSlot label="Sponsored" format="auto" responsive />
          </div>
          <div>
            <AdSlot label="Sponsored" format="auto" responsive />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LandingPage;
