import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home, BarChart3, Users, TrendingUp, BookOpen, HelpCircle,
  Menu, X, Wallet, ChevronDown, Moon, Sun, Settings, Shield,
  AlertTriangle, Search, Activity, User, Clock
} from "lucide-react";
import logo from "@/assets/logo.png";
import { getActiveAccount, getStoredAccounts, clearAuth, setActiveAccount, parseCallbackParams, storeAccounts, type DerivAccount } from "@/services/deriv-auth";
import { getOAuthUrl } from "@/services/deriv-auth";
import TradingPanel from "@/components/trading/TradingPanel";
import TradingViewChart from "@/components/trading/TradingViewChart";
import DerivChart from "@/components/trading/DerivChart";
import DATTab from "@/components/trading/DATTab";
import ClientTokenManager from "@/components/trading/ClientTokenManager";
import DerivWebSocket from "@/services/deriv-websocket";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VOLATILITY_MARKETS, CONTRACT_TYPES } from "@/lib/trading-constants";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { usePremium } from "@/hooks/use-premium";
import PremiumUpgradeModal from "@/components/trading/PremiumUpgradeModal";
import AdminDashboard from "@/components/trading/AdminDashboard";

const DERIV_APP_ID = "129344";

const sidebarItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: TrendingUp, label: "AI Signals", path: "/signals" },
  { icon: BarChart3, label: "Market Tracker", path: "/signals" },
  { icon: Users, label: "Partners", path: "/partners" },
  { icon: BookOpen, label: "eLearning Academy", path: "/education" },
  { icon: HelpCircle, label: "Help Center", path: "/help" },
  { icon: Settings, label: "Settings", path: "/risk" },
];

type ViewMode = "digit-edge" | "trading-view" | "deriv-charts" | "dat" | "transactions";

const viewLabels: Record<ViewMode, string> = {
  "digit-edge": "Digit Edge",
  "trading-view": "Trading View",
  "deriv-charts": "Deriv Charts",
  "dat": "DAT",
  "transactions": "Transactions",
};

