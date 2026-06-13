'use client';
import { useEffect, useState } from 'react';

export default function VenezuelaRates() {
  const [rates, setRates] = useState<{ bcv: number; paralelo: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('/api/rates');
        const data = await res.json();
        if (data.bcv && data.paralelo) {
          setRates({ bcv: parseFloat(data.bcv), paralelo: parseFloat(data.paralelo) });
        }
      } catch (error) {
        console.error('Failed to load rates', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
    
    // Recargar silenciosamente cada 60 segundos
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !rates) return null; // No renderizamos nada mientras carga o si falla

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
      background: 'rgba(0, 255, 136, 0.05)',
      border: '1px solid rgba(0, 255, 136, 0.2)',
      borderRadius: '8px',
      padding: '10px 20px',
      marginBottom: '20px',
      color: 'var(--text-color)',
      fontSize: '14px',
      fontWeight: '500',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ 
          background: 'var(--bg-dark)', 
          padding: '2px 6px', 
          borderRadius: '4px', 
          border: '1px solid rgba(255,255,255,0.1)',
          fontSize: '12px'
        }}>BCV</span>
        <span>Bs. {rates.bcv.toFixed(2)}</span>
      </div>
      <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ 
          background: 'var(--bg-dark)', 
          padding: '2px 6px', 
          borderRadius: '4px', 
          border: '1px solid rgba(255,255,255,0.1)',
          fontSize: '12px',
          color: 'var(--primary)'
        }}>Binance (Paralelo)</span>
        <span style={{ color: 'var(--primary)' }}>Bs. {rates.paralelo.toFixed(2)}</span>
      </div>
    </div>
  );
}
