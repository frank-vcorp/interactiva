import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Interactiva",
  description:
    "Consulta catálogos automotrices EBC y Lobato con búsqueda, filtros y valores por fuente.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Interactiva",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#152238",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <body className={`${inter.variable} font-sans min-h-dvh`}>
        {children}
      </body>
    </html>
  );
}
