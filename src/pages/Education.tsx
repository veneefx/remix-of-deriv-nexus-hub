import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Trophy, Star, Clock, Users, ChevronRight, GraduationCap, TrendingUp, BarChart3, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const CATEGORIES = ["All", "Beginner", "Intermediate", "Advanced", "Strategy"];

const COURSES = [
  { title: "Introduction to Trading", desc: "Learn the fundamentals of financial markets and how trading works.", level: "Beginner", duration: "2h", students: 1240, icon: BookOpen, color: "bg-buy/10 text-buy" },
  { title: "Technical Analysis 101", desc: "Master chart patterns, indicators, and price action analysis.", level: "Beginner", duration: "4h", students: 980, icon: BarChart3, color: "bg-primary/10 text-primary" },
  { title: "Digit Trading Strategies", desc: "Advanced strategies for digit over/under, even/odd contracts.", level: "Intermediate", duration: "3h", students: 750, icon: TrendingUp, color: "bg-accent/10 text-accent" },
  { title: "Risk Management", desc: "Protect your capital with proven risk management techniques.", level: "Intermediate", duration: "2.5h", students: 890, icon: Shield, color: "bg-warning/10 text-warning" },
  { title: "Algorithmic Trading", desc: "Build and deploy automated trading bots using the Deriv API.", level: "Advanced", duration: "6h", students: 420, icon: GraduationCap, color: "bg-buy/10 text-buy" },
  { title: "Volatility Index Mastery", desc: "Deep dive into synthetic indices and volatility markets.", level: "Advanced", duration: "5h", students: 560, icon: BarChart3, color: "bg-primary/10 text-primary" },
];

const ACHIEVEMENTS = [
  { title: "First Trade", desc: "Complete your first trade", icon: "🏆", earned: true },
  { title: "Quick Learner", desc: "Complete 3 courses", icon: "📚", earned: true },
  { title: "Win Streak", desc: "Win 10 trades in a row", icon: "🔥", earned: false },
  { title: "Risk Master", desc: "Trade 50 times without hitting stop loss", icon: "🛡", earned: false },
  { title: "Analyst Pro", desc: "Use the analysis tab 100 times", icon: "📊", earned: false },
  { title: "Bot Builder", desc: "Run automated trading for 1 hour", icon: "🤖", earned: false },
];

const Education = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredCourses = selectedCategory === "All" ? COURSES : COURSES.filter((c) => c.level === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />

      {/* Hero */}
      <section className="py-16 text-center">
        <div className="container">
          <motion.div {...fadeUp}>
            <span className="inline-block px-4 py-1.5 mb-4 rounded-full border border-primary/30 bg-primary/5 text-xs font-medium text-primary">
              📚 eLearning Academy
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground">
              Master the <span className="text-gradient-brand">Markets</span>
            </h1>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              From beginner to expert. Learn trading strategies, technical analysis, and algorithmic trading with our comprehensive course library.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="pb-12">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "6+", label: "Courses", icon: BookOpen },
              { value: "4.8K+", label: "Students", icon: Users },
              { value: "4.9/5", label: "Rating", icon: Star },
              { value: "22h+", label: "Content", icon: Clock },
            ].map((s) => (
              <motion.div key={s.label} className="p-4 rounded-xl bg-card border border-border text-center" {...fadeUp}>
                <s.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="pb-6">
        <div className="container">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  selectedCategory === c ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="pb-16">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, i) => (
              <motion.div
                key={course.title}
                className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors group cursor-pointer"
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
              >
                <div className={`w-10 h-10 rounded-lg ${course.color} flex items-center justify-center mb-4`}>
                  <course.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{course.level}</span>
                <h3 className="text-foreground font-semibold mt-1">{course.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{course.desc}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {course.students}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-16 bg-card/30">
        <div className="container">
          <motion.div className="text-center mb-10" {...fadeUp}>
            <Trophy className="w-8 h-8 text-accent mx-auto mb-3" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Achievements</h2>
            <p className="text-muted-foreground mt-2">Track your progress and earn badges as you learn.</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {ACHIEVEMENTS.map((a, i) => (
              <motion.div
                key={a.title}
                className={`p-4 rounded-xl border text-center ${a.earned ? "bg-card border-primary/30" : "bg-card/50 border-border opacity-50"}`}
                {...fadeUp}
                transition={{ delay: i * 0.05 }}
              >
                <div className="text-2xl mb-2">{a.icon}</div>
                <h4 className="text-xs font-semibold text-foreground">{a.title}</h4>
                <p className="text-[10px] text-muted-foreground mt-1">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Ready to Start Learning?</h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Join thousands of traders who are mastering the markets with our expert-led courses.
            </p>
            <button className="mt-6 px-8 py-3 bg-gradient-brand text-primary-foreground font-semibold rounded-lg glow-red">
              Enroll Now — It's Free
            </button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Education;
