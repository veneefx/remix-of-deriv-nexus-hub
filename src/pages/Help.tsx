import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MessageCircle, Mail, BookOpen, Shield, Zap, Users, ChevronDown, HelpCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const CATEGORIES = [
  { icon: Zap, title: "Getting Started", articles: [
    { q: "How do I create a Deriv account?", a: "Visit deriv.com and sign up for a free account. You can start with a demo account that comes with $10,000 in virtual funds for practice trading. Once comfortable, you can switch to a real account." },
    { q: "How do I connect my Deriv account to DTNexus?", a: "Click the 'Connect Account' button in the Trading Hub. You'll be redirected to Deriv's secure OAuth2 login page. After signing in, you'll be automatically redirected back to DTNexus with your account connected." },
    { q: "Is DTNexus free to use?", a: "Yes! DTNexus is free to use. We apply a small 3% commission on trades executed through our platform. All educational content, signals, and analytics tools are available at no additional cost." },
    { q: "What markets can I trade on DTNexus?", a: "DTNexus supports all Deriv Volatility Indices including Volatility 10, 25, 50, 75, 100, 150, 200, and 250 — both standard and 1-second variants. We specialize in digit trading contracts." },
  ]},
  { icon: Shield, title: "Account & Security", articles: [
    { q: "Is my Deriv account safe when using DTNexus?", a: "Absolutely. DTNexus uses Deriv's official OAuth2 authentication. We never see or store your Deriv password. Your authentication tokens are stored in session storage and cleared when you close your browser." },
    { q: "Can DTNexus withdraw money from my account?", a: "No. DTNexus can only execute trades on your behalf when you explicitly initiate them. We have no ability to make withdrawals or transfers from your Deriv account." },
    { q: "How do I disconnect my account?", a: "Click the Logout button in the Trading Hub sidebar. This will clear your session and disconnect your Deriv account from DTNexus immediately." },
  ]},
  { icon: BookOpen, title: "Trading & Tools", articles: [
    { q: "What are digit trading contracts?", a: "Digit contracts predict the last digit (0-9) of a market tick. Options include Over/Under (predicting if the digit will be above/below a number), Even/Odd, and Matches/Differs. These are 1-tick contracts with instant results." },
    { q: "How does the AI bot work?", a: "Our AI bot analyzes the last 100+ ticks to identify statistical patterns, digit frequency imbalances, and streak patterns. It uses mean reversion logic and probability-based recovery strategies to find high-probability trade setups." },
    { q: "What is the Martingale feature?", a: "Martingale is a staking strategy where you increase your stake after a loss to recover previous losses when you win. DTNexus allows you to set a custom multiplier and maximum steps to control risk." },
    { q: "How do I use Premium Signals?", a: "Navigate to the Signals page to view real-time technical indicators. The gauges show overall market sentiment based on oscillators and moving averages. Use these signals alongside your own analysis for better trading decisions." },
  ]},
  { icon: Users, title: "Partners Program", articles: [
    { q: "How does the affiliate program work?", a: "Share your unique referral link with others. When someone signs up and trades through your link, you earn a percentage of the commission from their trades. Commissions are lifetime — you earn as long as they trade." },
    { q: "How much can I earn as a partner?", a: "Earnings depend on your referrals' trading volume. Commission rates start at 25% and can reach 40% as you bring more active traders. There is no cap on earnings." },
    { q: "When do I get paid?", a: "Partner commissions are calculated weekly and paid out with no minimum threshold. You can track your earnings in real-time on the Partners dashboard." },
  ]},
];

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />

      {/* Hero */}
      <section className="py-16 text-center">
        <div className="container max-w-2xl">
          <motion.div {...fadeUp}>
            <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">How Can We Help?</h1>
            <p className="mt-3 text-muted-foreground">Search our knowledge base or browse categories below.</p>
            <div className="relative mt-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="pb-12">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Zap, label: "Quick Start Guide", link: "/education" },
              { icon: MessageCircle, label: "Contact Support", link: "#contact" },
              { icon: BookOpen, label: "eLearning Academy", link: "/education" },
              { icon: Mail, label: "Email Us", link: "mailto:support@dtnexus.com" },
            ].map((item) => (
              <Link key={item.label} to={item.link} className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors text-center">
                <item.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">{item.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-12">
        <div className="container max-w-3xl">
          {CATEGORIES.map((cat, ci) => {
            const filteredArticles = searchQuery
              ? cat.articles.filter((a) => a.q.toLowerCase().includes(searchQuery.toLowerCase()) || a.a.toLowerCase().includes(searchQuery.toLowerCase()))
              : cat.articles;

            if (searchQuery && filteredArticles.length === 0) return null;

            return (
              <motion.div key={cat.title} className="mb-10" {...fadeUp} transition={{ delay: ci * 0.1 }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <cat.icon className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">{cat.title}</h2>
                </div>
                <div className="space-y-2">
                  {filteredArticles.map((article, i) => (
                    <details key={i} className="group p-4 rounded-lg bg-card border border-border">
                      <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-foreground">
                        {article.q}
                        <ChevronDown className="w-4 h-4 text-muted-foreground group-open:rotate-180 transition-transform shrink-0 ml-2" />
                      </summary>
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{article.a}</p>
                    </details>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 bg-card/30">
        <div className="container max-w-2xl text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-2xl font-bold text-foreground">Still Need Help?</h2>
            <p className="mt-3 text-muted-foreground">
              Our support team is available 24/7 to assist you with any questions or issues.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              <a href="mailto:support@dtnexus.com" className="px-6 py-3 bg-gradient-brand text-primary-foreground font-semibold rounded-lg">
                📧 Email Support
              </a>
              <a href="https://t.me/dtnexus" target="_blank" rel="noopener" className="px-6 py-3 border border-border text-foreground font-semibold rounded-lg hover:bg-secondary transition-colors">
                💬 Telegram Community
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Help;
