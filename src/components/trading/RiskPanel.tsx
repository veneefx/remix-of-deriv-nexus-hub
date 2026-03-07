import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, AlertTriangle, Target, TrendingDown } from "lucide-react";

interface RiskPanelProps {
  isOpen: boolean;
  onClose: () => void;
  takeProfit: string;
  stopLoss: string;
  maxDrawdown?: number;
  dailyTarget?: number;
  onTakeProfitChange: (value: string) => void;
  onStopLossChange: (value: string) => void;
}

const RiskPanel = ({
  isOpen,
  onClose,
  takeProfit,
  stopLoss,
  maxDrawdown = 0,
  dailyTarget = 0,
  onTakeProfitChange,
  onStopLossChange,
}: RiskPanelProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm"
          />

          {/* Side Panel */}
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-[420px] bg-card border-l border-border flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Risk Management</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Take Profit */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-buy" />
                  <label className="text-sm font-semibold text-foreground">Take Profit</label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Stop trading when you reach this profit target.
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                    $
                  </span>
                  <input
                    type="number"
                    value={takeProfit}
                    onChange={(e) => onTakeProfitChange(e.target.value)}
                    className="w-full pl-7 pr-4 py-3 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-buy/50"
                    placeholder="1000"
                  />
                </div>
                <div className="p-3 rounded-lg bg-buy/5 border border-buy/20">
                  <p className="text-xs text-buy font-medium">
                    Current Profit: <span className="font-bold">${dailyTarget.toFixed(2)}</span>
                  </p>
                </div>
              </div>

              {/* Stop Loss */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-sell" />
                  <label className="text-sm font-semibold text-foreground">Stop Loss</label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Stop trading when you lose this amount.
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                    $
                  </span>
                  <input
                    type="number"
                    value={stopLoss}
                    onChange={(e) => onStopLossChange(e.target.value)}
                    className="w-full pl-7 pr-4 py-3 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sell/50"
                    placeholder="100"
                  />
                </div>
                <div className="p-3 rounded-lg bg-sell/5 border border-sell/20">
                  <p className="text-xs text-sell font-medium">
                    Current Loss: <span className="font-bold">${maxDrawdown.toFixed(2)}</span>
                  </p>
                </div>
              </div>

              {/* Risk Status */}
              <div className="space-y-3 pt-6 border-t border-border">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <label className="text-sm font-semibold text-foreground">Risk Status</label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-secondary border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Max Loss</p>
                    <p className="text-sm font-bold text-foreground">${stopLoss}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Target Profit</p>
                    <p className="text-sm font-bold text-foreground">${takeProfit}</p>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                <p className="text-xs font-medium text-foreground">💡 Pro Tip</p>
                <p className="text-xs text-muted-foreground">
                  Set realistic targets based on your account size. A 10-20% daily profit target is considered healthy.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border">
              <button
                onClick={onClose}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                Close Panel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RiskPanel;
