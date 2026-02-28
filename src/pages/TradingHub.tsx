import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home, BarChart3, Users, TrendingUp, BookOpen, HelpCircle,
  Menu, X, Wallet, ChevronDown
} from "lucide-react";
import logo from "@/assets/logo.png";
import { getActiveAccount, getStoredAccounts, clearAuth, type DerivAccount } from "@/services/deriv-auth";
import { getOAuthUrl } from "@/services/deriv-auth";
import TradingPanel from "@/components/trading/TradingPanel";
import DerivWebSocket from "@/services/deriv-websocket";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Always create a WS connection for live data, even without account
    const wsInstance = new DerivWebSocket(DERIV_APP_ID);
    setWs(wsInstance);
    wsInstance.connect().then(() => {
      if (account) {
        wsInstance.authorize(account.token);
      }
    });

    if (account) {
      wsInstance.on("authorize", (data) => {
        if (data.authorize) {
          setBalance(data.authorize.balance);
          wsInstance.getBalance();
        }
      });
      wsInstance.on("balance", (data) => {
        if (data.balance) setBalance(data.balance.balance);
      });
    }

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

            {/* Mobile trading panel trigger */}
            {isMobile && (
              <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
                <SheetTrigger asChild>
                  <button className="lg:hidden px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-lg flex items-center gap-1">
                    <BarChart3 className="w-3.5 h-3.5" />
                    Trade
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[85vh] p-0 bg-background border-t border-border rounded-t-2xl">
                  <div className="h-full overflow-y-auto">
                    <MobileTradingControls
                      ws={ws}
                      account={account}
                      onLogin={handleLogin}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <TradingPanel ws={ws} account={account} />
        </main>
      </div>
    </div>
  );
};

/* Mobile Trading Controls - rendered in bottom sheet */
const MobileTradingControls = ({ ws, account, onLogin }: { ws: DerivWebSocket | null; account: DerivAccount | null; onLogin: () => void }) => {
  if (!account) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Wallet className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Connect to Trade</h3>
        <p className="text-sm text-muted-foreground">Connect your Deriv account to execute trades.</p>
        <button onClick={onLogin} className="w-full py-3 bg-gradient-brand text-primary-foreground font-semibold rounded-lg">
          Connect Deriv Account
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <p className="text-xs text-muted-foreground text-center mb-4">Trading controls are available in the side panel on desktop.</p>
      <p className="text-xs text-muted-foreground text-center">Connected as: <span className="text-foreground font-medium">{account.loginid}</span></p>
    </div>
  );
};

export default TradingHub;
