"use client";
import React from 'react';

export default function InstructionsTab() {
  return (
    <div className="standard-calc">
      <div className="calc-panel-box">
        <div className="panel-title-bar"><span>📖</span> Guía de Uso Rápido</div>
        
        <div style={{ padding: '10px 0', color: 'var(--text-color)', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '20px' }}>
            Bienvenido a <strong>CriptoCal</strong>, tu herramienta profesional para detectar oportunidades de arbitraje. Aquí tienes un resumen de cómo utilizar cada sección de la aplicación.
          </p>

          <h3 style={{ color: 'var(--primary)', marginBottom: '10px', fontSize: '18px' }}>🌍 Arbitraje P2P (Fiat)</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
            Esta calculadora te ayuda a saber si es rentable comprar USDT (o cualquier cripto) usando tu moneda local (fiat) en el mercado P2P, y luego venderla un poco más cara.
            <br/><br/>
            <strong>Cómo usarla:</strong>
            <br/>1. Ingresa el capital que vas a invertir (Ej: 100 USD).
            <br/>2. El sistema jalará los precios en vivo de Binance P2P (si está disponible) o puedes ingresarlos manualmente.
            <br/>3. Abajo verás tu ganancia neta exacta.
          </p>

          <h3 style={{ color: 'var(--primary)', marginBottom: '10px', fontSize: '18px' }}>📈 Escáner Spot (Cripto a Cripto)</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
            Si ya tienes USDT, puedes comprar una moneda (Ej: BTC) en un Exchange donde esté barata y enviarla a otro Exchange donde esté más cara.
            <br/><br/>
            <strong>Cómo usarlo:</strong>
            <br/>1. En la pestaña de Spot verás un escáner que revisa 8 exchanges al mismo tiempo.
            <br/>2. El sistema calculará el "Spread" (el porcentaje de diferencia de precios).
            <br/>3. Si el spread es positivo (verde) y suficientemente grande para cubrir la comisión de retiro (red), tienes una oportunidad de ganancia.
          </p>

          <h3 style={{ color: 'var(--primary)', marginBottom: '10px', fontSize: '18px' }}>🤖 Alertas Bot</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
            Buscar oportunidades manualmente toma mucho tiempo. El Robot hace el trabajo duro por ti 24/7.
            <br/><br/>
            <strong>Cómo usarlo:</strong>
            <br/>1. Vincula tu Telegram hablando con nuestro bot para obtener tu Chat ID.
            <br/>2. Crea alertas para tus pares favoritos (Ej: Comprar en Binance, Vender en Bybit).
            <br/>3. Fija un "Spread Mínimo" (Ej: 0.5%). Si el robot detecta que el mercado supera ese spread, te escribirá inmediatamente a tu Telegram.
          </p>

          <h3 style={{ color: 'var(--primary)', marginBottom: '10px', fontSize: '18px' }}>📋 Mis Operaciones</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Como un buen trader, debes llevar un registro. Cada vez que simules una operación rentable en cualquiera de las calculadoras, usa el botón "Guardar Operación" para enviarla a tu historial en la nube y descargar tus reportes en Excel.
          </p>
        </div>
      </div>

      <div className="calc-panel-box" style={{ marginTop: '20px' }}>
        <div className="panel-title-bar"><span>⚠️</span> Consejos Importantes</div>
        <ul style={{ color: 'var(--text-muted)', paddingLeft: '20px', margin: '10px 0', lineHeight: '1.6' }}>
          <li><strong>Verifica las redes:</strong> Antes de hacer arbitraje Spot, asegúrate de que ambos exchanges soporten la misma red de retiro (Ej: TRC20, BEP20) y que los retiros no estén suspendidos.</li>
          <li><strong>Ojo con las comisiones:</strong> El Spread no es la ganancia final. Debes restarle la comisión de retiro que te cobre el exchange A para enviar el dinero al exchange B.</li>
          <li><strong>Volatilidad:</strong> Las oportunidades de arbitraje (spreads altos) suelen durar muy pocos minutos. ¡Debes ser rápido!</li>
        </ul>
      </div>
    </div>
  );
}
