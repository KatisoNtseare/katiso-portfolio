import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Manrope, Sora } from "next/font/google";
import { SiteChrome } from "@/components/site-chrome";
import { site } from "@/lib/site";
import "./globals.css";
import "./ui-refinements.css";
import "./portfolio-design.css";

const display = Sora({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--f-display", display: "swap" });
const sans = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--f-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--f-mono", display: "swap" });

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f9fc" },
    { media: "(prefers-color-scheme: dark)", color: "#f7f9fc" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Katiso Ntseare | Software Developer | Backend & Full-Stack", template: "%s | Katiso Ntseare" },
  description: "Katiso Ntseare is an IT professional specialising in C#, ASP.NET Core, Next.js, React, SQL Server, Python, DevOps and application security in South Africa.",
  openGraph: { type: "website", url: site.url, title: "Katiso Ntseare | Software Developer", description: site.description, siteName: "Katiso Ntseare" },
  twitter: { card: "summary_large_image", title: "Katiso Ntseare | Software Developer", description: site.description },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body><SiteChrome>{children}</SiteChrome></body>
    </html>
  );
}