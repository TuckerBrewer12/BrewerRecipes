import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "@fontsource-variable/fraunces/full.css";
import "./globals.css";

import { getCurrentMember } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "Family Recipes", template: "%s · Family Recipes" },
  description: "Brewer family recipes and meals.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const member = await getCurrentMember();
  return (
    <html lang="en" data-text={member?.large_text ? "large" : undefined} className={`${GeistSans.variable} h-full`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
