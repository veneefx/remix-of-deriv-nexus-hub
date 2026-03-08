import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home, BarChart3, Users, TrendingUp, BookOpen, HelpCircle,
  Menu, X, Wallet, ChevronDown, Moon, Sun, Settings, Shield,
  AlertTriangle, Search, Activity, User, Clock, Lock, FlaskConical
} from "lucide-react";
import logo from "@/assets/logo.png";
import { getActiveAccount, getStoredAccounts, clearAuth, setActiveAccount, parseCallbackParams, storeAccounts, type DerivAccount } from "@/services/deriv-auth";
import { getOAuthUrl } from "@/services/deriv-auth";
import TradingPanel from "@/components/trading/TradingPanel";
import TradingViewChart from "@/components/trading/TradingViewChart";
import DerivChart from "@/components/trading/DerivChart";
import DATTab from "@/components/trading/DATTab";
import MarketScannerView from "@/components/trading/MarketScannerView";
import StrategyLab from "@/components/trading/StrategyLab";
import ClientTokenManager from "@/components/trading/ClientTokenManager";
import TradingHubLoader from "@/components/trading/TradingHubLoader";
import DerivWebSocket from "@/services/deriv-websocket";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VOLATILITY_MARKETS, MARKET_CATEGORIES, CONTRACT_TYPES } from "@/lib/trading-constants";
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

type ViewMode = "digit-edge" | "trading-view" | "deriv-charts" | "dat" | "market-scanner" | "strategy-lab" | "transactions";

