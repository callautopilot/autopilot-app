import type { Metadata } from "next";
import "@/app/styles/global.css";
import { Inter as FontSans } from "next/font/google";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Superclone AI",
  description: "Superclone AI",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        {children}
      </body>
    </html>
  );
}
