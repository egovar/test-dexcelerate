"use client";

import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import type { OutgoingWebSocketMessage } from "@/types/scanner";

const WS_URL = "wss://api-rs.dexcelerate.com/ws";

interface WebSocketContextType {
  ws: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: OutgoingWebSocketMessage) => void;
  close: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  onError?: (error: Event) => void;
}

export function WebSocketProvider({
  children,
  onError,
}: WebSocketProviderProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    try {
      console.log("Connecting to WebSocket...");
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      wsRef.current.onclose = (event) => {
        console.log("WebSocket disconnected");
        setIsConnected(false);

        // Auto-reconnect with exponential backoff
        if (!event.wasClean && reconnectAttempts.current < 5) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // 1s, 2s, 4s, 8s, 16s
          console.log(
            `Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current + 1})`,
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current += 1;
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        onError?.(error);
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  }, [onError]);

  const sendMessage = useCallback((message: OutgoingWebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      console.log("Sent WebSocket message:", message);
    } else {
      console.warn("WebSocket not connected, cannot send message:", message);
    }
  }, []);

  const close = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, "Provider unmounted");
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Initialize connection on mount
  useEffect(() => {
    connect();

    return () => {
      close();
    };
  }, [connect, close]);

  const value: WebSocketContextType = {
    ws: wsRef.current,
    isConnected,
    sendMessage,
    close,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketContextType {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}
