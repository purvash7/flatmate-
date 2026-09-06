import { getStoredToken } from './api.js';
import { MessageItem, MatchItem } from '../types.js';

type WebSocketEventCallback = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<WebSocketEventCallback>> = new Map();
  private reconnectTimeout: any = null;
  private pingInterval: any = null;
  private isConnecting: boolean = false;
  private isConnected: boolean = false;
  private fallbackPollingInterval: any = null;
  private activeMatchIdForPolling: string | null = null;

  public connect() {
    const token = getStoredToken();
    if (!token) {
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.isConnecting = false;
        this.stopPollingFallback();
        this.emit('connection:change', { connected: true });

        // Authenticate explicitly as well
        this.send('auth', { token });

        // Start ping interval
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.send('ping', {});
          }
        }, 25000);
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { type, ...data } = payload;
          if (type) {
            this.emit(type, data);
          }
        } catch {
          // parse error
        }
      };

      this.ws.onerror = () => {
        this.isConnected = false;
        this.startPollingFallback();
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.isConnecting = false;
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.emit('connection:change', { connected: false });
        this.startPollingFallback();

        // Auto reconnect after 3 seconds
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => {
          if (getStoredToken()) {
            this.connect();
          }
        }, 3000);
      };
    } catch {
      this.isConnecting = false;
      this.isConnected = false;
      this.startPollingFallback();
    }
  }

  public disconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.stopPollingFallback();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
  }

  public send(type: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }));
      return true;
    }
    return false;
  }

  public sendMessage(matchId: string, content: string) {
    return this.send('chat:send', { match_id: matchId, content });
  }

  public markAsRead(matchId: string) {
    return this.send('chat:read', { match_id: matchId });
  }

  public sendTyping(matchId: string, isTyping: boolean) {
    return this.send('chat:typing', { match_id: matchId, is_typing: isTyping });
  }

  public on(event: string, callback: WebSocketEventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  public off(event: string, callback: WebSocketEventCallback) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(data);
        } catch (err) {
          console.warn(`Error in websocket listener for ${event}:`, err);
        }
      });
    }
  }

  public isSocketConnected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  // Polling fallback mechanism if WebSockets fail
  public setActiveMatchForPolling(matchId: string | null) {
    this.activeMatchIdForPolling = matchId;
  }

  private startPollingFallback() {
    if (this.fallbackPollingInterval) return;
    this.fallbackPollingInterval = setInterval(() => {
      if (this.activeMatchIdForPolling) {
        this.emit('fallback:poll_needed', { matchId: this.activeMatchIdForPolling });
      }
    }, 4000);
  }

  private stopPollingFallback() {
    if (this.fallbackPollingInterval) {
      clearInterval(this.fallbackPollingInterval);
      this.fallbackPollingInterval = null;
    }
  }
}

export const wsService = new WebSocketService();
