import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionGuard } from "@/components/auth/SessionGuard";
import { AuthenticatedLayout } from "@/components/auth/AuthenticatedLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Håll koll på dina utgifter",
  description: "Analysera ditt Nordea kontoutdrag – utgifter, inkomster, skulder och prognoser.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Håll koll",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#09090b" />
      </head>
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
