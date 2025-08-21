import { TokenData } from "@/types/scanner";
import { formatLargeNumber, formatPercentage } from "@/lib/data-utils";

interface LiquidityColumnProps {
  token: TokenData;
}

export function LiquidityColumn({ token }: LiquidityColumnProps) {
  const { formatted: changePc, isPositive } = formatPercentage(
    token.liquidity.changePc,
  );

  return (
    <div className="text-right">
      <div className="flex flex-col gap-1">
        <span className="font-medium text-xs">
          ${formatLargeNumber(token.liquidity.current)}
        </span>
        <span
          className={`text-xs ${
            isPositive ? "text-green-500" : "text-red-500"
          }`}
        >
          {changePc}
        </span>
      </div>
    </div>
  );
}
