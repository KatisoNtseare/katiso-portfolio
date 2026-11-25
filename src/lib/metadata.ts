import type { Metadata } from "next";
import { site } from "@/lib/site";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
};

export function createPageMetadata({
  title,
  description,
  path,
  image = "/opengraph-image.png",
  imageAlt = `${site.name} - Software Developer`,
}: PageMetadataInput): Metadata {
  const canonical = new URL(path, site.url).toString();
  const imageUrl = new URL(image, site.url).toString();
  const twitterImageUrl = new URL(
    image === "/opengraph-image.png" ? "/twitter-image.png" : image,
    site.url,
  ).toString();
  const socialTitle = `${title} - ${site.name}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "en_ZA",
      url: canonical,
      siteName: site.name,
      title: socialTitle,
      description,
      images: [{
        url: imageUrl,
        alt: imageAlt,
        ...(image === "/opengraph-image.png" ? { width: 1200, height: 630 } : {}),
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [twitterImageUrl],
    },
  };
}
