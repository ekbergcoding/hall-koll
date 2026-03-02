"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthlyStats } from "@/lib/analytics";
import { getMonthLabel, formatSEK } from "@/lib/utils";

interface MonthlyChartProps {
  stats: MonthlyStats[];
}

export function MonthlyChart({ stats }: MonthlyChartProps) {
  const data = stats.map((s) => ({
    month: getMonthLabel(s.monthKey).replace(/^\w/, (c) => c.toUpperCase()),
    Inkomst: Math.round(s.income),
    Konsumtion: Math.round(s.consumption),
    Skuldbetalningar: Math.round(s.debtPayments),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Månadsöversikt</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
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
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Line type="monotone" dataKey="Inkomst" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="Konsumtion" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="Skuldbetalningar" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
