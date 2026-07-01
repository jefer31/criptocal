import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { Suspense } from "react";
import ReferralTracker from "../components/ReferralTracker";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0a0a1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "CriptoCal — Calculadora de Arbitraje de Criptomonedas",
  description:
    "Plataforma profesional para calcular spreads y oportunidades de arbitraje entre exchanges de criptomonedas. Precios en tiempo real, historial en la nube y modo objetivo.",
  keywords: "arbitraje, criptomonedas, bitcoin, spread, calculadora, binance, bybit, crypto",
  authors: [{ name: "CriptoCal" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "CriptoCal — Calculadora de Arbitraje de Criptomonedas",
    description: "Calcula spreads y oportunidades de arbitraje entre los mejores exchanges del mundo.",
    type: "website",
    locale: "es_LA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/api/icon-rounded?v=1" type="image/png" />
        <link rel="apple-touch-icon" href="/api/icon-rounded?v=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Suspense fallback={null}>
          <ReferralTracker />
        </Suspense>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
