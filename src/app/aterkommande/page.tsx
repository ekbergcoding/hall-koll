"use client";

import React, { useEffect } from "react";
import { useAppStore } from "@/hooks/useAppStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatSEK } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/transactionModel";
import { CheckCircle, XCircle, RefreshCcw, Calendar } from "lucide-react";

export default function AterkommandePage() {
  const { recurringItems, toggleRecurring, refreshRecurring, transactions, isLoading } = useAppStore();

  useEffect(() => {
    if (!isLoading && transactions.length > 0 && recurringItems.length === 0) {
      refreshRecurring();
    }
  }, [isLoading, transactions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
      </div>
    );
  }

  const confirmed = recurringItems.filter((r) => r.confirmed);
  const suggestions = recurringItems.filter((r) => !r.confirmed);

  const monthlyTotal = confirmed.reduce((s, r) => s + r.averageAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Återkommande</h1>
          <p className="text-sm text-muted-foreground">
            Identifiera och spåra återkommande utgifter
          </p>
        </div>
        <Button variant="outline" onClick={refreshRecurring}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Uppdatera analys
        </Button>
      </div>

      {/* Monthly total */}
      {confirmed.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Bekräftade återkommande utgifter / månad</p>
                <p className="text-2xl font-bold">{formatSEK(monthlyTotal)}</p>
              </div>
              <div className="text-xs text-muted-foreground text-right">
                {confirmed.length} poster
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmed */}
      {confirmed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bekräftade ({confirmed.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {confirmed.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[item.category] || "#94a3b8" }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>~dag {item.typicalDay}</span>
                        <span>{item.occurrences} förekomster</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium">{formatSEK(item.averageAmount)}/mån</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleRecurring(item.id)}>
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Förslag ({suggestions.length})</CardTitle>
          <CardDescription>
            Baserat på transaktionsmönster. Bekräfta de som stämmer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Inga fler förslag hittades. Ladda upp mer data eller klicka &quot;Uppdatera analys&quot;.
            </p>
          ) : (
            <div className="space-y-3">
              {suggestions.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[item.category] || "#94a3b8" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>~dag {item.typicalDay}</span>
                        <span>{item.occurrences} förekomster</span>
                        <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">Konfidens:</span>
                        <Progress value={item.confidence * 100} className="h-1 w-20" />
                        <span className="text-[10px] text-muted-foreground">{Math.round(item.confidence * 100)}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm">{formatSEK(item.averageAmount)}/mån</span>
                    <Button variant="outline" size="sm" className="h-7 gap-1" onClick={() => toggleRecurring(item.id)}>
                      <CheckCircle className="h-3 w-3" />
                      Bekräfta
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
