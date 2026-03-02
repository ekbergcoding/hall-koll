"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import type { Transaction, CategorizationRule, RecurringItem, UserSettings } from "@/lib/transactionModel";
import { DEFAULT_SETTINGS } from "@/lib/transactionModel";
import { DEFAULT_RULES, applyCategorizationToAll, buildAutoTags, categorizeTransaction } from "@/lib/categorizer";
import { parseNordeaCSV, deduplicateTransactions } from "@/lib/csvParser";
import { detectRecurring } from "@/lib/recurring";
import { generateDemoTransactions } from "@/lib/demoData";
import {
  getAllTransactions, saveTransactions, updateTransaction as dbUpdateTransaction, clearTransactions,
  getAllRules, saveRules, addRule as dbAddRule, deleteRule as dbDeleteRule,
  getAllRecurring, saveRecurring,
  getSettings, saveSettings,
  exportTransactionsToCSV,
} from "@/lib/storage";
import { deriveMerchantKey } from "@/lib/transactionModel";

interface AppState {
  transactions: Transaction[];
  rules: CategorizationRule[];
  recurringItems: RecurringItem[];
  settings: UserSettings;
  isLoading: boolean;
  importCSV: (content: string) => Promise<{ added: number; errors: string[] }>;
  updateTransactionCategory: (id: string, category: Transaction["category"]) => void;
  updateCategoryByMerchant: (merchantKey: string, category: Transaction["category"]) => void;
  createRuleFromTransaction: (transaction: Transaction, category: Transaction["category"]) => void;
  addRule: (rule: CategorizationRule) => void;
  updateRule: (rule: CategorizationRule) => void;
  deleteRule: (id: string) => void;
  toggleRecurring: (id: string) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  exportCSV: () => string;
  clearAllData: () => void;
  loadDemoData: () => void;
  refreshRecurring: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rules, setRules] = useState<CategorizationRule[]>([]);
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function load() {
      try {
        const [txns, loadedRules, recurring, loadedSettings] = await Promise.all([
          getAllTransactions(),
          getAllRules(),
          getAllRecurring(),
          getSettings(),
        ]);

        if (txns.length === 0) {
          const demo = generateDemoTransactions();
          await saveTransactions(demo);
          setTransactions(demo);
        } else {
          setTransactions(txns);
        }

        setRules(loadedRules);
        setRecurringItems(recurring);
        setSettings(loadedSettings);
      } catch {
        const demo = generateDemoTransactions();
        setTransactions(demo);
        setRules(DEFAULT_RULES);
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const importCSV = useCallback(async (content: string) => {
    const result = parseNordeaCSV(content);
    if (result.transactions.length === 0) {
      return { added: 0, errors: result.errors };
    }

    const currentTxns = await getAllTransactions();
    const deduped = deduplicateTransactions(currentTxns, result.transactions);
    const currentRules = await getAllRules();

    const categorized: Transaction[] = deduped.map((t) => {
      const catResult = categorizeTransaction(t, currentRules);
      const txn: Transaction = {
        ...t,
        category: catResult.category,
        merchantKey: catResult.merchantKey || t.merchantKey,
        tags: [],
        userOverride: false,
      };
      txn.tags = buildAutoTags(txn);
      return txn;
    });

    await saveTransactions(categorized);
    const allTxns = await getAllTransactions();
    setTransactions(allTxns);

    return { added: categorized.length, errors: result.errors };
  }, []);

  const updateTransactionCategory = useCallback(async (id: string, category: Transaction["category"]) => {
    setTransactions((prev) => {
      const updated = prev.map((t) =>
        t.id === id ? { ...t, category, userOverride: true, tags: buildAutoTags({ ...t, category, userOverride: true }) } : t
      );
      const found = updated.find((t) => t.id === id);
      if (found) dbUpdateTransaction(found);
      return updated;
    });
  }, []);

  const updateCategoryByMerchant = useCallback(async (merchantKey: string, category: Transaction["category"]) => {
    setTransactions((prev) => {
      const updated = prev.map((t) =>
        t.merchantKey === merchantKey
          ? { ...t, category, userOverride: true, tags: buildAutoTags({ ...t, category, userOverride: true }) }
          : t
      );
      const changed = updated.filter((t) => t.merchantKey === merchantKey);
      for (const t of changed) dbUpdateTransaction(t);
      return updated;
    });
  }, []);

  const createRuleFromTransaction = useCallback(async (transaction: Transaction, category: Transaction["category"]) => {
    const mKey = deriveMerchantKey(transaction.rubrik);
    const newRule: CategorizationRule = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      field: "rubrik",
      matchType: "contains",
      pattern: mKey,
      category,
      merchantKey: mKey,
      priority: 25,
      isDefault: false,
      enabled: true,
    };

    await dbAddRule(newRule);
    const allRules = await getAllRules();
    setRules(allRules);

    setTransactions((prev) => {
      const updated = applyCategorizationToAll(prev, allRules).map((t) => ({
        ...t,
        tags: buildAutoTags(t),
      }));
      saveTransactions(updated);
      return updated;
    });
  }, []);

  const addRuleCb = useCallback(async (rule: CategorizationRule) => {
    await dbAddRule(rule);
    const allRules = await getAllRules();
    setRules(allRules);

    setTransactions((prev) => {
      const updated = applyCategorizationToAll(prev, allRules).map((t) => ({
        ...t,
        tags: buildAutoTags(t),
      }));
      saveTransactions(updated);
      return updated;
    });
  }, []);

  const updateRuleCb = useCallback(async (rule: CategorizationRule) => {
    await dbAddRule(rule);
    const allRules = await getAllRules();
    setRules(allRules);

    setTransactions((prev) => {
      const updated = applyCategorizationToAll(prev, allRules).map((t) => ({
        ...t,
        tags: buildAutoTags(t),
      }));
      saveTransactions(updated);
      return updated;
    });
  }, []);

  const deleteRuleCb = useCallback(async (id: string) => {
    await dbDeleteRule(id);
    const allRules = await getAllRules();
    setRules(allRules);
  }, []);

  const toggleRecurring = useCallback(async (id: string) => {
    setRecurringItems((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, confirmed: !r.confirmed } : r));
      saveRecurring(updated);
      return updated;
    });
  }, []);

  const updateSettingsCb = useCallback(async (partial: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const exportCSV = useCallback(() => {
    return exportTransactionsToCSV(transactions);
  }, [transactions]);

  const clearAllData = useCallback(async () => {
    await clearTransactions();
    await saveRules(DEFAULT_RULES);
    await saveRecurring([]);
    await saveSettings(DEFAULT_SETTINGS);
    setTransactions([]);
    setRules(DEFAULT_RULES);
    setRecurringItems([]);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const loadDemoData = useCallback(async () => {
    const demo = generateDemoTransactions();
    await clearTransactions();
    await saveTransactions(demo);
    setTransactions(demo);
  }, []);

  const refreshRecurring = useCallback(() => {
    const confirmed = new Set(recurringItems.filter((r) => r.confirmed).map((r) => r.id));
    const detected = detectRecurring(transactions, confirmed);
    setRecurringItems(detected);
    saveRecurring(detected);
  }, [transactions, recurringItems]);

  return (
    <AppContext.Provider
      value={{
        transactions,
        rules,
        recurringItems,
        settings,
        isLoading,
        importCSV,
        updateTransactionCategory,
        updateCategoryByMerchant,
        createRuleFromTransaction,
        addRule: addRuleCb,
        updateRule: updateRuleCb,
        deleteRule: deleteRuleCb,
        toggleRecurring,
        updateSettings: updateSettingsCb,
        exportCSV,
        clearAllData,
        loadDemoData,
        refreshRecurring,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
}
