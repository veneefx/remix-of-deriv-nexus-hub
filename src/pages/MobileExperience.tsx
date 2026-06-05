import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Smartphone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import mobileDarkAsset from "@/assets/landing-mobile-dark.webp.asset.json";
import mobileLightAsset from "@/assets/landing-mobile-light.webp.asset.json";

const MobileExperience = () => {
  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <Navbar />
      <main className="px-6 pb-20 pt-32">
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <section className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#00d4ff]">
              <Smartphone className="h-4 w-4" /> Mobile Experience
            </div>
            <h1 className="text-4xl font-bold md:text-6xl">DNexus tuned for handheld execution</h1>
            <p className="max-w-2xl text-lg leading-relaxed text-white/70">
              The mobile layouts were moved here so the landing hero stays focused. This page keeps the polished phone-first experience visible without crowding the front page.
            </p>
            <div className="grid gap-3 text-sm text-white/70 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Dark mode for execution focus and low-light trading sessions.</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Light mode for review, analysis, and cleaner daytime readability.</div>
            </div>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/trading" className="inline-flex items-center gap-2 rounded-xl bg-[#e41f28] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ff3333]">
                Go to Trading Hub <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/platform-showcase" className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/5">
                Platform Showcase
              </Link>
            </div>
          </section>

          <section className="relative flex min-h-[560px] items-center justify-center overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-8">
            <motion.img
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              src={mobileDarkAsset.url}
              alt="DNexus mobile dark trading interface"
              className="relative z-10 w-full max-w-[280px] rounded-[2rem] border border-white/10 bg-white/5 p-2 shadow-2xl"
              loading="eager"
            />
            <motion.img
              initial={{ opacity: 0, x: 18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12 }}
              src={mobileLightAsset.url}
              alt="DNexus mobile light trading interface"
              className="absolute right-4 top-14 w-full max-w-[220px] rounded-[2rem] border border-white/10 bg-white/5 p-2 shadow-2xl md:right-10"
              loading="lazy"
            />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MobileExperience;