import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ScanLine, Sparkles, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import datLeftAsset from "@/assets/landing-dat-left.png.asset.json";
import scannerLeftAsset from "@/assets/landing-scanner-left.png.asset.json";
import tradingViewPortraitAsset from "@/assets/landing-tradingview-portrait.png.asset.json";
import aiCommandPortraitAsset from "@/assets/landing-ai-command-portrait.png.asset.json";

const showcaseCards = [
  {
    title: "Dynamic Analysis Terminal",
    description: "The core intelligence surface for reading volatility, tick speed, pressure, and confluence from a single DNexus workflow.",
    image: datLeftAsset.url,
    icon: ScanLine,
  },
  {
    title: "Market Scanner",
    description: "A broader radar for ranking setups, spotting momentum clusters, and narrowing focus before execution.",
    image: scannerLeftAsset.url,
    icon: TrendingUp,
  },
  {
    title: "Chart + AI Command",
    description: "The premium mobile-style presentation of the trading chart beside the AI guidance layer and execution context.",
    image: tradingViewPortraitAsset.url,
    icon: Sparkles,
  },
  {
    title: "AI Trading Surface",
    description: "A refined DNexus view showing how the AI layer and active market context stay visually aligned inside the brand.",
    image: aiCommandPortraitAsset.url,
    icon: Sparkles,
  },
];

const PlatformShowcase = () => {
  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <Navbar />
      <main className="px-6 pb-20 pt-32">
        <div className="mx-auto max-w-6xl space-y-14">
          <section className="space-y-5 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#00d4ff]">Platform Showcase</p>
            <h1 className="text-4xl font-bold md:text-6xl">Authentic DNexus product views, kept off the hero</h1>
            <p className="mx-auto max-w-3xl text-lg text-white/70">
              These are the extra platform visuals moved out of the landing hero so the front page stays cleaner while the product depth still gets its own dedicated space.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link to="/trading" className="inline-flex items-center gap-2 rounded-xl bg-[#e41f28] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ff3333]">
                Open Trading Hub <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/mobile-experience" className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/5">
                View Mobile Experience
              </Link>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {showcaseCards.map((card, index) => (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5"
              >
                <div className="p-6">
                  <div className="mb-4 inline-flex rounded-xl bg-white/8 p-3">
                    <card.icon className="h-5 w-5 text-[#00d4ff]" />
                  </div>
                  <h2 className="text-2xl font-bold">{card.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{card.description}</p>
                </div>
                <img src={card.image} alt={card.title} className="w-full object-cover" loading="lazy" />
              </motion.article>
            ))}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PlatformShowcase;