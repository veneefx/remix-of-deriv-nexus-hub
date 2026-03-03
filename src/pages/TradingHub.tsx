import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home, BarChart3, Users, TrendingUp, BookOpen, HelpCircle,
  Menu, X, Wallet, ChevronDown, Moon, Sun, Settings, Shield
} from "lucide-react";
import logo from "@/assets/logo.png";
import { getActiveAccount, getStoredAccounts, clearAuth, setActiveAccount, parseCallbackParams, storeAccounts, type DerivAccount } from "@/services/deriv-auth";
import { getOAuthUrl } from "@/services/deriv-auth";
import TradingPanel from "@/components/trading/TradingPanel";
import TradingViewChart from "@/components/trading/TradingViewChart";
import DerivChart from "@/components/trading/DerivChart";
import ClientTokenManager from "@/components/trading/ClientTokenManager";
import DerivWebSocket from "@/services/deriv-websocket";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VOLATILITY_MARKETS, CONTRACT_TYPES } from "@/lib/trading-constants";

const DERIV_APP_ID = "129344";

const sidebarItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: TrendingUp, label: "AI Signals", path: "/signals" },
  { icon: BarChart3, label: "Market Tracker", path: "/signals" },
  { icon: Users, label: "Partners", path: "/partners" },
  { icon: BookOpen, label: "eLearning Academy", path: "/education" },
  { icon: HelpCircle, label: "Help Center", path: "/help" },
  { icon: Settings, label: "Risk Disclosure", path: "/risk" },
];

type ViewMode = "digit-edge" | "trading-view" | "deriv-charts";

const viewLabels: Record<ViewMode, string> = {
  "digit-edge": "Digit Edge",
  "trading-view": "Trading View",
  "deriv-charts": "Deriv Charts",
};

const TradingHub = () => {
  const [account, setAccount] = useState<DerivAccount | null>(getActiveAccount());
  const [accounts, setAccounts] = useState<DerivAccount[]>(getStoredAccounts());
  const [balance, setBalance] = useState<number | null>(null);
  const [accountBalances, setAccountBalances] = useState<Record<string, number>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ws, setWs] = useState<DerivWebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [activeView, setActiveView] = useState<ViewMode>("digit-edge");
  const [selectedMarket, setSelectedMarket] = useState("R_10");
  const [tokenManagerOpen, setTokenManagerOpen] = useState(false);
  const [tokenTab, setTokenTab] = useState<"demo" | "real" | "clients">("demo");
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") || !document.documentElement.classList.contains("light");
    }
    return true;
  });
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Handle OAuth callback params if user lands on /trading with tokens in URL
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

  // Theme toggle — just CSS class change, no app restart
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
      return next;
    });
  }, []);

  // WebSocket connection
  useEffect(() => {
    const wsInstance = new DerivWebSocket(DERIV_APP_ID);
    setWs(wsInstance);
    wsInstance.connect().then(() => {
      setWsConnected(true);
      wsInstance.subscribeTicks(selectedMarket);
      if (account) {
        wsInstance.authorize(account.token);
      }
    }).catch(() => setWsConnected(false));

    wsInstance.on("connection", (data) => {
      setWsConnected(data.status === "connected");
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

    return () => { wsInstance.disconnect(); };
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
    if (activeView === "trading-view" || activeView === "deriv-charts") {
      ws.send({ forget_all: "ticks" });
      ws.subscribeTicks(selectedMarket);
    }
  }, [ws, selectedMarket, activeView]);

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

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-56 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-14 px-4 flex items-center gap-2 border-b border-border">
          <img src={logo} alt="DNexus" className="h-6" />
          <span className="font-display text-sm font-bold">
            <span className="text-foreground">DN</span>
            <span className="text-primary">EXUS</span>
          </span>
        </div>

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
                <button onClick={() => setTokenManagerOpen(true)} className="flex-1 px-2 py-1 text-[10px] font-medium bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors">
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
              className="flex items-center gap-2.5 px-3 py-2 text-xs text-secondary-foreground rounded-lg hover:bg-secondary transition-colors"
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
            <img src={logo} alt="DNexus" className="h-5 lg:hidden" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-secondary rounded-lg transition-colors">
                  {viewLabels[activeView]}
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
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

            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${wsConnected ? "bg-buy/20 text-buy" : "bg-sell/20 text-sell"}`}>
              {wsConnected ? (account ? "Connected" : "Live Data") : "Connecting..."}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {balance !== null && (
              <button
                onClick={() => setTokenManagerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-card rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  {balance.toFixed(2)} {account?.currency || "USD"}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
            {!account && (
              <button onClick={handleLogin} className="px-4 py-1.5 bg-gradient-brand text-primary-foreground text-xs font-medium rounded-lg">
                Connect Account
              </button>
            )}

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
                    <MobileTradingControls ws={ws} account={account} onLogin={handleLogin} />
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          {activeView === "digit-edge" && <TradingPanel ws={ws} account={account} />}
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
        </main>
      </div>

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

/* Shared Trading Sidebar */
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
  const isLoggedIn = !!account;

  return (
    <div className="hidden lg:block w-[280px] border-l border-border bg-card/50 overflow-y-auto p-4 space-y-4">
      <div>
        <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">Market <span className="text-primary text-xs">●</span></label>
        <select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)} className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
          {VOLATILITY_MARKETS.map((m) => (<option key={m.symbol} value={m.symbol}>{m.label}</option>))}
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

      <div className="text-center space-y-2">
        <p className="text-[10px] text-muted-foreground">Software Status</p>
        <p className="text-lg font-bold text-sell">INACTIVE</p>
      </div>

      {!isLoggedIn ? (
        <button onClick={onLogin} className="w-full py-3 bg-gradient-brand text-primary-foreground font-semibold text-sm rounded-lg">
          Connect to Start
        </button>
      ) : (
        <button className="w-full py-3 border-2 border-primary text-primary font-bold text-sm rounded-lg hover:bg-primary/10 transition-colors">
          Start
        </button>
      )}

      <div>
        <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">Execution Speed <span className="text-primary text-xs">●</span></label>
        <select className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded text-xs text-foreground">
          <option>Fast</option>
          <option>Normal</option>
        </select>
      </div>

      <button className="w-full flex items-center justify-between px-3 py-2.5 bg-secondary border border-border rounded-lg text-xs text-foreground hover:bg-muted transition-colors">
        <span className="flex items-center gap-2">
          <span className="text-primary">🛡</span> Risk Management Settings
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground -rotate-90" />
      </button>
    </div>
  );
};

/* Mobile Trading Controls */
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
      <p className="text-xs text-muted-foreground text-center mb-4">Trading controls available in side panel on desktop.</p>
      <p className="text-xs text-muted-foreground text-center">Connected as: <span className="text-foreground font-medium">{account.loginid}</span></p>
    </div>
  );
};

export default TradingHub;
