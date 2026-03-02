"use server";

import { getSQL } from "./db";
import type { Transaction, CategorizationRule, RecurringItem, UserSettings } from "./transactionModel";
import { DEFAULT_SETTINGS } from "./transactionModel";
import { DEFAULT_RULES } from "./categorizer";

// ── Transactions ──

export async function getAllTransactions(): Promise<Transaction[]> {
  try {
    console.log("[actions] getAllTransactions: start");
    const sql = getSQL();
    const rows = await sql`SELECT * FROM transactions ORDER BY booking_date DESC NULLS FIRST`;
    console.log("[actions] getAllTransactions: got", rows.length, "rows");
    return rows.map(rowToTransaction);
  } catch (error) {
    console.error("[actions] getAllTransactions FAILED:", error);
    throw error;
  }
}

export async function saveTransactions(transactions: Transaction[]): Promise<void> {
  const sql = getSQL();
  for (const t of transactions) {
    await sql`
      INSERT INTO transactions (id, booking_date, is_reserved, amount, currency, rubrik, sender, recipient, name, saldo, month_key, category, merchant_key, tags, user_override)
      VALUES (${t.id}, ${t.bookingDate}, ${t.isReserved}, ${t.amount}, ${t.currency}, ${t.rubrik}, ${t.sender}, ${t.recipient}, ${t.name}, ${t.saldo}, ${t.monthKey}, ${t.category}, ${t.merchantKey}, ${t.tags}, ${t.userOverride})
      ON CONFLICT (id) DO UPDATE SET
        booking_date = EXCLUDED.booking_date,
        is_reserved = EXCLUDED.is_reserved,
        amount = EXCLUDED.amount,
        currency = EXCLUDED.currency,
        rubrik = EXCLUDED.rubrik,
        sender = EXCLUDED.sender,
        recipient = EXCLUDED.recipient,
        name = EXCLUDED.name,
        saldo = EXCLUDED.saldo,
        month_key = EXCLUDED.month_key,
        category = EXCLUDED.category,
        merchant_key = EXCLUDED.merchant_key,
        tags = EXCLUDED.tags,
        user_override = EXCLUDED.user_override
    `;
  }
}

export async function updateTransaction(transaction: Transaction): Promise<void> {
  await saveTransactions([transaction]);
}

export async function clearTransactions(): Promise<void> {
  const sql = getSQL();
  await sql`DELETE FROM transactions`;
}

// ── Rules ──

export async function getAllRules(): Promise<CategorizationRule[]> {
  try {
    console.log("[actions] getAllRules: start");
    const sql = getSQL();
    const rows = await sql`SELECT * FROM rules ORDER BY priority ASC`;
    console.log("[actions] getAllRules: got", rows.length, "rows");
    if (rows.length === 0) {
      console.log("[actions] getAllRules: seeding default rules");
      await saveRules(DEFAULT_RULES);
      return DEFAULT_RULES;
    }
    return rows.map(rowToRule);
  } catch (error) {
    console.error("[actions] getAllRules FAILED:", error);
    throw error;
  }
}

export async function saveRules(rules: CategorizationRule[]): Promise<void> {
  try {
    console.log("[actions] saveRules: saving", rules.length, "rules");
    const sql = getSQL();
    await sql`DELETE FROM rules`;
    for (const r of rules) {
      await sql`
        INSERT INTO rules (id, field, match_type, pattern, category, merchant_key, amount_condition, priority, is_default, enabled)
        VALUES (${r.id}, ${r.field}, ${r.matchType}, ${r.pattern}, ${r.category}, ${r.merchantKey ?? null}, ${r.amountCondition ?? null}, ${r.priority}, ${r.isDefault}, ${r.enabled})
      `;
    }
    console.log("[actions] saveRules: done");
  } catch (error) {
    console.error("[actions] saveRules FAILED:", error);
    throw error;
  }
}

export async function addRule(rule: CategorizationRule): Promise<void> {
  const sql = getSQL();
  await sql`
    INSERT INTO rules (id, field, match_type, pattern, category, merchant_key, amount_condition, priority, is_default, enabled)
    VALUES (${rule.id}, ${rule.field}, ${rule.matchType}, ${rule.pattern}, ${rule.category}, ${rule.merchantKey ?? null}, ${rule.amountCondition ?? null}, ${rule.priority}, ${rule.isDefault}, ${rule.enabled})
    ON CONFLICT (id) DO UPDATE SET
      field = EXCLUDED.field,
      match_type = EXCLUDED.match_type,
      pattern = EXCLUDED.pattern,
      category = EXCLUDED.category,
      merchant_key = EXCLUDED.merchant_key,
      amount_condition = EXCLUDED.amount_condition,
      priority = EXCLUDED.priority,
      is_default = EXCLUDED.is_default,
      enabled = EXCLUDED.enabled
  `;
}

