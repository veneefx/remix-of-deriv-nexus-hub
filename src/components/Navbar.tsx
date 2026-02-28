import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, X, TrendingUp } from "lucide-react";
import logo from "@/assets/logo.png";

const navItems = [
  { label: "Home", path: "/" },
  {
    label: "Platforms",
    children: [
      { label: "Trading Hub", path: "/trading" },
      { label: "AI Signals", path: "/signals" },
      { label: "Partners Program", path: "/partners" },
    ],
  },
  { label: "Education", path: "/education" },
  { label: "Market Tracker", path: "/signals" },
  { label: "Charts", path: "/signals" },
  {
    label: "Account",
    children: [
      { label: "Profile", path: "/trading" },
      { label: "Settings", path: "/trading" },
    ],
  },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 py-3 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex h-[60px] items-center justify-between px-6 sm:px-8 bg-card/70 backdrop-blur-md border border-border/50 rounded-full shadow-lg shadow-black/10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="DTNexus" className="h-7" />
            <span className="font-display text-base font-bold">
              <span className="text-foreground">DT</span>
              <span className="text-primary">NEXUS</span>
            </span>
          </Link>

          {/* Desktop Nav - centered */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navItems.map((item) => (
              <div key={item.label} className="relative">
                {item.children ? (
                  <button
                    className={`flex items-center gap-1 px-3.5 py-2 text-[13px] font-medium transition-colors hover:text-foreground rounded-full ${
                      item.children.some((c) => c.path === location.pathname)
                        ? "text-primary"
                        : "text-secondary-foreground"
                    }`}
                    onMouseEnter={() => setOpenDropdown(item.label)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    {item.label}
                    <ChevronDown className="w-3 h-3" />
                    <AnimatePresence>
                      {openDropdown === item.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 mt-2 w-48 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl shadow-black/20 overflow-hidden z-50"
                        >
                          {item.children.map((child) => (
                            <Link
                              key={child.path}
                              to={child.path}
                              className="block px-4 py-2.5 text-[13px] text-secondary-foreground hover:bg-secondary hover:text-primary transition-colors"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                ) : (
                  <Link
                    to={item.path}
                    className={`px-3.5 py-2 text-[13px] font-medium transition-colors hover:text-foreground rounded-full ${
                      location.pathname === item.path
                        ? "text-primary"
                        : "text-secondary-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Right CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/trading"
              className="flex items-center gap-2 h-10 px-5 bg-gradient-brand text-primary-foreground font-semibold text-[13px] rounded-lg hover-lift glow-red"
            >
              Trading Hub
              <TrendingUp className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden mt-2 mx-4 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-4 space-y-1">
              {navItems.map((item) => (
                <div key={item.label}>
                  {item.children ? (
                    <>
                      <p className="px-3 py-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        {item.label}
                      </p>
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          className="block pl-6 py-2 text-sm text-secondary-foreground hover:text-primary rounded-lg"
                          onClick={() => setMobileOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </>
                  ) : (
                    <Link
                      to={item.path}
                      className="block px-3 py-2 text-sm text-secondary-foreground hover:text-primary rounded-lg"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
              <Link
                to="/trading"
                className="block text-center mt-3 px-5 py-2.5 bg-gradient-brand text-primary-foreground font-semibold text-sm rounded-xl"
                onClick={() => setMobileOpen(false)}
              >
                Trading Hub →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;