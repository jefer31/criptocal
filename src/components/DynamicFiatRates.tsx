'use client';
import { useEffect, useState } from 'react';

interface Props {
  fiatCurrency: string;
}

export default function DynamicFiatRates({ fiatCurrency }: Props) {
  const [rates, setRates] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setRates(null);

    const fetchRates = async () => {
      try {
        if (fiatCurrency === 'VES') {
          const res = await fetch('/api/rates');
          const data = await res.json();
          if (active && data.bcv && data.paralelo) {
            setRates({ 
              country: '🇻🇪 Venezuela',
              mainLabel: 'Dólar BCV', mainVal: parseFloat(data.bcv).toFixed(2) + ' Bs',
              subLabel: 'Dólar Paralelo', subVal: parseFloat(data.paralelo).toFixed(2) + ' Bs',
            });
          }
        } else if (fiatCurrency === 'ARS') {
          // Free API for Argentina Dolar Blue
          const resBlue = await fetch('https://dolarapi.com/v1/dolares/blue');
          const dataBlue = await resBlue.json();
          
          const resOficial = await fetch('https://dolarapi.com/v1/dolares/oficial');
          const dataOficial = await resOficial.json();
          
          if (active && dataBlue && dataOficial) {
            setRates({
              country: '🇦🇷 Argentina',
              mainLabel: 'Dólar Oficial', mainVal: dataOficial.venta + ' ARS',
              subLabel: 'Dólar Blue', subVal: dataBlue.venta + ' ARS',
            });
          }
        } else if (['COP', 'MXN', 'PEN', 'BRL', 'CLP', 'EUR', 'BOB', 'PYG', 'UYU', 'DOP'].includes(fiatCurrency)) {
          // Free API fallback for other currencies against USD
          const res = await fetch('https://open.er-api.com/v6/latest/USD');
          const data = await res.json();
          
          if (active && data && data.rates && data.rates[fiatCurrency]) {
            const rate = data.rates[fiatCurrency];
            
            const countryMap: Record<string, string> = {
              'COP': '🇨🇴 Colombia',
              'MXN': '🇲🇽 México',
              'PEN': '🇵🇪 Perú',
              'BRL': '🇧🇷 Brasil',
              'CLP': '🇨🇱 Chile',
              'EUR': '🇪🇺 Europa',
              'BOB': '🇧🇴 Bolivia',
              'PYG': '🇵🇾 Paraguay',
              'UYU': '🇺🇾 Uruguay',
              'DOP': '🇩🇴 R. Dominicana'
            };
            
            setRates({
              country: countryMap[fiatCurrency],
              mainLabel: 'Tasa Oficial (vs USD)', mainVal: parseFloat(rate).toFixed(2) + ' ' + fiatCurrency,
              subLabel: 'Fuente', subVal: 'Mercado Global'
            });
          }
        } else {
          setRates(null);
        }
      } catch (error) {
        console.error(`Failed to load rates for ${fiatCurrency}`, error);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 60000);
    
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [fiatCurrency]);

  if (loading || !rates) return null;

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
         {rates.country}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ 
          background: 'var(--bg-dark)', 
          padding: '2px 6px', 
          borderRadius: '4px', 
          color: 'var(--text-muted)' 
        }}>{rates.mainLabel}:</span>
        <span style={{ color: 'var(--success)' }}>{rates.mainVal}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ 
          background: 'var(--bg-dark)', 
          padding: '2px 6px', 
          borderRadius: '4px', 
          color: 'var(--text-muted)' 
        }}>{rates.subLabel}:</span>
        <span style={{ color: 'var(--primary)' }}>{rates.subVal}</span>
      </div>
    </div>
  );
}
