import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { Mail, ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <img src={logo} alt="DTNexus" className="h-8" />
          <span className="font-display text-xl font-bold">
            <span className="text-foreground">DT</span><span className="text-primary">NEXUS</span>
          </span>
        </Link>

        <div className="bg-card border border-border rounded-2xl p-8">
          <h2 className="text-lg font-bold text-foreground mb-2">Reset Password</h2>
          {sent ? (
            <div className="space-y-4">
              <p className="text-sm text-buy bg-buy/10 p-3 rounded-lg">Check your email for a password reset link.</p>
              <Link to="/auth" className="flex items-center gap-2 text-sm text-primary hover:underline"><ArrowLeft className="w-4 h-4" /> Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-muted-foreground">Enter your email and we'll send you a reset link.</p>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              {error && <p className="text-xs text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>}
              <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-brand text-primary-foreground font-semibold rounded-lg disabled:opacity-50">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              <Link to="/auth" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="w-3 h-3" /> Back to Login</Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
