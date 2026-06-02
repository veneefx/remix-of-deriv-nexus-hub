import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { Lock } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      navigate("/auth");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else navigate("/trading");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <img src={logo} alt="DTNexus" className="h-8" />
          <span className="font-display text-xl font-bold"><span className="text-foreground">DT</span><span className="text-primary">NEXUS</span></span>
        </Link>
        <div className="bg-card border border-border rounded-2xl p-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Set New Password</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" required minLength={6} className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            {error && <p className="text-xs text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-brand text-primary-foreground font-semibold rounded-lg disabled:opacity-50">{loading ? "Updating..." : "Update Password"}</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
