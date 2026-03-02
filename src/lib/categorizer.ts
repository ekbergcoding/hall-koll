import type { Transaction, CategorizationRule, Category } from "./transactionModel";

export const DEFAULT_RULES: CategorizationRule[] = [
  // Income
  { id: "r-lon", field: "rubrik", matchType: "contains", pattern: "Lön", category: "Inkomst", priority: 10, isDefault: true, enabled: true },
  { id: "r-swish-in", field: "rubrik", matchType: "contains", pattern: "Swish inbetalning", category: "Inkomst", priority: 10, isDefault: true, enabled: true },
  { id: "r-bankgiro-in", field: "rubrik", matchType: "contains", pattern: "Bankgiroinsättning", category: "Inkomst", priority: 10, isDefault: true, enabled: true },
  { id: "r-insattning", field: "rubrik", matchType: "contains", pattern: "Insättning", category: "Inkomst", priority: 10, isDefault: true, enabled: true },
  { id: "r-aterbetal", field: "rubrik", matchType: "contains", pattern: "Återbetal", category: "Inkomst", priority: 10, isDefault: true, enabled: true },

  // Transfers
  { id: "r-overforing", field: "rubrik", matchType: "contains", pattern: "Överföring", category: "Överföringar, interna flyttar", priority: 20, isDefault: true, enabled: true },
  { id: "r-xtraspar", field: "rubrik", matchType: "contains", pattern: "Xtraspar", category: "Överföringar, interna flyttar", priority: 20, isDefault: true, enabled: true },
  { id: "r-revolut", field: "rubrik", matchType: "contains", pattern: "Revolut", category: "Överföringar, interna flyttar", priority: 20, isDefault: true, enabled: true },

  // Debt payments
  { id: "r-anyfin", field: "rubrik", matchType: "contains", pattern: "Anyfin", category: "Skuld, lån, amortering", priority: 15, isDefault: true, enabled: true },
  { id: "r-sevenday", field: "rubrik", matchType: "contains", pattern: "Sevenday", category: "Skuld, lån, amortering", priority: 15, isDefault: true, enabled: true },
  { id: "r-medmera", field: "rubrik", matchType: "contains", pattern: "MedMera", category: "Skuld, lån, amortering", priority: 15, isDefault: true, enabled: true },
  { id: "r-klarna", field: "rubrik", matchType: "contains", pattern: "Klarna", category: "Skuld, lån, amortering", priority: 15, isDefault: true, enabled: true },
  { id: "r-ferratum", field: "rubrik", matchType: "contains", pattern: "Ferratum", category: "Skuld, lån, amortering", amountCondition: "negative", priority: 15, isDefault: true, enabled: true },
  { id: "r-trustly", field: "rubrik", matchType: "contains", pattern: "Trustly", category: "Skuld, lån, amortering", amountCondition: "negative", priority: 15, isDefault: true, enabled: true },

  // ATM
  { id: "r-kontantuttag", field: "rubrik", matchType: "contains", pattern: "Kontantuttag", category: "Kontantuttag", priority: 20, isDefault: true, enabled: true },
  { id: "r-bankomat", field: "rubrik", matchType: "contains", pattern: "BANKOMAT", category: "Kontantuttag", priority: 20, isDefault: true, enabled: true },

  // Food delivery
  { id: "r-foodora", field: "rubrik", matchType: "contains", pattern: "FOODORA", category: "Mat, leverans", merchantKey: "FOODORA", priority: 30, isDefault: true, enabled: true },
  { id: "r-wolt", field: "rubrik", matchType: "contains", pattern: "WOLT", category: "Mat, leverans", merchantKey: "WOLT", priority: 30, isDefault: true, enabled: true },

  // Grocery
  { id: "r-ica", field: "rubrik", matchType: "contains", pattern: "ICA", category: "Mat, butik", merchantKey: "ICA", priority: 30, isDefault: true, enabled: true },
  { id: "r-coop", field: "rubrik", matchType: "contains", pattern: "COOP", category: "Mat, butik", merchantKey: "COOP", priority: 30, isDefault: true, enabled: true },
  { id: "r-hemkop", field: "rubrik", matchType: "contains", pattern: "HEMKÖP", category: "Mat, butik", merchantKey: "HEMKÖP", priority: 30, isDefault: true, enabled: true },
  { id: "r-willys", field: "rubrik", matchType: "contains", pattern: "WILLYS", category: "Mat, butik", merchantKey: "WILLYS", priority: 30, isDefault: true, enabled: true },
  { id: "r-lidl", field: "rubrik", matchType: "contains", pattern: "LIDL", category: "Mat, butik", merchantKey: "LIDL", priority: 30, isDefault: true, enabled: true },

  // Subscriptions
  { id: "r-netflix", field: "rubrik", matchType: "contains", pattern: "NETFLIX", category: "Abonnemang, streaming", merchantKey: "NETFLIX", priority: 30, isDefault: true, enabled: true },
  { id: "r-spotify", field: "rubrik", matchType: "contains", pattern: "SPOTIFY", category: "Abonnemang, streaming", merchantKey: "SPOTIFY", priority: 30, isDefault: true, enabled: true },
  { id: "r-viaplay", field: "rubrik", matchType: "contains", pattern: "VIAPLAY", category: "Abonnemang, streaming", merchantKey: "VIAPLAY", priority: 30, isDefault: true, enabled: true },
  { id: "r-hbo", field: "rubrik", matchType: "contains", pattern: "HBO", category: "Abonnemang, streaming", merchantKey: "HBO", priority: 30, isDefault: true, enabled: true },

  // Travel
  { id: "r-booking", field: "rubrik", matchType: "contains", pattern: "BOOKING", category: "Resor", priority: 30, isDefault: true, enabled: true },
  { id: "r-kiwi", field: "rubrik", matchType: "contains", pattern: "KIWI.COM", category: "Resor", priority: 30, isDefault: true, enabled: true },

  // Entertainment
  { id: "r-melody", field: "rubrik", matchType: "contains", pattern: "MELODY CLUB", category: "Nöje, bar, restaurang", priority: 30, isDefault: true, enabled: true },
  { id: "r-stationen", field: "rubrik", matchType: "contains", pattern: "STATIONEN", category: "Nöje, bar, restaurang", priority: 30, isDefault: true, enabled: true },
];

