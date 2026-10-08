import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./editorial.css";

export const metadata: Metadata = {
  title: "Internship Tracker",
  description: "Track internship applications, interviews, and deadlines.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
