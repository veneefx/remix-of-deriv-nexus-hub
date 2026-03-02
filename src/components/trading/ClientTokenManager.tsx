import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import DerivWebSocket from "@/services/deriv-websocket";

interface ClientToken {
  id: string;
  token: string;
  loginid: string;
  currency: string;
  balance: number | null;
  stake: string;
  usePercentage: boolean;
  percentage: number;
  is_virtual: boolean;
  active: boolean;
}

const DERIV_APP_ID = "129344";

const ClientTokenManager = () => {
  const [clients, setClients] = useState<ClientToken[]>(() => {
    const stored = localStorage.getItem("client_tokens");
    return stored ? JSON.parse(stored) : [];
  });
  const [newToken, setNewToken] = useState("");
  const [loading, setLoading] = useState(false);

  // Save to localStorage whenever clients change
  useEffect(() => {
    localStorage.setItem("client_tokens", JSON.stringify(clients));
  }, [clients]);

  const addToken = async () => {
    if (!newToken.trim()) return;
    setLoading(true);
    
    try {
      // Verify token via WebSocket
      const tempWs = new DerivWebSocket(DERIV_APP_ID);
      await tempWs.connect();
      tempWs.authorize(newToken.trim());
      
      tempWs.on("authorize", (data) => {
        if (data.authorize) {
          const acc = data.authorize;
          const client: ClientToken = {
            id: acc.loginid,
            token: newToken.trim(),
            loginid: acc.loginid,
            currency: acc.currency,
            balance: acc.balance,
            stake: "3",
            usePercentage: false,
            percentage: 20,
            is_virtual: acc.is_virtual === 1,
            active: true,
          };
          setClients(prev => [...prev.filter(c => c.loginid !== acc.loginid), client]);
          setNewToken("");
        } else if (data.error) {
          alert("Invalid token: " + (data.error?.message || "Authorization failed"));
        }
        setLoading(false);
        setTimeout(() => tempWs.disconnect(), 500);
      });

      tempWs.on("error", () => {
        setLoading(false);
        tempWs.disconnect();
      });
    } catch {
      setLoading(false);
      alert("Failed to connect. Check your token.");
    }
  };

  const removeClient = (loginid: string) => {
    setClients(prev => prev.filter(c => c.loginid !== loginid));
  };

  const updateClient = (loginid: string, updates: Partial<ClientToken>) => {
    setClients(prev => prev.map(c => c.loginid === loginid ? { ...c, ...updates } : c));
  };

  const refreshBalance = async (client: ClientToken) => {
    try {
      const tempWs = new DerivWebSocket(DERIV_APP_ID);
      await tempWs.connect();
      tempWs.authorize(client.token);
      tempWs.on("authorize", (data) => {
        if (data.authorize) {
          updateClient(client.loginid, { balance: data.authorize.balance });
        }
        setTimeout(() => tempWs.disconnect(), 500);
      });
    } catch {}
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Add your client Deriv API tokens below. Set individual stakes or use a percentage of their balance.
      </p>

      {/* Add new token */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newToken}
          onChange={(e) => setNewToken(e.target.value)}
          placeholder="Paste Deriv API token..."
          className="flex-1 px-3 py-2 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          onKeyDown={(e) => e.key === "Enter" && addToken()}
        />
        <button
          onClick={addToken}
          disabled={loading || !newToken.trim()}
          className="px-3 py-2 bg-primary text-primary-foreground text-xs font-medium rounded disabled:opacity-50 flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          {loading ? "Verifying..." : "Add"}
        </button>
      </div>

      {/* Client list */}
      {clients.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No client tokens added yet.</p>
      ) : (
        clients.map((client) => (
          <div key={client.loginid} className="p-3 rounded-xl border border-border space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${client.is_virtual ? "bg-warning/10" : "bg-success/10"}`}>
                  <span className={`text-[9px] font-bold ${client.is_virtual ? "text-warning" : "text-success"}`}>
                    {client.is_virtual ? "D" : "R"}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">{client.loginid}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {client.balance !== null ? `${client.balance.toFixed(2)} ${client.currency}` : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => refreshBalance(client)} className="text-[10px] text-primary hover:underline">Refresh</button>
                <button
                  onClick={() => updateClient(client.loginid, { active: !client.active })}
                  className={`w-8 h-4 rounded-full relative transition-colors ${client.active ? "bg-buy" : "bg-muted"}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-primary-foreground transition-transform ${client.active ? "left-4" : "left-0.5"}`} />
                </button>
                <button onClick={() => removeClient(client.loginid)} className="text-destructive hover:text-destructive/80">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Stake settings */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateClient(client.loginid, { usePercentage: false })}
                  className={`px-2 py-0.5 text-[10px] rounded ${!client.usePercentage ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                >
                  Fixed
                </button>
                <button
                  onClick={() => updateClient(client.loginid, { usePercentage: true })}
                  className={`px-2 py-0.5 text-[10px] rounded ${client.usePercentage ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                >
                  % Balance
                </button>
              </div>
              {client.usePercentage ? (
                <div className="flex items-center gap-1 flex-1">
                  <input
                    type="number"
                    value={client.percentage}
                    onChange={(e) => updateClient(client.loginid, { percentage: parseInt(e.target.value) || 20 })}
                    min="1"
                    max="100"
                    className="w-16 px-2 py-1 bg-secondary border border-border rounded text-[10px] text-foreground"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    % = ${client.balance ? ((client.balance * (client.percentage / 100))).toFixed(2) : "0.00"}
                  </span>
                </div>
              ) : (
                <input
                  type="number"
                  value={client.stake}
                  onChange={(e) => updateClient(client.loginid, { stake: e.target.value })}
                  min="0.35"
                  step="0.01"
                  className="w-20 px-2 py-1 bg-secondary border border-border rounded text-[10px] text-foreground"
                  placeholder="Stake"
                />
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ClientTokenManager;
