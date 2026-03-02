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

  // Housing
  { id: "r-hyra", field: "rubrik", matchType: "contains", pattern: "Hyra", category: "Boende", amountCondition: "negative", priority: 12, isDefault: true, enabled: true },
  { id: "r-hyresgast", field: "rubrik", matchType: "contains", pattern: "Hyresgäst", category: "Boende", amountCondition: "negative", priority: 12, isDefault: true, enabled: true },
  { id: "r-bostadsratt", field: "rubrik", matchType: "contains", pattern: "Bostadsrätt", category: "Boende", amountCondition: "negative", priority: 12, isDefault: true, enabled: true },
  { id: "r-riksbyggen", field: "rubrik", matchType: "contains", pattern: "Riksbyggen", category: "Boende", amountCondition: "negative", priority: 12, isDefault: true, enabled: true },
  { id: "r-vattenfall", field: "rubrik", matchType: "contains", pattern: "Vattenfall", category: "Boende", merchantKey: "VATTENFALL", amountCondition: "negative", priority: 25, isDefault: true, enabled: true },
  { id: "r-ellevio", field: "rubrik", matchType: "contains", pattern: "Ellevio", category: "Boende", merchantKey: "ELLEVIO", amountCondition: "negative", priority: 25, isDefault: true, enabled: true },
  { id: "r-eon", field: "rubrik", matchType: "contains", pattern: "E.ON", category: "Boende", merchantKey: "E.ON", amountCondition: "negative", priority: 25, isDefault: true, enabled: true },
  { id: "r-fortum", field: "rubrik", matchType: "contains", pattern: "Fortum", category: "Boende", merchantKey: "FORTUM", amountCondition: "negative", priority: 25, isDefault: true, enabled: true },
  { id: "r-telia-bredband", field: "rubrik", matchType: "contains", pattern: "Telia", category: "Boende", merchantKey: "TELIA", amountCondition: "negative", priority: 28, isDefault: true, enabled: true },

  // Health & medical
  { id: "r-apotek", field: "rubrik", matchType: "contains", pattern: "APOTEK", category: "Hälsa, sjukvård", merchantKey: "APOTEK", priority: 30, isDefault: true, enabled: true },
  { id: "r-apotea", field: "rubrik", matchType: "contains", pattern: "APOTEA", category: "Hälsa, sjukvård", merchantKey: "APOTEA", priority: 30, isDefault: true, enabled: true },
  { id: "r-kronans", field: "rubrik", matchType: "contains", pattern: "KRONANS", category: "Hälsa, sjukvård", merchantKey: "KRONANS APOTEK", priority: 30, isDefault: true, enabled: true },
  { id: "r-vardcentral", field: "rubrik", matchType: "contains", pattern: "Vårdcentral", category: "Hälsa, sjukvård", priority: 30, isDefault: true, enabled: true },
  { id: "r-tandvard", field: "rubrik", matchType: "contains", pattern: "Tandvård", category: "Hälsa, sjukvård", priority: 30, isDefault: true, enabled: true },
  { id: "r-folktand", field: "rubrik", matchType: "contains", pattern: "Folktand", category: "Hälsa, sjukvård", merchantKey: "FOLKTANDVÅRDEN", priority: 30, isDefault: true, enabled: true },
  { id: "r-1177", field: "rubrik", matchType: "contains", pattern: "1177", category: "Hälsa, sjukvård", priority: 30, isDefault: true, enabled: true },
  { id: "r-capio", field: "rubrik", matchType: "contains", pattern: "CAPIO", category: "Hälsa, sjukvård", merchantKey: "CAPIO", priority: 30, isDefault: true, enabled: true },
  { id: "r-synoptik", field: "rubrik", matchType: "contains", pattern: "SYNOPTIK", category: "Hälsa, sjukvård", merchantKey: "SYNOPTIK", priority: 30, isDefault: true, enabled: true },
  { id: "r-specsavers", field: "rubrik", matchType: "contains", pattern: "SPECSAVERS", category: "Hälsa, sjukvård", merchantKey: "SPECSAVERS", priority: 30, isDefault: true, enabled: true },

  // Clothing & shopping
  { id: "r-hm", field: "rubrik", matchType: "contains", pattern: "H&M", category: "Kläder, shopping", merchantKey: "H&M", priority: 30, isDefault: true, enabled: true },
  { id: "r-zara", field: "rubrik", matchType: "contains", pattern: "ZARA", category: "Kläder, shopping", merchantKey: "ZARA", priority: 30, isDefault: true, enabled: true },
  { id: "r-zalando", field: "rubrik", matchType: "contains", pattern: "ZALANDO", category: "Kläder, shopping", merchantKey: "ZALANDO", priority: 30, isDefault: true, enabled: true },
  { id: "r-stadium", field: "rubrik", matchType: "contains", pattern: "STADIUM", category: "Kläder, shopping", merchantKey: "STADIUM", priority: 30, isDefault: true, enabled: true },
  { id: "r-ikea", field: "rubrik", matchType: "contains", pattern: "IKEA", category: "Kläder, shopping", merchantKey: "IKEA", priority: 30, isDefault: true, enabled: true },

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
