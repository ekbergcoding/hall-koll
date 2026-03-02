import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionGuard } from "@/components/auth/SessionGuard";
import { AuthenticatedLayout } from "@/components/auth/AuthenticatedLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Håll koll på dina utgifter",
  description: "Analysera ditt Nordea kontoutdrag – utgifter, inkomster, skulder och prognoser.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className={inter.className}>
        <SessionGuard>
          <AuthenticatedLayout>
            {children}
          </AuthenticatedLayout>
        </SessionGuard>
      </body>
    </html>
  );
}
