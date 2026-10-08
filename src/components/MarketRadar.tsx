"use client";
import React, { useState, useEffect, useMemo } from 'react';

const CRYPTO_SYMBOLS = [
  { value: 'BTCUSDT', label: '₿ Bitcoin (BTC/USDT)', short: 'BTC' },
  { value: 'ETHUSDT', label: 'Ξ Ethereum (ETH/USDT)', short: 'ETH' },
  { value: 'SOLUSDT', label: '◎ Solana (SOL/USDT)', short: 'SOL' },
  { value: 'XRPUSDT', label: '✕ XRP (XRP/USDT)', short: 'XRP' },
  { value: 'BNBUSDT', label: '◆ BNB (BNB/USDT)', short: 'BNB' },
  { value: 'DOGEUSDT', label: 'Ð Dogecoin (DOGE/USDT)', short: 'DOGE' },
  { value: 'ADAUSDT', label: '♦ Cardano (ADA/USDT)', short: 'ADA' },
  { value: 'TRXUSDT', label: '✧ TRON (TRX/USDT)', short: 'TRX' },
  { value: 'AVAXUSDT', label: '▲ Avalanche (AVAX/USDT)', short: 'AVAX' },
  { value: 'DOTUSDT', label: '● Polkadot (DOT/USDT)', short: 'DOT' },
  { value: 'LINKUSDT', label: '⬡ Chainlink (LINK/USDT)', short: 'LINK' },
  { value: 'MATICUSDT', label: '⬟ Polygon (MATIC/USDT)', short: 'MATIC' },
];

const FOREX_SYMBOLS = [
  { value: 'EUR_USD', label: '🇪🇺 EUR/USD', short: 'EUR/USD' },
  { value: 'GBP_USD', label: '🇬🇧 GBP/USD', short: 'GBP/USD' },
  { value: 'USD_JPY', label: '🇯🇵 USD/JPY', short: 'USD/JPY' },
  { value: 'USD_CHF', label: '🇨🇭 USD/CHF', short: 'USD/CHF' },
  { value: 'AUD_USD', label: '🇦🇺 AUD/USD', short: 'AUD/USD' },
  { value: 'USD_CAD', label: '🇨🇦 USD/CAD', short: 'USD/CAD' },
  { value: 'NZD_USD', label: '🇳🇿 NZD/USD', short: 'NZD/USD' },
  { value: 'EUR_GBP', label: '🇪🇺🇬🇧 EUR/GBP', short: 'EUR/GBP' },
];

const INTERVALS = [
  { value: '1m', label: '1 min' },
  { value: '5m', label: '5 min' },
  { value: '15m', label: '15 min' },
  { value: '30m', label: '30 min' },
  { value: '1h', label: '1 hora' },
  { value: '1d', label: '1 día' },
];

