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
  private maxReconnects = 5;
  private reconnectDelay = 2000;
  private isConnected = false;
  private pendingMessages: string[] = [];

  constructor(appId: string) {
    this.appId = appId;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${DERIV_WS_URL}?app_id=${this.appId}`);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          // Send any pending messages
          this.pendingMessages.forEach((msg) => this.ws?.send(msg));
          this.pendingMessages = [];
          this.emit("connection", { status: "connected" });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.msg_type) {
              this.emit(data.msg_type, data);
            }
            if (data.error) {
              this.emit("error", data);
            }
          } catch (e) {
            console.error("Failed to parse WS message:", e);
          }
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.emit("connection", { status: "disconnected" });
          this.tryReconnect();
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

  private tryReconnect() {
    if (this.reconnectAttempts < this.maxReconnects) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  send(data: Record<string, any>) {
    const msg = JSON.stringify(data);
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(msg);
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
    this.ws?.close();
    this.ws = null;
    this.isConnected = false;
    this.handlers.clear();
  }

  get connected() {
    return this.isConnected;
  }
}

export default DerivWebSocket;
