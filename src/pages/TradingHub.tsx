import { useCallback, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home, BarChart3, Users, TrendingUp, BookOpen, HelpCircle,
  Menu, X, Wallet, ChevronDown, Moon, Sun, Settings, Shield,
  AlertTriangle, Search, Activity, User, Clock, Lock
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
  const navigate = useNavigate();
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
      return false;
    }
    return false;
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
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

  const handleLogin = useCallback(() => {
    const url = getOAuthUrl(DERIV_APP_ID);
    window.location.href = url;
  }, []);

  const handleLogout = useCallback(() => {
    clearAuth();
    setAccount(null);
    setAccounts([]);
    setBalance(null);
    setAccountBalances({});
    setTokenManagerOpen(false);
    toast({ title: "Logged out successfully" });
  }, []);

  // Initialize WebSocket
  useEffect(() => {
    if (!account) return;
    const newWs = new DerivWebSocket(account.token);
    setWs(newWs);
    newWs.on("connect", () => setWsConnected(true));
    newWs.on("disconnect", () => setWsConnected(false));
    newWs.on("balance", (data) => {
      if (data.balance) {
        setBalance(data.balance.balance);
        if (account.loginid) {
          setAccountBalances(prev => ({ ...prev, [account.loginid]: data.balance.balance }));
        }
      }
    });
    return () => { newWs.disconnect(); };
  }, [account]);

  const marketLabel = VOLATILITY_MARKETS.find(m => m.symbol === selectedMarket)?.label || "Volatility 10";

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? "dark" : "light"}`}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "fixed inset-0 z-40 lg:static" : "hidden lg:flex"} flex-col w-64 bg-card border-r border-border`}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="DTNexus" className="h-8" />
            <span className="font-bold text-sm hidden sm:inline">DTNexus</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account Info */}
        {account && (
          <div className="p-4 border-b border-border space-y-2">
            <div className="text-xs text-muted-foreground">Active Account</div>
            <div className="text-sm font-semibold text-foreground truncate">{account.loginid}</div>
            {balance !== null && (
              <div className="text-sm font-bold text-buy">${balance.toFixed(2)}</div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {sidebarItems.map((item) => (
            <a
              key={item.label}
              href={item.path}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </a>
          ))}
        </nav>

        {/* Logout */}
        {account && (
          <div className="p-4 border-t border-border">
            <button
              onClick={handleLogout}
              className="w-full px-3 py-2 text-xs font-semibold bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-4 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{currentTime.toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* View Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors">
                {viewLabels[activeView]}
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(viewLabels) as ViewMode[]).map((view) => (
                  <DropdownMenuItem key={view} onClick={() => setActiveView(view)}>
                    {viewLabels[view]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="p-2 hover:bg-muted rounded-lg transition-colors">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Admin Badge */}
            {isAdmin && (
              <button
                onClick={() => setShowAdminDashboard(true)}
                className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
              >
                <Shield className="w-4 h-4" />
                Admin
              </button>
            )}

            {/* Account Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors">
                <User className="w-4 h-4" />
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {account ? (
                  <>
                    <DropdownMenuItem onClick={() => setTokenManagerOpen(true)}>
                      Manage Accounts
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      Disconnect
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={handleLogin}>
                    Connect Deriv Account
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 overflow-hidden">
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
                    className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Upgrade to Premium
                  </button>
                </div>
              </div>
            ) : (
              <DATTab lastDigits={lastDigits} currentTick={currentTick} marketLabel={marketLabel} />
            )
          )}

          {activeView === "trading-view" && (
            <div className="flex h-full">
              <div className="flex-1 min-w-0">
                <TradingViewChart ws={ws} selectedMarket={selectedMarket} />
              </div>
            </div>
          )}

          {activeView === "deriv-charts" && (
            <div className="flex h-full">
              <div className="flex-1 min-w-0">
                <DerivChart ws={ws} selectedMarket={selectedMarket} />
              </div>
            </div>
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
      </div>

      {/* Modals */}
      <AnimatePresence>
        {tokenManagerOpen && (
          <ClientTokenManager
            accounts={accounts}
            activeAccount={account}
            onSelectAccount={(acc) => {
              setActiveAccount(acc);
              setAccount(acc);
              setTokenManagerOpen(false);
            }}
            onClose={() => setTokenManagerOpen(false)}
          />
        )}

        {showPremiumModal && (
          <PremiumUpgradeModal
            feature={premiumFeature}
            onClose={() => setShowPremiumModal(false)}
          />
        )}

        {showAdminDashboard && (
          <AdminDashboard onClose={() => setShowAdminDashboard(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TradingHub;
