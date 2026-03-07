import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, BarChart3, Users, TrendingUp, BookOpen, HelpCircle,
  LogOut, ChevronDown, Wallet, Menu, X, Settings, MoreVertical, Clock, Shield
} from "lucide-react";
import logo from "@/assets/logo.png";
import { getActiveAccount, getStoredAccounts, setActiveAccount, clearAuth, type DerivAccount } from "@/services/deriv-auth";
import { getOAuthUrl } from "@/services/deriv-auth";
import TradingPanel from "@/components/trading/TradingPanel";
import DATTab from "@/components/trading/DATTab";
import TradingViewChart from "@/components/trading/TradingViewChart";
import DerivChart from "@/components/trading/DerivChart";
import DerivWebSocket from "@/services/deriv-websocket";
import { usePremium } from "@/hooks/use-premium";
import AdminDashboard from "@/components/trading/AdminDashboard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DERIV_APP_ID = "129344";

const sidebarItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: TrendingUp, label: "AI Signals", path: "/signals" },
  { icon: BarChart3, label: "Market Tracker", path: "/signals" },
  { icon: Users, label: "Partners", path: "/partners" },
  { icon: BookOpen, label: "eLearning Academy", path: "/education" },
  { icon: HelpCircle, label: "Help Center", path: "/help" },
];

type ViewMode = "digit-edge" | "dat" | "trading-view" | "deriv-charts";

const viewLabels: Record<ViewMode, string> = {
  "digit-edge": "Digit Edge",
  "dat": "DAT Analyzer",
  "trading-view": "Trading View",
  "deriv-charts": "Deriv Charts",
};

const TradingHub = () => {
  const [account, setAccount] = useState<DerivAccount | null>(getActiveAccount());
  const [accounts, setAccounts] = useState<DerivAccount[]>(getStoredAccounts());
  const [balance, setBalance] = useState<number | null>(null);
  const [ws, setWs] = useState<DerivWebSocket | null>(null);
  const [activeView, setActiveView] = useState<ViewMode>(() => (localStorage.getItem("dnx_view") as ViewMode) || "digit-edge");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const { isAdmin } = usePremium();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("dnx_view", activeView);
  }, [activeView]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!account) return;

    const wsInstance = new DerivWebSocket(account.token);
    setWs(wsInstance);

    wsInstance.on("balance", (data) => {
      if (data.balance) {
        setBalance(data.balance.balance);
      }
    });

    return () => {
      wsInstance.disconnect();
    };
  }, [account]);

  const handleLogin = () => {
    const url = getOAuthUrl(DERIV_APP_ID);
    window.location.href = url;
  };

  const handleLogout = () => {
    clearAuth();
    setAccount(null);
    setAccounts([]);
    setBalance(null);
    ws?.disconnect();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden flex-col">
      {/* Top bar */}
      <header className="h-16 border-b border-border flex items-center justify-between px-4 bg-card z-30">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Dnexus" className="h-8" />
            <span className="font-bold text-lg hidden sm:inline">
              <span className="text-foreground">DT</span>
              <span className="text-primary">NEXUS</span>
            </span>
          </Link>

          {/* View Selector Panel (Left, below/beside logo) */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border">
            {(Object.keys(viewLabels) as ViewMode[]).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeView === view
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {viewLabels[view]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Admin Icon */}
          {isAdmin && (
            <button
              onClick={() => setShowAdminDashboard(true)}
              className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
              title="Admin Dashboard"
            >
              <Shield className="w-5 h-5" />
            </button>
          )}

          {/* Balance / Connect Button */}
          {account ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border shadow-sm">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">
                {balance !== null ? `$${balance.toFixed(2)}` : "Loading..."}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase px-1.5 py-0.5 bg-muted rounded">
                {account.currency}
              </span>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="px-5 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-full shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              Connect Account
            </button>
          )}

          {/* Collapsed Nav Menu (Three dots) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-muted rounded-full transition-colors text-foreground">
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {sidebarItems.map((item) => (
                <DropdownMenuItem key={item.label} onClick={() => navigate(item.path)}>
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </DropdownMenuItem>
              ))}
              <div className="h-px bg-border my-1" />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile View Selector */}
        <div className="md:hidden flex items-center gap-1 p-2 bg-card border-b border-border overflow-x-auto no-scrollbar">
          {(Object.keys(viewLabels) as ViewMode[]).map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`flex-shrink-0 px-3 py-1.5 text-[10px] font-bold rounded-full whitespace-nowrap transition-all ${
                activeView === view
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {viewLabels[view]}
            </button>
          ))}
        </div>

        {/* Trading area */}
        <main className="flex-1 overflow-y-auto bg-background/50 relative">
          {!account ? (
            <div className="max-w-lg mx-auto mt-12 px-4">
              <div className="p-8 rounded-2xl bg-card border border-border text-center space-y-6 shadow-xl">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-black text-foreground">Sign In to Access Digit Edge</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Unlock the power of Digit Edge with our advanced trading tools. Sign in to your account to get started with premium features.
                </p>
                <button
                  onClick={handleLogin}
                  className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                >
                  🔑 Sign in Now
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeView === "digit-edge" && <TradingPanel ws={ws} account={account} />}
              {activeView === "dat" && <DATTab lastDigits={[]} currentTick={null} marketLabel="" />}
              {activeView === "trading-view" && <TradingViewChart ws={ws} selectedMarket="R_10" />}
              {activeView === "deriv-charts" && <DerivChart ws={ws} selectedMarket="R_10" />}
            </>
          )}
        </main>

        {/* Bottom Time Bar */}
        <footer className="h-8 bg-card border-t border-border flex items-center justify-between px-4 text-[10px] text-muted-foreground z-20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${ws ? "bg-success" : "bg-muted"}`} />
              <span>{ws ? "Connected to Deriv" : "Disconnected"}</span>
            </div>
            <span>© 2024 DTNexus</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <Clock className="w-3 h-3" />
            {currentTime.toLocaleTimeString()}
          </div>
        </footer>
      </div>

      {/* Admin Dashboard Modal */}
      <AnimatePresence>
        {showAdminDashboard && (
          <AdminDashboard onClose={() => setShowAdminDashboard(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TradingHub;
