import type { Metadata } from "next";
import Script from "next/script";
import { ThemeProvider } from "next-themes";
import { AuthRecoveryRedirect } from "@/components/AuthRecoveryRedirect";
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
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="capture-password-recovery" strategy="beforeInteractive">
          {`(function(){try{var query=new URLSearchParams(window.location.search);var hash=new URLSearchParams(window.location.hash.charAt(0)==='#'?window.location.hash.slice(1):window.location.hash);if(query.get('type')==='recovery'||hash.get('type')==='recovery'){sessionStorage.setItem('smartqueue-password-recovery','true')}}catch(e){}})();`}
        </Script>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="theme"
        >
          <AuthRecoveryRedirect />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
