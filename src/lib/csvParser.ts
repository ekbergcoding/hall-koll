import { stableHash, getMonthKey } from "./utils";
import type { Transaction } from "./transactionModel";
import { deriveMerchantKey } from "./transactionModel";

interface RawRow {
  bokföringsdag: string;
  belopp: string;
  avsändare: string;
  mottagare: string;
  namn: string;
  rubrik: string;
  saldo: string;
  valuta: string;
}

function parseSwedishDecimal(value: string): number | null {
  if (!value || value.trim() === "") return null;
  const cleaned = value.trim().replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseBookingDate(value: string): { date: Date | null; isReserved: boolean } {
  const trimmed = value.trim();
  if (trimmed.toLowerCase() === "reserverat") {
    return { date: null, isReserved: true };
  }
  // Handle YYYY/MM/DD or YYYY-MM-DD
  const normalized = trimmed.replace(/\//g, "-");
  const parsed = new Date(normalized);
  if (isNaN(parsed.getTime())) {
    return { date: null, isReserved: false };
  }
  return { date: parsed, isReserved: false };
}

function detectSeparator(firstLine: string): string {
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  if (semicolonCount >= commaCount && semicolonCount >= tabCount) return ";";
  if (tabCount >= commaCount) return "\t";
  return ",";
}

function parseCSVLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === separator) {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

export interface ParseResult {
  transactions: Omit<Transaction, "category" | "tags" | "userOverride" | "note">[];
  errors: string[];
  totalRows: number;
  skippedRows: number;
}

export function parseNordeaCSV(csvContent: string): ParseResult {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return { transactions: [], errors: ["Filen är tom eller har bara en rad."], totalRows: 0, skippedRows: 0 };
  }

  const separator = detectSeparator(lines[0]);
  const headerLine = parseCSVLine(lines[0], separator);
  const normalizedHeaders = headerLine.map((h) => h.trim().toLowerCase());

  // Map expected columns
  const colMap = {
    bokföringsdag: normalizedHeaders.findIndex((h) => h.includes("bokföringsdag") || h.includes("bokforingsdag")),
    belopp: normalizedHeaders.findIndex((h) => h.includes("belopp")),
    avsändare: normalizedHeaders.findIndex((h) => h.includes("avsändare") || h.includes("avsandare")),
    mottagare: normalizedHeaders.findIndex((h) => h.includes("mottagare")),
    namn: normalizedHeaders.findIndex((h) => h.includes("namn")),
    rubrik: normalizedHeaders.findIndex((h) => h.includes("rubrik")),
    saldo: normalizedHeaders.findIndex((h) => h.includes("saldo")),
    valuta: normalizedHeaders.findIndex((h) => h.includes("valuta")),
  };

  const errors: string[] = [];
  if (colMap.bokföringsdag === -1) errors.push("Kolumn 'Bokföringsdag' hittades inte.");
  if (colMap.belopp === -1) errors.push("Kolumn 'Belopp' hittades inte.");
  if (colMap.rubrik === -1) errors.push("Kolumn 'Rubrik' hittades inte.");

  if (errors.length > 0) {
    return { transactions: [], errors, totalRows: lines.length - 1, skippedRows: lines.length - 1 };
  }

  const transactions: Omit<Transaction, "category" | "tags" | "userOverride" | "note">[] = [];
  let skippedRows = 0;

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i], separator);
    if (fields.length < 3) {
      skippedRows++;
      continue;
    }

    const raw: RawRow = {
      bokföringsdag: fields[colMap.bokföringsdag] || "",
      belopp: fields[colMap.belopp] || "",
      avsändare: colMap.avsändare >= 0 ? fields[colMap.avsändare] || "" : "",
      mottagare: colMap.mottagare >= 0 ? fields[colMap.mottagare] || "" : "",
      namn: colMap.namn >= 0 ? fields[colMap.namn] || "" : "",
      rubrik: fields[colMap.rubrik] || "",
      saldo: colMap.saldo >= 0 ? fields[colMap.saldo] || "" : "",
      valuta: colMap.valuta >= 0 ? fields[colMap.valuta] || "" : "",
    };

    const amount = parseSwedishDecimal(raw.belopp);
    if (amount === null) {
      skippedRows++;
      errors.push(`Rad ${i + 1}: Ogiltigt belopp "${raw.belopp}"`);
      continue;
    }

    const { date, isReserved } = parseBookingDate(raw.bokföringsdag);
    const saldo = parseSwedishDecimal(raw.saldo);
    const rubrik = raw.rubrik.trim();

    const hashInput = `${raw.bokföringsdag}|${raw.belopp}|${rubrik}|${raw.saldo}`;
    const id = stableHash(hashInput) + "_" + i.toString(36);

    const monthKey = date ? getMonthKey(date) : "reserverat";

    transactions.push({
      id,
      bookingDate: date ? date.toISOString() : null,
      isReserved,
      amount,
      currency: raw.valuta.trim() || "SEK",
      rubrik,
      sender: raw.avsändare.trim() || null,
      recipient: raw.mottagare.trim() || null,
      name: raw.namn.trim() || null,
      saldo,
      monthKey,
      merchantKey: deriveMerchantKey(rubrik),
    });
  }

  return {
    transactions,
    errors,
    totalRows: lines.length - 1,
    skippedRows,
  };
}

export function deduplicateTransactions(
  existing: Transaction[],
  incoming: Omit<Transaction, "category" | "tags" | "userOverride" | "note">[]
): Omit<Transaction, "category" | "tags" | "userOverride" | "note">[] {
  const existingKeys = new Set(existing.map((t) => `${t.bookingDate}|${t.amount}|${t.rubrik}|${t.saldo}`));
  return incoming.filter((t) => {
    const key = `${t.bookingDate}|${t.amount}|${t.rubrik}|${t.saldo}`;
    if (existingKeys.has(key)) return false;
    existingKeys.add(key);
    return true;
  });
}
