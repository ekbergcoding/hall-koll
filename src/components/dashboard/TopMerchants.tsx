"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MerchantRank } from "@/lib/analytics";
import { CATEGORY_COLORS } from "@/lib/transactionModel";
import { formatSEK } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface TopMerchantsProps {
  merchants: MerchantRank[];
}

export function TopMerchants({ merchants }: TopMerchantsProps) {
  const maxTotal = merchants.length > 0 ? merchants[0].total : 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Topp handlare</CardTitle>
          <Link href="/handlare" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            Visa alla <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {merchants.map((m, idx) => (
            <div key={m.merchantKey} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                  <span className="font-medium truncate">{m.merchantKey}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{m.count} st</span>
                  <span className="font-mono font-medium text-foreground">{formatSEK(m.total)}</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted ml-7">
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
            <p className="text-sm text-muted-foreground text-center py-4">
              Inga transaktioner att visa.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
