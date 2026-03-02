"use client";

import React, { useMemo, useState } from "react";
import { useAppStore } from "@/hooks/useAppStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { FileUpload } from "@/components/import/FileUpload";
import { getAvailableMonths, filterByMonth } from "@/lib/analytics";
import { getMonthLabel } from "@/lib/utils";

export default function TransaktionerPage() {
  const { transactions, isLoading } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const months = useMemo(() => getAvailableMonths(transactions), [transactions]);
  const monthFiltered = useMemo(
    () => filterByMonth(transactions, selectedMonth),
    [transactions, selectedMonth]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transaktioner</h1>
          <p className="text-sm text-muted-foreground">
            Hantera, filtrera och klassificera dina transaktioner
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

      <FileUpload />

      <TransactionTable transactions={monthFiltered} />
    </div>
  );
}
