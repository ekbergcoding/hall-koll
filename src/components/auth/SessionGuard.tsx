"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated" && pathname !== "/login") {
      router.push("/login");
    }
  }, [status, pathname, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (status === "unauthenticated" && pathname !== "/login") {
    return null;
  }

  return <>{children}</>;
}

export function SessionGuard({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthGuard>{children}</AuthGuard>
    </SessionProvider>
  );
}
