import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Knight Companion",
  description: "Compagnon de personnage pour Knight RPG"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
