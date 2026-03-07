import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, Menu, X, MoreVertical, Clock, AlertCircle, TrendingUp, TrendingDown,
  Play, Pause, RotateCcw, Settings, Lock
} from "lucide-react";
import logo from "@/assets/logo.png";
import { getActiveAccount, getStoredAccounts, setActiveAccount, clearAuth, type DerivAccount } from "@/services/deriv-auth";
import { getOAuthUrl } from "@/services/deriv-auth";
import DerivWebSocket from "@/services/deriv-websocket";
import { usePremium } from "@/hooks/use-premium";
import { VOLATILITY_MARKETS, CONTRACT_TYPES } from "@/lib/trading-constants";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DERIV_APP_ID = "129344";

const TradingHub = () => {
  const navigate = useNavigate();
  const [account, setAccount] = useState<DerivAccount | null>(getActiveAccount());
  const [balance, setBalance] = useState<number | null>(null);
  const [ws, setWs] = useState<DerivWebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Trading controls
  const [selectedMarket, setSelectedMarket] = useState("R_10");
  const [contractType, setContractType] = useState("DIGITEVEN");
  const [stake, setStake] = useState("10");
  const [duration, setDuration] = useState("1");
  const [durationType, setDurationType] = useState<"t" | "m" | "h" | "d">("t");
  
  // Trading state
  const [isTrading, setIsTrading] = useState(false);
  const [tradeMode, setTradeMode] = useState<"quick" | "automated">("quick");
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [payout, setPayout] = useState<number | null>(null);
  const [lastTrade, setLastTrade] = useState<any>(null);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [lastDigit, setLastDigit] = useState<number | null>(null);
  const [aggressiveMode, setAggressiveMode] = useState(false);
  const [aggressiveInterval, setAggressiveInterval] = useState(1000); // 1 second
  const aggressiveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { isPremium, isAdmin } = usePremium();

  // Clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (!account) return;

    const wsInstance = new DerivWebSocket(account.token);
    setWs(wsInstance);

    wsInstance.on("connect", () => {
      setWsConnected(true);
      console.log("✅ Connected to Deriv WebSocket");
    });

    wsInstance.on("disconnect", () => {
      setWsConnected(false);
      console.log("❌ Disconnected from Deriv WebSocket");
    });

    wsInstance.on("balance", (data) => {
      if (data.balance) {
        setBalance(data.balance.balance);
      }
    });

    wsInstance.on("tick", (data) => {
      if (data.tick) {
        setCurrentPrice(data.tick.quote);
        const digit = Math.floor(data.tick.quote * 10) % 10;
        setLastDigit(digit);
      }
    });

    wsInstance.on("proposal", (data) => {
      if (data.proposal) {
          setProposalId(data.proposal.id);
        setPayout(data.proposal.payout);
      }
    });

    wsInstance.on("buy", (data) => {
      if (data.buy) {
        setLastTrade(data.buy);
        setTradeHistory(prev => [data.buy, ...prev].slice(0, 50));
      }
    });

    wsInstance.on("proposal_open_contract", (data) => {
      if (data.proposal_open_contract?.is_sold) {
        const trade = data.proposal_open_contract;
        setLastTrade(trade);
        setTradeHistory(prev => [trade, ...prev].slice(0, 50));
        
        if (trade.profit > 0) {
          toast({ title: "✅ Trade Won", description: `+${trade.profit.toFixed(2)} USD` });
        } else {
          toast({ title: "❌ Trade Lost", description: `${trade.profit.toFixed(2)} USD` });
        }
      }
    });

    return () => {
      wsInstance.disconnect();
    };
  }, [account]);

  // Get proposal on market/contract change
  useEffect(() => {
    if (!ws || !account) return;

    const needsBarrier = contractType === "DIGITOVER" || contractType === "DIGITUNDER";
    ws.getProposal({
      amount: parseFloat(stake) || 10,
      contractType,
      symbol: selectedMarket,
      duration: parseInt(duration) || 1,
      durationUnit: durationType,
    });
  }, [ws, selectedMarket, contractType, stake, duration, durationType, account]);

  // Aggressive mode handler
  useEffect(() => {
    if (!aggressiveMode || !ws || !account) {
      if (aggressiveIntervalRef.current) {
        clearInterval(aggressiveIntervalRef.current);
      }
      return;
    }

    const executeTrade = () => {
      if (!proposalId || isTrading) return;
      
      setIsTrading(true);
      ws.buyContract(proposalId, parseFloat(stake) || 10);
      
      setTimeout(() => {
        setIsTrading(false);
      }, 500);
    };

    aggressiveIntervalRef.current = setInterval(executeTrade, aggressiveInterval);

    return () => {
      if (aggressiveIntervalRef.current) {
        clearInterval(aggressiveIntervalRef.current);
      }
    };
  }, [aggressiveMode, aggressiveInterval, proposalId, stake, ws, account, isTrading]);

  const handleLogin = () => {
    const url = getOAuthUrl(DERIV_APP_ID);
    window.location.href = url;
  };

  const handleLogout = () => {
    clearAuth();
    setAccount(null);
    setBalance(null);
    ws?.disconnect();
    navigate("/");
  };

  const executeTrade = () => {
    if (!proposalId || isTrading || !account) return;
    
    setIsTrading(true);
    ws?.buyContract(proposalId, parseFloat(stake) || 10);
  };

  const marketLabel = VOLATILITY_MARKETS.find(m => m.symbol === selectedMarket)?.label || "Volatility 10";
  const contractLabel = CONTRACT_TYPES.find(c => c.type === contractType)?.label || "Even/Odd";

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 overflow-y-auto transition-transform lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Trading Controls</h2>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Market Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Market</label>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {VOLATILITY_MARKETS.map((m) => (
                <option key={m.symbol} value={m.symbol}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Contract Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Contract Type</label>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {CONTRACT_TYPES.map((c) => (
                <option key={c.type} value={c.type}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Stake */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Stake (USD)</label>
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              min="0.35"
              step="0.01"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
              <select
                value={durationType}
                onChange={(e) => setDurationType(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="t">Ticks</option>
                <option value="m">Minutes</option>
                <option value="h">Hours</option>
                <option value="d">Days</option>
              </select>
            </div>
          </div>

          {/* Payout Display */}
          {payout && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 font-medium">Potential Payout</p>
              <p className="text-2xl font-bold text-blue-900">${payout.toFixed(2)}</p>
            </div>
          )}

          {/* Aggressive Mode Toggle */}
          {isPremium && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-purple-900">Aggressive Mode</label>
                <input
                  type="checkbox"
                  checked={aggressiveMode}
                  onChange={(e) => setAggressiveMode(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
              </div>
              {aggressiveMode && (
                <div>
                  <label className="block text-xs text-purple-700 font-medium mb-2">Interval (ms)</label>
                  <input
                    type="number"
                    value={aggressiveInterval}
                    onChange={(e) => setAggressiveInterval(Math.max(100, parseInt(e.target.value) || 1000))}
                    min="100"
                    step="100"
                    className="w-full px-3 py-2 border border-purple-300 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-700">
              <Menu className="w-6 h-6" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="DTNexus" className="h-8" />
              <span className="font-bold text-lg hidden sm:inline">
                <span className="text-gray-900">DT</span>
                <span className="text-green-500">NEXUS</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {account ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
                  <Wallet className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-bold text-gray-900">
                    ${balance !== null ? balance.toFixed(2) : "0.00"}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <MoreVertical className="w-5 h-5 text-gray-700" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="px-6 py-2 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 transition-colors shadow-lg"
              >
                Connect Account
              </button>
            )}
          </div>
        </header>

        {/* Main Trading Area */}
        <main className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Chart Area (Center) */}
          <div className="flex-1 bg-gray-50 border-r border-gray-200 flex flex-col p-6 overflow-y-auto">
            {!account ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <TrendingUp className="w-16 h-16 text-gray-300 mx-auto" />
                  <h2 className="text-2xl font-bold text-gray-900">Connect to Start Trading</h2>
                  <p className="text-gray-600">Sign in with your Deriv account to begin trading</p>
                  <button
                    onClick={handleLogin}
                    className="px-8 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Connect Account
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Market Info */}
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Market</p>
                      <p className="text-lg font-bold text-gray-900">{marketLabel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Current Price</p>
                      <p className="text-lg font-bold text-gray-900">
                        {currentPrice ? currentPrice.toFixed(4) : "---"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Last Digit</p>
                      <p className="text-lg font-bold text-gray-900">
                        {lastDigit !== null ? lastDigit : "---"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Connection</p>
                      <p className={`text-lg font-bold ${wsConnected ? "text-green-600" : "text-red-600"}`}>
                        {wsConnected ? "Connected" : "Disconnected"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Trade History */}
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-4">Recent Trades</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {tradeHistory.length === 0 ? (
                      <p className="text-sm text-gray-600">No trades yet</p>
                    ) : (
                      tradeHistory.map((trade, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium text-gray-700">Trade {idx + 1}</span>
                          <span className={`text-sm font-bold ${trade.profit > 0 ? "text-green-600" : "text-red-600"}`}>
                            {trade.profit > 0 ? "+" : ""}{trade.profit.toFixed(2)} USD
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Trading Panel */}
          {account && (
            <div className="w-full lg:w-96 bg-white border-l border-gray-200 flex flex-col p-6 overflow-y-auto">
              {/* Mode Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setTradeMode("quick")}
                  className={`flex-1 py-2 font-bold rounded-lg transition-colors ${
                    tradeMode === "quick"
                      ? "bg-yellow-400 text-gray-900"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Quick
                </button>
                <button
                  onClick={() => setTradeMode("automated")}
                  className={`flex-1 py-2 font-bold rounded-lg transition-colors ${
                    tradeMode === "automated"
                      ? "bg-yellow-400 text-gray-900"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Automated
                </button>
              </div>

              {/* Trading Info */}
              <div className="space-y-4 mb-6">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium">Contract Type</p>
                  <p className="text-lg font-bold text-gray-900">{contractLabel}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium">Stake</p>
                  <p className="text-lg font-bold text-gray-900">${stake}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium">Duration</p>
                  <p className="text-lg font-bold text-gray-900">{duration} {durationType === "t" ? "Ticks" : durationType === "m" ? "Minutes" : durationType === "h" ? "Hours" : "Days"}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 flex-1">
                <button
                  onClick={executeTrade}
                  disabled={isTrading || !proposalId}
                  className="w-full py-4 bg-green-500 text-white font-bold text-lg rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                >
                  {isTrading ? "Executing..." : "Even"}
                </button>
                <button
                  onClick={executeTrade}
                  disabled={isTrading || !proposalId}
                  className="w-full py-4 bg-red-500 text-white font-bold text-lg rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                >
                  {isTrading ? "Executing..." : "DIGITODD"}
                </button>
              </div>

              {/* Last Trade Info */}
              {lastTrade && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-2">Last Trade</p>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-700">
                      Payout: <span className="font-bold text-gray-900">${lastTrade.payout?.toFixed(2) || "---"}</span>
                    </p>
                    <p className={`text-sm font-bold ${lastTrade.profit > 0 ? "text-green-600" : "text-red-600"}`}>
                      Profit: {lastTrade.profit > 0 ? "+" : ""}{lastTrade.profit?.toFixed(2) || "0.00"} USD
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Bottom Status Bar */}
        <footer className="h-10 bg-gray-900 text-white flex items-center justify-between px-6 text-xs font-mono">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1 ${wsConnected ? "text-green-400" : "text-red-400"}`}>
              <div className={`w-2 h-2 rounded-full ${wsConnected ? "bg-green-400" : "bg-red-400"}`} />
              <span>{wsConnected ? "Connected" : "Disconnected"}</span>
            </div>
            <span className="text-gray-500">© 2024 DTNexus</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default TradingHub;
