"use client";

import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, type Category, CATEGORY_COLORS } from "@/lib/transactionModel";

interface CategorySelectorProps {
  value: Category;
  onChange: (category: Category) => void;
  size?: "sm" | "default";
}

export function CategorySelector({ value, onChange, size = "default" }: CategorySelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Category)}>
      <SelectTrigger className={size === "sm" ? "h-7 text-xs w-auto min-w-[140px]" : ""}>
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: CATEGORY_COLORS[value] || "#94a3b8" }}
          />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {CATEGORIES.map((cat) => (
          <SelectItem key={cat} value={cat}>
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[cat] || "#94a3b8" }}
              />
              {cat}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
