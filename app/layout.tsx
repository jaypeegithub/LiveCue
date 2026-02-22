import "./globals.css";

export const metadata = {
  title: "LiveCue MVP",
  description: "ESPN MMA exists check",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
