import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Save, ArrowLeft, RefreshCw } from "lucide-react";
import logo from "@/assets/logo.png";

const AdminStrategy = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [strategy, setStrategy] = useState<any>(null);
  const [profiles, setProfiles] = useState<any>({});
  const [riskGlobal, setRiskGlobal] = useState<any>({});
  const [recoveryGlobal, setRecoveryGlobal] = useState<any>({});
  const [digitSettings, setDigitSettings] = useState<any>({});
  const [riseFallSettings, setRiseFallSettings] = useState<any>({});
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("user_id", user.id).single();
      if (!profile?.is_admin) { navigate("/"); return; }
      setIsAdmin(true);
      loadStrategy();
    };
    checkAdmin();
  }, [navigate]);

  const loadStrategy = async () => {
    setLoading(true);
    const { data } = await supabase.from("global_strategy").select("*").eq("active", true).limit(1).single();
    if (data) {
      setStrategy(data);
      setProfiles(data.profiles || {});
      setRiskGlobal(data.risk_global || {});
      setRecoveryGlobal(data.recovery_global || {});
      setDigitSettings(data.digit_settings || {});
      setRiseFallSettings(data.rise_fall_settings || {});
    }
    setLoading(false);
  };

  const saveStrategy = async () => {
    if (!strategy) return;
    setSaving(true);
    await supabase.from("global_strategy").update({
      profiles,
      risk_global: riskGlobal,
      recovery_global: recoveryGlobal,
      digit_settings: digitSettings,
      rise_fall_settings: riseFallSettings,
      version: (strategy.version || 0) + 1,
    }).eq("id", strategy.id);
    await loadStrategy();
    setSaving(false);
  };

  const updateProfile = (profile: string, key: string, value: any) => {
    setProfiles((prev: any) => ({
      ...prev,
      [profile]: { ...prev[profile], [key]: value }
    }));
  };

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src={logo} alt="DNexus" className="w-16 mx-auto animate-pulse" />
          <p className="text-sm text-muted-foreground">{loading ? "Loading strategy..." : "Access denied"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/trading" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /></Link>
            <img src={logo} alt="DNexus" className="h-6" />
            <h1 className="text-sm font-bold text-foreground">Admin Strategy Control</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">v{strategy?.version}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadStrategy} className="px-3 py-1.5 text-xs bg-secondary border border-border rounded-lg text-foreground hover:bg-muted flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Reload
            </button>
            <button onClick={saveStrategy} disabled={saving} className="px-4 py-1.5 text-xs bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-1">
              <Save className="w-3 h-3" /> {saving ? "Saving..." : "Save & Push"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-8">
        {/* Strategy Profiles */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Strategy Profiles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {["aggressive", "balanced", "conservative"].map((profile) => {
              const p = profiles[profile] || {};
              const color = profile === "aggressive" ? "sell" : profile === "balanced" ? "warning" : "buy";
              return (
                <div key={profile} className={`p-5 rounded-xl border border-border bg-card space-y-4`}>
                  <h3 className={`text-sm font-bold capitalize text-${color} flex items-center gap-2`}>
                    {profile === "aggressive" ? "🟥" : profile === "balanced" ? "🟨" : "🟩"} {profile}
                  </h3>
                  <Field label="Digit Frequency Threshold" value={p.digit_frequency_threshold || 0} onChange={(v) => updateProfile(profile, "digit_frequency_threshold", parseFloat(v))} type="number" step="0.01" />
                  <Field label="Momentum Weight" value={p.momentum_weight || 0} onChange={(v) => updateProfile(profile, "momentum_weight", parseFloat(v))} type="number" step="0.1" />
                  <Field label="Max Open Trades" value={p.max_open_trades || 1} onChange={(v) => updateProfile(profile, "max_open_trades", parseInt(v))} type="number" />
                  <Field label="Min Tick History" value={p.minimum_tick_history || 50} onChange={(v) => updateProfile(profile, "minimum_tick_history", parseInt(v))} type="number" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Confluence Required</span>
                    <button
                      onClick={() => updateProfile(profile, "confluence_required", !p.confluence_required)}
                      className={`w-9 h-5 rounded-full relative transition-colors ${p.confluence_required ? "bg-buy" : "bg-muted"}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-primary-foreground transition-transform ${p.confluence_required ? "left-4" : "left-0.5"}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Global Risk */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-xl border border-border bg-card space-y-4">
            <h3 className="text-sm font-bold text-foreground">Global Risk Settings</h3>
            <Field label="Daily Loss Limit" value={riskGlobal.daily_loss_limit || 100} onChange={(v) => setRiskGlobal((p: any) => ({ ...p, daily_loss_limit: parseFloat(v) }))} type="number" />
            <Field label="Daily Profit Target" value={riskGlobal.daily_profit_target || 1000} onChange={(v) => setRiskGlobal((p: any) => ({ ...p, daily_profit_target: parseFloat(v) }))} type="number" />
            <Field label="Martingale Multiplier" value={riskGlobal.multiplier || 2.2} onChange={(v) => setRiskGlobal((p: any) => ({ ...p, multiplier: parseFloat(v) }))} type="number" step="0.1" />
            <Field label="Max Recovery Steps" value={riskGlobal.max_recovery_steps || 10} onChange={(v) => setRiskGlobal((p: any) => ({ ...p, max_recovery_steps: parseInt(v) }))} type="number" />
            <Field label="Stop After Loss Streak" value={riskGlobal.stop_after_loss_streak || 10} onChange={(v) => setRiskGlobal((p: any) => ({ ...p, stop_after_loss_streak: parseInt(v) }))} type="number" />
            <Field label="Partial Profit %" value={riskGlobal.secure_partial_profit_percent || 50} onChange={(v) => setRiskGlobal((p: any) => ({ ...p, secure_partial_profit_percent: parseInt(v) }))} type="number" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Martingale Enabled</span>
              <button
                onClick={() => setRiskGlobal((p: any) => ({ ...p, martingale_enabled: !p.martingale_enabled }))}
                className={`w-9 h-5 rounded-full relative transition-colors ${riskGlobal.martingale_enabled ? "bg-buy" : "bg-muted"}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-primary-foreground transition-transform ${riskGlobal.martingale_enabled ? "left-4" : "left-0.5"}`} />
              </button>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card space-y-4">
            <h3 className="text-sm font-bold text-foreground">Recovery Settings</h3>
            <Field label="Start Martingale After (losses)" value={recoveryGlobal.start_martingale_after || 1} onChange={(v) => setRecoveryGlobal((p: any) => ({ ...p, start_martingale_after: parseInt(v) }))} type="number" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Reset After Win</span>
              <button
                onClick={() => setRecoveryGlobal((p: any) => ({ ...p, reset_after_win: !p.reset_after_win }))}
                className={`w-9 h-5 rounded-full relative transition-colors ${recoveryGlobal.reset_after_win ? "bg-buy" : "bg-muted"}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-primary-foreground transition-transform ${recoveryGlobal.reset_after_win ? "left-4" : "left-0.5"}`} />
              </button>
            </div>

            <h3 className="text-sm font-bold text-foreground mt-6">Digit Settings</h3>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Sequence Detection</span>
              <button
                onClick={() => setDigitSettings((p: any) => ({ ...p, sequence_detection: !p.sequence_detection }))}
                className={`w-9 h-5 rounded-full relative transition-colors ${digitSettings.sequence_detection ? "bg-buy" : "bg-muted"}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-primary-foreground transition-transform ${digitSettings.sequence_detection ? "left-4" : "left-0.5"}`} />
              </button>
            </div>

            <h3 className="text-sm font-bold text-foreground mt-6">Rise/Fall Settings</h3>
            <Field label="Min Trend Strength" value={riseFallSettings.minimum_trend_strength || 0.6} onChange={(v) => setRiseFallSettings((p: any) => ({ ...p, minimum_trend_strength: parseFloat(v) }))} type="number" step="0.1" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">S/R Enabled</span>
              <button
                onClick={() => setRiseFallSettings((p: any) => ({ ...p, support_resistance_enabled: !p.support_resistance_enabled }))}
                className={`w-9 h-5 rounded-full relative transition-colors ${riseFallSettings.support_resistance_enabled ? "bg-buy" : "bg-muted"}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-primary-foreground transition-transform ${riseFallSettings.support_resistance_enabled ? "left-4" : "left-0.5"}`} />
              </button>
            </div>
          </div>
        </section>

        <p className="text-xs text-muted-foreground text-center">
          Changes apply to ALL active bots within 30 seconds. No restart required.
        </p>
      </main>
    </div>
  );
};

const Field = ({ label, value, onChange, type = "text", step }: { label: string; value: any; onChange: (v: string) => void; type?: string; step?: string }) => (
  <div>
    <label className="text-xs text-muted-foreground">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} step={step} className="mt-1 w-full px-3 py-1.5 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
  </div>
);

export default AdminStrategy;
