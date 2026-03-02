"use server";

import { getSQL } from "./db";
import { getRequiredUserId } from "./auth";
import type { Transaction, CategorizationRule, RecurringItem, UserSettings, CategoryBudget } from "./transactionModel";
import { DEFAULT_SETTINGS } from "./transactionModel";
import { DEFAULT_RULES } from "./categorizer";

// ── Transactions ──

export async function getAllTransactions(): Promise<Transaction[]> {
  const userId = await getRequiredUserId();
  const sql = getSQL();
  const rows = await sql`SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY booking_date DESC NULLS FIRST`;
  return rows.map(rowToTransaction);
}

export async function saveTransactions(transactions: Transaction[]): Promise<void> {
  const userId = await getRequiredUserId();
  const sql = getSQL();
  for (const t of transactions) {
    await sql`
      INSERT INTO transactions (id, user_id, booking_date, is_reserved, amount, currency, rubrik, sender, recipient, name, saldo, month_key, category, merchant_key, tags, user_override, note)
      VALUES (${t.id}, ${userId}, ${t.bookingDate}, ${t.isReserved}, ${t.amount}, ${t.currency}, ${t.rubrik}, ${t.sender}, ${t.recipient}, ${t.name}, ${t.saldo}, ${t.monthKey}, ${t.category}, ${t.merchantKey}, ${t.tags}, ${t.userOverride}, ${t.note || ''})
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
        user_override = EXCLUDED.user_override,
        note = EXCLUDED.note
    `;
  }
}

export async function updateTransaction(transaction: Transaction): Promise<void> {
  await saveTransactions([transaction]);
}

export async function clearTransactions(): Promise<void> {
  const userId = await getRequiredUserId();
  const sql = getSQL();
  await sql`DELETE FROM transactions WHERE user_id = ${userId}`;
}

// ── Rules ──

export async function getAllRules(): Promise<CategorizationRule[]> {
  const userId = await getRequiredUserId();
  const sql = getSQL();
  const rows = await sql`SELECT * FROM rules WHERE user_id = ${userId} ORDER BY priority ASC`;
  if (rows.length === 0) {
    await saveRules(DEFAULT_RULES);
    return DEFAULT_RULES;
  }
  return rows.map(rowToRule);
}

export async function saveRules(rules: CategorizationRule[]): Promise<void> {
  const userId = await getRequiredUserId();
  const sql = getSQL();
  await sql`DELETE FROM rules WHERE user_id = ${userId}`;
  for (const r of rules) {
    await sql`
      INSERT INTO rules (id, user_id, field, match_type, pattern, category, merchant_key, amount_condition, priority, is_default, enabled)
      VALUES (${r.id}, ${userId}, ${r.field}, ${r.matchType}, ${r.pattern}, ${r.category}, ${r.merchantKey ?? null}, ${r.amountCondition ?? null}, ${r.priority}, ${r.isDefault}, ${r.enabled})
    `;
  }
}

export async function addRule(rule: CategorizationRule): Promise<void> {
  const userId = await getRequiredUserId();
  const sql = getSQL();
  await sql`
    INSERT INTO rules (id, user_id, field, match_type, pattern, category, merchant_key, amount_condition, priority, is_default, enabled)
    VALUES (${rule.id}, ${userId}, ${rule.field}, ${rule.matchType}, ${rule.pattern}, ${rule.category}, ${rule.merchantKey ?? null}, ${rule.amountCondition ?? null}, ${rule.priority}, ${rule.isDefault}, ${rule.enabled})
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
  const userId = await getRequiredUserId();
  const sql = getSQL();
  await sql`DELETE FROM rules WHERE id = ${id} AND user_id = ${userId}`;
}

// ── Recurring ──

export async function getAllRecurring(): Promise<RecurringItem[]> {
  const userId = await getRequiredUserId();
  const sql = getSQL();
  const rows = await sql`SELECT * FROM recurring WHERE user_id = ${userId}`;
  return rows.map(rowToRecurring);
}

export async function saveRecurring(items: RecurringItem[]): Promise<void> {
  const userId = await getRequiredUserId();
  const sql = getSQL();
  await sql`DELETE FROM recurring WHERE user_id = ${userId}`;
  for (const item of items) {
    await sql`
      INSERT INTO recurring (id, user_id, merchant_key, label, category, average_amount, typical_day, occurrences, confidence, confirmed, transaction_ids)
      VALUES (${item.id}, ${userId}, ${item.merchantKey}, ${item.label}, ${item.category}, ${item.averageAmount}, ${item.typicalDay}, ${item.occurrences}, ${item.confidence}, ${item.confirmed}, ${item.transactionIds})
    `;
  }
}

// ── Settings ──

export async function getSettings(): Promise<UserSettings> {
  const userId = await getRequiredUserId();
  const sql = getSQL();
  const rows = await sql`SELECT * FROM settings WHERE key = 'user' AND user_id = ${userId}`;
  const budgetRows = await sql`SELECT category, budget FROM category_budgets WHERE user_id = ${userId}`;
  const categoryBudgets: CategoryBudget[] = budgetRows.map((r: any) => ({
    category: r.category,
    budget: Number(r.budget),
  }));
  if (rows.length === 0) return { ...DEFAULT_SETTINGS, categoryBudgets };
  const r = rows[0];
  return {
    includeReserved: r.include_reserved as boolean,
    monthlyBudget: Number(r.monthly_budget),
    cashBuffer: Number(r.cash_buffer),
    categoryBudgets,
  };
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  const userId = await getRequiredUserId();
  const sql = getSQL();
  await sql`
    INSERT INTO settings (key, user_id, include_reserved, monthly_budget, cash_buffer)
    VALUES ('user', ${userId}, ${settings.includeReserved}, ${settings.monthlyBudget}, ${settings.cashBuffer})
    ON CONFLICT (key, user_id) DO UPDATE SET
      include_reserved = EXCLUDED.include_reserved,
      monthly_budget = EXCLUDED.monthly_budget,
      cash_buffer = EXCLUDED.cash_buffer
  `;
  // Sync category budgets
  await sql`DELETE FROM category_budgets WHERE user_id = ${userId}`;
  for (const cb of settings.categoryBudgets ?? []) {
    if (cb.budget > 0) {
      await sql`
        INSERT INTO category_budgets (user_id, category, budget)
        VALUES (${userId}, ${cb.category}, ${cb.budget})
      `;
    }
  }
}

// ── Custom Categories ──

export interface CustomCategory {
  name: string;
  color: string;
}

export async function getCustomCategories(): Promise<CustomCategory[]> {
  const userId = await getRequiredUserId();
  const sql = getSQL();
  const rows = await sql`SELECT name, color FROM custom_categories WHERE user_id = ${userId} ORDER BY name`;
  return rows.map((r) => ({ name: r.name as string, color: r.color as string }));
}

export async function addCustomCategory(name: string, color: string): Promise<void> {
  const userId = await getRequiredUserId();
  const sql = getSQL();
  await sql`
    INSERT INTO custom_categories (name, user_id, color)
    VALUES (${name}, ${userId}, ${color})
    ON CONFLICT (name, user_id) DO UPDATE SET color = EXCLUDED.color
  `;
}

export async function deleteCustomCategory(name: string): Promise<void> {
  const userId = await getRequiredUserId();
  const sql = getSQL();
  await sql`DELETE FROM custom_categories WHERE name = ${name} AND user_id = ${userId}`;
}

// ── CSV Export ──

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
    note: (r.note as string) || "",
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
