import type { Metadata, Viewport } from "next";
import { DM_Mono, DM_Sans, Instrument_Serif } from "next/font/google";
import { SiteChrome } from "@/components/site-chrome";
import { site } from "@/lib/site";
import "./globals.css";
import "./ui-refinements.css";
import "./portfolio-design.css";

const display = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--f-display", display: "swap" });
const sans = DM_Sans({ subsets: ["latin"], variable: "--f-body", display: "swap" });
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--f-mono", display: "swap" });

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0e" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Katiso Ntseare | Software Developer", template: "%s | Katiso Ntseare" },
  description: site.description,
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