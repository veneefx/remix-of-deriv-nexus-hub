import { motion } from "framer-motion";
import { TrendingUp, BarChart3, Users, Globe, Shield, Zap, Brain, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

const whatYouGet = [
  { icon: BarChart3, title: "Advanced Analytics", desc: "Get detailed insights and analysis to make informed trading decisions." },
  { icon: Shield, title: "AI-Powered Signals", desc: "Leverage artificial intelligence for accurate market predictions." },
  { icon: Zap, title: "Real-Time Updates", desc: "Stay ahead with instant notifications and live market data." },
  { icon: Globe, title: "Risk Management", desc: "Built-in tools to help you manage risk and protect your investments." },
];

const faqs = [
  { q: "What is trading?", a: "Trading involves buying and selling financial instruments to profit from price movements." },
  { q: "How does Dnexus work?", a: "Dnexus connects to the Deriv API to provide real-time trading, signals, and analytics in one platform." },
  { q: "Is my money safe?", a: "We use official Deriv OAuth for authentication. Funds are held in your Deriv account, not ours." },
  { q: "Can I use a demo account?", a: "Yes! Log in with your Deriv demo account (VRTC) to practice risk-free." },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
          <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px]" />
        </div>

        <div className="container relative py-24 md:py-36 text-center">
          <motion.div
            className="inline-block px-4 py-1.5 mb-6 rounded-full border border-primary/30 bg-primary/5"
            {...fadeUp}
          >
            <span className="text-xs font-medium text-primary">🚀 Next-Gen Trading Platform</span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Trading made{" "}
            <span className="text-gradient-brand">easier</span>
          </motion.h1>

          <motion.p
            className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Experience AI-powered analytics, automated trading strategies, professional signals, 
            and secure account management - all in one unified platform.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link
              to="/trading"
              className="flex items-center gap-2 px-8 py-3.5 bg-gradient-brand text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity glow-red"
            >
              Start Trading Now
              <TrendingUp className="w-5 h-5" />
            </Link>
            <a
              href="https://deriv.com/signup/"
              target="_blank"
              rel="noopener"
              className="px-8 py-3.5 border border-border text-foreground font-semibold rounded-lg hover:bg-secondary transition-colors"
            >
              Create Free Deriv Account
            </a>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto"
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {features.map((f) => (
              <div key={f.title} className="flex flex-col items-center gap-3 p-6">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Trading Reimagined Section */}
      <section className="py-20 bg-card/30">
        <div className="container">
          <motion.div className="max-w-3xl mx-auto text-center" {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold">
              Trading <span className="text-gradient-brand">Reimagined</span>
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              DTNexus leverages AI and machine learning to deliver expert signals and quantitative analysis 
              that professionals trust. Our comprehensive free learning materials help you master the markets 
              while our automation tools execute with precision.
            </p>
            <Link to="/education" className="inline-flex items-center gap-2 mt-6 text-primary font-medium hover:underline">
              Learn More →
            </Link>
          </motion.div>
        </div>
      </section>

      {/* What You'll Get */}
      <section className="py-20">
        <div className="container">
          <motion.h2 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-12" {...fadeUp}>
            What You'll Get
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whatYouGet.map((item, i) => (
              <motion.div
                key={item.title}
                className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                {...fadeUp}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-20 bg-gradient-brand relative overflow-hidden">
        <div className="absolute inset-0 bg-background/90" />
        <div className="container relative">
          <motion.div className="text-center mb-12" {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold">
              Join a Growing Community
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Dnexus is rapidly becoming the platform of choice for traders seeking an edge in today's dynamic markets.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "12K+", label: "Active Traders" },
              { value: "99K", label: "Monthly Volume (USD)" },
              { value: "24/7", label: "Market Access" },
              { value: "AI", label: "Powered Analytics" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center"
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-3xl md:text-4xl font-bold text-gradient-brand">{stat.value}</div>
                <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container max-w-2xl">
          <motion.div className="text-center mb-12" {...fadeUp}>
            <span className="text-sm text-primary font-medium">FAQ's</span>
            <h2 className="text-3xl font-bold mt-2">Frequently Asked Questions</h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.details
                key={i}
                className="group p-4 rounded-lg bg-card border border-border"
                {...fadeUp}
                transition={{ delay: i * 0.05 }}
              >
                <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-foreground">
                  {faq.q}
                  <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-card/50">
        <div className="container text-center">
          <motion.h2 className="text-3xl md:text-4xl font-bold" {...fadeUp}>
            Ready to Take Your Trading to the Next Level?
          </motion.h2>
          <motion.p className="mt-4 text-muted-foreground max-w-xl mx-auto" {...fadeUp}>
            Unlock the full potential of your trading journey with our powerful tools and expert guidance.
          </motion.p>
          <motion.div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center" {...fadeUp}>
            <Link
              to="/trading"
              className="px-8 py-3.5 bg-gradient-brand text-primary-foreground font-semibold rounded-lg glow-red"
            >
              Start Trading Now
            </Link>
            <a
              href="https://deriv.com/signup/"
              target="_blank"
              rel="noopener"
              className="px-8 py-3.5 border border-border text-foreground font-semibold rounded-lg hover:bg-secondary transition-colors"
            >
              Create Deriv Account
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
