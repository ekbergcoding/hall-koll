"use client";

import React, { useMemo } from "react";
import { useAppStore } from "@/hooks/useAppStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { computeMonthlyStats } from "@/lib/analytics";
import { formatSEK, getMonthKey, getMonthLabel } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Target, TrendingUp, Calendar, AlertTriangle } from "lucide-react";

export default function PrognosPage() {
  const { transactions, settings, updateSettings, isLoading } = useAppStore();

  const stats = useMemo(
    () => computeMonthlyStats(transactions, settings.includeReserved),
    [transactions, settings.includeReserved]
  );

  const currentMonthKey = getMonthKey(new Date());
  const currentMonthStats = stats.find((s) => s.monthKey === currentMonthKey);

  // Estimate monthly averages from previous months
  const previousStats = stats.filter((s) => s.monthKey < currentMonthKey);
  const avgIncome = previousStats.length > 0
    ? previousStats.reduce((s, m) => s + m.income, 0) / previousStats.length
    : 0;
  const avgConsumption = previousStats.length > 0
    ? previousStats.reduce((s, m) => s + m.consumption, 0) / previousStats.length
    : 0;
  const avgDebt = previousStats.length > 0
    ? previousStats.reduce((s, m) => s + m.debtPayments, 0) / previousStats.length
    : 0;

  // This month pace
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const spentSoFar = currentMonthStats?.consumption || 0;
  const projectedSpend = dayOfMonth > 0 ? (spentSoFar / dayOfMonth) * daysInMonth : 0;
  const budgetProgress = settings.monthlyBudget > 0 ? (spentSoFar / settings.monthlyBudget) * 100 : 0;

  // Runway
  const monthlyNetBurn = avgConsumption + avgDebt - avgIncome;
  const runwayMonths = monthlyNetBurn > 0 && settings.cashBuffer > 0
    ? Math.floor(settings.cashBuffer / monthlyNetBurn)
    : monthlyNetBurn <= 0
      ? Infinity
      : 0;

  // Forecast chart data
  const forecastData = useMemo(() => {
    const data = stats.map((s) => ({
      month: getMonthLabel(s.monthKey).replace(/^\w/, (c) => c.toUpperCase()),
      Konsumtion: Math.round(s.consumption),
      Budget: settings.monthlyBudget,
      isForecast: false,
    }));

    // Add 3 forecast months
    const lastDate = new Date();
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date(lastDate.getFullYear(), lastDate.getMonth() + i, 1);
      const label = getMonthLabel(getMonthKey(futureDate)).replace(/^\w/, (c) => c.toUpperCase());
      data.push({
        month: label,
        Konsumtion: Math.round(avgConsumption),
        Budget: settings.monthlyBudget,
        isForecast: true,
      });
    }

    return data;
  }, [stats, settings.monthlyBudget, avgConsumption]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Prognos</h1>
        <p className="text-sm text-muted-foreground">
          Budget, prognoser och kassaflödesanalys
        </p>
      </div>

      {/* Budget inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label className="text-xs text-muted-foreground">Månadsbudget (konsumtion)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={settings.monthlyBudget}
                onChange={(e) => updateSettings({ monthlyBudget: parseFloat(e.target.value) || 0 })}
                className="font-mono"
              />
              <span className="text-sm text-muted-foreground">SEK</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label className="text-xs text-muted-foreground">Kassabuffert (sparat)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={settings.cashBuffer}
                onChange={(e) => updateSettings({ cashBuffer: parseFloat(e.target.value) || 0 })}
                className="font-mono"
              />
              <span className="text-sm text-muted-foreground">SEK</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* This month */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Denna månad — {getMonthLabel(currentMonthKey).replace(/^\w/, (c) => c.toUpperCase())}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Spenderat hittills</p>
              <p className="text-xl font-bold">{formatSEK(spentSoFar)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Projicerat totalspend</p>
              <p className={`text-xl font-bold ${projectedSpend > settings.monthlyBudget ? "text-destructive" : "text-green-600"}`}>
                {formatSEK(projectedSpend)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Budget</p>
              <p className="text-xl font-bold">{formatSEK(settings.monthlyBudget)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Budgetförbrukning</span>
              <span className={budgetProgress > 100 ? "text-destructive font-medium" : ""}>
                {Math.round(budgetProgress)}%
              </span>
            </div>
            <Progress value={Math.min(budgetProgress, 100)} className="h-2.5" />
            <p className="text-xs text-muted-foreground">
              Dag {dayOfMonth} av {daysInMonth} ({Math.round((dayOfMonth / daysInMonth) * 100)}% av månaden)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Averages */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <p className="text-xs text-muted-foreground">Snittinkomst / månad</p>
            </div>
            <p className="text-lg font-bold text-green-600">{formatSEK(avgIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
              <p className="text-xs text-muted-foreground">Snittkonsumtion / månad</p>
            </div>
            <p className="text-lg font-bold text-red-600">{formatSEK(avgConsumption)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-amber-600" />
              <p className="text-xs text-muted-foreground">Snitt skuldbetalning / månad</p>
            </div>
            <p className="text-lg font-bold text-amber-600">{formatSEK(avgDebt)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Runway */}
      {settings.cashBuffer > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Runway (med nuvarande burn rate)</p>
                <p className="text-2xl font-bold">
                  {runwayMonths === Infinity ? (
                    <span className="text-green-600">Positivt kassaflöde</span>
                  ) : runwayMonths > 0 ? (
                    <span>{runwayMonths} månader</span>
                  ) : (
                    <span className="text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-5 w-5" /> Ej hållbart
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground space-y-1">
                <p>Buffert: {formatSEK(settings.cashBuffer)}</p>
                <p>Nettoutflöde: {formatSEK(Math.max(monthlyNetBurn, 0))}/mån</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forecast chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Konsumtion vs budget</CardTitle>
          <CardDescription>Faktiska månader + 3 månaders prognos baserad på snitt</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => formatSEK(Number(value ?? 0))}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="Konsumtion" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.85} />
              <ReferenceLine y={settings.monthlyBudget} stroke="#22c55e" strokeDasharray="5 5" label={{ value: "Budget", position: "top", fontSize: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
