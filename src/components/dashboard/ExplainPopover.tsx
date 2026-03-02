"use client";

import React from "react";
import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatSEK } from "@/lib/utils";
import type { Transaction, Category } from "@/lib/transactionModel";

interface ExplainPopoverProps {
  title: string;
  includedCategories: Category[];
  excludedCategories?: Category[];
  topTransactions: Transaction[];
  total: number;
}

export function ExplainPopover({
  title,
  includedCategories,
  excludedCategories,
  topTransactions,
  total,
}: ExplainPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm">{title}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Totalt: {formatSEK(total)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Inkluderar:</p>
            <div className="flex flex-wrap gap-1">
              {includedCategories.map((c) => (
                <span key={c} className="inline-block rounded bg-secondary px-1.5 py-0.5 text-[10px]">
                  {c}
                </span>
              ))}
            </div>
          </div>

          {excludedCategories && excludedCategories.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Exkluderar:</p>
              <div className="flex flex-wrap gap-1">
                {excludedCategories.map((c) => (
                  <span key={c} className="inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] line-through">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {topTransactions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Topp {Math.min(topTransactions.length, 10)} transaktioner:
              </p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {topTransactions.slice(0, 10).map((t) => (
                  <div key={t.id} className="flex justify-between text-xs">
                    <span className="truncate mr-2">{t.rubrik}</span>
                    <span className="font-mono shrink-0">{formatSEK(Math.abs(t.amount))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
