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

  console.log("Dropping old tables (no user data to preserve)...");
  await sql`DROP TABLE IF EXISTS custom_categories CASCADE`;
  await sql`DROP TABLE IF EXISTS recurring CASCADE`;
  await sql`DROP TABLE IF EXISTS settings CASCADE`;
  await sql`DROP TABLE IF EXISTS rules CASCADE`;
  await sql`DROP TABLE IF EXISTS transactions CASCADE`;
  await sql`DROP TABLE IF EXISTS verification_tokens CASCADE`;
  await sql`DROP TABLE IF EXISTS sessions CASCADE`;
  await sql`DROP TABLE IF EXISTS accounts CASCADE`;
  await sql`DROP TABLE IF EXISTS users CASCADE`;

  console.log("Creating auth tables...");

  await sql`
    CREATE TABLE users (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT,
      email TEXT UNIQUE,
      "emailVerified" TIMESTAMPTZ,
      image TEXT
    )
  `;

  await sql`
    CREATE TABLE accounts (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      "providerAccountId" TEXT NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INTEGER,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      session_state TEXT
    )
  `;

  await sql`
    CREATE TABLE sessions (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "sessionToken" TEXT NOT NULL UNIQUE,
      "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires TIMESTAMPTZ NOT NULL
    )
  `;

  await sql`
    CREATE TABLE verification_tokens (
      identifier TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires TIMESTAMPTZ NOT NULL,
      PRIMARY KEY (identifier, token)
    )
  `;

  console.log("Creating app data tables...");

  await sql`
    CREATE TABLE transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    CREATE TABLE rules (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    CREATE TABLE recurring (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    CREATE TABLE settings (
      key TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      include_reserved BOOLEAN DEFAULT false,
      monthly_budget NUMERIC(12,2) DEFAULT 15000,
      cash_buffer NUMERIC(12,2) DEFAULT 0,
      PRIMARY KEY (key, user_id)
    )
  `;

  await sql`
    CREATE TABLE custom_categories (
      name TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      color TEXT NOT NULL,
      PRIMARY KEY (name, user_id)
    )
  `;

  console.log("Creating indexes...");
  await sql`CREATE INDEX idx_transactions_user ON transactions(user_id)`;
  await sql`CREATE INDEX idx_transactions_merchant ON transactions(merchant_key)`;
  await sql`CREATE INDEX idx_transactions_month ON transactions(month_key)`;
  await sql`CREATE INDEX idx_transactions_category ON transactions(category)`;
  await sql`CREATE INDEX idx_rules_user ON rules(user_id)`;
  await sql`CREATE INDEX idx_recurring_user ON recurring(user_id)`;

  console.log("Migration complete!");
}

main().catch(console.error);
