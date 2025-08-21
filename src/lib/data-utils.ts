import {
  ScannerResult,
  TokenData,
  chainIdToName,
  GetScannerResultParams,
} from "@/types/scanner";

/**
 * Transform raw ScannerResult from API into TokenData for UI consumption
 */
export function transformScannerResult(result: ScannerResult): TokenData {
  // Calculate market cap using priority order from docs
  const mcap = calculateMarketCap(result);

  return {
    id: result.pairAddress, // use pair address as unique ID
    tokenName: result.token1Name,
    tokenSymbol: result.token1Symbol,
    token0Symbol: result.token0Symbol, // Added token0Symbol from API
    tokenAddress: result.token1Address,
    pairAddress: result.pairAddress,
    chain: chainIdToName(result.chainId),
    exchange: result.routerAddress, // router address as exchange identifier
    priceUsd: parseFloat(result.price),
    volumeUsd: parseFloat(result.volume),
    mcap,
    priceChangePcs: {
      "5m": parseFloat(result.diff5M),
      "1h": parseFloat(result.diff1H),
      "6h": parseFloat(result.diff6H),
      "24h": parseFloat(result.diff24H),
    },
    transactions: {
      buys: result.buys || 0,
      sells: result.sells || 0,
    },
    audit: {
      mintable: !result.isMintAuthDisabled,
      freezable: !result.isFreezeAuthDisabled,
      honeypot: result.honeyPot || false,
      contractVerified: result.contractVerified,
    },
    tokenCreatedTimestamp: new Date(result.age),
    liquidity: {
      current: parseFloat(result.liquidity),
      changePc: parseFloat(result.percentChangeInLiquidity),
    },
  };
}

/**
 * Calculate market cap using priority order from docs
 */
function calculateMarketCap(result: ScannerResult): number {
  // Priority order: currentMcap -> initialMcap -> pairMcapUsd -> pairMcapUsdInitial -> 0
  if (result.currentMcap && parseFloat(result.currentMcap) > 0) {
    return parseFloat(result.currentMcap);
  }

  if (result.initialMcap && parseFloat(result.initialMcap) > 0) {
    return parseFloat(result.initialMcap);
  }

  if (result.pairMcapUsd && parseFloat(result.pairMcapUsd) > 0) {
    return parseFloat(result.pairMcapUsd);
  }

  if (result.pairMcapUsdInitial && parseFloat(result.pairMcapUsdInitial) > 0) {
    return parseFloat(result.pairMcapUsdInitial);
  }

  return 0;
}

/**
 * Format number as currency (USD)
 */
export function formatCurrency(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`;
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

/**
 * Format percentage with color indicator
 */
export function formatPercentage(value: number): {
  formatted: string;
  isPositive: boolean;
} {
  const isPositive = value > 0;
  return {
    formatted: `${isPositive ? "+" : ""}${value.toFixed(2)}%`,
    isPositive,
  };
}

/**
 * Calculate age in human readable format
 */
export function formatAge(timestamp: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return `${diffDays}d`;
  }
  if (diffHours > 0) {
    return `${diffHours}h`;
  }
  return `${diffMinutes}m`;
}

/**
 * Format filters for WebSocket subscription
 * Currently includes only rankBy and isNotHP=true
 * TODO: Add chain support later
 */
export function formatFiltersForWebSocket(
  filters: GetScannerResultParams,
): GetScannerResultParams {
  const wsFilters: GetScannerResultParams = {
    isNotHP: true, // Always exclude honeypots for WebSocket
    chain: "SOL",
  };

  // Only include rankBy if it exists in the original filters
  if (filters.rankBy) {
    wsFilters.rankBy = filters.rankBy;
  }

  return wsFilters;
}
