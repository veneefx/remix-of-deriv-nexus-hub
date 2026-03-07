import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Zap, TrendingUp, BarChart3, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import PaymentModal from "./PaymentModal";

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

interface Plan {
  name: string;
  price: string;
  duration: string;
  popular?: boolean;
}

const PremiumUpgradeModal = ({ isOpen, onClose, featureName = "Advanced Trading Tools" }: PremiumUpgradeModalProps) => {
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const plans: Plan[] = [
    { name: "Daily", price: "$7", duration: "1 day", popular: false },
    { name: "Weekly", price: "$25.49", duration: "7 days", popular: true },
    { name: "Monthly", price: "$37", duration: "30 days", popular: false },
    { name: "Lifetime", price: "$570", duration: "Forever", popular: false },
  ];

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const features = [
    { icon: Zap, text: "Digit Edge Trading Bot" },
    { icon: BarChart3, text: "DAT Analyzer" },
    { icon: Brain, text: "AI Signals & Analysis" },
    { icon: TrendingUp, text: "Fast Trading Bot" },
  ];

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
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 flex items-center justify-between p-6 border-b border-border bg-card/95 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Upgrade to Premium</h2>
                    <p className="text-xs text-muted-foreground">Unlock advanced trading tools</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-8">
                {/* Feature Info */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{featureName}</span> is a premium feature. Upgrade your account to unlock it.
                  </p>
                </div>

                {/* Features Included */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4">What You'll Unlock</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
                        <feature.icon className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-foreground">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plans */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4">Choose Your Plan</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {plans.map((plan) => (
                      <button
                        key={plan.name}
                        onClick={() => handleSelectPlan(plan)}
                        className={`relative p-4 rounded-lg border transition-all ${
                          plan.popular
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20 hover:ring-primary/40"
                            : "border-border bg-secondary/30 hover:border-primary/50"
                        }`}
                      >
                        {plan.popular && (
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full">
                            Popular
                          </div>
                        )}
                        <h4 className="font-semibold text-foreground text-sm mb-1">{plan.name}</h4>
                        <p className="text-2xl font-bold text-primary mb-1">{plan.price}</p>
                        <p className="text-xs text-muted-foreground">{plan.duration}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4">Payment Methods</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors text-sm font-medium text-foreground hover:bg-secondary">
                      💳 M-Pesa
                    </button>
                    <button className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors text-sm font-medium text-foreground hover:bg-secondary">
                      ₿ USDT
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 rounded-lg bg-secondary/50 border border-border space-y-2">
                  <p className="text-xs font-medium text-foreground">✓ Instant activation</p>
                  <p className="text-xs font-medium text-foreground">✓ Cancel anytime</p>
                  <p className="text-xs font-medium text-foreground">✓ 30-day money-back guarantee</p>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 flex gap-3 p-6 border-t border-border bg-card/95 backdrop-blur">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        plan={selectedPlan}
      />
    </AnimatePresence>
  );
};

export default PremiumUpgradeModal;
