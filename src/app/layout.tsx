import type { Metadata } from "next";
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
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var saved=localStorage.getItem('theme');var cookie=document.cookie.match(/(?:^|; )theme=([^;]*)/);var theme=saved||(cookie?decodeURIComponent(cookie[1]):null);var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;if(theme==='dark'||(!theme&&prefersDark)){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <AuthRecoveryRedirect />
        {children}
      </body>
    </html>
  );
}
