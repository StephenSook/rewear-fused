import type { Metadata } from "next";
import { Fraunces, Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/shell";

// Interim Google stand-ins for Editorial New (display) and General Sans (body)
// until those are self-hosted via next/font/local. JetBrains Mono is the locked
// data face. No Inter / Roboto / Arial / system / Space Grotesk.
const display = Fraunces({
  variable: "--font-display-src",
  subsets: ["latin"],
  axes: ["opsz"],
});
const body = Sora({ variable: "--font-body-src", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono-src", subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://rewear-fused.vercel.app";
const DESCRIPTION =
  "Safe to wear, able to be remade. A co-design loop closing the recycling loop on children's stretch apparel.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "REWEAR-FUSED", template: "%s" },
  description: DESCRIPTION,
  openGraph: {
    title: "REWEAR-FUSED",
    description: DESCRIPTION,
    siteName: "REWEAR-FUSED",
    type: "website",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "REWEAR-FUSED",
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="grain min-h-full flex flex-col">
        <Shell />
        {children}
      </body>
    </html>
  );
}
