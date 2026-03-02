"use client";

import React, { useState } from "react";
import { useAppStore } from "@/hooks/useAppStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { CATEGORIES, type Category, type CategorizationRule } from "@/lib/transactionModel";
import { Plus, Trash2, Pencil } from "lucide-react";

export default function ReglerPage() {
  const { rules, addRule, updateRule, deleteRule, isLoading } = useAppStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CategorizationRule | null>(null);

  const [field, setField] = useState<"rubrik" | "name">("rubrik");
  const [matchType, setMatchType] = useState<"contains" | "startsWith" | "regex">("contains");
  const [pattern, setPattern] = useState("");
  const [category, setCategory] = useState<Category>("Övrigt");
  const [merchantKey, setMerchantKey] = useState("");
  const [amountCondition, setAmountCondition] = useState<"" | "negative" | "positive">("");
  const [priority, setPriority] = useState(25);

  function openNew() {
    setEditingRule(null);
    setField("rubrik");
    setMatchType("contains");
    setPattern("");
    setCategory("Övrigt");
    setMerchantKey("");
    setAmountCondition("");
    setPriority(25);
    setDialogOpen(true);
  }

  function openEdit(rule: CategorizationRule) {
    setEditingRule(rule);
    setField(rule.field);
    setMatchType(rule.matchType);
    setPattern(rule.pattern);
    setCategory(rule.category);
    setMerchantKey(rule.merchantKey || "");
    setAmountCondition(rule.amountCondition || "");
    setPriority(rule.priority);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!pattern.trim()) return;
    const rule: CategorizationRule = {
      id: editingRule?.id || `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      field,
      matchType,
      pattern: pattern.trim(),
      category,
      merchantKey: merchantKey.trim() || undefined,
      amountCondition: amountCondition || undefined,
      priority,
      isDefault: editingRule?.isDefault || false,
      enabled: true,
    };

    if (editingRule) {
      updateRule(rule);
    } else {
      addRule(rule);
    }
    setDialogOpen(false);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
      </div>
    );
  }

  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Regler</h1>
          <p className="text-sm text-muted-foreground">
            Hantera kategoriseringsregler. Regler tillämpas i prioritetsordning (lägre = högre prioritet).
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" />
              Ny regel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRule ? "Redigera regel" : "Skapa ny regel"}</DialogTitle>
              <DialogDescription>
                Regler matchar mot transaktionens rubrik eller namn och tilldelar en kategori.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Fält</Label>
                  <Select value={field} onValueChange={(v) => setField(v as "rubrik" | "name")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rubrik">Rubrik</SelectItem>
                      <SelectItem value="name">Namn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Matchningstyp</Label>
                  <Select value={matchType} onValueChange={(v) => setMatchType(v as typeof matchType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contains">Innehåller</SelectItem>
                      <SelectItem value="startsWith">Börjar med</SelectItem>
                      <SelectItem value="regex">Regex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs">Mönster</Label>
                <Input value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="t.ex. NETFLIX" />
              </div>

              <div>
                <Label className="text-xs">Kategori</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Handlarnyckel (valfritt)</Label>
                  <Input value={merchantKey} onChange={(e) => setMerchantKey(e.target.value)} placeholder="t.ex. NETFLIX" />
                </div>
                <div>
                  <Label className="text-xs">Beloppsvillkor</Label>
                  <Select value={amountCondition} onValueChange={(v) => setAmountCondition(v as typeof amountCondition)}>
                    <SelectTrigger><SelectValue placeholder="Inget" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">Inget</SelectItem>
                      <SelectItem value="negative">Negativt (utgift)</SelectItem>
                      <SelectItem value="positive">Positivt (inkomst)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs">Prioritet (lägre = körs först)</Label>
                <Input type="number" value={priority} onChange={(e) => setPriority(parseInt(e.target.value) || 25)} />
              </div>

              <Button onClick={handleSave} className="w-full">
                {editingRule ? "Spara ändringar" : "Skapa regel"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktiva regler ({rules.length})</CardTitle>
          <CardDescription>
            Regler tillämpas uppifrån och ned. Första matchning vinner.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">
                      P{rule.priority}
                    </Badge>
                    <span className="text-sm font-medium">{rule.field}</span>
                    <span className="text-xs text-muted-foreground">{rule.matchType}</span>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{rule.pattern}</code>
                    {rule.amountCondition && (
                      <Badge variant="secondary" className="text-[10px]">
                        {rule.amountCondition === "negative" ? "Negativt" : "Positivt"}
                      </Badge>
                    )}
                    <span className="text-xs">→</span>
                    <Badge variant="secondary" className="text-xs">
                      {rule.category}
                    </Badge>
                    {rule.isDefault && (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Standard
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(rule)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteRule(rule.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
