import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Hospital Queue",
  description: "AI powered hospital queue management system",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
