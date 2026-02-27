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
    <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
      <div className="container">
        <div className="mx-auto flex h-[72px] items-center justify-between px-8 bg-card/60 backdrop-blur-sm border border-border/30 rounded-xl mt-3">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="Dnexus" className="h-8" />
            <span className="font-display text-lg font-bold">
              <span className="text-foreground">DN</span>
              <span className="text-primary">EXUS</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <div key={item.label} className="relative">
                {item.children ? (
                  <button
                    className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors hover:text-foreground ${
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
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50"
                        >
                          {item.children.map((child) => (
                            <Link
                              key={child.path}
                              to={child.path}
                              className="block px-4 py-2.5 text-sm text-secondary-foreground hover:bg-secondary hover:text-primary transition-colors"
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
                    className={`px-4 py-2 text-sm font-medium transition-colors hover:text-foreground ${
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

          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/trading"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-brand text-primary-foreground font-semibold text-sm rounded-lg hover-lift glow-red"
            >
              Trading Hub
              <TrendingUp className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border bg-card"
          >
            <div className="container py-4 space-y-2">
              {navItems.map((item) => (
                <div key={item.label}>
                  {item.children ? (
                    <>
                      <p className="px-3 py-2 text-sm text-muted-foreground font-medium">
                        {item.label}
                      </p>
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          className="block pl-6 py-2 text-sm text-secondary-foreground hover:text-primary"
                          onClick={() => setMobileOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </>
                  ) : (
                    <Link
                      to={item.path}
                      className="block px-3 py-2 text-sm text-secondary-foreground hover:text-primary"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
              <Link
                to="/trading"
                className="block text-center mt-4 px-5 py-2.5 bg-gradient-brand text-primary-foreground font-semibold text-sm rounded-lg"
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
