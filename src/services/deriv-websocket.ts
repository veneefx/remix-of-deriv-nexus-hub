// Deriv WebSocket Service
const DERIV_WS_URL = "wss://ws.derivws.com/websockets/v3";

export type DerivMessage = {
  msg_type?: string;
  [key: string]: any;
};

type MessageHandler = (data: DerivMessage) => void;

class DerivWebSocket {
  private ws: WebSocket | null = null;
  private appId: string;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnects = 10;
  private reconnectDelay = 2000;
  private isConnected = false;
  private pendingMessages: string[] = [];
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private lastPongTs = 0;
  private intentionalClose = false;

  constructor(appId: string) {
    this.appId = appId;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.intentionalClose = false;
        this.ws = new WebSocket(`${DERIV_WS_URL}?app_id=${this.appId}`);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.lastPongTs = Date.now();
          // Flush pending messages safely
          this.pendingMessages.forEach((msg) => {
            try { this.ws?.send(msg); } catch {}
          });
          this.pendingMessages = [];
          this.startHeartbeat();
          this.emit("connection", { status: "connected" });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.msg_type === "ping" || data.ping) this.lastPongTs = Date.now();
            if (data.msg_type) {
              this.emit(data.msg_type, data);
            }
            if (data.error) {
              this.emit("error", data);
            }
            // Any incoming message proves the link is alive
            this.lastPongTs = Date.now();
          } catch (e) {
            console.error("Failed to parse WS message:", e);
          }
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.stopHeartbeat();
          this.emit("connection", { status: "disconnected" });
          if (!this.intentionalClose) this.tryReconnect();
        };

        this.ws.onerror = (err) => {
          console.error("WebSocket error:", err);
          this.emit("error", { error: "Connection error" });
          reject(err);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      // Send ping every 25s
      if (this.ws?.readyState === WebSocket.OPEN) {
        try { this.ws.send(JSON.stringify({ ping: 1 })); } catch {}
      }
      // If no message received in 60s, force reconnect
      if (Date.now() - this.lastPongTs > 60000) {
        console.warn("[WS] Heartbeat timeout — forcing reconnect");
        try { this.ws?.close(); } catch {}
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private tryReconnect() {
    if (this.reconnectAttempts < this.maxReconnects) {
      this.reconnectAttempts++;
      const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 15000);
      setTimeout(() => {
        this.connect().catch(console.error);
      }, delay);
    }
  }

  send(data: Record<string, any>) {
    const msg = JSON.stringify(data);
    // Only send if socket is fully OPEN — otherwise buffer
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try { this.ws.send(msg); } catch (e) {
        // Network error during send — buffer and let reconnect logic handle
        this.pendingMessages.push(msg);
      }
    } else {
      this.pendingMessages.push(msg);
    }
  }

  on(msgType: string, handler: MessageHandler) {
    if (!this.handlers.has(msgType)) {
      this.handlers.set(msgType, new Set());
    }
    this.handlers.get(msgType)!.add(handler);
    return () => this.handlers.get(msgType)?.delete(handler);
  }

  private emit(msgType: string, data: any) {
    this.handlers.get(msgType)?.forEach((handler) => handler(data));
  }

  authorize(token: string) {
    this.send({ authorize: token });
  }

  subscribeTicks(symbol: string) {
    this.send({ ticks: symbol, subscribe: 1 });
  }

  unsubscribeTicks(symbol: string) {
    this.send({ forget_all: "ticks" });
  }

  getBalance() {
    this.send({ balance: 1, subscribe: 1 });
  }

  getProposal(params: {
    amount: number;
    contractType: string;
    symbol: string;
    duration: number;
    durationUnit: string;
    barrier?: string;
  }) {
    this.send({
      proposal: 1,
      amount: params.amount,
      basis: "stake",
      contract_type: params.contractType,
      currency: "USD",
      symbol: params.symbol,
      duration: params.duration,
      duration_unit: params.durationUnit,
      ...(params.barrier !== undefined && { barrier: params.barrier }),
    });
  }

  buyContract(proposalId: string, price: number) {
    this.send({ buy: proposalId, price });
  }

  subscribeOpenContract() {
    this.send({ proposal_open_contract: 1, subscribe: 1 });
  }

  disconnect() {
    this.intentionalClose = true;
    this.stopHeartbeat();
    try { this.ws?.close(); } catch {}
    this.ws = null;
    this.isConnected = false;
    this.handlers.clear();
  }

  get connected() {
    return this.isConnected;
  }
}

export default DerivWebSocket;
