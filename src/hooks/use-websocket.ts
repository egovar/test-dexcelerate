"use client";

import { useEffect } from "react";
import type {
  IncomingWebSocketMessage,
  TickEventPayload,
  PairStatsMsgData,
  ScannerPairsEventPayload,
} from "@/types/scanner";
import { useWebSocket as useWebSocketProvider } from "@/components/providers/websocket-provider";

interface UseWebSocketProps {
  onTick?: (data: TickEventPayload) => void;
  onPairStats?: (data: PairStatsMsgData) => void;
  onScannerPairs?: (data: ScannerPairsEventPayload) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

/**
 * Legacy hook for backward compatibility
 * Use the new useWebSocket from provider directly for new code
 */
export function useWebSocket({
  onTick,
  onPairStats,
  onScannerPairs,
  onOpen,
  onClose,
  onError,
}: UseWebSocketProps) {
  const { ws, isConnected, sendMessage, close } = useWebSocketProvider();

  // Set up message handlers
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message: IncomingWebSocketMessage = JSON.parse(event.data);

        switch (message.event) {
          case "tick":
            onTick?.(message.data);
            break;
          case "pair-stats":
            onPairStats?.(message.data);
            break;
          case "scanner-pairs":
            onScannerPairs?.(message.data);
            break;
          default:
            console.warn("Unknown WebSocket message type:", message);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    const handleOpen = () => {
      onOpen?.();
    };

    const handleClose = () => {
      onClose?.();
    };

    const handleError = (error: Event) => {
      onError?.(error);
    };

    // Add event listeners
    ws.addEventListener("message", handleMessage);
    ws.addEventListener("open", handleOpen);
    ws.addEventListener("close", handleClose);
    ws.addEventListener("error", handleError);

    // Cleanup
    return () => {
      ws.removeEventListener("message", handleMessage);
      ws.removeEventListener("open", handleOpen);
      ws.removeEventListener("close", handleClose);
      ws.removeEventListener("error", handleError);
    };
  }, [ws, onTick, onPairStats, onScannerPairs, onOpen, onClose, onError]);

  return {
    isConnected,
    sendMessage,
    close,
  };
}

/**
 * Helper function to parse WebSocket messages
 */
export function parseWebSocketMessage(
  data: string,
): IncomingWebSocketMessage | null {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error("Error parsing WebSocket message:", error);
    return null;
  }
}
