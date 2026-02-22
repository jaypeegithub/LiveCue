import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LiveCue",
  description: "Get a text when your UFC fight is about to start.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
