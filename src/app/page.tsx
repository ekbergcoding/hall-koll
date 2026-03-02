"use client";

import React, { useMemo, useState } from "react";
import { useAppStore } from "@/hooks/useAppStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KPICards } from "@/components/dashboard/KPICards";
import { MonthlyChart } from "@/components/dashboard/MonthlyChart";
import { CategoryDonut } from "@/components/dashboard/CategoryDonut";
import { TopMerchants } from "@/components/dashboard/TopMerchants";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { FileUpload } from "@/components/import/FileUpload";
import { computeMonthlyStats, computeCategoryBreakdown, computeTopMerchants, computeSavingsRate, getAvailableMonths, filterByMonth } from "@/lib/analytics";
import { SavingsChart } from "@/components/dashboard/SavingsChart";
import { getMonthLabel } from "@/lib/utils";
import { CATEGORIES, CATEGORY_COLORS, type Category } from "@/lib/transactionModel";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { transactions, settings, isLoading } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(new Set());

  const months = useMemo(() => getAvailableMonths(transactions), [transactions]);
  const monthFiltered = useMemo(
    () => filterByMonth(transactions, selectedMonth),
    [transactions, selectedMonth]
  );
  const filtered = useMemo(
    () => selectedCategories.size === 0
      ? monthFiltered
      : monthFiltered.filter((t) => selectedCategories.has(t.category)),
    [monthFiltered, selectedCategories]
  );

  function toggleCategory(cat: Category) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }
  const monthlyStats = useMemo(
    () => computeMonthlyStats(transactions, settings.includeReserved),
    [transactions, settings.includeReserved]
  );
  const categoryBreakdown = useMemo(
    () => computeCategoryBreakdown(filtered, settings.includeReserved),
    [filtered, settings.includeReserved]
  );
  const topMerchants = useMemo(
    () => computeTopMerchants(filtered),
    [filtered]
  );

  const categoriesInUse = useMemo(() => {
    const cats = new Set(monthFiltered.map((t) => t.category));
    return CATEGORIES.filter((c) => cats.has(c));
  }, [monthFiltered]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Laddar data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Överblick av din ekonomi — {transactions.length} transaktioner
          </p>
        </div>
        <Select
          value={selectedMonth || "all"}
          onValueChange={(v) => setSelectedMonth(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Välj månad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla månader</SelectItem>
            {months.map((m) => (
              <SelectItem key={m} value={m}>
                {getMonthLabel(m).replace(/^\w/, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category filter */}
      {categoriesInUse.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {categoriesInUse.map((cat) => {
            const active = selectedCategories.size === 0 || selectedCategories.has(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "bg-background border-border text-foreground"
                    : "bg-muted/40 border-transparent text-muted-foreground opacity-50"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                />
                {cat}
              </button>
            );
          })}
          {selectedCategories.size > 0 && (
            <button
              onClick={() => setSelectedCategories(new Set())}
              className="inline-flex items-center rounded-full border border-dashed px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Visa alla
            </button>
          )}
        </div>
      )}

      {/* Upload area */}
      {transactions.length === 0 && <FileUpload />}

      {/* KPIs */}
      <KPICards transactions={filtered} includeReserved={settings.includeReserved} />

      {/* Charts */}
      {monthlyStats.length > 0 && <MonthlyChart stats={monthlyStats} />}

      {/* Savings rate */}
      {(() => {
        const savingsData = computeSavingsRate(monthlyStats);
        return savingsData.length > 1 ? <SavingsChart data={savingsData} /> : null;
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryDonut breakdown={categoryBreakdown} />
        <TopMerchants merchants={topMerchants} />
      </div>

      {/* Transactions */}
      <TransactionTable transactions={filtered} />
    </div>
  );
}
