import { useState } from "react";
import { motion } from "framer-motion";
import { Users, DollarSign, Link2, BarChart3, Copy, CheckCircle, TrendingUp, Globe, Shield, Zap, Gift, Award } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const COMMISSION_TIERS = [
  { tier: "Starter", minReferrals: 0, rate: "25%", color: "border-muted" },
  { tier: "Silver", minReferrals: 10, rate: "30%", color: "border-muted-foreground" },
  { tier: "Gold", minReferrals: 50, rate: "35%", color: "border-accent" },
  { tier: "Platinum", minReferrals: 100, rate: "40%", color: "border-primary" },
];

const BENEFITS = [
  { icon: DollarSign, title: "Lifetime Commissions", desc: "Earn recurring commissions on every trade your referrals make, forever." },
  { icon: BarChart3, title: "Real-Time Analytics", desc: "Track clicks, conversions, and earnings with our advanced dashboard." },
  { icon: Globe, title: "Global Reach", desc: "Promote to traders worldwide with multi-language support." },
  { icon: Shield, title: "Trusted Platform", desc: "Partner with a regulated, transparent trading ecosystem." },
  { icon: Zap, title: "Instant Payouts", desc: "Get paid weekly with no minimum threshold." },
  { icon: Gift, title: "Exclusive Bonuses", desc: "Access special promotions and bonus programs for top partners." },
];

const MOCK_STATS = [
  { label: "Total Referrals", value: "0", icon: Users },
  { label: "Active Traders", value: "0", icon: TrendingUp },
  { label: "Total Earned", value: "$0.00", icon: DollarSign },
  { label: "This Month", value: "$0.00", icon: BarChart3 },
];

const Partners = () => {
  const [copied, setCopied] = useState(false);
  const referralLink = "https://digit-nexus-hub.lovable.app/?ref=YOUR_ID";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />

      {/* Hero */}
      <section className="py-16 text-center">
        <div className="container">
          <motion.div {...fadeUp}>
            <span className="inline-block px-4 py-1.5 mb-4 rounded-full border border-primary/30 bg-primary/5 text-xs font-medium text-primary">
              🤝 Partners Program
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground">
              Earn While You <span className="text-gradient-brand">Share</span>
            </h1>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Join the DTNexus affiliate program and earn lifetime commissions on every trade your referrals make. No limits, no caps.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Dashboard */}
      <section className="pb-12">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {MOCK_STATS.map((s) => (
              <motion.div key={s.label} className="p-5 rounded-xl bg-card border border-border text-center" {...fadeUp}>
                <s.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Referral Link */}
      <section className="pb-12">
        <div className="container max-w-2xl">
          <motion.div className="p-6 rounded-xl bg-card border border-border" {...fadeUp}>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" /> Your Referral Link
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-muted-foreground"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2.5 bg-gradient-brand text-primary-foreground text-sm font-semibold rounded-lg flex items-center gap-2"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Commission Tiers */}
      <section className="py-16">
        <div className="container">
          <motion.div className="text-center mb-10" {...fadeUp}>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Commission Tiers</h2>
            <p className="text-muted-foreground mt-2">The more you refer, the more you earn.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {COMMISSION_TIERS.map((tier, i) => (
              <motion.div
                key={tier.tier}
                className={`p-6 rounded-xl bg-card border-2 ${tier.color} text-center`}
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
              >
                <Award className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-bold text-foreground">{tier.tier}</h3>
                <p className="text-3xl font-bold text-gradient-brand mt-2">{tier.rate}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {tier.minReferrals === 0 ? "Start earning today" : `${tier.minReferrals}+ active referrals`}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-card/30">
        <div className="container">
          <motion.div className="text-center mb-10" {...fadeUp}>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Why Partner With Us</h2>
            <p className="text-muted-foreground mt-2">Everything you need to succeed as a DTNexus affiliate.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                {...fadeUp}
                transition={{ delay: i * 0.08 }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <b.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container max-w-3xl">
          <motion.div className="text-center mb-10" {...fadeUp}>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">How It Works</h2>
          </motion.div>
          <div className="space-y-6">
            {[
              { step: "1", title: "Sign Up", desc: "Create your free partner account in seconds. No upfront costs or commitments." },
              { step: "2", title: "Share Your Link", desc: "Promote DTNexus using your unique referral link across social media, websites, or communities." },
              { step: "3", title: "Earn Commissions", desc: "Every time someone signs up and trades through your link, you earn a commission on their trading volume." },
            ].map((s, i) => (
              <motion.div key={s.step} className="flex gap-4 items-start" {...fadeUp} transition={{ delay: i * 0.1 }}>
                <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary-foreground">{s.step}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-card/50">
        <div className="container text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Ready to Start Earning?</h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Join hundreds of partners already earning lifetime commissions with DTNexus.
            </p>
            <button className="mt-6 px-8 py-3.5 bg-gradient-brand text-primary-foreground font-semibold rounded-lg glow-red">
              Become a Partner — It's Free
            </button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Partners;
