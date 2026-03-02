"use client";

import React, { useMemo, useState } from "react";
import { useAppStore } from "@/hooks/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { CATEGORY_COLORS, type Category } from "@/lib/transactionModel";
import { computeCategoryBreakdown, computeCategoryMonthly, getAvailableMonths, filterByMonth } from "@/lib/analytics";
import { formatSEK, getMonthLabel } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function KategorierPage() {
  const { transactions, settings, isLoading } = useAppStore();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const months = useMemo(() => getAvailableMonths(transactions), [transactions]);
  const monthFiltered = useMemo(
    () => filterByMonth(transactions, selectedMonth),
    [transactions, selectedMonth]
  );
  const breakdown = useMemo(
    () => computeCategoryBreakdown(monthFiltered, settings.includeReserved),
    [monthFiltered, settings.includeReserved]
  );

  const grandTotal = useMemo(
    () => breakdown.reduce((sum, b) => sum + b.total, 0),
    [breakdown]
  );

  // Compute 3-month average per category for trend comparison
  const categoryAvgs = useMemo(() => {
    const monthly = computeCategoryMonthly(transactions, settings.includeReserved);
    const allMonths = getAvailableMonths(transactions);
    const recentMonths = allMonths.slice(-3);
    const avgs = new Map<string, number>();
    for (const cat of breakdown.map((b) => b.category)) {
      const catMonthly = monthly.filter(
        (m) => m.category === cat && recentMonths.includes(m.monthKey)
      );
      const total = catMonthly.reduce((s, m) => s + m.total, 0);
      avgs.set(cat, catMonthly.length > 0 ? total / recentMonths.length : 0);
    }
    return avgs;
  }, [transactions, settings.includeReserved, breakdown]);

  const pieData = breakdown.map((b) => ({
    name: b.category,
    value: Math.round(b.total),
    count: b.count,
  }));

  const barData = breakdown.map((b) => ({
    name: b.category.length > 18 ? b.category.slice(0, 16) + "…" : b.category,
    fullName: b.category,
    total: Math.round(b.total),
    count: b.count,
    fill: CATEGORY_COLORS[b.category] || "#94a3b8",
  }));

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
          <h1 className="text-2xl font-bold tracking-tight">Kategorier</h1>
          <p className="text-sm text-muted-foreground">
            Konsumtion per kategori — totalt {formatSEK(grandTotal)}
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

      {/* Donut chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fördelning</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={CATEGORY_COLORS[entry.name as Category] || "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatSEK(Number(value ?? 0))}
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bar chart */}
      {barData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jämförelse</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(300, barData.length * 40)}>
              <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => formatSEK(v)} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => formatSEK(Number(value ?? 0))}
                  labelFormatter={(label, payload) =>
                    payload?.[0]?.payload?.fullName || label
                  }
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                  {barData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Full table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detaljerad lista</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Kategori</th>
                  <th className="pb-2 pr-3 font-medium text-right">Antal</th>
                  <th className="pb-2 pr-3 font-medium text-right">Totalt</th>
                  <th className="pb-2 pr-3 font-medium text-right">Snitt/txn</th>
                  <th className="pb-2 pr-3 font-medium text-right">Andel</th>
                  <th className="pb-2 font-medium text-right">vs 3-mån snitt</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((b) => (
                  <tr key={b.category} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: CATEGORY_COLORS[b.category] || "#94a3b8" }}
                        />
                        <span className="font-medium">{b.category}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-right text-muted-foreground">{b.count} st</td>
                    <td className="py-2.5 pr-3 text-right font-mono font-medium">{formatSEK(b.total)}</td>
                    <td className="py-2.5 pr-3 text-right font-mono text-muted-foreground">
                      {formatSEK(b.count > 0 ? b.total / b.count : 0)}
                    </td>
                    <td className="py-2.5 pr-3 text-right text-muted-foreground">
                      {grandTotal > 0 ? ((b.total / grandTotal) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-2.5 text-right">
                      {(() => {
                        const avg = categoryAvgs.get(b.category) || 0;
                        if (avg === 0) return <Minus className="h-3 w-3 text-muted-foreground inline" />;
                        const monthCount = selectedMonth ? 1 : getAvailableMonths(transactions).length;
                        const currentMonthly = b.total / Math.max(monthCount, 1);
                        const diff = ((currentMonthly - avg) / avg) * 100;
                        if (Math.abs(diff) < 5) return <span className="text-xs text-muted-foreground">~0%</span>;
                        return diff > 0 ? (
                          <span className="text-xs text-red-600 flex items-center justify-end gap-0.5">
                            <TrendingUp className="h-3 w-3" />+{Math.round(diff)}%
                          </span>
                        ) : (
                          <span className="text-xs text-green-600 flex items-center justify-end gap-0.5">
                            <TrendingDown className="h-3 w-3" />{Math.round(diff)}%
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
                {breakdown.length > 0 && (
                  <tr className="font-medium">
                    <td className="py-2.5 pr-3">Totalt</td>
                    <td className="py-2.5 pr-3 text-right text-muted-foreground">
                      {breakdown.reduce((s, b) => s + b.count, 0)} st
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono">{formatSEK(grandTotal)}</td>
                    <td className="py-2.5 pr-3 text-right" />
                    <td className="py-2.5 pr-3 text-right">100%</td>
                    <td className="py-2.5 text-right" />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {breakdown.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Inga kategorier att visa.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