export async function deleteRule(id: string): Promise<void> {
  const sql = getSQL();
  await sql`DELETE FROM rules WHERE id = ${id}`;
}

// ── Recurring ──

export async function getAllRecurring(): Promise<RecurringItem[]> {
  try {
    console.log("[actions] getAllRecurring: start");
    const sql = getSQL();
    const rows = await sql`SELECT * FROM recurring`;
    console.log("[actions] getAllRecurring: got", rows.length, "rows");
    return rows.map(rowToRecurring);
  } catch (error) {
    console.error("[actions] getAllRecurring FAILED:", error);
    throw error;
  }
}

export async function saveRecurring(items: RecurringItem[]): Promise<void> {
  const sql = getSQL();
  await sql`DELETE FROM recurring`;
  for (const item of items) {
    await sql`
      INSERT INTO recurring (id, merchant_key, label, category, average_amount, typical_day, occurrences, confidence, confirmed, transaction_ids)
      VALUES (${item.id}, ${item.merchantKey}, ${item.label}, ${item.category}, ${item.averageAmount}, ${item.typicalDay}, ${item.occurrences}, ${item.confidence}, ${item.confirmed}, ${item.transactionIds})
    `;
  }
}

// ── Settings ──

export async function getSettings(): Promise<UserSettings> {
  try {
    console.log("[actions] getSettings: start");
    const sql = getSQL();
    const rows = await sql`SELECT * FROM settings WHERE key = 'user'`;
    console.log("[actions] getSettings: got", rows.length, "rows");
    if (rows.length === 0) return DEFAULT_SETTINGS;
    const r = rows[0];
    return {
      includeReserved: r.include_reserved,
      monthlyBudget: Number(r.monthly_budget),
      cashBuffer: Number(r.cash_buffer),
    };
  } catch (error) {
    console.error("[actions] getSettings FAILED:", error);
    throw error;
  }
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  const sql = getSQL();
  await sql`
    INSERT INTO settings (key, include_reserved, monthly_budget, cash_buffer)
    VALUES ('user', ${settings.includeReserved}, ${settings.monthlyBudget}, ${settings.cashBuffer})
    ON CONFLICT (key) DO UPDATE SET
      include_reserved = EXCLUDED.include_reserved,
      monthly_budget = EXCLUDED.monthly_budget,
      cash_buffer = EXCLUDED.cash_buffer
  `;
}

// ── CSV Export (pure function, no DB) ──

export async function exportTransactionsToCSV(transactions: Transaction[]): Promise<string> {
  const headers = [
    "Bokföringsdag", "Belopp", "Kategori", "Rubrik", "Handlare",
    "Avsändare", "Mottagare", "Namn", "Saldo", "Valuta", "Taggar", "Användarändrad",
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

// ── Row mappers ──

function rowToTransaction(r: Record<string, unknown>): Transaction {
  return {
    id: r.id as string,
    bookingDate: r.booking_date ? new Date(r.booking_date as string).toISOString() : null,
    isReserved: r.is_reserved as boolean,
    amount: Number(r.amount),
    currency: r.currency as string,
    rubrik: r.rubrik as string,
    sender: (r.sender as string) || null,
    recipient: (r.recipient as string) || null,
    name: (r.name as string) || null,
    saldo: r.saldo !== null ? Number(r.saldo) : null,
    monthKey: r.month_key as string,
    category: r.category as Transaction["category"],
    merchantKey: r.merchant_key as string,
    tags: (r.tags as string[]) || [],
    userOverride: r.user_override as boolean,
  };
}

function rowToRule(r: Record<string, unknown>): CategorizationRule {
  return {
    id: r.id as string,
    field: r.field as CategorizationRule["field"],
    matchType: r.match_type as CategorizationRule["matchType"],
    pattern: r.pattern as string,
    category: r.category as CategorizationRule["category"],
    merchantKey: (r.merchant_key as string) || undefined,
    amountCondition: (r.amount_condition as CategorizationRule["amountCondition"]) || undefined,
    priority: Number(r.priority),
    isDefault: r.is_default as boolean,
    enabled: r.enabled as boolean,
  };
}

function rowToRecurring(r: Record<string, unknown>): RecurringItem {
  return {
    id: r.id as string,
    merchantKey: r.merchant_key as string,
    label: r.label as string,
    category: r.category as RecurringItem["category"],
    averageAmount: Number(r.average_amount),
    typicalDay: Number(r.typical_day),
    occurrences: Number(r.occurrences),
    confidence: Number(r.confidence),
    confirmed: r.confirmed as boolean,
    transactionIds: (r.transaction_ids as string[]) || [],
  };
}
