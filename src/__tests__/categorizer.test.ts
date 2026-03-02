import { describe, it, expect } from "vitest";
import { categorizeTransaction, DEFAULT_RULES, applyCategorizationToAll, buildAutoTags } from "@/lib/categorizer";
import type { Transaction } from "@/lib/transactionModel";

describe("categorizeTransaction", () => {
  it("categorizes salary as Inkomst", () => {
    const result = categorizeTransaction(
      { rubrik: "Lön Januari", name: null, amount: 31788.4 },
      DEFAULT_RULES
    );
    expect(result.category).toBe("Inkomst");
  });

  it("categorizes Swish inbetalning as Inkomst", () => {
    const result = categorizeTransaction(
      { rubrik: "Swish inbetalning ANNA SVENSSON", name: null, amount: 500 },
      DEFAULT_RULES
    );
    expect(result.category).toBe("Inkomst");
  });

  it("categorizes Bankgiroinsättning as Inkomst", () => {
    const result = categorizeTransaction(
      { rubrik: "Bankgiroinsättning Ferratum 055", name: null, amount: 5000 },
      DEFAULT_RULES
    );
    expect(result.category).toBe("Inkomst");
  });

  it("categorizes NETFLIX as Abonnemang, streaming", () => {
    const result = categorizeTransaction(
      { rubrik: "Kortköp 260127 NETFLIX.COM", name: null, amount: -389.05 },
      DEFAULT_RULES
    );
    expect(result.category).toBe("Abonnemang, streaming");
  });

  it("categorizes SPOTIFY as Abonnemang, streaming", () => {
    const result = categorizeTransaction(
      { rubrik: "Kortköp 260127 SPOTIFY AB", name: null, amount: -119 },
      DEFAULT_RULES
    );
    expect(result.category).toBe("Abonnemang, streaming");
  });

  it("categorizes ICA as Mat, butik", () => {
    const result = categorizeTransaction(
      { rubrik: "Kortköp 260128 ICA MAXI UPPSAL", name: null, amount: -1245.5 },
      DEFAULT_RULES
    );
    expect(result.category).toBe("Mat, butik");
  });

  it("categorizes FOODORA as Mat, leverans", () => {
    const result = categorizeTransaction(
      { rubrik: "Kortköp 260301 FOODORA AB", name: null, amount: -289 },
      DEFAULT_RULES
    );
    expect(result.category).toBe("Mat, leverans");
  });

  it("categorizes Överföring as internal transfer", () => {
    const result = categorizeTransaction(
      { rubrik: "Överföring 679469-7", name: null, amount: -8500 },
      DEFAULT_RULES
    );
    expect(result.category).toBe("Överföringar, interna flyttar");
  });

  it("categorizes Xtraspar as internal transfer", () => {
    const result = categorizeTransaction(
      { rubrik: "Xtraspar", name: null, amount: -2500 },
      DEFAULT_RULES
    );
    expect(result.category).toBe("Överföringar, interna flyttar");
  });

  it("categorizes Anyfin as debt payment", () => {
    const result = categorizeTransaction(
      { rubrik: "Anyfin 260129 Betalning", name: null, amount: -3200 },
      DEFAULT_RULES
    );
    expect(result.category).toBe("Skuld, lån, amortering");
  });

  it("categorizes Trustly (negative amount) as debt payment", () => {
    const result = categorizeTransaction(
      { rubrik: "Trustly Group AB", name: null, amount: -1500 },
      DEFAULT_RULES
    );
    expect(result.category).toBe("Skuld, lån, amortering");
  });

  it("does NOT categorize Trustly (positive amount) as debt payment", () => {
    const result = categorizeTransaction(
      { rubrik: "Trustly Group AB", name: null, amount: 500 },
      DEFAULT_RULES
    );
    expect(result.category).not.toBe("Skuld, lån, amortering");
  });

  it("categorizes Ferratum (negative) as debt payment", () => {
    const result = categorizeTransaction(
      { rubrik: "Ferratum betalning", name: null, amount: -2000 },
      DEFAULT_RULES
    );
    expect(result.category).toBe("Skuld, lån, amortering");
  });

  it("categorizes Ferratum (positive/incoming) as Inkomst due to Bankgiroinsättning", () => {
    const result = categorizeTransaction(
      { rubrik: "Bankgiroinsättning Ferratum 055", name: null, amount: 5000 },
      DEFAULT_RULES
    );
    expect(result.category).toBe("Inkomst");
  });

  it("categorizes Kontantuttag as ATM", () => {
    const result = categorizeTransaction(
      { rubrik: "Kontantuttag 251130 BANKOMAT UPPSAL", name: null, amount: -1000 },
      DEFAULT_RULES
    );
    expect(result.category).toBe("Kontantuttag");
  });

  it("categorizes BOOKING as Resor", () => {
    const result = categorizeTransaction(
      { rubrik: "Kortköp 260228 BOOKING.COM", name: null, amount: -2100 },
      DEFAULT_RULES
    );
    expect(result.category).toBe("Resor");
  });

  it("categorizes MELODY CLUB as entertainment", () => {
    const result = categorizeTransaction(
      { rubrik: "Kortköp 260131 MELODY CLUB", name: null, amount: -350 },
      DEFAULT_RULES
    );
    expect(result.category).toBe("Nöje, bar, restaurang");
  });

  it("defaults positive amounts to Inkomst", () => {
    const result = categorizeTransaction(
      { rubrik: "Okänd insättning XYZ", name: null, amount: 1000 },
      DEFAULT_RULES
    );
    expect(result.category).toBe("Inkomst");
  });

  it("defaults unknown negative amounts to Övrigt", () => {
    const result = categorizeTransaction(
      { rubrik: "Kortköp 260301 RANDOM SHOP", name: null, amount: -150 },
      DEFAULT_RULES
    );
    expect(result.category).toBe("Övrigt");
  });

  it("matching is case-insensitive", () => {
    const result = categorizeTransaction(
      { rubrik: "kortköp 260301 netflix.com", name: null, amount: -100 },
      DEFAULT_RULES
    );
    expect(result.category).toBe("Abonnemang, streaming");
  });
});

describe("buildAutoTags", () => {
  it("tags reserved transactions", () => {
    const t = { isReserved: true, category: "Övrigt", userOverride: false } as Transaction;
    expect(buildAutoTags(t)).toContain("Reserverad");
  });

  it("tags debt candidates", () => {
    const t = { isReserved: false, category: "Skuld, lån, amortering", userOverride: false } as Transaction;
    expect(buildAutoTags(t)).toContain("Auto: skuldkandidat");
  });

  it("does not tag user-overridden debt as candidate", () => {
    const t = { isReserved: false, category: "Skuld, lån, amortering", userOverride: true } as Transaction;
    expect(buildAutoTags(t)).not.toContain("Auto: skuldkandidat");
  });
});

describe("applyCategorizationToAll", () => {
  it("does not overwrite user-overridden transactions", () => {
    const transactions: Transaction[] = [
      {
        id: "1",
        bookingDate: "2026-01-01T00:00:00.000Z",
        isReserved: false,
        amount: -100,
        currency: "SEK",
        rubrik: "Kortköp 260101 NETFLIX.COM",
        sender: null,
        recipient: null,
        name: null,
        saldo: 1000,
        monthKey: "2026-01",
        category: "Konsumtion",
        merchantKey: "NETFLIX",
        tags: [],
        userOverride: true,
      },
    ];
    const result = applyCategorizationToAll(transactions, DEFAULT_RULES);
    expect(result[0].category).toBe("Konsumtion"); // not overwritten to streaming
  });
});
