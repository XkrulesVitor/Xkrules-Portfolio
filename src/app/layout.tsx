import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE } from "@/content/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// OpenGraph e Twitter card (V.5): a captura do diorama em public/og.jpg (1280x720). O metadataBase
// resolve as URLs relativas para o endereço público, que é o que os rastreadores sociais exigem.
const OG_IMAGE = {
  url: SITE.ogImage.path,
  width: SITE.ogImage.width,
  height: SITE.ogImage.height,
  alt: SITE.ogImage.alt,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: SITE.title,
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE.shortTitle,
    title: SITE.title,
    description: SITE.description,
    locale: SITE.ogLocale,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
    images: [{ url: SITE.ogImage.path, alt: SITE.ogImage.alt }],
  },
};

export const viewport: Viewport = {
  themeColor: SITE.themeColor,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full font-sans">{children}</body>
    </html>
  );
}
