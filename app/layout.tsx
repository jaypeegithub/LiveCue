import "./globals.css";
import { Oswald, Inter } from "next/font/google";

const oswald = Oswald({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-oswald",
});
const inter = Inter({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "LiveCue — Never Miss the Fight",
  description:
    "LiveCue tells you when your fight is about to start. Pick a UFC event and bout, get your cue so you never miss the moment.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${oswald.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
