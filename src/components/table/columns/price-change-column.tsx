import { TokenData } from "@/types/scanner";
import { formatPercentage } from "@/lib/data-utils";

interface PriceChangeColumnProps {
  token: TokenData;
}

function getChangeColor(value: number): string {
  if (value === 0) return "text-gray-500";
  return value > 0 ? "text-green-500" : "text-red-500";
}

export function PriceChangeColumn({ token }: PriceChangeColumnProps) {
  const changes = [
    { label: "5m", value: token.priceChangePcs["5m"] || 0 },
    { label: "1h", value: token.priceChangePcs["1h"] || 0 },
    { label: "6h", value: token.priceChangePcs["6h"] || 0 },
    { label: "24h", value: token.priceChangePcs["24h"] || 0 },
  ];

  return (
    <div className="text-right">
      <div className="flex flex-col gap-1">
        {/* Top row: timeframe labels */}
        <div className="grid grid-cols-4 gap-1 text-xs text-muted-foreground">
          {changes.map(({ label }) => (
            <div key={label} className="text-center">
              {label}
            </div>
          ))}
        </div>

        {/* Bottom row: percentage values with colors */}
        <div className="grid grid-cols-4 gap-1 text-xs font-medium">
          {changes.map(({ label, value }) => {
            const { formatted } = formatPercentage(value);
            return (
              <div
                key={label}
                className={`text-center ${getChangeColor(value)}`}
              >
                {formatted}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