export default function MarketRadar() {
  const [market, setMarket] = useState<'crypto' | 'forex'>('crypto');
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [interval, setInterval] = useState('15m');
  const [analyzing, setAnalyzing] = useState(true);
  const [signalData, setSignalData] = useState<{
    rsi: number;
    trend: string;
    signal: string;
    color: string;
    message: string;
    price: number;
  } | null>(null);

  const symbols = market === 'crypto' ? CRYPTO_SYMBOLS : FOREX_SYMBOLS;
  const currentShort = symbols.find(s => s.value === selectedSymbol)?.short || '';

  // TradingView Interval Mapping
  const tvIntervalMap: Record<string, string> = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '30m': '30',
    '1h': '60',
    '1d': 'D',
  };

  // Finnhub Interval Mapping
  const finnhubIntervalMap: Record<string, string> = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '30m': '30',
    '1h': '60',
    '1d': 'D',
  };

  const chartUrl = useMemo(() => {
    // For TradingView, crypto is BINANCE:BTCUSDT, forex is FX:EURUSD
    let tvSymbol = market === 'crypto' ? `BINANCE:${selectedSymbol}` : `FX:${selectedSymbol.replace('_', '')}`;
    
    const params = new URLSearchParams({
      symbol: tvSymbol,
      interval: tvIntervalMap[interval] || '15',
      theme: 'dark',
      style: '1',
      locale: 'es',
      timezone: 'America/New_York',
      hide_top_toolbar: '0',
      hide_legend: '0',
      allow_symbol_change: '0',
      save_image: '0',
      calendar: '0',
      hide_volume: '0',
      studies: 'RSI@tv-basicstudies,MACD@tv-basicstudies',
      backgroundColor: 'rgba(10, 10, 26, 1)',
    });
    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [market, selectedSymbol, interval]);

  useEffect(() => {
    let isMounted = true;
    
    const analyzeMarket = async () => {
      setAnalyzing(true);
      try {
        let closes: number[] = [];
        let currentPrice = 0;

        if (market === 'crypto') {
          // Fetch from Binance
          const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${selectedSymbol}&interval=${interval}&limit=15`);
          const data = await res.json();
          if (!isMounted) return;
          closes = data.map((d: any) => parseFloat(d[4]));
          currentPrice = closes[closes.length - 1];
        } else {
          // Fetch from our custom Finnhub proxy for Forex
          const finnRes = finnhubIntervalMap[interval];
          const res = await fetch(`/api/forex?symbol=${selectedSymbol}&resolution=${finnRes}`);
          const data = await res.json();
          if (!isMounted) return;
          if (data.error) throw new Error(data.error);
          closes = data.closes;
          currentPrice = data.currentPrice;
        }

        if (closes.length < 14) throw new Error("Not enough data");

        // RSI Calculation (Simplified 14-period)
        let gains = 0;
        let losses = 0;
        for (let i = 1; i < closes.length; i++) {
          const diff = closes[i] - closes[i - 1];
          if (diff >= 0) gains += diff;
          else losses -= diff;
        }
        
        const avgGain = gains / 14;
        const avgLoss = losses / 14;
        let rsi = 50;
        if (avgLoss === 0) {
          rsi = 100;
        } else {
          const rs = avgGain / avgLoss;
          rsi = 100 - (100 / (1 + rs));
        }

        // Determine Signal based on RSI and Price Action
        let trend = "NEUTRAL";
        let signal = "⚪ ESPERAR";
        let color = "#aaaaaa";
        let message = "El mercado está sin dirección clara. Mantente fuera y espera confirmación.";

        if (rsi >= 70) {
          trend = "BAJISTA (Sobrecompra)";
          signal = "🔴 VENDER / CORTO";
          color = "#ff5252";
          message = "El precio ha subido demasiado rápido y está sobrecomprado. Alta probabilidad de corrección o caída. Momento ideal para vender o abrir un Short.";
        } else if (rsi <= 30) {
          trend = "ALCISTA (Sobreventa)";
          signal = "🟢 COMPRAR / LARGO";
          color = "#00e676";
          message = "El precio ha caído demasiado y tocó fondo. Los vendedores están agotados. Alta probabilidad de rebote. Momento ideal para comprar o abrir un Long.";
        } else if (rsi > 55 && rsi < 70) {
          trend = "ALCISTA LIGERA";
          signal = "🟢 COMPRAR (Precaución)";
          color = "#00e676";
          message = "Hay fuerza compradora en el mercado. Puedes comprar, pero usa un Stop Loss ajustado porque la tendencia podría girarse.";
        } else if (rsi < 45 && rsi > 30) {
          trend = "BAJISTA LIGERA";
          signal = "🔴 VENDER (Precaución)";
          color = "#ff5252";
          message = "Los vendedores tienen el control. Es buena zona para vender, pero protégete por si hay un rebote sorpresa.";
        }

        // Add some artificial delay to simulate "AI processing" for UX
        setTimeout(() => {
          if (isMounted) {
            setSignalData({ rsi: parseFloat(rsi.toFixed(2)), trend, signal, color, message, price: currentPrice });
            setAnalyzing(false);
          }
        }, 1200);

      } catch (error) {
        console.error("Error analyzing market:", error);
        setAnalyzing(false);
      }
    };

    analyzeMarket();
    // Refresh analysis every 30 seconds
    const intervalId = setInterval(analyzeMarket, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [market, selectedSymbol, interval]);

  return (
    <div className="standard-calc">
      <div className="calc-panel-box">
        <div className="panel-title-bar">
          <span>🤖</span> Bot de Señales (Inteligencia de Mercado)
        </div>

        {/* Market type tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
          <button
            onClick={() => { setMarket('crypto'); setSelectedSymbol('BTCUSDT'); }}
            className={market === 'crypto' ? 'btn-primary' : 'btn-secondary'}
            style={{ flex: 1, padding: '11px 8px', fontSize: '13px', fontWeight: 600 }}
          >
            🪙 Cripto (Binance)
          </button>
          <button
            onClick={() => { setMarket('forex'); setSelectedSymbol('EUR_USD'); }}
            className={market === 'forex' ? 'btn-primary' : 'btn-secondary'}
            style={{ flex: 1, padding: '11px 8px', fontSize: '13px', fontWeight: 600 }}
          >
            💱 Forex (OANDA/WallSt)
          </button>
        </div>

        {/* Symbol selector */}
        <div className="input-group" style={{ marginBottom: '12px' }}>
          <label>Activo a Analizar</label>
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
          >
            {symbols.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Interval selector */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Temporalidad (Para cuándo quieres la predicción)</label>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {INTERVALS.map(i => (
              <button
                key={i.value}
                onClick={() => setInterval(i.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: interval === i.value ? '1px solid var(--neon-blue)' : '1px solid var(--border)',
                  background: interval === i.value ? 'rgba(0, 173, 181, 0.15)' : 'rgba(255,255,255,0.03)',
                  color: interval === i.value ? 'var(--neon-blue)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: interval === i.value ? 700 : 400,
                  transition: 'all 0.2s ease',
                  flex: '1 1 auto',
                  textAlign: 'center',
                  minWidth: '40px',
                }}
              >
                {i.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Signal Output */}
      <div className="calc-panel-box" style={{ marginTop: '12px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        
        {analyzing ? (
          <div style={{ padding: '40px 20px' }}>
            <div className="btn-spinner" style={{ width: '40px', height: '40px', borderWidth: '4px', margin: '0 auto 20px auto' }}></div>
            <h3 style={{ color: 'var(--neon-blue)', margin: 0 }}>TradingBot Analizando Mercado...</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '10px' }}>
              Leyendo velas en vivo de {market === 'crypto' ? 'Binance' : 'Wall Street'} y calculando fuerza para {currentShort}...
            </p>
          </div>
        ) : signalData ? (
          <div style={{ padding: '20px 10px' }}>
            <div style={{ 
              display: 'inline-block', 
              padding: '5px 15px', 
              borderRadius: '20px', 
              background: 'rgba(255,255,255,0.05)', 
              color: 'var(--text-muted)',
              fontSize: '13px',
              marginBottom: '15px'
            }}>
              Precio Actual: <strong style={{ color: '#fff' }}>{market === 'crypto' ? '$' : ''}{signalData.price.toLocaleString(undefined, { minimumFractionDigits: market === 'forex' ? 4 : 2 })}</strong>
            </div>

            <h4 style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Tendencia Detectada</h4>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: signalData.color, marginBottom: '25px' }}>
              {signalData.trend}
            </div>

            <div style={{
              background: `rgba(${signalData.color === '#00e676' ? '0,230,118' : signalData.color === '#ff5252' ? '255,82,82' : '170,170,170'}, 0.1)`,
              border: `1px solid ${signalData.color}`,
              borderRadius: '12px',
              padding: '25px 20px',
              marginBottom: '20px',
              boxShadow: `0 0 20px rgba(${signalData.color === '#00e676' ? '0,230,118' : signalData.color === '#ff5252' ? '255,82,82' : '170,170,170'}, 0.2)`
            }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Señal Recomendada</h4>
              <h2 style={{ margin: 0, fontSize: '32px', color: signalData.color }}>{signalData.signal}</h2>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto' }}>
              {signalData.message}
            </p>
            
            <div style={{ marginTop: '20px', fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
              (Fuerza RSI: {signalData.rsi}) - Actualizado en vivo
            </div>
          </div>
        ) : null}

      </div>

      {/* Candlestick Chart */}
      <div className="calc-panel-box" style={{ marginTop: '12px' }}>
        <div className="panel-title-bar">
          <span>🕯️</span> Gráfico de Velas — Confirma tu entrada
        </div>
        <div style={{
          width: '100%',
          height: '450px',
          borderRadius: '8px',
          overflow: 'hidden',
          background: 'rgba(0,0,0,0.2)',
        }}>
          <iframe
            key={`chart-${selectedSymbol}-${interval}`}
            src={chartUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
            }}
            title={`Gráfico ${currentShort}`}
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>

      {/* Disclaimer */}
      <div className="calc-panel-box" style={{
        marginTop: '12px',
        background: 'rgba(255, 82, 82, 0.05)',
        border: '1px solid rgba(255, 82, 82, 0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '4px 0' }}>
          <span style={{ fontSize: '22px' }}>⚠️</span>
          <p style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: '1.6', margin: 0 }}>
            <strong style={{ color: '#ff5252' }}>Aviso Legal:</strong> Las señales de este bot están basadas estrictamente en análisis técnico automatizado (RSI y Acción del precio).
            <strong> NO constituyen asesoría financiera infalible</strong>. El mercado es altamente volátil. Usa esta herramienta como apoyo, gestiona tu riesgo y opera bajo tu propia responsabilidad.
          </p>
        </div>
      </div>
    </div>
  );
}
