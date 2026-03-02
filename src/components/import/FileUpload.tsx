"use client";

import React, { useCallback, useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/hooks/useAppStore";

export function FileUpload() {
  const { importCSV } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<{ added: number; errors: string[] } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setResult(null);
      try {
        const text = await file.text();
        const res = await importCSV(text);
        setResult(res);
      } catch {
        setResult({ added: 0, errors: ["Kunde inte läsa filen."] });
      } finally {
        setIsProcessing(false);
      }
    },
    [importCSV]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Importera kontoutdrag</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          }`}
        >
          <Upload className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium mb-1">
            Dra och släpp din Nordea CSV här
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            eller klicka för att välja fil
          </p>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={onFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {isProcessing && (
            <p className="text-sm text-muted-foreground animate-pulse">Bearbetar...</p>
          )}
        </div>

        {result && (
          <div className="mt-4 space-y-2">
            {result.added > 0 && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>{result.added} nya transaktioner importerade</span>
              </div>
            )}
            {result.added === 0 && result.errors.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Inga nya transaktioner hittades (eventuella dubbletter ignorerades)</span>
              </div>
            )}
            {result.errors.length > 0 && (
              <div className="space-y-1">
                {result.errors.slice(0, 5).map((err, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{err}</span>
                  </div>
                ))}
                {result.errors.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    ...och {result.errors.length - 5} fler varningar
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
