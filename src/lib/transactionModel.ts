export const CATEGORIES = [
  "Inkomst",
  "Konsumtion",
  "Skuld, lån, amortering",
  "Överföringar, interna flyttar",
  "Kontantuttag",
  "Boende",
  "Hälsa, sjukvård",
  "Avgifter, bank, försäkring",
  "Mat, butik",
  "Mat, leverans",
  "Transport",
  "Abonnemang, streaming",
  "Nöje, bar, restaurang",
  "Kläder, shopping",
  "Resor",
  "Övrigt",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Transaction {
  id: string;
  bookingDate: string | null; // ISO string or null
  isReserved: boolean;
  amount: number;
  currency: string;
  rubrik: string;
  sender: string | null;
  recipient: string | null;
  name: string | null;
  saldo: number | null;
  monthKey: string;
  category: Category;
  merchantKey: string;
  tags: string[];
  userOverride: boolean;
  note: string;
}

export interface CategorizationRule {
  id: string;
  field: "rubrik" | "name";
  matchType: "contains" | "startsWith" | "regex";
  pattern: string;
  category: Category;
  merchantKey?: string;
  amountCondition?: "negative" | "positive";
  priority: number;
  isDefault: boolean;
  enabled: boolean;
}

export interface RecurringItem {
  id: string;
  merchantKey: string;
  label: string;
  category: Category;
  averageAmount: number;
  typicalDay: number;
  occurrences: number;
  confidence: number;
  confirmed: boolean;
  transactionIds: string[];
}

export interface CategoryBudget {
  category: Category;
  budget: number;
}

export interface UserSettings {
  includeReserved: boolean;
  monthlyBudget: number;
  cashBuffer: number;
  categoryBudgets: CategoryBudget[];
}

export const DEFAULT_SETTINGS: UserSettings = {
  includeReserved: false,
  monthlyBudget: 15000,
  cashBuffer: 0,
  categoryBudgets: [],
};

export const CATEGORY_COLORS: Record<Category, string> = {
  Inkomst: "#22c55e",
  Konsumtion: "#ef4444",
  "Skuld, lån, amortering": "#f59e0b",
  "Överföringar, interna flyttar": "#6366f1",
  Kontantuttag: "#8b5cf6",
  Boende: "#d946ef",
  "Hälsa, sjukvård": "#f43f5e",
  "Avgifter, bank, försäkring": "#64748b",
  "Mat, butik": "#10b981",
  "Mat, leverans": "#f97316",
  Transport: "#0ea5e9",
  "Abonnemang, streaming": "#a855f7",
  "Nöje, bar, restaurang": "#ec4899",
  "Kläder, shopping": "#e879f9",
  Resor: "#14b8a6",
  Övrigt: "#94a3b8",
};

export function deriveMerchantKey(rubrik: string): string {
  let cleaned = rubrik.trim().toUpperCase();
  // Remove date patterns like YYMMDD
  cleaned = cleaned.replace(/\b\d{6}\b/g, "").trim();
  // Remove "Kortköp", "Reservation Kortköp", etc. prefixes
  cleaned = cleaned
    .replace(/^RESERVATION\s+KORTKÖP\s*/i, "")
    .replace(/^KORTKÖP\s*/i, "")
    .replace(/^KONTANTUTTAG\s*/i, "")
    .replace(/^SWISH\s+(IN|UT)BETALNING\s*/i, "")
    .replace(/^BANKGIROINSÄTTNING\s*/i, "")
    .trim();
  // Remove trailing numbers/reference codes
  cleaned = cleaned.replace(/\s+\d+[-/]?\d*$/, "").trim();
  return cleaned || rubrik.trim().toUpperCase();
}
