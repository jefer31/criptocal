"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

import AdBanner from '../components/AdBanner';

export default function LandingPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'var(--bg-dark)', 
      color: 'var(--text-color)',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Navigation */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 5%',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(20, 20, 30, 0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '20px', fontWeight: 'bold' }}>
          <Image src="/logo.png" alt="CriptoCal Logo" width={32} height={32} style={{ borderRadius: '8px' }} />
          CriptoCal
        </div>
        <div>
          <Link href="/dashboard" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 20px' }}>
            Ir a la Calculadora
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{
        padding: '100px 5%',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, rgba(0, 173, 181, 0.15) 0%, transparent 50%)'
      }}>
        <h1 style={{ 
          fontSize: 'clamp(40px, 6vw, 64px)', 
          fontWeight: 800, 
          lineHeight: '1.1',
          marginBottom: '20px',
          background: 'linear-gradient(90deg, #fff, #00adb5)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Domina el Arbitraje<br/>de Criptomonedas
        </h1>
        <p style={{ 
          fontSize: 'clamp(16px, 2vw, 20px)', 
          color: 'var(--text-muted)', 
          maxWidth: '600px', 
          marginBottom: '40px',
          lineHeight: '1.6'
        }}>
          La herramienta definitiva para detectar oportunidades de spread en P2P y Spot. Analizamos +8 exchanges en tiempo real para que tú solo te enfoques en ganar.
        </p>
        <Link href="/dashboard" className="btn-primary" style={{ 
          textDecoration: 'none', 
          padding: '16px 32px', 
          fontSize: '18px',
          boxShadow: '0 4px 20px rgba(0, 173, 181, 0.4)',
          transform: 'scale(1)',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Abrir Calculadora Gratis
        </Link>
      </header>

      {/* Features Section */}
      <section style={{ padding: '80px 5%', backgroundColor: 'rgba(255,255,255,0.02)' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px', marginBottom: '50px' }}>Herramientas Profesionales</h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '30px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          
          <div className="calc-panel-box" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🌍</div>
            <h3 style={{ fontSize: '22px', marginBottom: '15px' }}>Arbitraje P2P Fiat</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Calcula la rentabilidad exacta comprando USDT con tu moneda local y vendiéndola a un precio mayor. Integración con Binance P2P.
            </p>
          </div>

          <div className="calc-panel-box" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📈</div>
            <h3 style={{ fontSize: '22px', marginBottom: '15px' }}>Escáner Spot Global</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Comparamos los precios de Bitcoin, Ethereum y más en 8 exchanges globales simultáneamente para encontrar el mejor Spread.
            </p>
          </div>

          <div className="calc-panel-box" style={{ textAlign: 'center', padding: '40px 20px', border: '1px solid var(--neon-blue)' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🤖</div>
            <h3 style={{ fontSize: '22px', marginBottom: '15px', color: 'var(--neon-blue)' }}>Alertas Bot Gratis</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              No pases horas mirando la pantalla. Configura tu rentabilidad mínima y nuestro bot de Telegram te avisará cuando haya una oportunidad. Totalmente gratis.
            </p>
          </div>

        </div>
      </section>

      {/* AdBanner so A-Ads bot can verify the root URL */}
      <div style={{ maxWidth: '800px', margin: '40px auto 0 auto' }}>
        <AdBanner placement="bottom" />
      </div>

      {/* Footer */}
      <footer style={{
        padding: '40px 5%',
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        color: 'var(--text-muted)',
        marginTop: '50px'
      }}>
        <p>© {new Date().getFullYear()} CriptoCal v2.1. Todos los derechos reservados.</p>
        <p style={{ fontSize: '12px', marginTop: '10px' }}>
          El comercio de criptomonedas implica un riesgo significativo.
        </p>
      </footer>
    </div>
  );
}
