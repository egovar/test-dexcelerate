"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useEffect } from "react";
import { TokenData } from "@/types/scanner";
import { TokenRow } from "./token-row";
import { HighlightType } from "@/hooks/use-enhanced-token-updates";

interface TokenTableProps {
  tokens: TokenData[];
  isLoading: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
  highlightedRows?: Map<string, HighlightType>;
}

export function TokenTable({
  tokens,
  isLoading,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  highlightedRows = new Map(),
}: TokenTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tokens.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Row height estimate
    overscan: 5, // Render 5 extra items for smooth scrolling
  });

  // Infinite scroll: fetch next page when scrolled near the end
  useEffect(() => {
    const [lastItem] = [...virtualizer.getVirtualItems()].reverse();

    if (!lastItem) {
      return;
    }

    if (
      lastItem.index >= tokens.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage?.();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    tokens.length,
    isFetchingNextPage,
    virtualizer.getVirtualItems(),
  ]);

  if (isLoading && tokens.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center text-muted-foreground">
          Loading token data...
        </div>
      </div>
    );
  }

  if (!isLoading && tokens.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center text-muted-foreground">
          No tokens found
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      {/* Grid Header - matches row grid exactly */}
      <div className="border-b bg-muted/50 p-4">
        <div className="grid grid-cols-24 gap-4 text-xs font-medium text-muted-foreground">
          <div className="col-span-3 text-left">Token</div>
          <div className="col-span-3 text-right">Price</div>
          <div className="col-span-2 text-right">Age</div>
          <div className="col-span-2 text-right">Volume</div>
          <div className="col-span-3 text-right">Transactions</div>
          <div className="col-span-2 text-right">Market Cap</div>
          <div className="col-span-2 text-right">Liquidity</div>
          <div className="col-span-7 text-center">Price Change</div>
        </div>
      </div>

      {/* Virtualized Table Body */}
      <div ref={parentRef} className="h-[600px] overflow-auto">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const token = tokens[virtualItem.index];
            const highlight = highlightedRows.get(token.id);

            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <TokenRow token={token} highlight={highlight} />
              </div>
            );
          })}
        </div>

        {/* Loading indicator for next page */}
        {isFetchingNextPage && (
          <div className="p-4 text-center text-muted-foreground">
            Loading more tokens...
          </div>
        )}
      </div>
    </div>
  );
}
