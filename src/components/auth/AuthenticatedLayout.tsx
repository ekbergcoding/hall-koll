"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { AppProvider } from "@/hooks/useAppStore";
import { AppShell } from "@/components/layout/AppShell";

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();

  if (pathname === "/login" || status !== "authenticated") {
    return <>{children}</>;
  }

  return (
    <AppProvider>
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}
