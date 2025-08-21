import { useInfiniteQuery } from "@tanstack/react-query";
import { getScannerResults } from "@/lib/api";
import { transformScannerResult } from "@/lib/data-utils";
import { GetScannerResultParams, TokenData } from "@/types/scanner";

/**
 * Hook to fetch scanner data with infinite scroll using raw filters
 */
export function useScannerData(
  baseFilters: GetScannerResultParams,
  additionalFilters: Partial<GetScannerResultParams> = {},
) {
  // Combine base filters with additional filters (excluding page)
  const filters: Omit<GetScannerResultParams, "page"> = {
    ...baseFilters,
    ...additionalFilters,
  };

  return useInfiniteQuery({
    queryKey: ["scanner", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await getScannerResults({
        ...filters,
        page: pageParam,
      });

      // Transform raw API data to UI format
      const tokens = response.pairs.map(transformScannerResult);

      return {
        tokens,
        totalRows: response.totalRows,
        currentPage: pageParam,
        hasNextPage: pageParam * 100 < response.totalRows,
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 30, // Consider data fresh for 30 seconds
  });
}

/**
 * Hook to get available filters for the UI
 */
export function useFilterOptions() {
  return {
    chains: ["SOL", "ETH", "BASE", "BSC"] as const,
    volumeRanges: [
      { label: "Any", value: null },
      { label: "$1K+", value: 1000 },
      { label: "$10K+", value: 10000 },
      { label: "$100K+", value: 100000 },
    ],
    ageRanges: [
      { label: "Any", value: null },
      { label: "1 hour", value: 60 * 60 },
      { label: "6 hours", value: 6 * 60 * 60 },
      { label: "24 hours", value: 24 * 60 * 60 },
      { label: "7 days", value: 7 * 24 * 60 * 60 },
    ],
  };
}
