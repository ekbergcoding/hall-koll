import type { Transaction, RecurringItem } from "./transactionModel";

interface MerchantGroup {
  merchantKey: string;
  transactions: Transaction[];
}

function groupByMerchant(transactions: Transaction[]): MerchantGroup[] {
  const map = new Map<string, Transaction[]>();
  for (const t of transactions) {
    if (t.isReserved || !t.bookingDate) continue;
    const key = t.merchantKey;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  return Array.from(map.entries()).map(([merchantKey, txns]) => ({
    merchantKey,
    transactions: txns.sort(
      (a, b) => new Date(a.bookingDate!).getTime() - new Date(b.bookingDate!).getTime()
    ),
  }));
}

function getUniqueMonths(transactions: Transaction[]): Set<string> {
  return new Set(transactions.map((t) => t.monthKey).filter((m) => m !== "reserverat"));
}

function averageAmount(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / transactions.length;
}

function amountSimilarity(amounts: number[], tolerance: number = 0.05): boolean {
  if (amounts.length < 2) return true;
  const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
  if (avg === 0) return true;
  return amounts.every((a) => Math.abs(a - avg) / avg <= tolerance);
}

function typicalDayOfMonth(transactions: Transaction[]): number {
  const days = transactions
    .filter((t) => t.bookingDate)
    .map((t) => new Date(t.bookingDate!).getDate());
  if (days.length === 0) return 1;
  return Math.round(days.reduce((s, d) => s + d, 0) / days.length);
}

export function detectRecurring(
  transactions: Transaction[],
  confirmedIds: Set<string> = new Set()
): RecurringItem[] {
  const groups = groupByMerchant(transactions);
  const results: RecurringItem[] = [];

  for (const group of groups) {
    const months = getUniqueMonths(group.transactions);
    if (months.size < 2) continue;

    const amounts = group.transactions.map((t) => Math.abs(t.amount));
    const similar = amountSimilarity(amounts, 0.10);

    // Need at least 2 months and somewhat similar amounts
    if (!similar && months.size < 3) continue;

    const avg = averageAmount(group.transactions);
    const day = typicalDayOfMonth(group.transactions);

    // Confidence: higher with more months, similar amounts
    let confidence = Math.min(months.size / 4, 1) * 0.6;
    if (similar) confidence += 0.3;
    if (months.size >= 3) confidence += 0.1;
    confidence = Math.min(confidence, 1);

    if (confidence < 0.3) continue;

    const id = `rec-${group.merchantKey.toLowerCase().replace(/\s+/g, "-")}`;

    results.push({
      id,
      merchantKey: group.merchantKey,
      label: group.merchantKey,
      category: group.transactions[0].category,
      averageAmount: avg,
      typicalDay: day,
      occurrences: group.transactions.length,
      confidence,
      confirmed: confirmedIds.has(id),
      transactionIds: group.transactions.map((t) => t.id),
    });
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}
