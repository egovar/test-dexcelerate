import { TokenData } from "@/types/scanner";
import { formatAge } from "@/lib/data-utils";

interface AgeColumnProps {
  token: TokenData;
}

export function AgeColumn({ token }: AgeColumnProps) {
  return (
    <div className="text-right">
      <span className="font-medium text-xs">
        {formatAge(token.tokenCreatedTimestamp)}
      </span>
    </div>
  );
}
