"use client";
import React from 'react';

export default function AlertConfig() {
  return (
    <div className="standard-calc">
      <div className="calc-panel-box" style={{ 
        background: 'linear-gradient(135deg, rgba(0, 173, 181, 0.1) 0%, rgba(30, 60, 114, 0.2) 100%)',
        border: '1px solid var(--neon-blue)',
        textAlign: 'center',
        padding: '50px 20px',
        borderRadius: '12px'
      }}>
        <div style={{ fontSize: '56px', marginBottom: '20px' }}>🚀</div>
        <h3 style={{ fontSize: '26px', marginBottom: '15px', color: '#fff', fontWeight: 'bold' }}>
          Únete a nuestro Canal Privado de Señales
        </h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: '16px', maxWidth: '600px', margin: '0 auto 30px auto', lineHeight: '1.6' }}>
          Hemos evolucionado nuestro sistema para hacerlo más fácil. Ahora todas las alertas automáticas de arbitraje 
          se envían directamente a nuestro <strong>Canal VIP de Telegram</strong> 24/7. 
          Ya no necesitas configurar monedas manualmente, nuestro robot hace todo el trabajo pesado.
        </p>
        
        <a 
          href="https://t.me/+kHrRx74YhOA3NDEx" 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn-primary"
          style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '16px 36px', 
            fontSize: '18px',
            fontWeight: 'bold',
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(0, 173, 181, 0.4)',
            borderRadius: '8px'
          }}
        >
          <span>🔥</span> Entrar al Canal Gratis
        </a>
      </div>

      <div className="calc-panel-box" style={{ marginTop: '20px' }}>
        <div className="panel-title-bar"><span>ℹ️</span> ¿Qué encontrarás en el canal?</div>
        <div className="text-gray-300 text-sm leading-relaxed" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px 0' }}>
          <p>✅ <strong>Monitoreo Global (24/7):</strong> Nuestro potente robot alojado en la nube escanea más de 45 criptomonedas simultáneamente cruzando precios en 8 de los mejores exchanges del mundo.</p>
          <p>✅ <strong>Solo las Mejores Oportunidades:</strong> Nuestro algoritmo filtra automáticamente el ruido del mercado y los spreads microscópicos. Solo enviamos alertas cuando el porcentaje de ganancia bruta vale la pena.</p>
          <p>✅ <strong>100% Automático:</strong> Recibirás la notificación en tiempo real en tu teléfono a través de Telegram. Solo tienes que abrir tus exchanges, comparar las comisiones de red actuales y ejecutar la compra/venta.</p>
        </div>
      </div>
    </div>
  );
}
