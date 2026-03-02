import { readFileSync } from "fs";
import { resolve } from "path";
import { neon } from "@neondatabase/serverless";

const envFile = readFileSync(resolve(__dirname, "../.env.local"), "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^(\w+)="?([^"]*)"?$/);
  if (match) process.env[match[1]] = match[2];
}

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log("Creating tables...");

  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      booking_date TIMESTAMPTZ,
      is_reserved BOOLEAN DEFAULT false,
      amount NUMERIC(12,2) NOT NULL,
      currency TEXT DEFAULT 'SEK',
      rubrik TEXT NOT NULL,
      sender TEXT,
      recipient TEXT,
      name TEXT,
      saldo NUMERIC(12,2),
      month_key TEXT NOT NULL,
      category TEXT NOT NULL,
      merchant_key TEXT NOT NULL,
      tags TEXT[] DEFAULT '{}',
      user_override BOOLEAN DEFAULT false
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY,
      field TEXT NOT NULL,
      match_type TEXT NOT NULL,
      pattern TEXT NOT NULL,
      category TEXT NOT NULL,
      merchant_key TEXT,
      amount_condition TEXT,
      priority INTEGER NOT NULL,
      is_default BOOLEAN DEFAULT false,
      enabled BOOLEAN DEFAULT true
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS recurring (
      id TEXT PRIMARY KEY,
      merchant_key TEXT NOT NULL,
      label TEXT NOT NULL,
      category TEXT NOT NULL,
      average_amount NUMERIC(12,2) NOT NULL,
      typical_day INTEGER NOT NULL,
      occurrences INTEGER NOT NULL,
      confidence NUMERIC(5,4) NOT NULL,
      confirmed BOOLEAN DEFAULT false,
      transaction_ids TEXT[] DEFAULT '{}'
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      include_reserved BOOLEAN DEFAULT false,
      monthly_budget NUMERIC(12,2) DEFAULT 15000,
      cash_buffer NUMERIC(12,2) DEFAULT 0
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant_key)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_transactions_month ON transactions(month_key)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)`;

  console.log("Migration complete!");
}

main().catch(console.error);
