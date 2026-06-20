"use client";
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function SpreadChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [symbol, setSymbol] = useState('BTCUSDT');

  const PAIRS = [
    { value: 'BTCUSDT', label: 'Bitcoin (BTC)' },
    { value: 'ETHUSDT', label: 'Ethereum (ETH)' },
    { value: 'SOLUSDT', label: 'Solana (SOL)' },
    { value: 'BNBUSDT', label: 'Binance Coin (BNB)' },
    { value: 'XRPUSDT', label: 'Ripple (XRP)' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/crypto/history?symbol=${symbol}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'Error fetching data');
        }
      } catch (err: any) {
        setError(err.message);
      }
      setLoading(false);
    };

    fetchData();
  }, [symbol]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div style={{ background: '#1a1a25', border: '1px solid #2a2a35', padding: '10px', borderRadius: '8px' }}>
          <p style={{ color: '#e1e1e6', fontWeight: 'bold', margin: '0 0 5px 0' }}>Hora: {label}</p>
          <p style={{ color: '#00adb5', margin: '0 0 2px 0' }}>Binance (Compra): ${point.binancePrice.toLocaleString()}</p>
          <p style={{ color: '#ffb74d', margin: '0 0 5px 0' }}>Bybit (Venta): ${point.bybitPrice.toLocaleString()}</p>
          <p style={{ 
            color: point.spreadPercent > 0 ? '#00e676' : '#ff5252', 
            fontWeight: 'bold',
            margin: 0
          }}>
            Spread Neto: {point.spreadPercent > 0 ? '+' : ''}{point.spreadPercent}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="standard-calc">
      <div className="calc-panel-box">
        <div className="panel-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div><span>📊</span> Analítica de Spread: Binance vs Bybit (24h)</div>
          <select 
            value={symbol} 
            onChange={(e) => setSymbol(e.target.value)}
            style={{ 
              background: 'var(--card-bg-light)', 
              color: 'var(--primary)', 
              border: '1px solid var(--border)', 
              borderRadius: '6px', 
              padding: '4px 10px',
              fontWeight: 'bold',
              outline: 'none'
            }}
          >
            {PAIRS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
            <div className="btn-spinner" style={{ marginRight: '10px' }}></div> Cargando historial de precios...
          </div>
        ) : error ? (
          <div style={{ height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--danger)' }}>
            ⚠️ Error: {error}
          </div>
        ) : data.length === 0 ? (
          <div style={{ height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
            No hay datos disponibles para este par.
          </div>
        ) : (
          <div style={{ width: '100%', height: '350px', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" vertical={false} />
                <XAxis 
                  dataKey="timeLabel" 
                  stroke="#6b7280" 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  tickMargin={10} 
                  minTickGap={20}
                />
                <YAxis 
                  stroke="#6b7280" 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  tickFormatter={(val) => `${val}%`} 
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#ff5252" strokeDasharray="3 3" opacity={0.5} />
                <Line 
                  type="monotone" 
                  dataKey="spreadPercent" 
                  stroke="#00adb5" 
                  strokeWidth={3} 
                  dot={{ r: 2, fill: '#00adb5', strokeWidth: 0 }} 
                  activeDot={{ r: 6, fill: '#00e676', strokeWidth: 0 }} 
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0, 173, 181, 0.05)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          <strong>💡 ¿Cómo interpretar este gráfico?</strong><br/>
          Este gráfico muestra el margen de rentabilidad bruto comprando en Binance y vendiendo en Bybit durante las últimas 24 horas. 
          <ul>
            <li style={{ marginTop: '5px' }}>Si la línea azul sube por encima del 0%, hubo oportunidad de ganancia.</li>
            <li style={{ marginTop: '5px' }}>Los picos más altos te indican a qué horas del día el mercado suele ser más ineficiente y rentable.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
