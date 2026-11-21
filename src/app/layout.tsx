import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "@fontsource-variable/fraunces/full.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Family Recipes", template: "%s · Family Recipes" },
  description: "Brewer family recipes and meals.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} h-full`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
