import type React from "react";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SEO & GEO - Check Your Website Status",
  description:
    "Analyze your website for SEO and GEO issues and get recommendations for improvement",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head></head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
