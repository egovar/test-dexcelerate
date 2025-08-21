import { TokenData } from "@/types/scanner";

interface TransactionsColumnProps {
  token: TokenData;
}

export function TransactionsColumn({ token }: TransactionsColumnProps) {
  const totalTransactions = token.transactions.buys + token.transactions.sells;

  return (
    <div className="text-right">
      <div className="flex flex-col gap-1">
        {/* First row: total transactions */}
        <div className="font-medium text-xs">
          {totalTransactions.toLocaleString()}
        </div>

        {/* Second row: buys (green) / sells (red) */}
        <div className="text-xs">
          <span className="text-green-500 font-medium">
            {token.transactions.buys}
          </span>
          <span className="text-muted-foreground mx-1">/</span>
          <span className="text-red-500 font-medium">
            {token.transactions.sells}
          </span>
        </div>
      </div>
    </div>
  );
}
