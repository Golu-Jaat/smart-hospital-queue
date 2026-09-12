import type { Metadata } from "next";
import Script from "next/script";
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
        <Script id="initialize-theme" strategy="beforeInteractive">
          {`(function(){try{var saved=localStorage.getItem('theme');var cookie=document.cookie.match(/(?:^|; )theme=([^;]*)/);var theme=saved||(cookie?decodeURIComponent(cookie[1]):null);var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;if(theme==='dark'||(!theme&&prefersDark)){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();`}
        </Script>
        <AuthRecoveryRedirect />
        {children}
      </body>
    </html>
  );
}
