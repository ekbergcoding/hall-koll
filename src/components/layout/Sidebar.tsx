"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  List,
  RefreshCcw,
  Settings,
  TrendingUp,
  BookOpen,
  Store,
  PieChart,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transaktioner", label: "Transaktioner", icon: List },
  { href: "/kategorier", label: "Kategorier", icon: PieChart },
  { href: "/handlare", label: "Handlare", icon: Store },
  { href: "/aterkommande", label: "Återkommande", icon: RefreshCcw },
  { href: "/regler", label: "Regler", icon: BookOpen },
  { href: "/prognos", label: "Prognos", icon: TrendingUp },
  { href: "/installningar", label: "Inställningar", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <div className="fixed top-0 left-0 z-50 flex h-14 w-full items-center border-b bg-background px-4 lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <span className="ml-3 text-lg font-bold tracking-tight">Håll koll</span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-sidebar-background transition-transform duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              HK
            </div>
            <div>
              <span className="text-base font-bold tracking-tight">Håll koll</span>
              <p className="text-[10px] text-muted-foreground leading-none">på dina utgifter</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3 space-y-2">
          {session?.user && (
            <div className="flex items-center gap-2 px-2">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt=""
                  className="h-7 w-7 rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{session.user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{session.user.email}</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-muted-foreground gap-2"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-3.5 w-3.5" />
            Logga ut
          </Button>
        </div>
      </aside>
    </>
  );
}
