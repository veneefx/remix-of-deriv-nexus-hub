import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home, BarChart3, Users, TrendingUp, BookOpen, HelpCircle,
  Menu, X, Wallet
} from "lucide-react";
import logo from "@/assets/logo.png";
import { getActiveAccount, getStoredAccounts, clearAuth, type DerivAccount } from "@/services/deriv-auth";
import { getOAuthUrl } from "@/services/deriv-auth";
import TradingPanel from "@/components/trading/TradingPanel";
import DerivWebSocket from "@/services/deriv-websocket";

const DERIV_APP_ID = "68014";

const sidebarItems = [
  { icon: Home, label: "Home", path: "/trading" },
  { icon: TrendingUp, label: "AI Signals", path: "/signals" },
  { icon: Users, label: "Partners", path: "/partners" },
  { icon: BarChart3, label: "Signals (Beta)", path: "/signals-beta" },
  { icon: BookOpen, label: "eLearning Academy", path: "/education" },
  { icon: HelpCircle, label: "Help Center", path: "/help" },
];

const TradingHub = () => {
  const [account, setAccount] = useState<DerivAccount | null>(getActiveAccount());
  const [accounts] = useState<DerivAccount[]>(getStoredAccounts());
  const [balance, setBalance] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ws, setWs] = useState<DerivWebSocket | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!account) return;
    const wsInstance = new DerivWebSocket(DERIV_APP_ID);
    setWs(wsInstance);
    wsInstance.connect().then(() => {
      wsInstance.authorize(account.token);
    });
    wsInstance.on("authorize", (data) => {
      if (data.authorize) {
        setBalance(data.authorize.balance);
        wsInstance.getBalance();
      }
    });
    wsInstance.on("balance", (data) => {
      if (data.balance) setBalance(data.balance.balance);
    });
    return () => { wsInstance.disconnect(); };
  }, [account]);

  const handleLogin = () => {
    const url = getOAuthUrl(DERIV_APP_ID, `${window.location.origin}/callback`);
    window.location.href = url;
  };

  const handleLogout = () => {
    clearAuth();
    setAccount(null);
    setBalance(null);
    ws?.disconnect();
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-14 px-4 flex items-center gap-2 border-b border-border">
          <img src={logo} alt="Dnexus" className="h-6" />
          <span className="font-display text-sm font-bold">
            <span className="text-foreground">DN</span>
            <span className="text-primary">EXUS</span>
          </span>
        </div>

        {/* User area */}
        <div className="p-3 border-b border-border">
          {account ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {account.loginid.charAt(0)}
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
                <button onClick={handleLogout} className="flex-1 px-2 py-1 text-[10px] font-medium bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors">
                  Logout
                </button>
                <button className="flex-1 px-2 py-1 text-[10px] font-medium bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors">
                  Upgrade
                </button>
              </div>
            </div>
          ) : (
            <button onClick={handleLogin} className="w-full px-3 py-2 bg-gradient-brand text-primary-foreground font-semibold text-xs rounded-lg">
              Connect Account
            </button>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {sidebarItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-2.5 px-3 py-2 text-xs text-secondary-foreground rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <Link to="/" className="flex items-center gap-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Home
          </Link>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 border-b border-border flex items-center justify-between px-4 bg-card/50">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <img src={logo} alt="Dnexus" className="h-5 lg:hidden" />
          </div>
          <div className="flex items-center gap-3">
            {balance !== null && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-card rounded-lg border border-border">
                <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  {balance.toFixed(2)} {account?.currency || "USD"}
                </span>
              </div>
            )}
            {!account && (
              <button onClick={handleLogin} className="px-4 py-1.5 bg-gradient-brand text-primary-foreground text-xs font-medium rounded-lg">
                Connect Account
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {!account ? (
            <NotLoggedIn onLogin={handleLogin} />
          ) : (
            <TradingPanel ws={ws} account={account} />
          )}
        </main>
      </div>
    </div>
  );
};

const NotLoggedIn = ({ onLogin }: { onLogin: () => void }) => (
  <div className="max-w-lg mx-auto mt-12 p-4 space-y-8">
    <div className="p-6 rounded-xl bg-primary/10 border border-primary/20 text-center space-y-4">
      <div className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
        ⭐ Premium Feature
      </div>
      <h2 className="text-xl font-bold text-foreground">Sign In to Access Digit Edge</h2>
      <p className="text-sm text-muted-foreground">
        Unlock the power of Digit Edge, our advanced trading tools. Sign in to your account to get started with premium features.
      </p>
      <button onClick={onLogin} className="px-6 py-2.5 bg-gradient-brand text-primary-foreground font-semibold rounded-lg glow-red">
        🔑 Sign in Now
      </button>
    </div>

    <div className="p-6 rounded-xl bg-card border border-border space-y-4">
      <h3 className="text-lg font-bold text-foreground">Why Choose Digit Edge?</h3>
      <p className="text-sm text-muted-foreground">
        Advanced digit analysis tool that uses machine learning to predict market movements with high accuracy.
      </p>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {["Real-time digit analysis", "Machine learning predictions", "Historical pattern recognition", "Risk assessment tools", "Customizable alerts"].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span className="text-success">✓</span> {item}
          </li>
        ))}
      </ul>
    </div>

    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.2em] text-center">
        What You'll Get
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: BarChart3, title: "Advanced Analytics", desc: "Detailed insights and analysis" },
          { icon: TrendingUp, title: "AI-Powered Signals", desc: "Accurate market predictions" },
          { icon: Home, title: "Real-Time Updates", desc: "Instant notifications" },
          { icon: Users, title: "Risk Management", desc: "Protect your investments" },
        ].map((item) => (
          <div key={item.title} className="p-4 rounded-lg bg-card border border-border">
            <item.icon className="w-5 h-5 text-primary mb-2" />
            <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default TradingHub;
