import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, User, Shield, Check, Search, Calendar, CreditCard } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  is_premium: boolean;
  is_admin: boolean;
  created_at: string;
}

const AdminDashboard = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) fetchProfiles();
  }, [isOpen]);

  const togglePremium = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_premium: !currentStatus })
      .eq("id", userId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Premium status updated for user.` });
      fetchProfiles();
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.email.toLowerCase().includes(search.toLowerCase()) || 
    (p.display_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Admin Management</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by email or name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid gap-4">
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
                      <span className="text-[10px] text-muted-foreground mt-1">
                        Joined {new Date(profile.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => togglePremium(profile.id, profile.is_premium)}
                      className={`p-2 rounded-lg transition-colors ${profile.is_premium ? "bg-destructive/10 text-destructive hover:bg-destructive/20" : "bg-buy/10 text-buy hover:bg-buy/20"}`}
                      title={profile.is_premium ? "Revoke Premium" : "Grant Premium"}
                    >
                      {profile.is_premium ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
              {filteredProfiles.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No users found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
