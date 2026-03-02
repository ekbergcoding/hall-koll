"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoryBreakdown } from "@/lib/analytics";
import { CATEGORY_COLORS } from "@/lib/transactionModel";
import { formatSEK } from "@/lib/utils";

interface CategoryDonutProps {
  breakdown: CategoryBreakdown[];
}

export function CategoryDonut({ breakdown }: CategoryDonutProps) {
  const data = breakdown.map((b) => ({
    name: b.category,
    value: Math.round(b.total),
    count: b.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Konsumtion per kategori</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] || "#94a3b8"}
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
          <div className="flex flex-col gap-1.5 min-w-[180px]">
            {data.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs">
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] || "#94a3b8",
                  }}
                />
                <span className="truncate flex-1">{entry.name}</span>
                <span className="font-mono text-muted-foreground">{formatSEK(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
