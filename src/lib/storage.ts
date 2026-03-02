import { openDB, type IDBPDatabase } from "idb";
import type { Transaction, CategorizationRule, RecurringItem, UserSettings } from "./transactionModel";
import { DEFAULT_SETTINGS } from "./transactionModel";
import { DEFAULT_RULES } from "./categorizer";

const DB_NAME = "hallkoll";
const DB_VERSION = 1;

interface HallKollDB {
  transactions: { key: string; value: Transaction };
  rules: { key: string; value: CategorizationRule };
  recurring: { key: string; value: RecurringItem };
  settings: { key: string; value: UserSettings };
}

let dbPromise: Promise<IDBPDatabase<HallKollDB>> | null = null;

function getDB(): Promise<IDBPDatabase<HallKollDB>> {
  if (!dbPromise) {
    dbPromise = openDB<HallKollDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("transactions")) {
          db.createObjectStore("transactions", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("rules")) {
          db.createObjectStore("rules", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("recurring")) {
          db.createObjectStore("recurring", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings");
        }
      },
    });
  }
  return dbPromise;
}

// Transactions
export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDB();
  return db.getAll("transactions");
}

export async function saveTransactions(transactions: Transaction[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("transactions", "readwrite");
  for (const t of transactions) {
    await tx.store.put(t);
  }
  await tx.done;
}

export async function updateTransaction(transaction: Transaction): Promise<void> {
  const db = await getDB();
  await db.put("transactions", transaction);
}

export async function clearTransactions(): Promise<void> {
  const db = await getDB();
  await db.clear("transactions");
}

// Rules
export async function getAllRules(): Promise<CategorizationRule[]> {
  const db = await getDB();
  const rules = await db.getAll("rules");
  if (rules.length === 0) {
    await saveRules(DEFAULT_RULES);
    return DEFAULT_RULES;
  }
  return rules;
}

export async function saveRules(rules: CategorizationRule[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("rules", "readwrite");
  await tx.store.clear();
  for (const r of rules) {
    await tx.store.put(r);
  }
  await tx.done;
}

export async function addRule(rule: CategorizationRule): Promise<void> {
  const db = await getDB();
  await db.put("rules", rule);
}

export async function deleteRule(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("rules", id);
}

// Recurring
export async function getAllRecurring(): Promise<RecurringItem[]> {
  const db = await getDB();
  return db.getAll("recurring");
}

export async function saveRecurring(items: RecurringItem[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("recurring", "readwrite");
  await tx.store.clear();
  for (const item of items) {
    await tx.store.put(item);
  }
  await tx.done;
}

// Settings
export async function getSettings(): Promise<UserSettings> {
  const db = await getDB();
  const settings = await db.get("settings", "user");
  return settings || DEFAULT_SETTINGS;
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  const db = await getDB();
  await db.put("settings", settings, "user");
}

// Export to CSV
export function exportTransactionsToCSV(transactions: Transaction[]): string {
  const headers = [
    "Bokföringsdag",
    "Belopp",
    "Kategori",
    "Rubrik",
    "Handlare",
    "Avsändare",
    "Mottagare",
    "Namn",
    "Saldo",
    "Valuta",
    "Taggar",
    "Användarändrad",
  ];

  const rows = transactions.map((t) => [
    t.bookingDate ? new Date(t.bookingDate).toISOString().split("T")[0] : "Reserverat",
    t.amount.toFixed(2).replace(".", ","),
    t.category,
    `"${t.rubrik.replace(/"/g, '""')}"`,
    t.merchantKey,
    t.sender || "",
    t.recipient || "",
    t.name || "",
    t.saldo !== null ? t.saldo.toFixed(2).replace(".", ",") : "",
    t.currency,
    t.tags.join(", "),
    t.userOverride ? "Ja" : "Nej",
  ]);

  return [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
}
