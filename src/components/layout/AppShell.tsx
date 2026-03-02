"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="relative min-h-screen">
        <Sidebar />
        <main className="lg:pl-64">
          <div className="pt-14 lg:pt-0">
            <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
