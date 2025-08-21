"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type TabType,
  type GetScannerResultParams,
  TokenData,
} from "@/types/scanner";
import { TokenTable } from "@/components/table/token-table";
import { useScannerData } from "@/hooks/use-scanner-data";
import { useEnhancedTokenUpdates } from "@/hooks/use-enhanced-token-updates";
import { useWebSocket } from "@/components/providers/websocket-provider";
import { formatFiltersForWebSocket } from "@/lib/data-utils";
import { parseWebSocketMessage } from "@/hooks/use-websocket";
import { isEqual } from "lodash-es";

interface EnhancedTableTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  currentFilters: GetScannerResultParams;
}

export function EnhancedTableTabs({
  activeTab,
  onTabChange,
  currentFilters,
}: EnhancedTableTabsProps) {
  // WebSocket connection
  const { ws, sendMessage } = useWebSocket();
  // Get initial data from REST API using raw filters
  const restQuery = useScannerData(currentFilters);
  // Enhanced token updates with WebSocket
  const { initializeTokens, tokens, highlightedRows, handleTickEvent } =
    useEnhancedTokenUpdates(currentFilters);

  if (!tokens.length && restQuery.data) {
    initializeTokens(restQuery.data.pages.flatMap((page) => page.tokens));
  }

  // Subscribe to scanner updates using formatted filters
  const toggleScannerSubscription = useCallback(
    (connect: boolean, filters: GetScannerResultParams) => {
      const wsFilters = formatFiltersForWebSocket(filters);
      console.log("Subscribing to scanner with formatted filters:", wsFilters);
      sendMessage({
        event: connect ? "scanner-filter" : "unsubscribe-scanner-filter",
        data: wsFilters,
      });
    },
    [sendMessage],
  );
  const prevFiltersRef = useRef<GetScannerResultParams | null>(null);
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const message = parseWebSocketMessage(event.data);
      if (!message) return;
      if (message.event === "tick") {
        handleTickEvent(message.data);
      }
    },
    [handleTickEvent],
  );
  if (!isEqual(prevFiltersRef.current, currentFilters) && ws) {
    if (prevFiltersRef.current) {
      toggleScannerSubscription(false, currentFilters);
      ws.removeEventListener("message", handleMessage);
    }
    toggleScannerSubscription(true, currentFilters);
    // Add event listeners
    ws.addEventListener("message", handleMessage);
    prevFiltersRef.current = currentFilters;
  }
  const prevTokensRef = useRef<TokenData[]>([]);
  if (prevTokensRef.current.length < tokens.length) {
    tokens.forEach((t) => {
      console.log(t.pairAddress, t.tokenAddress);
      sendMessage({
        event: "subscribe-pair-stats",
        data: {
          pair: t.pairAddress,
          token: t.tokenAddress,
          chain: t.chain,
        },
      });
    });
  }
  const isLoading = restQuery.isLoading && tokens.length === 0;

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => onTabChange(value as TabType)}
    >
      <TabsList className="grid w-full grid-cols-2 max-w-sm">
        <TabsTrigger value="trending">Trending Tokens</TabsTrigger>
        <TabsTrigger value="new">New Tokens</TabsTrigger>
      </TabsList>

      <TabsContent value="trending" className="mt-6">
        {activeTab === "trending" && (
          <>
            <TokenTable
              tokens={tokens}
              isLoading={isLoading}
              hasNextPage={restQuery.hasNextPage}
              fetchNextPage={restQuery.fetchNextPage}
              isFetchingNextPage={restQuery.isFetchingNextPage}
              highlightedRows={highlightedRows}
            />

            {restQuery.error && (
              <div className="mt-4 p-4 border border-red-200 rounded-md bg-red-50 dark:bg-red-950 dark:border-red-800">
                <p className="text-red-800 dark:text-red-200 text-sm">
                  Error loading trending tokens: {restQuery.error.message}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Make sure to enable CORS in your browser during development
                </p>
              </div>
            )}
          </>
        )}
      </TabsContent>

      <TabsContent value="new" className="mt-6">
        {activeTab === "new" && (
          <>
            <TokenTable
              tokens={tokens}
              isLoading={isLoading}
              hasNextPage={restQuery.hasNextPage}
              fetchNextPage={restQuery.fetchNextPage}
              isFetchingNextPage={restQuery.isFetchingNextPage}
              highlightedRows={highlightedRows}
            />

            {restQuery.error && (
              <div className="mt-4 p-4 border border-red-200 rounded-md bg-red-50 dark:bg-red-950 dark:border-red-800">
                <p className="text-red-800 dark:text-red-200 text-sm">
                  Error loading new tokens: {restQuery.error.message}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Make sure to enable CORS in your browser during development
                </p>
              </div>
            )}
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}
