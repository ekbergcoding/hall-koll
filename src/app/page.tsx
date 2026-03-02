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
import { computeMonthlyStats, computeCategoryBreakdown, computeTopMerchants, getAvailableMonths, filterByMonth } from "@/lib/analytics";
import { getMonthLabel } from "@/lib/utils";

export default function DashboardPage() {
  const { transactions, settings, isLoading } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const months = useMemo(() => getAvailableMonths(transactions), [transactions]);
  const monthFiltered = useMemo(
    () => filterByMonth(transactions, selectedMonth),
    [transactions, selectedMonth]
  );
  const monthlyStats = useMemo(
    () => computeMonthlyStats(transactions, settings.includeReserved),
    [transactions, settings.includeReserved]
  );
  const categoryBreakdown = useMemo(
    () => computeCategoryBreakdown(monthFiltered, settings.includeReserved),
    [monthFiltered, settings.includeReserved]
  );
  const topMerchants = useMemo(
    () => computeTopMerchants(monthFiltered),
    [monthFiltered]
  );

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

      {/* Upload area */}
      {transactions.length === 0 && <FileUpload />}

      {/* KPIs */}
      <KPICards transactions={monthFiltered} includeReserved={settings.includeReserved} />

      {/* Charts */}
      {monthlyStats.length > 0 && <MonthlyChart stats={monthlyStats} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryDonut breakdown={categoryBreakdown} />
        <TopMerchants merchants={topMerchants} />
      </div>

      {/* Transactions */}
      <TransactionTable transactions={monthFiltered} />
    </div>
  );
}
