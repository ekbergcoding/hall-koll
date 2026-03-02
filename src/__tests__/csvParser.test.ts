import { describe, it, expect } from "vitest";
import { parseNordeaCSV, deduplicateTransactions } from "@/lib/csvParser";
import type { Transaction } from "@/lib/transactionModel";

const SAMPLE_CSV = `Bokföringsdag;Belopp;Avsändare;Mottagare;Namn;Rubrik;Saldo;Valuta;
2026/01/25;31788,40;;;Arbetsgivare AB;Lön Januari;45320,55;SEK;
2026/01/27;-389,05;;;;Kortköp 260127 NETFLIX.COM;44931,50;SEK;
2026/01/28;-1245,50;;;;Kortköp 260128 ICA MAXI UPPSAL;43686,00;SEK;
Reserverat;-199,00;;;;Reservation Kortköp FOODORA AB;;SEK;`;

describe("parseNordeaCSV", () => {
  it("parses a valid Nordea CSV with semicolons and Swedish decimals", () => {
    const result = parseNordeaCSV(SAMPLE_CSV);
    expect(result.errors).toHaveLength(0);
    expect(result.transactions).toHaveLength(4);
    expect(result.totalRows).toBe(4);
    expect(result.skippedRows).toBe(0);
  });

  it("parses amounts correctly with Swedish comma decimals", () => {
    const result = parseNordeaCSV(SAMPLE_CSV);
    expect(result.transactions[0].amount).toBe(31788.40);
    expect(result.transactions[1].amount).toBe(-389.05);
    expect(result.transactions[2].amount).toBe(-1245.50);
  });

  it("parses dates in YYYY/MM/DD format", () => {
    const result = parseNordeaCSV(SAMPLE_CSV);
    const firstDate = new Date(result.transactions[0].bookingDate!);
    expect(firstDate.getFullYear()).toBe(2026);
    expect(firstDate.getMonth()).toBe(0); // January
    expect(firstDate.getDate()).toBe(25);
  });

  it('identifies reserved rows with "Reserverat" as booking date', () => {
    const result = parseNordeaCSV(SAMPLE_CSV);
    const reserved = result.transactions.find((t) => t.isReserved);
    expect(reserved).toBeDefined();
    expect(reserved!.bookingDate).toBeNull();
    expect(reserved!.monthKey).toBe("reserverat");
  });

  it("parses Saldo with Swedish decimal format", () => {
    const result = parseNordeaCSV(SAMPLE_CSV);
    expect(result.transactions[0].saldo).toBe(45320.55);
    expect(result.transactions[2].saldo).toBe(43686.00);
  });

  it("sets currency to SEK", () => {
    const result = parseNordeaCSV(SAMPLE_CSV);
    result.transactions.forEach((t) => expect(t.currency).toBe("SEK"));
  });

  it("derives monthKey from booking date", () => {
    const result = parseNordeaCSV(SAMPLE_CSV);
    expect(result.transactions[0].monthKey).toBe("2026-01");
  });

  it("returns errors for empty input", () => {
    const result = parseNordeaCSV("");
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.transactions).toHaveLength(0);
  });

  it("handles header-only CSV", () => {
    const result = parseNordeaCSV("Bokföringsdag;Belopp;Rubrik;Saldo;Valuta");
    expect(result.transactions).toHaveLength(0);
  });

  it("reports error for invalid amount", () => {
    const csv = `Bokföringsdag;Belopp;Avsändare;Mottagare;Namn;Rubrik;Saldo;Valuta;\n2026/01/01;abc;;;;Test;100,00;SEK;`;
    const result = parseNordeaCSV(csv);
    expect(result.skippedRows).toBe(1);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("generates stable IDs", () => {
    const r1 = parseNordeaCSV(SAMPLE_CSV);
    const r2 = parseNordeaCSV(SAMPLE_CSV);
    expect(r1.transactions[0].id).toBe(r2.transactions[0].id);
  });
});

describe("deduplicateTransactions", () => {
  it("removes duplicates based on (date, amount, rubrik, saldo)", () => {
    const result = parseNordeaCSV(SAMPLE_CSV);
    const existing: Transaction[] = result.transactions.slice(0, 2).map((t) => ({
      ...t,
      category: "Övrigt" as const,
      tags: [],
      userOverride: false,
    }));
    const deduped = deduplicateTransactions(existing, result.transactions);
    expect(deduped).toHaveLength(2); // only the 2 non-duplicates
  });

  it("keeps all items when no duplicates", () => {
    const result = parseNordeaCSV(SAMPLE_CSV);
    const deduped = deduplicateTransactions([], result.transactions);
    expect(deduped).toHaveLength(result.transactions.length);
  });
});
