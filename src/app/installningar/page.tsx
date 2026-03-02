"use client";

import React, { useState } from "react";
import { useAppStore } from "@/hooks/useAppStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/import/FileUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Download, Trash2, Database, Upload, AlertTriangle } from "lucide-react";

export default function InstallningarPage() {
  const { transactions, settings, updateSettings, exportCSV, clearAllData, loadDemoData, isLoading } = useAppStore();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleExport() {
    const csv = exportCSV();
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transaktioner_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleClear() {
    clearAllData();
    setConfirmDelete(false);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inställningar</h1>
        <p className="text-sm text-muted-foreground">
          Importera data, ändra inställningar och hantera lagrad data
        </p>
      </div>

      {/* Import */}
      <FileUpload />

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visningsinställningar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Inkludera reserverade transaktioner</Label>
              <p className="text-xs text-muted-foreground">Visa reserverade (ej bokförda) transaktioner i beräkningar</p>
            </div>
            <Switch
              checked={settings.includeReserved}
              onCheckedChange={(v) => updateSettings({ includeReserved: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exportera data</CardTitle>
          <CardDescription>
            Ladda ned alla {transactions.length} transaktioner som CSV med kategorier och taggar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleExport} disabled={transactions.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportera till CSV
          </Button>
        </CardContent>
      </Card>

      {/* Data info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lagrad data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span>{transactions.length} transaktioner sparade i din webbläsare (IndexedDB)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            All data lagras lokalt i din webbläsare. Inget skickas till någon server.
          </p>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={loadDemoData}>
              <Upload className="h-4 w-4 mr-2" />
              Ladda demodata
            </Button>

            <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Radera all data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Bekräfta radering
                  </DialogTitle>
                  <DialogDescription>
                    Detta raderar alla transaktioner, regler och inställningar. Åtgärden går inte att ångra.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setConfirmDelete(false)}>
                    Avbryt
                  </Button>
                  <Button variant="destructive" onClick={handleClear}>
                    Ja, radera allt
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