const TradingHub = () => {
  const [account, setAccount] = useState<DerivAccount | null>(getActiveAccount());
  const [accounts, setAccounts] = useState<DerivAccount[]>(getStoredAccounts());
  const [balance, setBalance] = useState<number | null>(null);
  const [accountBalances, setAccountBalances] = useState<Record<string, number>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ws, setWs] = useState<DerivWebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [activeView, setActiveView] = useState<ViewMode>(() => (localStorage.getItem("dnx_view") as ViewMode) || "digit-edge");
  const [selectedMarket, setSelectedMarket] = useState(() => localStorage.getItem("dnx_market") || "R_10");
  const [tokenManagerOpen, setTokenManagerOpen] = useState(false);
  const [tokenTab, setTokenTab] = useState<"demo" | "real" | "clients">("demo");
  const [lastDigits, setLastDigits] = useState<number[]>([]);
  const [currentTick, setCurrentTick] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return false; // Default to white theme
    }
    return false;
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isPremium, isAdmin } = usePremium();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState("");

  // Persist view selection
  useEffect(() => { localStorage.setItem("dnx_view", activeView); }, [activeView]);

  // Check platform auth
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

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Apply theme on mount and whenever darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Handle OAuth callback params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("acct1") || params.has("token1")) {
      const parsed = parseCallbackParams();
      if (parsed.length > 0) {
        storeAccounts(parsed);
        const realAccount = parsed.find((a) => !a.is_virtual) || parsed[0];
        setActiveAccount(realAccount);
        setAccounts(parsed);
        setAccount(realAccount);
        window.history.replaceState({}, document.title, "/trading");
      }
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  // WebSocket connection
  useEffect(() => {
    const wsInstance = new DerivWebSocket(DERIV_APP_ID);
    setWs(wsInstance);
    wsInstance.connect().then(() => {
      setWsConnected(true);
      wsInstance.subscribeTicks(selectedMarket);
      if (account) wsInstance.authorize(account.token);
    }).catch(() => {
      setWsConnected(false);
    });

    wsInstance.on("authorize", (data) => {
      if (data.authorize) {
        setBalance(data.authorize.balance);
        setAccountBalances(prev => ({ ...prev, [data.authorize.loginid]: data.authorize.balance }));
      }
    });

    wsInstance.on("tick", (data) => {
      if (!data.tick) return;
      setCurrentTick(data.tick.quote);
      const quoteStr = Number(data.tick.quote).toFixed(2);
      const digit = parseInt(quoteStr[quoteStr.length - 1], 10);
      setLastDigits(prev => [...prev.slice(-99), digit]);
    });

    return () => wsInstance.disconnect();
  }, [account]);

  const handleLogin = () => {
    const url = getOAuthUrl(DERIV_APP_ID, `${window.location.origin}/callback`);
    window.location.href = url;
  };

  const handleLogout = () => {
    clearAuth();
    setAccount(null);
    setBalance(null);
    setAccounts([]);
    setAccountBalances({});
    ws?.disconnect();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Africa/Nairobi" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="w-8 h-8" />
              <span className="font-bold text-xl">DNexus</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden"><X className="w-5 h-5" /></button>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {sidebarItems.map((item) => (
              <Link key={item.label} to={item.path} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent transition-colors">
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t space-y-2">
             <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent transition-colors">
               {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
               <span className="font-medium">{darkMode ? "Light Mode" : "Dark Mode"}</span>
             </button>
             {account && (
               <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/10 text-destructive transition-colors">
                 <X className="w-5 h-5" />
                 <span className="font-medium">Logout</span>
               </button>
             )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Header */}
        <header className="h-16 border-b bg-card/80 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-accent rounded-lg"><Menu className="w-5 h-5" /></button>
            <div className="hidden md:flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{formatTime(currentTime)} (EAT)</span>
              <span className="text-sm font-bold flex items-center gap-2">
                {selectedMarket.replace("_", " ")}
                <span className={`w-2 h-2 rounded-full ${wsConnected ? "bg-green-500" : "bg-red-500"} animate-pulse`} />
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1 bg-accent/50 p-1 rounded-xl">
               {(Object.keys(viewLabels) as ViewMode[]).map((v) => (
                 <button
                   key={v}
                   onClick={() => setActiveView(v)}
                   className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeView === v ? "bg-primary text-white shadow-lg" : "hover:bg-accent"}`}
                 >
                   {viewLabels[v]}
                 </button>
               ))}
             </div>
             
             {account ? (
               <div className="flex items-center gap-3 ml-2">
                 <div className="text-right hidden sm:block">
                   <p className="text-[10px] text-muted-foreground font-bold uppercase">{account.loginid}</p>
                   <p className="text-sm font-bold text-primary">{balance !== null ? `${balance.toLocaleString()} ${account.currency}` : "Loading..."}</p>
                 </div>
                 <button onClick={() => setTokenManagerOpen(true)} className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                   <User className="w-5 h-5 text-primary" />
                 </button>
               </div>
             ) : (
               <button onClick={handleLogin} className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                 Connect Account
               </button>
             )}
          </div>
        </header>

        {/* Trading Interface */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-0 overflow-hidden">
             {/* Chart Area */}
             <div className="xl:col-span-3 border-r overflow-hidden flex flex-col bg-background">
                {activeView === "trading-view" ? (
                  <TradingViewChart symbol={selectedMarket} />
                ) : activeView === "deriv-charts" ? (
                  <DerivChart symbol={selectedMarket} />
                ) : activeView === "dat" ? (
                  <DATTab lastDigits={lastDigits} currentTick={currentTick} />
                ) : (
                  <div className="flex-1 flex flex-col">
                    <div className="p-4 border-b flex items-center justify-between bg-card">
                       <h2 className="font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Market Analysis</h2>
                       <div className="flex gap-2">
                          {VOLATILITY_MARKETS.slice(0, 5).map(m => (
                            <button 
                              key={m.symbol}
                              onClick={() => setSelectedMarket(m.symbol)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${selectedMarket === m.symbol ? "bg-primary border-primary text-white" : "hover:border-primary/50"}`}
                            >
                              {m.label}
                            </button>
                          ))}
                       </div>
                    </div>
                    <div className="flex-1 relative">
                       <TradingViewChart symbol={selectedMarket} />
                    </div>
                  </div>
                )}
             </div>

             {/* Trading Panel Area */}
             <div className="xl:col-span-1 overflow-y-auto bg-card">
                <TradingPanel ws={ws} account={account} />
             </div>
          </div>
        </div>
      </main>

      <ClientTokenManager 
        open={tokenManagerOpen} 
        onClose={() => setTokenManagerOpen(false)} 
        accounts={accounts}
        activeAccount={account}
        onSwitch={handleSwitchAccount}
      />
      
      <PremiumUpgradeModal 
        open={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)} 
        feature={premiumFeature} 
      />
    </div>
  );
};

export default TradingHub;
