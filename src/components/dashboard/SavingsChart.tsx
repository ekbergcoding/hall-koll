"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SavingsData } from "@/lib/analytics";
import { getMonthLabel, formatSEK } from "@/lib/utils";

interface SavingsChartProps {
  data: SavingsData[];
}

export function SavingsChart({ data }: SavingsChartProps) {
  const chartData = data.map((d) => ({
    month: getMonthLabel(d.monthKey).replace(/^\w/, (c) => c.toUpperCase()),
    Sparkvot: d.savingsRate,
    Sparat: Math.round(d.saved),
  }));

  const avgRate = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d.savingsRate, 0) / data.length)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Sparkvot per månad</CardTitle>
          <span className={`text-sm font-bold ${avgRate >= 0 ? "text-green-600" : "text-red-600"}`}>
            Snitt: {avgRate}%
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${v}%`}
              domain={["auto", "auto"]}
            />
            <Tooltip
              formatter={(value: number, name: string) =>
                name === "Sparkvot" ? `${value}%` : formatSEK(value)
              }
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="Sparkvot"
              stroke="#22c55e"
              fill="url(#savingsGrad)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
