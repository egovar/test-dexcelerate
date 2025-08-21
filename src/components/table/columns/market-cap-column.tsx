import { TokenData } from "@/types/scanner";
import { formatLargeNumber } from "@/lib/data-utils";

interface MarketCapColumnProps {
  token: TokenData;
}

export function MarketCapColumn({ token }: MarketCapColumnProps) {
  return (
    <div className="text-right">
      <span className="font-medium text-xs">
        ${formatLargeNumber(token.mcap)}
      </span>
    </div>
  );
}
