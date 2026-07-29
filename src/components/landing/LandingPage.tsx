import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, BarChart3, Users, ChevronDown, ArrowRight, Zap, ShieldCheck, Gauge, LineChart, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import MarketTracker from "@/components/trading/MarketTracker";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAppSession } from "@/hooks/use-app-session";
import datLeftAsset from "@/assets/landing-dat-left.png.asset.json";
import heroPersonAsset from "@/assets/landing-hero-person.webp.asset.json";
import scannerLeftAsset from "@/assets/landing-scanner-left.png.asset.json";

const DERIV_AFFILIATE_LINK = "https://deriv.com/?t=xA1buvJrGeASmsCwn5r1F2Nd7ZgqdRLk&utm_source=affiliate_187242&utm_medium=affiliate&utm_campaign=MyAffiliates&utm_content=&referrer=";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const platformShowcaseCards = [
  {
    title: "Dynamic Analysis Terminal",
    image: datLeftAsset.url,
    badge: "Live",
    badgeClass: "bg-[#e41f28]",
    description: "Live volatility, tick speed, frequency pressure and confluence from the same DNexus analysis surface.",
  },
  {
    title: "Deep Market Scanner",
    image: scannerLeftAsset.url,
    badge: "Scanner",
    badgeClass: "bg-emerald-500",
    description: "Multi-market confluence, digit distribution, cycle detection and odd-even bias in one ranked view.",
  },
  {
    title: "Mobile Trading Experience",
    image: heroPersonAsset.url,
    badge: "Mobile",
    badgeClass: "bg-[#00d4ff] text-black",
    description: "Full analysis, bots and account control from your phone — no download, no compromise.",
  },
];

const heroStats = [
  { val: "12K+", label: "Active traders" },
  { val: "99.9%", label: "Uptime" },
  { val: "<40ms", label: "Signal latency" },
  { val: "24/7", label: "Synthetic markets" },
];

const capabilityCards = [
  { icon: Brain, title: "AI Trading Engine", desc: "Confluence scoring across momentum, streaks, rhythm and digit pressure — with martingale and risk guards built in." },
  { icon: BarChart3, title: "Premium Signals", desc: "Curated, probability-ranked setups streamed live with entry, market and confidence context." },
  { icon: Gauge, title: "Deep Analytics", desc: "Digit Edge terminal, probability engine, market scanner and strategy lab with 10,000-tick backtests." },
  { icon: ShieldCheck, title: "Risk Protection", desc: "Max stake ceilings, daily loss limits, auto-stop on error and session take-profit / stop-loss." },
  { icon: LineChart, title: "Strategy Lab", desc: "Replay ticks, test rules and validate an edge before a single real contract is placed." },
  { icon: Users, title: "Partners Program", desc: "Earn from your network with transparent tracking and a dedicated partner dashboard." },
];

