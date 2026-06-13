import React, { useState } from 'react';
import Image from 'next/image';

interface PricingModalProps {
  onClose: () => void;
  userEmail?: string;
}

const PricingModal: React.FC<PricingModalProps> = ({ onClose, userEmail }) => {
  const [loadingPlan, setLoadingPlan] = useState<'monthly' | 'annual' | null>(null);

  const handleCheckout = async (planType: 'monthly' | 'annual') => {
    setLoadingPlan(planType);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType, email: userEmail })
      });
      const data = await response.json();
      
      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        alert(data.error || 'Error al generar el pago. Intenta de nuevo.');
        setLoadingPlan(null);
      }
    } catch (error: any) {
      console.error(error);
      alert('Error de conexión: ' + error.message);
      setLoadingPlan(null);
    }
  };

  return (
    <div className="terms-modal-overlay" style={{ zIndex: 10000, display: 'flex', background: 'rgba(10, 10, 26, 0.95)', backdropFilter: 'blur(10px)', padding: '20px' }}>
      <div className="terms-modal-card" style={{ maxWidth: '800px', width: '100%', padding: '40px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>✕</button>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Image src="/logo.png" alt="CriptoCal Logo" width={60} height={60} style={{ borderRadius: '12px', marginBottom: '15px' }} />
          <h2 style={{ fontSize: '32px', color: 'var(--text-color)', marginBottom: '10px' }}>Desbloquea el Nivel PRO</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Sin anuncios. Alertas automáticas. Máximo poder.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          
          {/* Plan Mensual */}
          <div style={{ background: 'var(--bg-dark)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '30px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '20px', color: 'var(--text-color)', marginBottom: '15px' }}>Plan Mensual</h3>
            <div style={{ fontSize: '42px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '20px' }}>
              $14.99<span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/mes</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '30px', color: 'var(--text-color)' }}>
              <li style={{ marginBottom: '10px' }}>✅ 0% Anuncios y publicidad</li>
              <li style={{ marginBottom: '10px' }}>✅ Uso ilimitado de calculadoras</li>
              <li style={{ marginBottom: '10px' }}>✅ Alertas automáticas en Telegram</li>
            </ul>
            <button 
              className="btn-secondary" 
              style={{ width: '100%', padding: '15px', fontWeight: 'bold' }}
              onClick={() => handleCheckout('monthly')}
              disabled={loadingPlan !== null}
            >
              {loadingPlan === 'monthly' ? 'Cargando Pila Cripto...' : 'Pagar con USDT'}
            </button>
          </div>

          {/* Plan Anual */}
          <div style={{ background: 'linear-gradient(145deg, rgba(0, 255, 136, 0.1), rgba(10, 10, 26, 0.9))', border: '1px solid var(--primary)', borderRadius: '16px', padding: '30px', textAlign: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: '#0a0a1a', padding: '5px 15px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>MÁS POPULAR</div>
            <h3 style={{ fontSize: '20px', color: 'var(--text-color)', marginBottom: '15px' }}>Plan Anual</h3>
            <div style={{ fontSize: '42px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '20px' }}>
              $99.00<span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/año</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '30px', color: 'var(--text-color)' }}>
              <li style={{ marginBottom: '10px' }}>✅ <strong>Ahorras $20 USDT (2 meses gratis)</strong></li>
              <li style={{ marginBottom: '10px' }}>✅ 0% Anuncios y publicidad</li>
              <li style={{ marginBottom: '10px' }}>✅ Alertas VIP instantáneas</li>
              <li style={{ marginBottom: '10px' }}>✅ Acceso prioritario a Inteligencia Artificial (Futuro)</li>
            </ul>
            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '15px', fontWeight: 'bold' }}
              onClick={() => handleCheckout('annual')}
              disabled={loadingPlan !== null}
            >
              {loadingPlan === 'annual' ? 'Cargando Pila Cripto...' : 'Pagar con USDT'}
            </button>
          </div>

        </div>

        <div style={{ textAlign: 'center', marginTop: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
          Pagos procesados de forma segura mediante NowPayments. Aceptamos USDT (TRC20, BEP20) y Bitcoin.
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
