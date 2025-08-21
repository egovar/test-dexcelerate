import { TokenData } from "@/types/scanner";
import { formatLargeNumber } from "@/lib/data-utils";

interface VolumeColumnProps {
  token: TokenData;
}

export function VolumeColumn({ token }: VolumeColumnProps) {
  return (
    <div className="text-right">
      <span className="font-medium text-xs">
        ${formatLargeNumber(token.volumeUsd)}
      </span>
    </div>
  );
}
