import type { Metadata, Viewport } from "next";
import { Bagel_Fat_One, Instrument_Sans } from "next/font/google";
import { SITE } from "@/config/site";
import "./globals.css";

const bagel = Bagel_Fat_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bagel",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  axes: ["wdth"],
  display: "swap",
});

export const metadata: Metadata = {
  // Set SITE_URL to your domain in production so share images get absolute URLs
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "WINKY: phone cases and tote bags that wink back",
    template: "%s · WINKY",
  },
  description: SITE.tagline,
};

export const viewport: Viewport = {
  themeColor: "#FF4F9A",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bagel.variable} ${instrument.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only z-[60] rounded-full bg-grape px-5 py-3 font-semibold text-milk focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
