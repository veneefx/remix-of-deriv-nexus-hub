import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check } from "lucide-react";
import { useState } from "react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    name: string;
    price: string;
    duration: string;
  } | null;
}

const PaymentModal = ({ isOpen, onClose, plan }: PaymentModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "usdt" | null>(null);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mpesaDetails = {
    paybill: "522522",
    account: "1316780252",
    amount: plan?.price.replace("$", "") || "0",
  };

  const usdtDetails = {
    address: "Coming Soon",
    network: "Tron (TRC20)",
    amount: plan?.price.replace("$", "") || "0",
  };

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
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Complete Payment</h2>
                  {plan && <p className="text-xs text-muted-foreground mt-1">{plan.name} Plan - {plan.price}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {!paymentMethod ? (
                  <>
                    <p className="text-sm text-muted-foreground">Choose your payment method:</p>
                    <div className="space-y-3">
                      <button
                        onClick={() => setPaymentMethod("mpesa")}
                        className="w-full p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-all text-left space-y-2 hover:bg-secondary/30"
                      >
                        <p className="font-semibold text-foreground">💳 M-Pesa</p>
                        <p className="text-xs text-muted-foreground">Pay via M-Pesa to our Paybill</p>
                      </button>
                      <button
                        onClick={() => setPaymentMethod("usdt")}
                        className="w-full p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-all text-left space-y-2 hover:bg-secondary/30"
                      >
                        <p className="font-semibold text-foreground">₿ USDT (Crypto)</p>
                        <p className="text-xs text-muted-foreground">Pay with USDT on Tron network</p>
                      </button>
                    </div>
                  </>
                ) : paymentMethod === "mpesa" ? (
                  <>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Send payment to:</p>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Paybill Number</label>
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="text"
                              value={mpesaDetails.paybill}
                              readOnly
                              className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground"
                            />
                            <button
                              onClick={() => copyToClipboard(mpesaDetails.paybill)}
                              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                            >
                              {copied ? <Check className="w-4 h-4 text-buy" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Account Number</label>
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="text"
                              value={mpesaDetails.account}
                              readOnly
                              className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground"
                            />
                            <button
                              onClick={() => copyToClipboard(mpesaDetails.account)}
                              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                            >
                              {copied ? <Check className="w-4 h-4 text-buy" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Amount (USD)</label>
                          <input
                            type="text"
                            value={mpesaDetails.amount}
                            readOnly
                            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground mt-1"
                          />
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                        <p className="text-xs text-warning font-medium">
                          ⚠️ After payment, your account will be activated within 5 minutes.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Send USDT to:</p>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Wallet Address</label>
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="text"
                              value={usdtDetails.address}
                              readOnly
                              className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-xs text-foreground font-mono"
                            />
                            <button
                              onClick={() => copyToClipboard(usdtDetails.address)}
                              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                            >
                              {copied ? <Check className="w-4 h-4 text-buy" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Network</label>
                          <input
                            type="text"
                            value={usdtDetails.network}
                            readOnly
                            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground mt-1"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Amount (USDT)</label>
                          <input
                            type="text"
                            value={usdtDetails.amount}
                            readOnly
                            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground mt-1"
                          />
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                        <p className="text-xs text-warning font-medium">
                          ⚠️ After payment, your account will be activated within 10 minutes.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-6 border-t border-border">
                <button
                  onClick={() => paymentMethod ? setPaymentMethod(null) : onClose()}
                  className="flex-1 py-2.5 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
                >
                  {paymentMethod ? "Back" : "Cancel"}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-gradient-brand text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  I've Sent Payment
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
