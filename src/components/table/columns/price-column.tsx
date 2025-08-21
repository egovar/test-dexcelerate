import { TokenData } from "@/types/scanner";
import { formatCurrency } from "@/lib/data-utils";

interface PriceColumnProps {
  token: TokenData;
}

export function PriceColumn({ token }: PriceColumnProps) {
  return (
    <div className="text-right">
      <span className="font-medium text-xs">
        {formatCurrency(token.priceUsd, 6)}
      </span>
    </div>
  );
}
