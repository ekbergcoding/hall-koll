"use client";

import React, { useMemo, useState } from "react";
import { useAppStore } from "@/hooks/useAppStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { computeMonthlyStats, computeCategoryBreakdown, computeTopMerchants, computeSavingsRate } from "@/lib/analytics";
import { CATEGORY_COLORS, type Category } from "@/lib/transactionModel";
import { formatSEK, getMonthLabel } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, BarChart3, ArrowUpDown } from "lucide-react";

export default function YearlySummaryPage() {
  const { transactions, settings, isLoading } = useAppStore();

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    for (const t of transactions) {
      if (t.monthKey !== "reserverat") years.add(t.monthKey.slice(0, 4));
    }
    return Array.from(years).sort().reverse();
  }, [transactions]);

  const [selectedYear, setSelectedYear] = useState<string>(
    availableYears[0] || new Date().getFullYear().toString()
  );

  const yearTransactions = useMemo(
    () => transactions.filter((t) => t.monthKey.startsWith(selectedYear)),
    [transactions, selectedYear]
  );

  const stats = useMemo(
    () => computeMonthlyStats(yearTransactions, settings.includeReserved),
    [yearTransactions, settings.includeReserved]
  );

  const savingsData = useMemo(() => computeSavingsRate(stats), [stats]);

  const categoryBreakdown = useMemo(
    () => computeCategoryBreakdown(yearTransactions, settings.includeReserved),
    [yearTransactions, settings.includeReserved]
  );

  const topMerchants = useMemo(
    () => computeTopMerchants(yearTransactions, 15),
    [yearTransactions]
  );

  const totalIncome = stats.reduce((s, m) => s + m.income, 0);
  const totalConsumption = stats.reduce((s, m) => s + m.consumption, 0);
  const totalDebt = stats.reduce((s, m) => s + m.debtPayments, 0);
  const totalTransfers = stats.reduce((s, m) => s + m.transfers, 0);
  const totalNet = stats.reduce((s, m) => s + m.netCashflow, 0);
  const avgSavingsRate = savingsData.length > 0
    ? Math.round(savingsData.reduce((s, d) => s + d.savingsRate, 0) / savingsData.length)
    : 0;

  const monthlyChartData = stats.map((s) => ({
    month: getMonthLabel(s.monthKey).split(" ")[0].slice(0, 3),
    Inkomst: Math.round(s.income),
    Konsumtion: Math.round(s.consumption),
    Netto: Math.round(s.netCashflow),
  }));

  // Heatmap data: spending intensity by month
  const maxConsumption = Math.max(...stats.map((s) => s.consumption), 1);

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
          <h1 className="text-2xl font-bold tracking-tight">Årssammanfattning</h1>
          <p className="text-sm text-muted-foreground">
            Översikt för {selectedYear} — {yearTransactions.length} transaktioner
          </p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Annual KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total inkomst", value: totalIncome, icon: TrendingUp, color: "text-green-600" },
          { label: "Total konsumtion", value: -totalConsumption, icon: TrendingDown, color: "text-red-600" },
          { label: "Skuldbetalningar", value: -totalDebt, icon: ArrowUpDown, color: "text-amber-600" },
          { label: "Nettokassaflöde", value: totalNet, icon: Wallet, color: totalNet >= 0 ? "text-green-600" : "text-red-600" },
          { label: "Sparkvot (snitt)", value: avgSavingsRate, icon: PiggyBank, color: avgSavingsRate >= 0 ? "text-green-600" : "text-red-600", isPercent: true },
          { label: "Transaktioner", value: yearTransactions.length, icon: BarChart3, color: "text-foreground", isCount: true },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                <span className="text-[10px] text-muted-foreground">{kpi.label}</span>
              </div>
              <p className={`text-lg font-bold ${kpi.color}`}>
                {(kpi as any).isPercent ? `${kpi.value}%` : (kpi as any).isCount ? kpi.value : formatSEK(kpi.value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly spending heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Konsumtion per månad</CardTitle>
          <CardDescription>Intensitet visar hur mycket du spenderat relativt till årets max</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
            {Array.from({ length: 12 }, (_, i) => {
              const monthKey = `${selectedYear}-${String(i + 1).padStart(2, "0")}`;
              const stat = stats.find((s) => s.monthKey === monthKey);
              const intensity = stat ? stat.consumption / maxConsumption : 0;
              const monthNames = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
              return (
                <div key={monthKey} className="text-center">
                  <div
                    className="aspect-square rounded-lg flex items-center justify-center text-[10px] font-mono font-medium mb-1"
                    style={{
                      backgroundColor: stat
                        ? `rgba(239, 68, 68, ${0.1 + intensity * 0.7})`
                        : "hsl(var(--muted))",
                      color: intensity > 0.5 ? "white" : "hsl(var(--foreground))",
                    }}
                  >
                    {stat ? `${(stat.consumption / 1000).toFixed(0)}k` : "—"}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{monthNames[i]}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Monthly bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inkomst vs konsumtion per månad</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => formatSEK(Number(value ?? 0))}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="Inkomst" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Konsumtion" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category breakdown and top merchants side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Topp kategorier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {categoryBreakdown.slice(0, 10).map((b) => {
                const pct = totalConsumption > 0 ? (b.total / totalConsumption) * 100 : 0;
                return (
                  <div key={b.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[b.category] }}
                        />
                        <span className="font-medium">{b.category}</span>
                      </div>
                      <span className="font-mono text-xs">{formatSEK(b.total)} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: CATEGORY_COLORS[b.category],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Topp handlare</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topMerchants.map((m, idx) => (
                <div key={m.merchantKey} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{idx + 1}.</span>
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[m.category] || "#94a3b8" }}
                    />
                    <span className="truncate">{m.merchantKey}</span>
                  </div>
                  <span className="font-mono text-xs shrink-0 ml-2">{formatSEK(m.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
