"use client";

import { useState, useCallback } from "react";
import {
  TabType,
  GetScannerResultParams,
  TRENDING_TOKENS_FILTERS,
  NEW_TOKENS_FILTERS,
} from "@/types/scanner";
import { EnhancedTableTabs } from "./enhanced-table-tabs";

export function ScannerDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("trending");
  const [currentFilters, setCurrentFilters] = useState<GetScannerResultParams>(
    TRENDING_TOKENS_FILTERS,
  );

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);

    // Update filters when tab changes - tabs are just filter presets
    const newFilters =
      tab === "trending" ? TRENDING_TOKENS_FILTERS : NEW_TOKENS_FILTERS;
    setCurrentFilters(newFilters);
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Token Scanner</h1>
        <p className="text-muted-foreground">
          Real-time cryptocurrency token data with live updates
        </p>
      </div>

      <EnhancedTableTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        currentFilters={currentFilters}
      />
    </div>
  );
}
