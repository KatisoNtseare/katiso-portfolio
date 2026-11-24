import type { Metadata } from "next";
import { SiteChrome } from "@/components/site-chrome";
import { site } from "@/lib/site";
import "./globals.css";
import "./ui-refinements.css";
import "./portfolio-design.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Katiso Ntseare | Software Developer", template: "%s | Katiso Ntseare" },
  description: site.description,
  openGraph: { type: "website", url: site.url, title: "Katiso Ntseare | Software Developer", description: site.description, siteName: "Katiso Ntseare" },
  twitter: { card: "summary_large_image", title: "Katiso Ntseare | Software Developer", description: site.description },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><SiteChrome>{children}</SiteChrome></body></html>;
}
