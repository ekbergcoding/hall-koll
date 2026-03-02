"use client";

import React, { useMemo, useState } from "react";
import { useAppStore } from "@/hooks/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CATEGORY_COLORS, type Category } from "@/lib/transactionModel";
import { computeTopMerchants, getAvailableMonths, filterByMonth } from "@/lib/analytics";
import { formatSEK, getMonthLabel } from "@/lib/utils";
import { Search } from "lucide-react";

export default function HandlarePage() {
  const { transactions, isLoading } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const months = useMemo(() => getAvailableMonths(transactions), [transactions]);
  const monthFiltered = useMemo(
    () => filterByMonth(transactions, selectedMonth),
    [transactions, selectedMonth]
  );
  const allMerchants = useMemo(
    () => computeTopMerchants(monthFiltered, 999),
    [monthFiltered]
  );
  const merchants = useMemo(() => {
    if (!search.trim()) return allMerchants;
    const q = search.toLowerCase();
    return allMerchants.filter((m) => m.merchantKey.toLowerCase().includes(q));
  }, [allMerchants, search]);

  const grandTotal = useMemo(
    () => allMerchants.reduce((sum, m) => sum + m.total, 0),
    [allMerchants]
  );
  const maxTotal = merchants.length > 0 ? merchants[0].total : 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Handlare</h1>
          <p className="text-sm text-muted-foreground">
            {allMerchants.length} handlare — totalt {formatSEK(grandTotal)}
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

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Alla handlare ({merchants.length})</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sök handlare..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {merchants.map((m, idx) => (
              <div key={m.merchantKey} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground w-6 shrink-0 text-right">{idx + 1}.</span>
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[m.category] || "#94a3b8" }}
                    />
                    <span className="font-medium truncate">{m.merchantKey}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0 ml-3">
                    <span className="hidden sm:inline">{m.category}</span>
                    <span>{m.count} st</span>
                    <span className="font-mono font-medium text-foreground w-20 text-right">{formatSEK(m.total)}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-muted ml-9">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(m.total / maxTotal) * 100}%`,
                      backgroundColor: CATEGORY_COLORS[m.category] || "#94a3b8",
                    }}
                  />
                </div>
              </div>
            ))}
            {merchants.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Inga handlare att visa.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
