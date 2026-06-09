import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CriptoCal — Calculadora de Arbitraje de Criptomonedas",
  description:
    "Plataforma profesional para calcular spreads y oportunidades de arbitraje entre exchanges de criptomonedas. Precios en tiempo real, historial en la nube y modo objetivo.",
  keywords: "arbitraje, criptomonedas, bitcoin, spread, calculadora, binance, bybit, crypto",
  authors: [{ name: "CriptoCal" }],
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
