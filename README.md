# Håll koll på dina utgifter

En lokal webbapp för att analysera Nordea kontoutdrag (CSV). All data lagras i din webbläsare — inget skickas till någon server.

## Funktioner

- **Dashboard** med KPI-kort (inkomst, konsumtion, skuld, överföringar, nettokassaflöde), trenddiagram och kategorifördelning
- **Transaktioner** med sök, filter, sortering och inline-reklassificering
- **Regler** — en kategoriseringsmotor med contains/startsWith/regex, prioritetsordning, standardregler för svenska mönster
- **Återkommande** — automatisk identifiering av månatliga utgifter baserat på handlare, belopp och dag
- **Prognos** — budget vs faktisk konsumtion, projicering, kassaflödesrunway
- **Import/export** — dra-och-släpp CSV-import, CSV-export av kategoriserad data
- **Demodata** — appen laddas med exempeltransaktioner så du kan utforska direkt

## Kom igång

```bash
# Installera beroenden
npm install

# Starta utvecklingsservern
npm run dev

# Bygg för produktion
npm run build

# Kör tester
npm test
```

Öppna [http://localhost:3000](http://localhost:3000) i din webbläsare.

## Hur du exporterar CSV från Nordea

1. Logga in på Nordeas internetbank
2. Gå till ditt konto → Kontoutdrag / Transaktioner
3. Välj tidsperiod
4. Klicka "Exportera" och välj CSV-format
5. Spara filen och ladda upp den i appen

## CSV-format (Nordea)

Appen förväntar sig detta format:

| Kolumn | Beskrivning |
|--------|-------------|
| Bokföringsdag | `YYYY/MM/DD` eller `Reserverat` |
| Belopp | Svenskt decimalformat med komma: `-389,05`, `31788,40` |
| Avsändare | Valfritt |
| Mottagare | Valfritt |
| Namn | Valfritt |
| Rubrik | Transaktionsbeskrivning |
| Saldo | Kontosaldo efter transaktion |
| Valuta | Vanligtvis `SEK` |

- **Separator:** semikolon (`;`), auto-detekteras
- **Negativt belopp** = pengar ut, **positivt** = pengar in
- Rader med `Reserverat` som bokföringsdag markeras som reserverade och exkluderas som standard

## Hur parsing fungerar

1. **CSV-tolkning** (`src/lib/csvParser.ts`): Filen delas på rader, separator auto-detekteras (standard `;`). Kolumner mappas via headernamn. Belopp och saldo parsas med svensk decimalkomma (`-389,05` → `-389.05`).

2. **Deduplicering**: Varje transaktion får ett stabilt hash-ID baserat på (bokföringsdag, belopp, rubrik, saldo). Vid upprepad import ignoreras dubbletter.

3. **Kategorisering** (`src/lib/categorizer.ts`): Regler körs i prioritetsordning. Första matchning vinner. Regler matchar mot `rubrik` eller `namn` med contains/startsWith/regex. Vissa regler har beloppsvillkor (t.ex. Trustly + negativt → skuld).

4. **Persistens** (`src/lib/storage.ts`): Transaktioner, regler, återkommande och inställningar lagras i IndexedDB via `idb`-biblioteket.

## Regler och kategorisering

Standardregler klassificerar vanliga svenska bankmönster:

- **Inkomst**: Lön, Swish inbetalning, Bankgiroinsättning, Insättning, Återbetalning
- **Överföringar**: Överföring, Xtraspar, Revolut
- **Skuldbetalningar**: Anyfin, Sevenday, MedMera, Klarna, Ferratum (negativt), Trustly (negativt)
- **Kontantuttag**: Kontantuttag, BANKOMAT
- **Mat, butik**: ICA, COOP, HEMKÖP, WILLYS, LIDL
- **Mat, leverans**: FOODORA, WOLT
- **Abonnemang**: NETFLIX, SPOTIFY, VIAPLAY, HBO
- **Resor**: BOOKING, KIWI.COM
- **Nöje**: MELODY CLUB, STATIONEN

### Ändra regler

1. Gå till **Regler** i sidomenyn
2. Klicka **Ny regel** för att skapa en egen
3. Eller redigera/ta bort befintliga regler
4. Regler tillämpas direkt på alla transaktioner

### Ändra enskild transaktion

1. I transaktionstabellen, använd kategoriväljaren för att byta kategori
2. Klicka **Alla liknande** för att skapa en regel som tillämpas på alla med samma handlare

## Tech stack

- [Next.js](https://nextjs.org) App Router + TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4
- [shadcn/ui](https://ui.shadcn.com)-liknande komponenter (Radix UI)
- [Recharts](https://recharts.org)
- [idb](https://github.com/jakearchibald/idb) (IndexedDB wrapper)
- [Vitest](https://vitest.dev) för enhetstester

## Projektstruktur

```
src/
├── app/                    # Next.js App Router sidor
│   ├── page.tsx            # Dashboard
│   ├── transaktioner/      # Transaktionslista
│   ├── aterkommande/       # Återkommande utgifter
│   ├── regler/             # Regelhantering
│   ├── prognos/            # Prognos & budget
│   └── installningar/      # Inställningar, import/export
├── components/
│   ├── ui/                 # shadcn-liknande baskomponenter
│   ├── dashboard/          # KPI-kort, diagram, handlarlista
│   ├── transactions/       # Transaktionstabell, kategoriväljare
│   ├── import/             # Filuppladdning
│   └── layout/             # Sidebar, AppShell
├── hooks/
│   └── useAppStore.tsx     # Global state (React context + IndexedDB)
├── lib/
│   ├── csvParser.ts        # CSV-tolkning
│   ├── transactionModel.ts # Typer, kategorier, hjälpfunktioner
│   ├── categorizer.ts      # Regelmotor + standardregler
│   ├── recurring.ts        # Återkommande-detektion
│   ├── analytics.ts        # Beräkningar (månadsstatistik, kategoribrytning)
│   ├── storage.ts          # IndexedDB CRUD + CSV-export
│   ├── demoData.ts         # Seed-data
│   └── utils.ts            # Formatering, hashing
└── __tests__/              # Enhetstester
    ├── csvParser.test.ts
    └── categorizer.test.ts
```
