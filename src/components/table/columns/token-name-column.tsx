import { TokenData } from "@/types/scanner";

interface TokenNameColumnProps {
  token: TokenData;
}

const CHAIN_COLORS = {
  ETH: "bg-blue-500",
  SOL: "bg-purple-500",
  BASE: "bg-blue-600",
  BSC: "bg-yellow-500",
} as const;

export function TokenNameColumn({ token }: TokenNameColumnProps) {
  return (
    <div className="text-left">
      <div className="flex flex-col gap-1">
        {/* First row: token1Symbol/token0Symbol */}
        <div className="font-medium text-xs">
          {token.tokenSymbol}{" "}
          <span className="text-gray-500">/ {token.token0Symbol}</span>
        </div>

        {/* Second row: token1Name and chain badge */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs truncate max-w-24">
            {token.tokenName}
          </span>
          <span
            className={`
              ${CHAIN_COLORS[token.chain]} 
              text-white text-xs px-1 py-0.5 rounded font-medium
            `}
          >
            {token.chain}
          </span>
        </div>
      </div>
    </div>
  );
}
