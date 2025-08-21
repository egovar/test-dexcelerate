import { useMemo } from "react";
import { TokenData } from "@/types/scanner";
import { TokenNameColumn } from "./columns/token-name-column";
import { PriceColumn } from "./columns/price-column";
import { MarketCapColumn } from "./columns/market-cap-column";
import { VolumeColumn } from "./columns/volume-column";
import { PriceChangeColumn } from "./columns/price-change-column";
import { AgeColumn } from "./columns/age-column";
import { TransactionsColumn } from "./columns/transactions-column";
import { LiquidityColumn } from "./columns/liquidity-column";
import { HighlightType } from "@/hooks/use-enhanced-token-updates";

interface TokenRowProps {
  token: TokenData;
  highlight?: HighlightType | null;
}

export function TokenRow({ token, highlight }: TokenRowProps) {
  const highlightClass = useMemo(() => {
    if (!highlight) return "";
    return highlight === "buy"
      ? "animate-highlight-buy"
      : "animate-highlight-sell";
  }, [highlight]);

  return (
    <div
      className={`
      grid grid-cols-24 gap-4 p-4 border-b border-border 
      hover:bg-muted/50 transition-colors items-center min-h-[80px]
      ${highlightClass}
    `.trim()}
    >
      <div className="col-span-3">
        <TokenNameColumn token={token} />
      </div>

      <div className="col-span-3">
        <PriceColumn token={token} />
      </div>

      <div className="col-span-2">
        <AgeColumn token={token} />
      </div>

      <div className="col-span-2">
        <VolumeColumn token={token} />
      </div>

      <div className="col-span-3">
        <TransactionsColumn token={token} />
      </div>

      <div className="col-span-2">
        <MarketCapColumn token={token} />
      </div>

      <div className="col-span-2">
        <LiquidityColumn token={token} />
      </div>

      <div className="col-span-7">
        <PriceChangeColumn token={token} />
      </div>
    </div>
  );
}