const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [heroReady, setHeroReady] = useState(false);
  const { isSignedIn } = useAppSession();

  useEffect(() => {
    const heroImage = new Image();
    heroImage.src = heroPersonAsset.url;
    heroImage.onload = () => setHeroReady(true);
    heroImage.onerror = () => setHeroReady(false);
  }, []);

  const faqs = [
    { q: "What is trading?", a: "Trading involves buying and selling financial instruments to profit from price movements. On DNexus, we specialize in synthetic indices and digit contracts — fast-paced instruments that trade 24/7 with instant results." },
    { q: "How can I get started with trading?", a: "Create a free Deriv account, then connect it to DNexus via our Trading Hub. You can start with a $10,000 demo account to practice risk-free before trading with real funds." },
    { q: "Who is Deriv?", a: "Deriv is a regulated online broker offering synthetic indices, forex, and derivatives trading. DNexus connects to Deriv via their official API to provide enhanced trading tools and analytics." },
    { q: "Who is DNexus?", a: "DNexus is an independent third-party trading platform that enhances your Deriv experience with AI-powered analysis, automated bots, digit analysis tools, and professional signals — all in one unified interface." },
    { q: "What tools do you offer for market analysis?", a: "We offer a Digit Edge terminal with frequency heatmaps, momentum trackers, streak detectors, pressure meters, a Confluence Radar, pattern recognition, volatility scanners, and probability projection engines." },
    { q: "How does DNexus link to Deriv?", a: "DNexus uses Deriv's official OAuth2 API (App ID 33XI8M32mLLGgkDWPE4wt) for secure authentication. We never store your password — only temporary session tokens that are cleared when you log out." },
    { q: "Is DNexus safe to use?", a: "Yes. We use 256-bit encryption, secure OAuth2 authentication, and never hold your funds. All trades execute directly on your Deriv account. DNexus cannot withdraw or transfer your money." },
    { q: "What is the Digit Edge bot?", a: "Our AI-powered bot analyzes real-time tick data to detect statistical patterns and digit imbalances. It uses confluence scoring, frequency analysis, and adaptive strategies to find high-probability trading opportunities." },
    { q: "Do I need to pay to use DNexus?", a: "DNexus is free to use. We apply a transparent 3% commission on trades executed through our platform. All analysis tools, educational content, and signal features are included at no extra cost." },
    { q: "Can I trade on mobile?", a: "Yes! DNexus is fully responsive and optimized for mobile devices. Access all trading tools, analysis dashboards, and bot features from your phone's browser — no app download required." },
  ];

  return (
    <div className="min-h-screen bg-[#0c0c0d] flex flex-col font-['Poppins'] text-[#a7a7ad] antialiased">
      <Navbar />

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "48px 48px" }}
        />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#e41f28]/20 blur-[140px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-[#00d4ff]/10 blur-[150px]" />

        <div className="relative z-10 mx-auto grid max-w-[1240px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <div className="text-center lg:text-left">
            <motion.span
              className="inline-flex items-center gap-2 rounded-full border border-[#00d4ff]/25 bg-[#00d4ff]/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#00d4ff]"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Sparkles className="h-3.5 w-3.5" /> Next-gen trading platform
            </motion.span>

            <motion.h1
              className="mt-6 font-['Open_Sans'] text-[34px] font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[60px]"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Trade synthetics with an{" "}
              <span className="bg-gradient-to-r from-[#e41f28] via-[#ff5a5f] to-[#00d4ff] bg-clip-text text-transparent">
                institutional edge
              </span>
            </motion.h1>

            <motion.p
              className="mx-auto mt-5 max-w-[560px] text-[15px] leading-relaxed text-[#a7a7ad] sm:text-lg lg:mx-0"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
            >
              AI confluence analysis, automated bots with real risk controls, live signals and one secure
              connection to your Deriv account — in a single, fast interface.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26 }}
            >
              <Link
                to="/trading"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#e41f28] px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-[#e41f28]/25 transition-all hover:bg-[#ff3339]"
              >
                {isSignedIn ? "Open Trading Hub" : "Start trading now"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              {!isSignedIn && (
                <a
                  href={DERIV_AFFILIATE_LINK}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-all hover:border-white/30 hover:bg-white/10"
                >
                  Create free Deriv account
                </a>
              )}
            </motion.div>

            <motion.div
              className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/10 pt-8 sm:grid-cols-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              {heroStats.map((s) => (
                <div key={s.label} className="text-center lg:text-left">
                  <div className="font-['Open_Sans'] text-xl font-bold text-white sm:text-2xl">{s.val}</div>
                  <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#6f6f77]">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            className="relative flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="pointer-events-none absolute h-[300px] w-[300px] rounded-full bg-[#e41f28]/25 blur-[110px] sm:h-[380px] sm:w-[380px]" />
            {heroReady ? (
              <img
                src={heroPersonAsset.url}
                alt="DNexus trader using the platform on mobile"
                className="relative w-full max-w-[300px] object-contain drop-shadow-[0_40px_70px_rgba(0,0,0,0.5)] sm:max-w-[380px]"
                loading="eager"
              />
            ) : (
              <div className="relative aspect-[4/5] w-full max-w-[300px] animate-pulse rounded-[32px] border border-white/10 bg-white/5 sm:max-w-[380px]" />
            )}

            <div className="absolute -left-1 bottom-8 hidden rounded-2xl border border-white/10 bg-black/70 px-4 py-3 backdrop-blur-xl sm:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6f6f77]">Confluence</p>
              <p className="font-['Open_Sans'] text-xl font-bold text-emerald-400">87%</p>
            </div>
            <div className="absolute -right-1 top-10 hidden rounded-2xl border border-white/10 bg-black/70 px-4 py-3 backdrop-blur-xl sm:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6f6f77]">Bot status</p>
              <p className="flex items-center gap-2 font-['Open_Sans'] text-sm font-bold text-white">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Running
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= CAPABILITIES ================= */}
      <section className="border-y border-white/[0.06] bg-[#0a0a0b] py-20 sm:py-28">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <motion.div className="max-w-[640px]" {...fadeUp}>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e41f28]">Everything in one place</span>
            <h2 className="mt-4 font-['Open_Sans'] text-3xl font-bold leading-tight text-white sm:text-5xl">
              A complete trading desk, not a widget
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed sm:text-base">
              Analysis, automation, execution and protection are built as one system — so every signal you act on is
              backed by the same data and the same risk rules.
            </p>
          </motion.div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {capabilityCards.map((f, i) => (
              <motion.div
                key={f.title}
                className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 transition-all hover:-translate-y-1 hover:border-[#e41f28]/40 hover:bg-white/[0.06]"
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.05 }}
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#e41f28]/12 ring-1 ring-inset ring-[#e41f28]/25">
                  <f.icon className="h-5 w-5 text-[#e41f28]" />
                </div>
                <h3 className="mb-2 font-['Open_Sans'] text-lg font-bold text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-[#8e8e96]">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PLATFORM ================= */}
      <section className="bg-[#0c0c0d] py-20 sm:py-28">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <motion.div {...fadeUp} className="relative order-2 lg:order-1">
              <div className="pointer-events-none absolute inset-0 rounded-full bg-[#00d4ff]/10 blur-[120px]" />
              <img
                src={datLeftAsset.url}
                alt="DNexus Dynamic Analysis Terminal inside an angled phone mockup"
                className="relative mx-auto w-full max-w-[460px] drop-shadow-2xl"
                loading="lazy"
              />
            </motion.div>
            <motion.div {...fadeUp} className="order-1 space-y-7 lg:order-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e41f28]">Trade on our</span>
                <h2 className="mt-4 font-['Open_Sans'] text-3xl font-bold leading-tight text-white sm:text-5xl">
                  Next-gen trading platform
                </h2>
              </div>
              <p className="text-[15px] leading-relaxed sm:text-base">
                Cutting-edge execution powered by advanced algorithms and AI. From high-frequency digit contracts to
                quantitative strategies, DNexus gives you the edge in fast markets.
              </p>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {[
                  { title: "High-frequency execution", desc: "Turbo mode fires without waiting on open contracts" },
                  { title: "Algorithmic bots", desc: "Automate strategies 24/7 with adaptive learning" },
                  { title: "Powerful Deriv sync", desc: "Official API, multi-account, instant balances" },
                  { title: "AI quant analysis", desc: "Models score probability before every entry" },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3.5">
                    <Zap className="mt-0.5 h-5 w-5 shrink-0 text-[#e41f28]" />
                    <div>
                      <h4 className="mb-1 text-sm font-bold text-white">{item.title}</h4>
                      <p className="text-[13px] leading-relaxed text-[#8e8e96]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Link
                  to="/trading"
                  className="inline-flex items-center justify-center rounded-xl bg-[#e41f28] px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-[#ff3339]"
                >
                  Access Trading Hub
                </Link>
                <a
                  href={DERIV_AFFILIATE_LINK}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-all hover:border-[#e41f28] hover:bg-[#e41f28]/10"
                >
                  Sync with Deriv
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= SHOWCASE ================= */}
      <section className="border-y border-white/[0.06] bg-[#0a0a0b] py-20 sm:py-28">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <motion.div className="mx-auto max-w-[720px] text-center" {...fadeUp}>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e41f28]">Our platform</span>
            <h2 className="mt-4 font-['Open_Sans'] text-3xl font-bold leading-tight text-white sm:text-5xl">
              The full suite of DNexus surfaces
            </h2>
          </motion.div>

          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
            {platformShowcaseCards.map((p, i) => (
              <motion.div
                key={p.title}
                className="flex flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03]"
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.07 }}
              >
                <div className="p-6 pb-0">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <h3 className="font-['Open_Sans'] text-lg font-bold text-white">{p.title}</h3>
                    <span className={`${p.badgeClass} shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase text-white`}>
                      {p.badge}
                    </span>
                  </div>
                  <p className="mb-6 text-sm leading-relaxed text-[#8e8e96]">{p.description}</p>
                  <Link
                    to="/trading"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-[#e41f28]"
                  >
                    Access platform
                  </Link>
                </div>
                <div className="mt-6 overflow-hidden">
                  <img src={p.image} alt={p.title} className="h-56 w-full object-cover object-top opacity-90" loading="lazy" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= WHY TRADE ================= */}
      <section className="bg-[#0c0c0d] py-20 sm:py-28">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-gradient-to-br from-[#171718] to-[#0d0d0e] p-7 sm:p-14">
            <div className="pointer-events-none absolute -right-20 -top-20 h-[320px] w-[320px] rounded-full bg-[#e41f28]/15 blur-[120px]" />
            <div className="relative z-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div className="space-y-6">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e41f28]">Why trade with DNexus</span>
                <h2 className="font-['Open_Sans'] text-3xl font-bold leading-tight text-white sm:text-5xl">
                  Lightning-fast execution, disciplined by design
                </h2>
                <p className="text-[15px] leading-relaxed text-[#a7a7ad] sm:text-base">
                  Proven strategies plus hard risk rails: stake ceilings, daily loss limits and auto-stop on error keep
                  automation honest while you scale.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/trading"
                    className="inline-flex items-center justify-center rounded-xl bg-[#e41f28] px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-[#ff3339]"
                  >
                    Launch the hub
                  </Link>
                  <Link
                    to="/education"
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-white/10"
                  >
                    Learn the strategies
                  </Link>
                </div>
              </div>
              <img
                src={scannerLeftAsset.url}
                alt="DNexus Deep Market Scanner inside an angled phone mockup"
                className="mx-auto w-full max-w-[420px] drop-shadow-2xl"
                loading="lazy"
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {[
              { tag: "Extra visuals", title: "Platform Showcase", copy: "Every DNexus product mockup in one dedicated gallery.", to: "/platform-showcase", cta: "Open showcase" },
              { tag: "Mobile views", title: "Mobile Experience", copy: "Dark and light mobile layouts with the full mobile story.", to: "/mobile-experience", cta: "View mobile page" },
            ].map((c) => (
              <motion.div key={c.title} className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-7" {...fadeUp}>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#e41f28]">{c.tag}</p>
                <h3 className="mt-3 font-['Open_Sans'] text-2xl font-bold text-white sm:text-3xl">{c.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#8e8e96]">{c.copy}</p>
                <Link
                  to={c.to}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:text-[#e41f28]"
                >
                  {c.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= MARKET TRACKER ================= */}
      <section id="market-tracker" className="border-y border-white/[0.06] bg-[#0a0a0b] py-20 sm:py-28">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="mb-12 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e41f28]">Live markets</span>
            <h2 className="mt-4 font-['Open_Sans'] text-3xl font-bold leading-tight text-white sm:text-5xl">
              Comprehensive currency market tracker
            </h2>
          </div>
          <MarketTracker />
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="bg-[#0c0c0d] py-20 sm:py-28">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e41f28]">FAQs</span>
              <h2 className="mt-4 font-['Open_Sans'] text-3xl font-bold leading-tight text-white sm:text-5xl">
                Frequently asked questions
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed">
                Still unsure about something? The Help Centre covers connection, risk settings and payouts in detail.
              </p>
              <Link
                to="/help"
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-white/10"
              >
                Visit Help Centre <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {faqs.map((faq, i) => (
                <div
                  key={faq.q}
                  className="cursor-pointer overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] transition-all hover:border-white/20"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div className="flex items-center justify-between gap-4 p-5">
                    <span className="text-sm font-bold text-white">{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[#e41f28] transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`}
                    />
                  </div>
                  <AnimatePresence initial={false}>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-sm leading-relaxed text-[#8e8e96]">{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
