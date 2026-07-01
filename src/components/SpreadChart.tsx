"use client";
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

import { TOP_COINS, COIN_LABELS, ALL_EXCHANGES, ExchangeName } from '../lib/constants';

export default function SpreadChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [exchangeA, setExchangeA] = useState<ExchangeName>('binance');
  const [exchangeB, setExchangeB] = useState<ExchangeName>('bybit');

  const PAIRS = TOP_COINS.map(c => ({ value: c, label: COIN_LABELS[c] || c }));
  const EXCHANGES = ALL_EXCHANGES;

  // Helper to get formatted symbol for specific exchange
  const getExchangeSymbol = (sym: string, ex: ExchangeName) => {
    if (ex === 'okx' || ex === 'kucoin') {
      return sym.replace('USDT', '-USDT'); // e.g. BTC-USDT
    }
    return sym; // BTCUSDT
  };

  // Fetch Klines for a specific exchange
  const fetchKlines = async (ex: ExchangeName, sym: string): Promise<Map<number, number>> => {
    const formattedSymbol = getExchangeSymbol(sym, ex);
    const map = new Map<number, number>();

    try {
      if (ex === 'binance') {
        const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${formattedSymbol}&interval=1h&limit=24`);
        const json = await res.json();
        if (!Array.isArray(json)) throw new Error("Invalid format");
        json.forEach((candle: any) => {
          const ts = Math.floor(parseInt(candle[0]) / 3600000) * 3600000;
          map.set(ts, parseFloat(candle[4])); // Close price
        });
      } 
      else if (ex === 'bybit') {
        const res = await fetch(`https://api.bybit.com/v5/market/kline?category=spot&symbol=${formattedSymbol}&interval=60&limit=24`);
        const json = await res.json();
        if (!json?.result?.list) throw new Error("Invalid format");
        json.result.list.forEach((candle: any) => {
          const ts = Math.floor(parseInt(candle[0]) / 3600000) * 3600000;
          map.set(ts, parseFloat(candle[4]));
        });
      }
      else if (ex === 'okx') {
        const res = await fetch(`https://www.okx.com/api/v5/market/history-candles?instId=${formattedSymbol}&bar=1H&limit=24`);
        const json = await res.json();
        if (!json?.data || !Array.isArray(json.data)) throw new Error("Invalid format");
        json.data.forEach((candle: any) => {
          const ts = Math.floor(parseInt(candle[0]) / 3600000) * 3600000;
          map.set(ts, parseFloat(candle[4]));
        });
      }
      else if (ex === 'kucoin') {
        const endAt = Math.floor(Date.now() / 1000);
        const startAt = endAt - (24 * 3600);
        const res = await fetch(`https://api.kucoin.com/api/v1/market/candles?type=1hour&symbol=${formattedSymbol}&startAt=${startAt}&endAt=${endAt}`);
        const json = await res.json();
        if (!json?.data || !Array.isArray(json.data)) throw new Error("Invalid format");
        json.data.forEach((candle: any) => {
          const ts = Math.floor((parseInt(candle[0]) * 1000) / 3600000) * 3600000;
          map.set(ts, parseFloat(candle[2]));
        });
      }
      else if (ex === 'mexc') {
        const res = await fetch(`https://api.mexc.com/api/v3/klines?symbol=${sym}&interval=60m&limit=24`);
        const json = await res.json();
        if (!Array.isArray(json)) throw new Error("Invalid format");
        json.forEach((candle: any) => {
          const ts = Math.floor(parseInt(candle[0]) / 3600000) * 3600000;
          map.set(ts, parseFloat(candle[4]));
        });
      }
      else if (ex === 'gateio') {
        const gSym = sym.replace('USDT', '_USDT');
        const res = await fetch(`https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=${gSym}&interval=1h&limit=24`);
        const json = await res.json();
        if (!Array.isArray(json)) throw new Error("Invalid format");
        json.forEach((candle: any) => {
          // Gate.io candle[0] is timestamp in seconds
          const ts = Math.floor((parseInt(candle[0]) * 1000) / 3600000) * 3600000;
          map.set(ts, parseFloat(candle[2])); // Close price
        });
      }
      else if (ex === 'bitget') {
        const res = await fetch(`https://api.bitget.com/api/v2/spot/market/candles?symbol=${sym}&granularity=1h&limit=24`);
        const json = await res.json();
        if (!json?.data || !Array.isArray(json.data)) throw new Error("Invalid format");
        json.data.forEach((candle: any) => {
          const ts = Math.floor(parseInt(candle[0]) / 3600000) * 3600000;
          map.set(ts, parseFloat(candle[4]));
        });
      }
      else if (ex === 'kraken') {
        let krSym = sym;
        if (sym === 'BTCUSDT') krSym = 'XBTUSDT';
        const res = await fetch(`https://api.kraken.com/0/public/OHLC?pair=${krSym}&interval=60`);
        const json = await res.json();
        if (!json?.result) throw new Error("Invalid format");
        const pairKey = Object.keys(json.result)[0];
        const klines = json.result[pairKey];
        if (Array.isArray(klines)) {
          // Kraken gives the last 720 candles, we just need to iterate backwards or take the last 24
          const last24 = klines.slice(-24);
          last24.forEach((candle: any) => {
            const ts = Math.floor((parseInt(candle[0]) * 1000) / 3600000) * 3600000;
            map.set(ts, parseFloat(candle[4]));
          });
        }
      }
    } catch (error) {
      console.warn(`Error fetching ${ex} klines:`, error);
      // We don't throw here to allow graceful failure
    }
    return map;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      setData([]);

      try {
        const [mapA, mapB] = await Promise.all([
          fetchKlines(exchangeA, symbol),
          fetchKlines(exchangeB, symbol)
        ]);

        if (mapA.size === 0 || mapB.size === 0) {
          throw new Error("Datos históricos no disponibles temporalmente para estos exchanges.");
        }

        const result: any[] = [];
        const allHours = Array.from(new Set([...mapA.keys(), ...mapB.keys()])).sort((a, b) => a - b);

        allHours.forEach(hourMs => {
          const priceA = mapA.get(hourMs);
          const priceB = mapB.get(hourMs);

          if (priceA && priceB) {
            const spreadPercent = ((priceB - priceA) / priceA) * 100;
            const date = new Date(hourMs);
            const timeLabel = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

            result.push({
              timestamp: hourMs,
              timeLabel,
              priceA,
              priceB,
              spreadPercent: parseFloat(spreadPercent.toFixed(4))
            });
          }
        });

        if (result.length === 0) {
          throw new Error("No se pudo calcular el margen. Intenta con otro par o exchange.");
        }

        setData(result);
      } catch (err: any) {
        setError(err.message || "Error desconocido al procesar los datos.");
      }
      setLoading(false);
    };

    loadData();
  }, [symbol, exchangeA, exchangeB]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div style={{ background: '#1a1a25', border: '1px solid #2a2a35', padding: '10px', borderRadius: '8px' }}>
          <p style={{ color: '#e1e1e6', fontWeight: 'bold', margin: '0 0 5px 0' }}>Hora: {label}</p>
          <p style={{ color: '#00adb5', margin: '0 0 2px 0', textTransform: 'capitalize' }}>
            {exchangeA} (Compra): ${point.priceA.toLocaleString()}
          </p>
          <p style={{ color: '#ffb74d', margin: '0 0 5px 0', textTransform: 'capitalize' }}>
            {exchangeB} (Venta): ${point.priceB.toLocaleString()}
          </p>
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
          <div><span>📊</span> Analítica de Spread (24h)</div>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select 
              value={exchangeA} 
              onChange={(e) => setExchangeA(e.target.value as ExchangeName)}
              style={{ background: 'var(--card-bg-light)', color: '#00adb5', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px', fontWeight: 'bold' }}
            >
              {EXCHANGES.map(p => <option key={`A-${p.value}`} value={p.value}>Compra: {p.label}</option>)}
            </select>

            <select 
              value={exchangeB} 
              onChange={(e) => setExchangeB(e.target.value as ExchangeName)}
              style={{ background: 'var(--card-bg-light)', color: '#ffb74d', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px', fontWeight: 'bold' }}
            >
              {EXCHANGES.map(p => <option key={`B-${p.value}`} value={p.value}>Venta: {p.label}</option>)}
            </select>

            <select 
              value={symbol} 
              onChange={(e) => setSymbol(e.target.value)}
              style={{ background: 'var(--card-bg-light)', color: 'white', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px', fontWeight: 'bold' }}
            >
              {PAIRS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
            <div className="btn-spinner" style={{ marginRight: '10px' }}></div> Obteniendo historiales...
          </div>
        ) : error ? (
          <div style={{ height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--danger)' }}>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>⚠️</span> {error}
          </div>
        ) : data.length === 0 ? (
          <div style={{ height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
            No hay suficientes datos superpuestos para este par.
          </div>
        ) : (
          <div style={{ width: '100%', height: '350px', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" vertical={false} />
                <XAxis dataKey="timeLabel" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} tickMargin={10} minTickGap={20} />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(val) => `${val}%`} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#ff5252" strokeDasharray="3 3" opacity={0.5} />
                <Line type="monotone" dataKey="spreadPercent" stroke="#00adb5" strokeWidth={3} dot={{ r: 2, fill: '#00adb5', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#00e676', strokeWidth: 0 }} animationDuration={1000} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0, 173, 181, 0.05)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          <strong>💡 ¿Cómo interpretar este gráfico?</strong><br/>
          Comparamos los precios históricos directos desde el navegador para evitar bloqueos geográficos.
          <ul>
            <li style={{ marginTop: '5px' }}>Si la línea sube por encima del 0%, hubo oportunidad de ganancia bruta.</li>
            <li style={{ marginTop: '5px' }}>Las desconexiones indican que alguno de los exchanges seleccionados no proveyó datos para esa hora.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
