import type { Transaction } from "./transactionModel";
import { categorizeTransaction, DEFAULT_RULES, buildAutoTags } from "./categorizer";
import { deriveMerchantKey } from "./transactionModel";
import { getMonthKey, stableHash } from "./utils";

interface RawDemo {
  date: string;
  amount: number;
  rubrik: string;
  sender?: string;
  recipient?: string;
  name?: string;
}

const RAW_DEMO: RawDemo[] = [
  // January 2026
  { date: "2026-01-25", amount: 31788.40, rubrik: "Lon Januari", sender: "Arbetsgivare AB" },
  { date: "2026-01-26", amount: -8500, rubrik: "Overforing 679469-7" },
  { date: "2026-01-26", amount: -2500, rubrik: "Xtraspar" },
  { date: "2026-01-27", amount: -389.05, rubrik: "Kortkop 260127 NETFLIX.COM" },
  { date: "2026-01-27", amount: -119, rubrik: "Kortkop 260127 SPOTIFY AB" },
  { date: "2026-01-28", amount: -1245.50, rubrik: "Kortkop 260128 ICA MAXI UPPSAL" },
  { date: "2026-01-28", amount: -249, rubrik: "Kortkop 260128 FOODORA AB" },
  { date: "2026-01-29", amount: -3200, rubrik: "Anyfin 260129 Betalning" },
  { date: "2026-01-29", amount: -1500, rubrik: "Trustly Group AB" },
  { date: "2026-01-30", amount: -890, rubrik: "Kortkop 260130 COOP FORUM" },
  { date: "2026-01-30", amount: -199, rubrik: "Kortkop 260130 WOLT" },
  { date: "2026-01-31", amount: 500, rubrik: "Swish inbetalning ANNA SVENSSON" },
  { date: "2026-01-31", amount: -350, rubrik: "Kortkop 260131 MELODY CLUB" },
  { date: "2026-01-31", amount: -1000, rubrik: "Kontantuttag 260131 BANKOMAT UPPSAL" },

  // February 2026
  { date: "2026-02-25", amount: 31788.40, rubrik: "Lon Februari", sender: "Arbetsgivare AB" },
  { date: "2026-02-25", amount: -8500, rubrik: "Overforing 679469-7" },
  { date: "2026-02-25", amount: -2500, rubrik: "Xtraspar" },
  { date: "2026-02-26", amount: -389.05, rubrik: "Kortkop 260226 NETFLIX.COM" },
  { date: "2026-02-26", amount: -119, rubrik: "Kortkop 260226 SPOTIFY AB" },
  { date: "2026-02-27", amount: -1567.30, rubrik: "Kortkop 260227 ICA KVANTUM" },
  { date: "2026-02-27", amount: -189, rubrik: "Kortkop 260227 FOODORA AB" },
  { date: "2026-02-28", amount: -3200, rubrik: "Anyfin 260228 Betalning" },
  { date: "2026-02-28", amount: -1500, rubrik: "Trustly Group AB" },
  { date: "2026-02-28", amount: -745, rubrik: "Kortkop 260228 WILLYS" },
  { date: "2026-02-28", amount: -329, rubrik: "Kortkop 260228 HEMKOP" },
  { date: "2026-02-28", amount: -450, rubrik: "Kortkop 260228 STATIONEN" },
  { date: "2026-02-28", amount: 250, rubrik: "Swish inbetalning ERIK JOHANSSON" },
  { date: "2026-02-28", amount: -2100, rubrik: "Kortkop 260228 BOOKING.COM" },
  { date: "2026-02-28", amount: -159, rubrik: "Kortkop 260228 VIAPLAY AB" },
  { date: "2026-02-15", amount: -1200, rubrik: "Sevenday 260215 Lanebetal" },
  { date: "2026-02-10", amount: -899, rubrik: "Klarna 260210 Faktura" },
  { date: "2026-02-05", amount: -3500, rubrik: "Revolut*Top-up" },

  // March 2026 partial
  { date: "2026-03-01", amount: -289, rubrik: "Kortkop 260301 FOODORA AB" },
  { date: "2026-03-01", amount: -1890, rubrik: "Kortkop 260301 LIDL" },
];

let runningBalance = 45320.55;

export function generateDemoTransactions(): Transaction[] {
  return RAW_DEMO.map((raw, idx) => {
    const date = new Date(raw.date);
    const monthKey = getMonthKey(date);
    const hashInput = `${raw.date}|${raw.amount}|${raw.rubrik}|demo`;
    const id = "demo_" + stableHash(hashInput) + "_" + idx.toString(36);
    const merchantKey = deriveMerchantKey(raw.rubrik);

    runningBalance += raw.amount;

    const result = categorizeTransaction(
      { rubrik: raw.rubrik, name: raw.name || null, amount: raw.amount },
      DEFAULT_RULES
    );

    const transaction: Transaction = {
      id,
      bookingDate: date.toISOString(),
      isReserved: false,
      amount: raw.amount,
      currency: "SEK",
      rubrik: raw.rubrik,
      sender: raw.sender || null,
      recipient: raw.recipient || null,
      name: raw.name || null,
      saldo: Math.round(runningBalance * 100) / 100,
      monthKey,
      category: result.category,
      merchantKey: result.merchantKey || merchantKey,
      tags: [],
      userOverride: false,
      note: "",
    };

    transaction.tags = buildAutoTags(transaction);
    return transaction;
  });
}