const viewLabels: Record<ViewMode, string> = {
  "digit-edge": "Digit Edge",
  "trading-view": "Trading View",
  "deriv-charts": "Deriv Charts",
  "dat": "DAT",
  "market-scanner": "Market Scanner",
  "strategy-lab": "Strategy Lab",
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
      return false; // Default to light
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
      if (!user) {
        // Allow viewing but restrict trading
      }
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

  // Apply theme on mount
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

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
    setDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  // WebSocket connection with auto-reconnect
  useEffect(() => {
    const wsInstance = new DerivWebSocket(DERIV_APP_ID);
    setWs(wsInstance);
    wsInstance.connect().then(() => {
      setWsConnected(true);
      toast({ title: "✅ Connected to Deriv", description: "WebSocket connected successfully" });
      wsInstance.subscribeTicks(selectedMarket);
      if (account) {
        wsInstance.authorize(account.token);
      }
    }).catch(() => {
      setWsConnected(false);
      toast({ title: "❌ Connection Failed", description: "Could not connect to Deriv. Retrying..." });
    });

    // Auto-reconnect if disconnected
    const reconnectInterval = setInterval(() => {
      if (!wsInstance.connected) {
        wsInstance.connect().catch(() => {});
      }
    }, 5000);

    wsInstance.on("connection", (data) => {
      const connected = data.status === "connected";
      setWsConnected(connected);
      if (connected) {
        toast({ title: "✅ Reconnected", description: "WebSocket reconnected" });
      } else {
        toast({ title: "⚠️ Disconnected", description: "Connection lost. Reconnecting..." });
      }
    });

    wsInstance.on("authorize", (data) => {
      if (data.authorize) {
        const bal = data.authorize.balance;
        const loginid = data.authorize.loginid;
        setBalance(bal);
        setAccountBalances(prev => ({ ...prev, [loginid]: bal }));
        wsInstance.getBalance();
      }
    });

    wsInstance.on("balance", (data) => {
      if (data.balance) {
        setBalance(data.balance.balance);
        if (account) {
          setAccountBalances(prev => ({ ...prev, [account.loginid]: data.balance.balance }));
        }
      }
    });

    // Track ticks for DAT tab
    wsInstance.on("tick", (data) => {
      if (!data.tick || typeof data.tick.quote !== "number") return;
      const quote = data.tick.quote;
      setCurrentTick(quote);
      const quoteStr = Number(quote).toFixed(2);
      const digit = parseInt(quoteStr[quoteStr.length - 1], 10);
      setLastDigits(prev => [...prev.slice(-999), digit]);
    });

    return () => {
      clearInterval(reconnectInterval);
      wsInstance.disconnect();
    };
  }, [account]);

  // Fetch balances for non-active accounts
  useEffect(() => {
    if (accounts.length <= 1 || !account) return;
    const otherAccounts = accounts.filter(a => a.loginid !== account.loginid);
    otherAccounts.forEach(acc => {
      const tempWs = new DerivWebSocket(DERIV_APP_ID);
      tempWs.connect().then(() => {
        tempWs.authorize(acc.token);
        tempWs.on("authorize", (data) => {
          if (data.authorize) {
            setAccountBalances(prev => ({ ...prev, [data.authorize.loginid]: data.authorize.balance }));
          }
          setTimeout(() => tempWs.disconnect(), 1000);
        });
      }).catch(() => {});
    });
  }, [accounts, account]);

  useEffect(() => {
    if (!ws) return;
    ws.send({ forget_all: "ticks" });
    ws.subscribeTicks(selectedMarket);
  }, [ws, selectedMarket]);

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

  const handleSwitchAccount = (acc: DerivAccount) => {
    setActiveAccount(acc);
    setAccount(acc);
    setTokenManagerOpen(false);
  };

  const demoAccounts = accounts.filter(a => a.is_virtual);
  const realAccounts = accounts.filter(a => !a.is_virtual);
  const marketLabel = VOLATILITY_MARKETS.find(m => m.symbol === selectedMarket)?.label || selectedMarket;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Africa/Nairobi" });
  };
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const [hubLoaded, setHubLoaded] = useState(false);

  // Show loader on first visit
  if (!hubLoaded) {
    return <TradingHubLoader onComplete={() => setHubLoaded(true)} />;
  }

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="DNexus" className="h-10 animate-pulse" />
          <p className="text-xs text-muted-foreground">Loading Trading Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Floating Sidebar — slides from LEFT */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col shadow-2xl"
            >
              <div className="h-14 px-4 flex items-center justify-between border-b border-border">
                <div className="flex items-center gap-2">
                  <img src={logo} alt="DNexus" className="h-6" />
                  <span className="font-display text-sm font-bold">
                    <span className="text-foreground">DN</span>
                    <span className="text-primary">EXUS</span>
                  </span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Account info */}
              <div className="p-3 border-b border-border">
                {account ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {account.is_virtual ? "D" : "R"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{account.loginid}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {account.is_virtual ? "Demo" : "Real"} • {account.currency}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => { setTokenManagerOpen(true); setSidebarOpen(false); }} className="flex-1 px-2 py-1 text-[10px] font-medium bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors">
                        Token Manager
                      </button>
                      <button onClick={handleLogout} className="flex-1 px-2 py-1 text-[10px] font-medium bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors">
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={handleLogin} className="w-full px-3 py-2 bg-gradient-brand text-primary-foreground font-semibold text-xs rounded-lg">
                    Connect Deriv Account
                  </button>
                )}
              </div>

              <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
                {sidebarItems.map((item) => (
                  <Link
                    key={item.path + item.label}
                    to={item.path}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-secondary-foreground rounded-lg hover:bg-secondary transition-colors"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="p-3 border-t border-border space-y-2">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-secondary-foreground rounded-lg hover:bg-secondary transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    {darkMode ? "Dark Mode" : "Light Mode"}
                  </span>
                  <div className={`w-8 h-4 rounded-full transition-colors ${darkMode ? "bg-primary" : "bg-muted"} relative`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-primary-foreground transition-transform ${darkMode ? "left-4" : "left-0.5"}`} />
                  </div>
                </button>
                <Link to="/" className="flex items-center gap-2 px-3 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                  ← Back to Home
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar: Logo LEFT, view dropdown CENTER, balance/connect RIGHT */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 gap-3">
          <div className="flex items-center gap-2">
            <img src={logo} alt="DNexus" className="h-6" />
            <span className="font-display text-sm font-bold hidden sm:inline">
              <span className="text-foreground">DN</span>
              <span className="text-primary">EXUS</span>
            </span>
            <Link to="/risk" className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Risk Disclosure">
              <AlertTriangle className="w-4 h-4 text-warning" />
            </Link>
          </div>

          {/* Center: View dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-secondary rounded-lg transition-colors">
                {viewLabels[activeView]}
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              {(Object.keys(viewLabels) as ViewMode[]).map(view => (
                <DropdownMenuItem
                  key={view}
                  onClick={() => setActiveView(view)}
                  className={activeView === view ? "bg-primary/10 text-primary" : ""}
                >
                  {viewLabels[view]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Right: Balance/Connect + hamburger */}
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${wsConnected ? "bg-buy/20 text-buy" : "bg-sell/20 text-sell"}`}>
              {wsConnected ? "●" : "○"}
            </span>
            
            {balance !== null ? (
              <button
                onClick={() => setTokenManagerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-card rounded-lg border border-border hover:bg-secondary transition-colors whitespace-nowrap"
              >
                <Wallet className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-xs font-bold text-foreground">
                  {balance.toFixed(2)} {account?.currency || "USD"}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              </button>
            ) : (
              <button onClick={handleLogin} className="px-4 py-1.5 bg-gradient-brand text-primary-foreground text-xs font-semibold rounded-lg hover-lift glow-red">
                Connect Account
              </button>
            )}

            {isAdmin && (
              <button 
                onClick={() => setShowAdminDashboard(true)}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-primary"
                title="Admin Dashboard"
              >
                <Shield className="w-5 h-5" />
              </button>
            )}
            <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-foreground" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Main area */}
        <main className="flex-1 overflow-hidden pb-24 lg:pb-8">
          {activeView === "digit-edge" && (
            <TradingPanel ws={ws} account={account} />
          )}
          {activeView === "dat" && (
            !isPremium && !isAdmin ? (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-md">
                  <Lock className="w-12 h-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-semibold text-foreground">Premium Feature</h3>
                  <p className="text-sm text-muted-foreground">DAT Analyzer is only available for premium members.</p>
                  <button
                    onClick={() => {
                      setPremiumFeature("DAT Analyzer");
                      setShowPremiumModal(true);
                    }}
                    className="px-6 py-2 bg-gradient-brand text-primary-foreground font-semibold rounded-lg hover-lift"
                  >
                    Upgrade to Premium
                  </button>
                </div>
              </div>
            ) : (
              <DATTab ws={ws} selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} />
            )
          )}
          {activeView === "trading-view" && (
            <div className="flex h-full">
              <div className="flex-1 min-w-0">
                <TradingViewChart ws={ws} selectedMarket={selectedMarket} />
              </div>
              {!isMobile && (
                <TradingSidebar ws={ws} account={account} selectedMarket={selectedMarket} setSelectedMarket={setSelectedMarket} onLogin={handleLogin} />
              )}
            </div>
          )}
          {activeView === "deriv-charts" && (
            <div className="flex h-full">
              <div className="flex-1 min-w-0">
                <DerivChart ws={ws} selectedMarket={selectedMarket} />
              </div>
              {!isMobile && (
                <TradingSidebar ws={ws} account={account} selectedMarket={selectedMarket} setSelectedMarket={setSelectedMarket} onLogin={handleLogin} />
              )}
            </div>
          )}
          {activeView === "strategy-lab" && (
            <StrategyLab />
          )}
          {activeView === "market-scanner" && (
            <MarketScannerView />
          )}
          {activeView === "transactions" && (
            <div className="p-4 lg:p-6 overflow-y-auto h-full">
              <div className="p-6 rounded-xl bg-card border border-border text-center">
                <Wallet className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-foreground">Transactions</h3>
                <p className="text-xs text-muted-foreground mt-1">Trade history is displayed inside the Digit Edge panel while the bot is active.</p>
                <button onClick={() => setActiveView("digit-edge")} className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg">
                  Go to Digit Edge
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Footer bar with time + theme */}
        <div className="border-t border-border bg-card/50 px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>{formatDate(currentTime)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(currentTime)} EAT</span>
          </div>
          <button onClick={toggleTheme} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            {darkMode ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
            {darkMode ? "Dark" : "Light"}
          </button>
        </div>

        {/* Mobile Bottom Nav */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-lg border-t border-border">
            <div className="flex items-center justify-around py-2">
              {[
                { icon: Home, label: "Home", action: () => navigate("/") },
                { icon: Search, label: "Explore", action: () => setActiveView("trading-view") },
                { icon: Activity, label: "Trade", action: () => setActiveView("digit-edge"), active: activeView === "digit-edge" },
                { icon: BarChart3, label: "Analyze", action: () => setActiveView("dat"), active: activeView === "dat" },
                { icon: User, label: "Profile", action: () => setTokenManagerOpen(true) },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${(item as any).active ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[9px] font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        featureName={premiumFeature}
      />
      <AdminDashboard 
        isOpen={showAdminDashboard} 
        onClose={() => setShowAdminDashboard(false)} 
      />

      {/* Token Manager Modal */}
      {tokenManagerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={() => setTokenManagerOpen(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-[560px] max-w-[95vw] max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-bold text-foreground">Token Manager</h2>
              <button onClick={() => setTokenManagerOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-border">
              {(["demo", "real", "clients"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setTokenTab(tab)}
                  className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${tokenTab === tab ? "text-foreground border-b-2 border-primary" : "text-muted-foreground"}`}
                >
                  {tab === "clients" ? "Client Tokens" : tab}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-3 min-h-[120px] max-h-[50vh] overflow-y-auto">
              {tokenTab === "clients" ? (
                <ClientTokenManager />
              ) : (
                <>
                  {(tokenTab === "demo" ? demoAccounts : realAccounts).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No {tokenTab} accounts found.
                      {!account && " Connect your Deriv account first."}
                    </p>
                  ) : (
                    (tokenTab === "demo" ? demoAccounts : realAccounts).map((acc, i) => {
                      const isActive = account?.loginid === acc.loginid;
                      const accBalance = isActive ? balance : accountBalances[acc.loginid];
                      return (
                        <div
                          key={acc.loginid}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                            isActive ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50"
                          }`}
                          onClick={() => handleSwitchAccount(acc)}
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-primary">
                              {acc.is_virtual ? "DEMO" : i + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">{acc.loginid}</p>
                              {isActive && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-buy/20 text-buy">Active</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {accBalance !== undefined && accBalance !== null
                                ? `${accBalance.toFixed(2)} ${acc.currency}`
                                : `0.00 ${acc.currency}`}
                            </p>
                          </div>
                          {acc.is_virtual && (
                            <button
                              onClick={(e) => { e.stopPropagation(); ws?.send({ topup_virtual: 1 }); }}
                              className="text-[10px] font-medium px-2 py-1 rounded bg-secondary text-foreground hover:bg-muted transition-colors"
                            >
                              Reset Balance
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>

            <div className="flex justify-center gap-3 px-6 py-4 border-t border-border">
              {account && tokenTab !== "clients" && (
                <button onClick={() => { handleLogout(); setTokenManagerOpen(false); }} className="px-4 py-2 text-xs font-semibold bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors">
                  Disconnect
                </button>
              )}
              <button onClick={() => setTokenManagerOpen(false)} className="px-4 py-2 text-xs font-semibold bg-secondary text-foreground rounded-lg hover:bg-muted transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* Shared Trading Sidebar for TradingView and Deriv Charts */
const TradingSidebar = ({
  ws, account, selectedMarket, setSelectedMarket, onLogin
}: {
  ws: DerivWebSocket | null;
  account: DerivAccount | null;
  selectedMarket: string;
  setSelectedMarket: (m: string) => void;
  onLogin: () => void;
}) => {
  const [contractType, setContractType] = useState("DIGITEVEN");
  const [stake, setStake] = useState("3");
  const [duration, setDuration] = useState(1);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [payout, setPayout] = useState<number | null>(null);
  const [isTrading, setIsTrading] = useState(false);
  const isLoggedIn = !!account;

  // Get proposals for Trading View sidebar
  useEffect(() => {
    if (!ws || !isLoggedIn) return;
    const needsBarrier = contractType === "DIGITOVER" || contractType === "DIGITUNDER";
    const isRiseFall = contractType === "CALL" || contractType === "PUT";
    ws.getProposal({
      amount: parseFloat(stake) || 3,
      contractType,
      symbol: selectedMarket,
      duration: isRiseFall ? Math.max(duration, 5) : duration,
      durationUnit: isRiseFall ? "t" : "t",
    });
    const unsub = ws.on("proposal", (data) => {
      if (data.proposal) {
        setProposalId(data.proposal.id);
        setPayout(data.proposal.payout);
      }
    });
    return () => { unsub(); };
  }, [ws, contractType, stake, selectedMarket, duration, isLoggedIn]);

  const executeTrade = () => {
    if (!ws || !proposalId || isTrading || !isLoggedIn) return;
    setIsTrading(true);
    ws.buyContract(proposalId, parseFloat(stake));
    const unsub = ws.on("buy", (data) => {
      unsub();
      if (data.buy) {
        ws.subscribeOpenContract();
        const unsubC = ws.on("proposal_open_contract", (d) => {
          if (d.proposal_open_contract?.is_sold) {
            unsubC();
            setIsTrading(false);
            toast({
              title: d.proposal_open_contract.profit > 0 ? "✅ Trade Won" : "❌ Trade Lost",
              description: `${d.proposal_open_contract.profit > 0 ? "+" : ""}${d.proposal_open_contract.profit.toFixed(2)} USD`,
            });
          }
        });
      } else {
        setIsTrading(false);
      }
    });
  };

  return (
    <div className="hidden lg:block w-[280px] border-l border-border bg-card/50 overflow-y-auto p-4 space-y-4">
      <div>
        <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">Market <span className="text-primary text-xs">●</span></label>
        <select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)} className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
          {MARKET_CATEGORIES.map((cat) => (
            <optgroup key={cat.category} label={cat.category}>
              {cat.markets.map((m) => (<option key={m.symbol} value={m.symbol}>{m.label}</option>))}
            </optgroup>
          ))}
        </select>
      </div>
      <div>
        <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">Trade Type <span className="text-primary text-xs">●</span></label>
        <select value={contractType} onChange={(e) => setContractType(e.target.value)} className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
          {CONTRACT_TYPES.map((c) => (<option key={c.type} value={c.type}>{c.label}</option>))}
        </select>
      </div>
      <div>
        <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">Stake <span className="text-primary text-xs">●</span></label>
        <input type="number" value={stake} onChange={(e) => setStake(e.target.value)} min="0.35" step="0.01" className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
      </div>
      <div>
        <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">Duration <span className="text-primary text-xs">●</span></label>
        <div className="mt-1 flex gap-2">
          <input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 1)} min="1" className="flex-1 px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          <span className="px-3 py-2 bg-secondary border border-border rounded text-xs text-foreground">Ticks</span>
        </div>
      </div>

      {payout && (
        <div className="text-center text-xs text-muted-foreground p-3 bg-secondary/50 rounded-lg">
          <p>Payout: <span className="text-foreground font-medium">{payout.toFixed(2)} USD</span></p>
        </div>
      )}

      {!isLoggedIn ? (
        <button onClick={onLogin} className="w-full py-3 bg-gradient-brand text-primary-foreground font-semibold text-sm rounded-lg">
          Connect to Trade
        </button>
      ) : (
        <button
          onClick={executeTrade}
          disabled={isTrading || !proposalId}
          className="w-full py-3 border-2 border-buy text-buy font-bold text-sm rounded-lg hover:bg-buy/10 transition-colors disabled:opacity-50"
        >
          {isTrading ? "Executing..." : "▶ Execute Trade"}
        </button>
      )}
    </div>
  );
};

export default TradingHub;
