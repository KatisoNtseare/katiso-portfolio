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
  title: { default: "Katiso Ntseare - Software Developer in South Africa", template: "%s - Katiso Ntseare" },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: site.url,
    title: "Katiso Ntseare - Software Developer in South Africa",
    description: site.description,
    siteName: site.name,
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "Katiso Ntseare - Software Developer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Katiso Ntseare - Software Developer in South Africa",
    description: site.description,
    images: ["/twitter-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/images/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/images/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/images/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body><SiteChrome>{children}</SiteChrome></body>
    </html>
  );
}