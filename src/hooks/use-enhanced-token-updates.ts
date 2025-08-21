"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { debounce } from "lodash-es";
import {
  TokenData,
  SerdeRankBy,
  GetScannerResultParams,
  WsTokenSwap,
  TickEventPayload,
} from "@/types/scanner";

export type HighlightType = "buy" | "sell";

interface TokenBatch {
  tokenId: string;
  initialPrice: number;
  finalPrice: number;
  validTrades: WsTokenSwap[];
  startTime: number;
  volumeAccumulated: number;
  buysAccumulated: number;
  sellsAccumulated: number;
}

function getComparator(rankBy: SerdeRankBy = "volume") {
  switch (rankBy) {
    case "volume":
      return (a: TokenData, b: TokenData) => b.volumeUsd - a.volumeUsd;
    case "age":
      return (a: TokenData, b: TokenData) =>
        b.tokenCreatedTimestamp.getTime() - a.tokenCreatedTimestamp.getTime();
    case "mcap":
      return (a: TokenData, b: TokenData) => b.mcap - a.mcap;
    case "price5M":
      return (a: TokenData, b: TokenData) =>
        b.priceChangePcs["5m"] - a.priceChangePcs["5m"];
    case "price1H":
      return (a: TokenData, b: TokenData) =>
        b.priceChangePcs["1h"] - a.priceChangePcs["1h"];
    case "price6H":
      return (a: TokenData, b: TokenData) =>
        b.priceChangePcs["6h"] - a.priceChangePcs["6h"];
    case "price24H":
      return (a: TokenData, b: TokenData) =>
        b.priceChangePcs["24h"] - a.priceChangePcs["24h"];
    case "liquidity":
      return (a: TokenData, b: TokenData) =>
        b.liquidity.current - a.liquidity.current;
    case "txns":
      return (a: TokenData, b: TokenData) =>
        b.transactions.buys +
        b.transactions.sells -
        (a.transactions.buys + a.transactions.sells);
    case "buys":
      return (a: TokenData, b: TokenData) =>
        b.transactions.buys - a.transactions.buys;
    case "sells":
      return (a: TokenData, b: TokenData) =>
        b.transactions.sells - a.transactions.sells;
    default:
      return (a: TokenData, b: TokenData) => b.volumeUsd - a.volumeUsd;
  }
}

export function useEnhancedTokenUpdates(filters: GetScannerResultParams) {
  const tokenMapRef = useRef(new Map<string, TokenData>());
  const batchMapRef = useRef(new Map<string, TokenBatch>());
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [highlightedRows, setHighlightedRows] = useState(
    new Map<string, HighlightType>(),
  );

  // Debounced batch processor
  const processBatch = useMemo(
    () =>
      debounce(() => {
        const highlightMap = new Map<string, HighlightType>();

        // Process all batched trades
        batchMapRef.current.forEach((batch, tokenId) => {
          const existing = tokenMapRef.current.get(tokenId);
          if (!existing) return;

          const priceChange = batch.finalPrice - batch.initialPrice;
          const changePercent = Math.abs(priceChange / batch.initialPrice);

          // Only highlight significant changes (>0.1%)
          if (changePercent > 0.001) {
            highlightMap.set(tokenId, priceChange > 0 ? "buy" : "sell");
          }

          // Update token data with accumulated changes
          const updatedToken: TokenData = {
            ...existing,
            priceUsd: batch.finalPrice,
            volumeUsd: existing.volumeUsd + batch.volumeAccumulated,
            transactions: {
              buys: existing.transactions.buys + batch.buysAccumulated,
              sells: existing.transactions.sells + batch.sellsAccumulated,
            },
            // Recalculate market cap with new price
            mcap: existing.mcap * (batch.finalPrice / existing.priceUsd),
          };

          tokenMapRef.current.set(tokenId, updatedToken);
        });

        // Update tokens with new sorting
        const updatedTokens = Array.from(tokenMapRef.current.values()).sort(
          getComparator(filters.rankBy),
        );

        setTokens(updatedTokens);
        setHighlightedRows(highlightMap);

        // Clear highlights after 0.125s
        setTimeout(() => {
          setHighlightedRows(new Map());
        }, 125);

        // Clear batches
        batchMapRef.current.clear();
      }, 1000),
    [filters.rankBy],
  );

  // Handle tick events from WebSocket
  const handleTickEvent = useCallback(
    (tickData: TickEventPayload) => {
      const { pair, swaps } = tickData;
      const tokenId = pair.pair;

      // Filter out outlier swaps
      const validSwaps = swaps.filter((swap) => !swap.isOutlier);

      if (validSwaps.length === 0) return; // No valid swaps

      // Get or create batch
      let batch = batchMapRef.current.get(tokenId);
      if (!batch) {
        const currentToken = tokenMapRef.current.get(tokenId);
        if (!currentToken) return; // Token not in our dataset

        batch = {
          tokenId,
          initialPrice: currentToken.priceUsd,
          finalPrice: currentToken.priceUsd,
          validTrades: [],
          startTime: Date.now(),
          volumeAccumulated: 0,
          buysAccumulated: 0,
          sellsAccumulated: 0,
        };
        batchMapRef.current.set(tokenId, batch);
      }

      // Process each valid swap
      validSwaps.forEach((swap) => {
        const swapVolumeUsd =
          parseFloat(swap.priceToken1Usd) * parseFloat(swap.amountToken1);
        batch.volumeAccumulated += swapVolumeUsd;

        // Determine if this is a buy or sell based on tokenInAddress
        // If tokenInAddress === token1Address, someone bought token1 (sell from token1 perspective)
        // If tokenInAddress !== token1Address, someone sold token1 (buy from token1 perspective)
        const isBuy = swap.tokenInAddress !== pair.token;

        if (isBuy) {
          batch.buysAccumulated += 1;
        } else {
          batch.sellsAccumulated += 1;
        }
      });

      // Update final price with latest valid swap
      const latestSwap = validSwaps[validSwaps.length - 1];
      batch.finalPrice = parseFloat(latestSwap.priceToken1Usd);

      // Add to batch trades
      batch.validTrades.push(...validSwaps);

      // Trigger debounced update
      processBatch();
    },
    [processBatch],
  );

  // Initialize tokens from TokenData directly
  const initializeTokens = useCallback(
    (tokenData: TokenData[]) => {
      const newTokenMap = new Map<string, TokenData>();

      tokenData.forEach((token) => {
        newTokenMap.set(token.id, token);
      });

      tokenMapRef.current = newTokenMap;
      const sortedTokens = Array.from(newTokenMap.values()).sort(
        getComparator(filters.rankBy),
      );
      setTokens(sortedTokens);
    },
    [filters.rankBy],
  );

  // Get current token map for external access
  const getTokenMap = useCallback(() => tokenMapRef.current, []);

  return {
    tokens,
    highlightedRows,
    handleTickEvent,
    initializeTokens,
    getTokenMap,
  };
}
