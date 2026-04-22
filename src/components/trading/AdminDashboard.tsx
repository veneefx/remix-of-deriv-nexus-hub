import { useState, useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, User, Shield, Check, Search, CreditCard, BarChart3, DollarSign, TrendingUp, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { adminVerification } from "@/services/admin-verification";

const VERIFIABLE_FEATURES = [
  "DAT Analyzer",
  "Strategy Lab",
  "Market Scanner",
  "Forex AI",
  "Digit Edge Analytics",
  "Probability Engine",
];

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  is_premium: boolean;
  is_admin: boolean;
  created_at: string;
}

type Tab = "users" | "payments" | "trades" | "verifications";

const AdminDashboard = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("users");

  const fetchProfiles = async () => {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setProfiles(data || []);
  };

  const fetchPayments = async () => {
    const { data, error } = await supabase.from("payments").select("*").order("created_at", { ascending: false });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setPayments(data || []);
  };

  const fetchTrades = async () => {
    const { data, error } = await supabase.from("trade_logs").select("*").order("executed_at", { ascending: false }).limit(100);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setTrades(data || []);
  };

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    Promise.all([fetchProfiles(), fetchPayments(), fetchTrades()]).finally(() => setLoading(false));
  }, [isOpen]);

  const togglePremium = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_premium: !currentStatus }).eq("user_id", userId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Success", description: "Premium status updated." }); fetchProfiles(); }
  };

  const updatePaymentStatus = async (paymentId: string, status: "confirmed" | "rejected") => {
    const { error } = await supabase.from("payments").update({ status }).eq("id", paymentId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "✅ Payment " + status, description: status === "confirmed" ? "User premium activated automatically." : "Payment rejected." });
      fetchPayments();
      fetchProfiles();
    }
  };

  const filteredProfiles = profiles.filter(p =>
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    (p.display_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  // Get email for a user_id from profiles
  const emailFor = (userId: string) => profiles.find(p => p.id === userId || (p as any).user_id === userId)?.email || userId.slice(0, 8);

  // Stats
  const totalRevenue = payments.filter(p => p.status === "confirmed").reduce((s, p) => s + Number(p.amount), 0);
  const pendingPayments = payments.filter(p => p.status === "pending").length;
  const totalTrades = trades.length;
  const totalProfit = trades.reduce((s, t) => s + Number(t.profit), 0);

  if (!isOpen) return null;

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "users", label: "Users", icon: User },
    { key: "payments", label: "Payments", icon: CreditCard },
    { key: "verifications", label: "Verifications", icon: ShieldCheck },
    { key: "trades", label: "Trade Logs", icon: BarChart3 },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Admin Dashboard</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-3 p-4 border-b border-border">
          <div className="p-3 rounded-lg bg-secondary/50 text-center">
            <p className="text-[10px] text-muted-foreground">Users</p>
            <p className="text-lg font-bold">{profiles.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50 text-center">
            <p className="text-[10px] text-muted-foreground">Revenue</p>
            <p className="text-lg font-bold text-buy">${totalRevenue.toFixed(0)}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50 text-center">
            <p className="text-[10px] text-muted-foreground">Pending</p>
            <p className="text-lg font-bold text-warning">{pendingPayments}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50 text-center">
            <p className="text-[10px] text-muted-foreground">Trades</p>
            <p className="text-lg font-bold">{totalTrades}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-4 border-b border-border">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Search (users tab only) */}
        {activeTab === "users" && (
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search by email or name..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-sm" />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : activeTab === "users" ? (
            <div className="grid gap-3">
              {filteredProfiles.map(profile => (
                <div key={profile.id} className="p-4 rounded-xl border border-border bg-secondary/30 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{profile.email}</p>
                      <p className="text-xs text-muted-foreground">{profile.display_name || "No Name"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end mr-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${profile.is_premium ? "bg-buy/20 text-buy" : "bg-muted text-muted-foreground"}`}>
                        {profile.is_premium ? "PREMIUM" : "FREE"}
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-1">Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                    </div>
                    <button onClick={() => togglePremium((profile as any).user_id || profile.id, profile.is_premium)}
                      className={`p-2 rounded-lg transition-colors ${profile.is_premium ? "bg-destructive/10 text-destructive hover:bg-destructive/20" : "bg-buy/10 text-buy hover:bg-buy/20"}`}
                      title={profile.is_premium ? "Revoke Premium" : "Grant Premium"}>
                      {profile.is_premium ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
              {filteredProfiles.length === 0 && <p className="text-center text-muted-foreground py-8">No users found.</p>}
            </div>
          ) : activeTab === "payments" ? (
            <div className="grid gap-3">
              {payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No payments yet.</p>
              ) : payments.map(payment => (
                <div key={payment.id} className="p-4 rounded-xl border border-border bg-secondary/30 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payment.status === "confirmed" ? "bg-buy/10" : payment.status === "rejected" ? "bg-destructive/10" : "bg-warning/10"}`}>
                      <DollarSign className={`w-5 h-5 ${payment.status === "confirmed" ? "text-buy" : payment.status === "rejected" ? "text-destructive" : "text-warning"}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{emailFor(payment.user_id)}</p>
                      <p className="text-xs text-muted-foreground">{payment.method.toUpperCase()} • {payment.plan_type} • ${Number(payment.amount).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${payment.status === "confirmed" ? "bg-buy/20 text-buy" : payment.status === "rejected" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"}`}>
                      {payment.status.toUpperCase()}
                    </span>
                    {payment.status === "pending" && (
                      <div className="flex gap-1">
                        <button onClick={() => updatePaymentStatus(payment.id, "confirmed")}
                          className="p-2 rounded-lg bg-buy/10 text-buy hover:bg-buy/20 transition-colors" title="Confirm">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => updatePaymentStatus(payment.id, "rejected")}
                          className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors" title="Reject">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === "verifications" ? (
            <VerificationsPanel profiles={profiles} />
          ) : (
            <div className="grid gap-2">
              {trades.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No trade logs yet.</p>
              ) : (
                <>
                  <div className="grid grid-cols-6 gap-2 px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase">
                    <span>User</span><span>Type</span><span>Symbol</span><span>Stake</span><span>Profit</span><span>Time</span>
                  </div>
                  {trades.map(trade => (
                    <div key={trade.id} className={`grid grid-cols-6 gap-2 px-3 py-2.5 rounded-lg text-xs border border-border ${trade.won ? "bg-buy/5" : "bg-destructive/5"}`}>
                      <span className="truncate">{emailFor(trade.user_id)}</span>
                      <span className="font-mono">{trade.contract_type}</span>
                      <span>{trade.symbol}</span>
                      <span>${Number(trade.stake).toFixed(2)}</span>
                      <span className={trade.won ? "text-buy font-semibold" : "text-destructive font-semibold"}>
                        {trade.won ? "+" : ""}{Number(trade.profit).toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">{new Date(trade.executed_at).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
