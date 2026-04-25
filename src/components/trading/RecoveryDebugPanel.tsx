import { ShieldAlert } from "lucide-react";
import type { RecoveryDebugSnapshot } from "@/services/deriv-brain";

const RecoveryDebugPanel = ({ snapshot, stakeStep }: { snapshot: RecoveryDebugSnapshot; stakeStep: number }) => (
  <div className="p-4 rounded-xl bg-card border border-border space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-warning" />
        <h3 className="text-sm font-semibold text-foreground">Recovery Debug</h3>
      </div>
      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${snapshot.armed ? "bg-warning/20 text-warning" : "bg-secondary text-muted-foreground"}`}>
        {snapshot.armed ? "ARMED" : "IDLE"}
      </span>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {[
        ["Mode", snapshot.mode === "digit" ? "Digit" : "Even/Odd"],
        ["Target", snapshot.target || "—"],
        ["Attempts", snapshot.attempts],
        ["Stake Step", stakeStep],
      ].map(([label, value]) => (
        <div key={String(label)} className="rounded-lg bg-secondary/50 border border-border p-2">
          <p className="text-[8px] uppercase text-muted-foreground font-bold">{label}</p>
          <p className="text-xs text-foreground font-semibold mt-1">{String(value)}</p>
        </div>
      ))}
    </div>
    <p className="text-[10px] text-muted-foreground">{snapshot.lastReason || "No recovery event yet. The next base loss will show the re-arm reason and matched sequence here."}</p>
  </div>
);

export default RecoveryDebugPanel;