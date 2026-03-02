"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { CategorySelector } from "./CategorySelector";
import { formatSEKExact, formatDate } from "@/lib/utils";
import { CATEGORIES, CATEGORY_COLORS, type Transaction, type Category } from "@/lib/transactionModel";
import { useAppStore } from "@/hooks/useAppStore";
import { Copy, Search, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";

interface TransactionTableProps {
  transactions: Transaction[];
  compact?: boolean;
}

const PAGE_SIZE = 20;

interface PendingCategoryChange {
  transaction: Transaction;
  newCategory: Category;
  matchCount: number;
}

export function TransactionTable({ transactions, compact = false }: TransactionTableProps) {
  const { updateTransactionCategory, updateCategoryByMerchant, updateTransactionNote, createRuleFromTransaction } = useAppStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(new Set());
  const [showReserved, setShowReserved] = useState(false);
  const [pendingChange, setPendingChange] = useState<PendingCategoryChange | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const categoriesInUse = useMemo(() => {
    const cats = new Set(transactions.map((t) => t.category));
    return CATEGORIES.filter((c) => cats.has(c));
  }, [transactions]);

  function toggleCategory(cat: Category) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
    setPage(0);
  }

  function handleCategoryChange(transaction: Transaction, newCategory: Category) {
    const matchCount = transactions.filter(
      (t) => t.merchantKey === transaction.merchantKey && t.id !== transaction.id
    ).length;

    if (matchCount > 0) {
      setPendingChange({ transaction, newCategory, matchCount });
    } else {
      updateTransactionCategory(transaction.id, newCategory);
    }
  }

  function confirmBulk() {
    if (!pendingChange) return;
    updateCategoryByMerchant(pendingChange.transaction.merchantKey, pendingChange.newCategory);
    setPendingChange(null);
  }

  function confirmSingle() {
    if (!pendingChange) return;
    updateTransactionCategory(pendingChange.transaction.id, pendingChange.newCategory);
    setPendingChange(null);
  }

  const filtered = useMemo(() => {
    let result = transactions;

    if (selectedCategories.size > 0) {
      result = result.filter((t) => selectedCategories.has(t.category));
    }
    if (!showReserved) result = result.filter((t) => !t.isReserved);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.rubrik.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.merchantKey.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => {
      if (!a.bookingDate && !b.bookingDate) return 0;
      if (!a.bookingDate) return -1;
      if (!b.bookingDate) return 1;
      return new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime();
    });
  }, [transactions, search, selectedCategories, showReserved]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">
            Transaktioner ({filtered.length})
          </CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök rubrik, kategori..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-8 h-9"
            />
          </div>
        </div>
        {!compact && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {categoriesInUse.map((cat) => {
              const active = selectedCategories.size === 0 || selectedCategories.has(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-background border-border text-foreground"
                      : "bg-muted/40 border-transparent text-muted-foreground opacity-50"
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                  />
                  {cat}
                </button>
              );
            })}
            {selectedCategories.size > 0 && (
              <button
                onClick={() => { setSelectedCategories(new Set()); setPage(0); }}
                className="inline-flex items-center rounded-full border border-dashed px-2.5 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Visa alla
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <Switch id="show-reserved" checked={showReserved} onCheckedChange={setShowReserved} />
              <Label htmlFor="show-reserved" className="text-xs">Reserverade</Label>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Datum</th>
                <th className="pb-2 pr-3 font-medium">Rubrik</th>
                <th className="pb-2 pr-3 font-medium">Kategori</th>
                <th className="pb-2 pr-3 font-medium text-right">Belopp</th>
                <th className="pb-2 font-medium">Åtgärd</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-2.5 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                    {t.bookingDate ? formatDate(new Date(t.bookingDate)) : "Reserverat"}
                  </td>
                  <td className="py-2.5 pr-3 max-w-[280px]">
                    <div className="truncate text-sm">{t.rubrik}</div>
                    {t.tags.length > 0 && (
                      <div className="flex gap-1 mt-0.5">
                        {t.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {editingNoteId === t.id ? (
                      <div className="mt-1">
                        <Input
                          autoFocus
                          placeholder="Skriv en anteckning..."
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          onBlur={() => {
                            updateTransactionNote(t.id, noteText);
                            setEditingNoteId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              updateTransactionNote(t.id, noteText);
                              setEditingNoteId(null);
                            }
                            if (e.key === "Escape") setEditingNoteId(null);
                          }}
                          className="h-6 text-xs"
                        />
                      </div>
                    ) : t.note ? (
                      <button
                        onClick={() => { setEditingNoteId(t.id); setNoteText(t.note); }}
                        className="text-[11px] text-muted-foreground hover:text-foreground mt-0.5 flex items-center gap-1 truncate max-w-full"
                      >
                        <MessageSquare className="h-2.5 w-2.5 shrink-0" />{t.note}
                      </button>
                    ) : null}
                  </td>
                  <td className="py-2.5 pr-3">
                    <CategorySelector
                      value={t.category}
                      onChange={(cat) => handleCategoryChange(t, cat)}
                      size="sm"
                    />
                  </td>
                  <td className={`py-2.5 pr-3 text-right font-mono text-sm whitespace-nowrap ${t.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatSEKExact(t.amount)}
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => { setEditingNoteId(t.id); setNoteText(t.note || ""); }}
                        title="Lägg till anteckning"
                      >
                        <MessageSquare className={`h-3 w-3 ${t.note ? "text-primary" : ""}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => createRuleFromTransaction(t, t.category)}
                        title="Skapa regel för liknande transaktioner"
                      >
                        <Copy className="h-3 w-3" />
                        <span className="hidden sm:inline">Liknande</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    Inga transaktioner matchar din sökning.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              Visar {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, filtered.length)} av {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={!!pendingChange} onOpenChange={(open) => { if (!open) setPendingChange(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ändra kategori</DialogTitle>
            <DialogDescription>
              Det finns {pendingChange?.matchCount} andra transaktioner med samma
              namn ({pendingChange?.transaction.merchantKey}). Vill du ändra alla
              till <strong>{pendingChange?.newCategory}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={confirmSingle}>
              Bara denna
            </Button>
            <Button onClick={confirmBulk}>
              Ändra alla ({(pendingChange?.matchCount ?? 0) + 1})
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
