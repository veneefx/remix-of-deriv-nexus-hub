import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, X, TrendingUp, LogOut } from "lucide-react";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";

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
  { label: "Market Tracker", path: "/#market-tracker" },
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${scrolled ? "py-4" : "py-6"}`}>
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8">
        <div className={`flex h-[72px] items-center justify-between px-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl transition-all duration-300 ${scrolled ? "shadow-black/40" : ""}`}>
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logo} alt="DNexus" className="h-9 transition-transform duration-300 group-hover:scale-110" />
            <span className="font-bold text-xl tracking-tight text-white uppercase">
              DNexus
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => (
              <div key={item.label} className="relative group/nav">
                {item.children ? (
                  <div
                    className="relative"
                    onMouseEnter={() => setOpenDropdown(item.label)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all hover:text-[#e41f28] ${
                        item.children.some((c) => c.path === location.pathname) ? "text-[#e41f28]" : "text-gray-300"
                      }`}
                    >
                      {item.label}
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openDropdown === item.label ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {openDropdown === item.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 15, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 15, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute top-full left-0 mt-3 w-56 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 p-2"
                        >
                          {item.children.map((child) => (
                            <Link 
                              key={child.path} 
                              to={child.path} 
                              className="block px-4 py-3 text-sm font-bold text-gray-400 hover:bg-[#e41f28]/10 hover:text-[#e41f28] rounded-xl transition-all uppercase tracking-wider"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link 
                    to={item.path} 
                    className={`px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all hover:text-[#e41f28] ${
                      location.pathname === item.path ? "text-[#e41f28]" : "text-gray-300"
                    }`}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link 
                  to="/trading" 
                  className="flex items-center gap-2 h-12 px-8 bg-[#e41f28] text-white font-bold text-sm rounded-xl hover:bg-[#ff3333] transition-all transform hover:scale-105 shadow-lg shadow-[#e41f28]/20 uppercase tracking-widest"
                >
                  Trading Hub
                  <TrendingUp className="w-4 h-4" />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center w-12 h-12 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  to="/auth" 
                  className="px-6 py-2 text-sm font-bold text-white hover:text-[#e41f28] transition-all uppercase tracking-widest"
                >
                  Login
                </Link>
                <Link 
                  to="/trading" 
                  className="flex items-center gap-2 h-12 px-8 bg-[#e41f28] text-white font-bold text-sm rounded-xl hover:bg-[#ff3333] transition-all transform hover:scale-105 shadow-lg shadow-[#e41f28]/20 uppercase tracking-widest"
                >
                  Trading Hub
                  <TrendingUp className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          <button 
            className="lg:hidden w-12 h-12 flex items-center justify-center text-white bg-white/5 rounded-xl border border-white/10" 
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 100 }} 
            className="fixed inset-0 z-[70] lg:hidden bg-black/95 backdrop-blur-2xl p-8"
          >
            <div className="flex justify-between items-center mb-12">
              <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
                <img src={logo} alt="DNexus" className="h-9" />
                <span className="font-bold text-xl text-white uppercase">DNexus</span>
              </Link>
              <button className="w-12 h-12 flex items-center justify-center text-white bg-white/5 rounded-xl" onClick={() => setMobileOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {navItems.map((item) => (
                <div key={item.label} className="space-y-4">
                  {item.children ? (
                    <>
                      <p className="text-xs text-[#e41f28] font-bold uppercase tracking-[0.2em]">{item.label}</p>
                      <div className="grid grid-cols-1 gap-4 pl-4">
                        {item.children.map((child) => (
                          <Link 
                            key={child.path} 
                            to={child.path} 
                            className="text-2xl font-bold text-white hover:text-[#e41f28] transition-all uppercase" 
                            onClick={() => setMobileOpen(false)}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Link 
                      to={item.path} 
                      className="block text-3xl font-bold text-white hover:text-[#e41f28] transition-all uppercase" 
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
              
              <div className="pt-12 flex flex-col gap-4">
                <Link 
                  to="/trading" 
                  className="w-full py-5 bg-[#e41f28] text-white font-bold text-center rounded-2xl text-xl shadow-xl shadow-[#e41f28]/20 uppercase tracking-widest" 
                  onClick={() => setMobileOpen(false)}
                >
                  Trading Hub
                </Link>
                {isAuthenticated ? (
                  <button
                    onClick={() => { handleSignOut(); setMobileOpen(false); }}
                    className="w-full py-5 border-2 border-white/10 text-white font-bold rounded-2xl text-xl uppercase tracking-widest"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link 
                    to="/auth" 
                    className="w-full py-5 border-2 border-white/10 text-white font-bold text-center rounded-2xl text-xl uppercase tracking-widest" 
                    onClick={() => setMobileOpen(false)}
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
