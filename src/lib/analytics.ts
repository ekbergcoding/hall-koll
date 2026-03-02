import type { Transaction, Category } from "./transactionModel";

export interface MonthlyStats {
  monthKey: string;
  income: number;
  consumption: number;
  debtPayments: number;
  transfers: number;
  atm: number;
  netCashflow: number;
  transactionCount: number;
}

const CONSUMPTION_CATEGORIES: Category[] = [
  "Konsumtion",
  "Boende",
  "Hälsa, sjukvård",
  "Mat, butik",
  "Mat, leverans",
  "Transport",
  "Abonnemang, streaming",
  "Nöje, bar, restaurang",
  "Kläder, shopping",
  "Resor",
  "Avgifter, bank, försäkring",
  "Övrigt",
];

export function isConsumptionCategory(cat: Category): boolean {
  return CONSUMPTION_CATEGORIES.includes(cat);
}

export function computeMonthlyStats(
  transactions: Transaction[],
  includeReserved: boolean = false
): MonthlyStats[] {
  const filtered = transactions.filter((t) => {
    if (!includeReserved && t.isReserved) return false;
    return t.monthKey !== "reserverat";
  });

  const monthMap = new Map<string, Transaction[]>();
  for (const t of filtered) {
    if (!monthMap.has(t.monthKey)) monthMap.set(t.monthKey, []);
    monthMap.get(t.monthKey)!.push(t);
  }

  const stats: MonthlyStats[] = [];
  for (const [monthKey, txns] of monthMap) {
    let income = 0;
    let consumption = 0;
    let debtPayments = 0;
    let transfers = 0;
    let atm = 0;

    for (const t of txns) {
      if (t.category === "Inkomst") {
        income += t.amount;
      } else if (t.category === "Skuld, lån, amortering") {
        debtPayments += Math.abs(t.amount);
      } else if (t.category === "Överföringar, interna flyttar") {
        transfers += Math.abs(t.amount);
      } else if (t.category === "Kontantuttag") {
        atm += Math.abs(t.amount);
      } else if (isConsumptionCategory(t.category) && t.amount < 0) {
        consumption += Math.abs(t.amount);
      }
    }

    stats.push({
      monthKey,
      income,
      consumption,
      debtPayments,
      transfers,
      atm,
      netCashflow: income - consumption - debtPayments - transfers - atm,
      transactionCount: txns.length,
    });
  }

  return stats.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

export interface CategoryBreakdown {
  category: Category;
  total: number;
  count: number;
  transactions: Transaction[];
}

export function computeCategoryBreakdown(
  transactions: Transaction[],
  includeReserved: boolean = false
): CategoryBreakdown[] {
  const filtered = transactions.filter((t) => {
    if (!includeReserved && t.isReserved) return false;
    if (t.amount >= 0) return false;
    return isConsumptionCategory(t.category);
  });

  const map = new Map<Category, { total: number; count: number; transactions: Transaction[] }>();
  for (const t of filtered) {
    if (!map.has(t.category)) {
      map.set(t.category, { total: 0, count: 0, transactions: [] });
    }
    const entry = map.get(t.category)!;
    entry.total += Math.abs(t.amount);
    entry.count++;
    entry.transactions.push(t);
  }

  return Array.from(map.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.total - a.total);
}

export interface MerchantRank {
  merchantKey: string;
  total: number;
  count: number;
  category: Category;
}

export function computeTopMerchants(
  transactions: Transaction[],
  limit: number = 10
): MerchantRank[] {
  const filtered = transactions.filter((t) => !t.isReserved && t.amount < 0);
  const map = new Map<string, { total: number; count: number; category: Category }>();

  for (const t of filtered) {
    if (!map.has(t.merchantKey)) {
      map.set(t.merchantKey, { total: 0, count: 0, category: t.category });
    }
    const entry = map.get(t.merchantKey)!;
    entry.total += Math.abs(t.amount);
    entry.count++;
  }

  return Array.from(map.entries())
    .map(([merchantKey, data]) => ({ merchantKey, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

// Savings rate per month: (income - all outflows) / income
export interface SavingsData {
  monthKey: string;
  income: number;
  totalSpent: number;
  saved: number;
  savingsRate: number; // 0-100
}

export function computeSavingsRate(stats: MonthlyStats[]): SavingsData[] {
  return stats
    .filter((s) => s.income > 0)
    .map((s) => {
      const totalSpent = s.consumption + s.debtPayments + s.transfers + s.atm;
      const saved = s.income - totalSpent;
      return {
        monthKey: s.monthKey,
        income: s.income,
        totalSpent,
        saved,
        savingsRate: Math.round((saved / s.income) * 100),
      };
    });
}

// Category spending per month for trends
export interface CategoryMonthly {
  category: Category;
  monthKey: string;
  total: number;
}

export function computeCategoryMonthly(
  transactions: Transaction[],
  includeReserved = false
): CategoryMonthly[] {
  const filtered = transactions.filter((t) => {
    if (!includeReserved && t.isReserved) return false;
    if (t.amount >= 0) return false;
    return isConsumptionCategory(t.category);
  });

  const map = new Map<string, number>();
  for (const t of filtered) {
    const key = `${t.category}::${t.monthKey}`;
    map.set(key, (map.get(key) || 0) + Math.abs(t.amount));
  }

  return Array.from(map.entries()).map(([key, total]) => {
    const [category, monthKey] = key.split("::");
    return { category: category as Category, monthKey, total };
  });
}

// Compute spending alerts for current month
export interface SpendingAlert {
  category: Category;
  budget: number;
  spent: number;
  projected: number;
  percentUsed: number;
  daysLeft: number;
  severity: "ok" | "warning" | "danger";
}

export function computeSpendingAlerts(
  transactions: Transaction[],
  categoryBudgets: { category: Category; budget: number }[],
  currentMonthKey: string
): SpendingAlert[] {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - dayOfMonth;

  const monthTxns = transactions.filter(
    (t) => t.monthKey === currentMonthKey && t.amount < 0 && !t.isReserved
  );

  return categoryBudgets
    .filter((cb) => cb.budget > 0)
    .map((cb) => {
      const spent = monthTxns
        .filter((t) => t.category === cb.category)
        .reduce((s, t) => s + Math.abs(t.amount), 0);
      const projected = dayOfMonth > 0 ? (spent / dayOfMonth) * daysInMonth : 0;
      const percentUsed = (spent / cb.budget) * 100;
      const severity: SpendingAlert["severity"] =
        percentUsed >= 100 ? "danger" : percentUsed >= 80 ? "warning" : "ok";
      return {
        category: cb.category,
        budget: cb.budget,
        spent,
        projected,
        percentUsed,
        daysLeft,
        severity,
      };
    })
    .sort((a, b) => b.percentUsed - a.percentUsed);
}

export function getAvailableMonths(transactions: Transaction[]): string[] {
  const months = new Set<string>();
  for (const t of transactions) {
    if (t.monthKey !== "reserverat") months.add(t.monthKey);
  }
  return Array.from(months).sort();
}

export function filterByMonth(
  transactions: Transaction[],
  monthKey: string | null
): Transaction[] {
  if (!monthKey) return transactions;
  return transactions.filter((t) => t.monthKey === monthKey);
}