function matchRule(rule: CategorizationRule, transaction: { rubrik: string; name: string | null; amount: number }): boolean {
  if (!rule.enabled) return false;

  if (rule.amountCondition === "negative" && transaction.amount >= 0) return false;
  if (rule.amountCondition === "positive" && transaction.amount < 0) return false;

  const fieldValue = rule.field === "rubrik" ? transaction.rubrik : (transaction.name || "");

  switch (rule.matchType) {
    case "contains":
      return fieldValue.toLowerCase().includes(rule.pattern.toLowerCase());
    case "startsWith":
      return fieldValue.toLowerCase().startsWith(rule.pattern.toLowerCase());
    case "regex":
      try {
        return new RegExp(rule.pattern, "i").test(fieldValue);
      } catch {
        return false;
      }
    default:
      return false;
  }
}

export function categorizeTransaction(
  transaction: { rubrik: string; name: string | null; amount: number },
  rules: CategorizationRule[]
): { category: Category; merchantKey?: string; matchedRuleId?: string } {
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

  for (const rule of sortedRules) {
    if (matchRule(rule, transaction)) {
      return {
        category: rule.category,
        merchantKey: rule.merchantKey,
        matchedRuleId: rule.id,
      };
    }
  }

  // Positive amounts default to income
  if (transaction.amount > 0) {
    return { category: "Inkomst" };
  }

  return { category: "Övrigt" };
}

export function applyCategorizationToAll(
  transactions: Transaction[],
  rules: CategorizationRule[]
): Transaction[] {
  return transactions.map((t) => {
    if (t.userOverride) return t;
    const result = categorizeTransaction(t, rules);
    return {
      ...t,
      category: result.category,
      merchantKey: result.merchantKey || t.merchantKey,
    };
  });
}

export function buildAutoTags(transaction: Transaction): string[] {
  const tags: string[] = [];

  if (transaction.isReserved) {
    tags.push("Reserverad");
  }

  const debtCategories: Category[] = ["Skuld, lån, amortering"];
  if (debtCategories.includes(transaction.category) && !transaction.userOverride) {
    tags.push("Auto: skuldkandidat");
  }

  return tags;
}
