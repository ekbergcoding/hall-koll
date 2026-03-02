"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ExplainPopover } from "./ExplainPopover";
import { formatSEK } from "@/lib/utils";
import type { Transaction, Category } from "@/lib/transactionModel";
import { TrendingUp, TrendingDown, CreditCard, ArrowLeftRight, Activity } from "lucide-react";
import { isConsumptionCategory } from "@/lib/analytics";

interface KPICardsProps {
  transactions: Transaction[];
  includeReserved: boolean;
}

export function KPICards({ transactions, includeReserved }: KPICardsProps) {
  const filtered = transactions.filter((t) => {
    if (!includeReserved && t.isReserved) return false;
    return true;
  });

  const incomeTxns = filtered.filter((t) => t.category === "Inkomst");
  const income = incomeTxns.reduce((s, t) => s + t.amount, 0);

  const consumptionTxns = filtered.filter((t) => isConsumptionCategory(t.category) && t.amount < 0);
  const consumption = consumptionTxns.reduce((s, t) => s + Math.abs(t.amount), 0);

  const debtTxns = filtered.filter((t) => t.category === "Skuld, lån, amortering");
  const debtPayments = debtTxns.reduce((s, t) => s + Math.abs(t.amount), 0);

  const transferTxns = filtered.filter((t) => t.category === "Överföringar, interna flyttar");
  const transfers = transferTxns.reduce((s, t) => s + Math.abs(t.amount), 0);

  const net = income - consumption - debtPayments - transfers;

  const consumptionCats: Category[] = [
    "Konsumtion", "Mat, butik", "Mat, leverans", "Transport",
    "Abonnemang, streaming", "Nöje, bar, restaurang", "Resor",
    "Avgifter, bank, försäkring", "Övrigt",
  ];
  const excludedFromConsumption: Category[] = [
    "Inkomst", "Skuld, lån, amortering", "Överföringar, interna flyttar", "Kontantuttag",
  ];

  const cards = [
    {
      title: "Inkomst",
      value: income,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      explain: {
        included: ["Inkomst"] as Category[],
        excluded: [] as Category[],
        topTxns: [...incomeTxns].sort((a, b) => b.amount - a.amount),
      },
    },
    {
      title: "Konsumtion",
      value: -consumption,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
      explain: {
        included: consumptionCats,
        excluded: excludedFromConsumption,
        topTxns: [...consumptionTxns].sort((a, b) => a.amount - b.amount),
      },
    },
    {
      title: "Skuldbetalningar",
      value: -debtPayments,
      icon: CreditCard,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      explain: {
        included: ["Skuld, lån, amortering"] as Category[],
        excluded: [] as Category[],
        topTxns: [...debtTxns].sort((a, b) => a.amount - b.amount),
      },
    },
    {
      title: "Överföringar",
      value: -transfers,
      icon: ArrowLeftRight,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      explain: {
        included: ["Överföringar, interna flyttar"] as Category[],
        excluded: [] as Category[],
        topTxns: [...transferTxns].sort((a, b) => a.amount - b.amount),
      },
    },
    {
      title: "Nettokassaflöde",
      value: net,
      icon: Activity,
      color: net >= 0 ? "text-green-600" : "text-red-600",
      bgColor: net >= 0 ? "bg-green-50" : "bg-red-50",
      explain: {
        included: consumptionCats,
        excluded: [] as Category[],
        topTxns: [...filtered].sort((a, b) => a.amount - b.amount).slice(0, 10),
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
              <div className="flex items-center gap-1.5">
                <ExplainPopover
                  title={`Vad ingår i "${card.title}"`}
                  includedCategories={card.explain.included}
                  excludedCategories={card.explain.excluded}
                  topTransactions={card.explain.topTxns}
                  total={Math.abs(card.value)}
                />
                <div className={`rounded-md p-1.5 ${card.bgColor}`}>
                  <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
                </div>
              </div>
            </div>
            <p className={`text-xl font-bold ${card.color}`}>
              {formatSEK(card.value)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
