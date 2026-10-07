"use client";
import React, { useState, useMemo } from 'react';

const CRYPTO_SYMBOLS = [
  { value: 'BINANCE:BTCUSDT', label: '₿ Bitcoin (BTC/USDT)', short: 'BTC' },
  { value: 'BINANCE:ETHUSDT', label: 'Ξ Ethereum (ETH/USDT)', short: 'ETH' },
  { value: 'BINANCE:SOLUSDT', label: '◎ Solana (SOL/USDT)', short: 'SOL' },
  { value: 'BINANCE:XRPUSDT', label: '✕ XRP (XRP/USDT)', short: 'XRP' },
  { value: 'BINANCE:BNBUSDT', label: '◆ BNB (BNB/USDT)', short: 'BNB' },
  { value: 'BINANCE:DOGEUSDT', label: 'Ð Dogecoin (DOGE/USDT)', short: 'DOGE' },
  { value: 'BINANCE:ADAUSDT', label: '♦ Cardano (ADA/USDT)', short: 'ADA' },
  { value: 'BINANCE:TRXUSDT', label: '✧ TRON (TRX/USDT)', short: 'TRX' },
  { value: 'BINANCE:AVAXUSDT', label: '▲ Avalanche (AVAX/USDT)', short: 'AVAX' },
  { value: 'BINANCE:DOTUSDT', label: '● Polkadot (DOT/USDT)', short: 'DOT' },
  { value: 'BINANCE:LINKUSDT', label: '⬡ Chainlink (LINK/USDT)', short: 'LINK' },
  { value: 'BINANCE:MATICUSDT', label: '⬟ Polygon (MATIC/USDT)', short: 'MATIC' },
];

const FOREX_SYMBOLS = [
  { value: 'FX:EURUSD', label: '🇪🇺 EUR/USD', short: 'EUR/USD' },
  { value: 'FX:GBPUSD', label: '🇬🇧 GBP/USD', short: 'GBP/USD' },
  { value: 'FX:USDJPY', label: '🇯🇵 USD/JPY', short: 'USD/JPY' },
  { value: 'FX:USDCHF', label: '🇨🇭 USD/CHF', short: 'USD/CHF' },
  { value: 'FX:AUDUSD', label: '🇦🇺 AUD/USD', short: 'AUD/USD' },
  { value: 'FX:USDCAD', label: '🇨🇦 USD/CAD', short: 'USD/CAD' },
  { value: 'FX:NZDUSD', label: '🇳🇿 NZD/USD', short: 'NZD/USD' },
  { value: 'FX:EURGBP', label: '🇪🇺🇬🇧 EUR/GBP', short: 'EUR/GBP' },
];

const INTERVALS = [
  { value: '1', label: '1m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '30', label: '30m' },
  { value: '60', label: '1h' },
  { value: '240', label: '4h' },
  { value: 'D', label: '1D' },
];

export default function MarketRadar() {
  const [market, setMarket] = useState<'crypto' | 'forex'>('crypto');
  const [selectedSymbol, setSelectedSymbol] = useState('BINANCE:BTCUSDT');
  const [interval, setInterval] = useState('15');

  const symbols = market === 'crypto' ? CRYPTO_SYMBOLS : FOREX_SYMBOLS;
  const currentShort = symbols.find(s => s.value === selectedSymbol)?.short || '';

  // Build TradingView chart iframe URL
  const chartUrl = useMemo(() => {
    const params = new URLSearchParams({
      symbol: selectedSymbol,
      interval: interval,
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
  }, [selectedSymbol, interval]);

  // Build TradingView technical analysis iframe URL
  const gaugeUrl = useMemo(() => {
    const config = {
      interval: interval,
      width: '100%',
      height: '100%',
      isTransparent: true,
      symbol: selectedSymbol,
      showIntervalTabs: true,
      displayMode: 'single',
      locale: 'es',
      colorTheme: 'dark',
    };
    return `https://s.tradingview.com/embed-widget/technical-analysis/?locale=es#${JSON.stringify(config)}`;
  }, [selectedSymbol, interval]);

  return (
    <div className="standard-calc">
      {/* Controls */}
      <div className="calc-panel-box">
        <div className="panel-title-bar">
          <span>📡</span> Radar de Mercado — Análisis Técnico en Tiempo Real
        </div>

        {/* Market type tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            onClick={() => { setMarket('crypto'); setSelectedSymbol('BINANCE:BTCUSDT'); }}
            className={market === 'crypto' ? 'btn-primary' : 'btn-secondary'}
            style={{ flex: 1, padding: '11px 8px', fontSize: '13px', fontWeight: 600 }}
          >
            🪙 Cripto
          </button>
          <button
            onClick={() => { setMarket('forex'); setSelectedSymbol('FX:EURUSD'); }}
            className={market === 'forex' ? 'btn-primary' : 'btn-secondary'}
            style={{ flex: 1, padding: '11px 8px', fontSize: '13px', fontWeight: 600 }}
          >
            💱 Forex
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
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Temporalidad</label>
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

      {/* Technical Analysis Gauge */}
      <div className="calc-panel-box" style={{ marginTop: '12px' }}>
        <div className="panel-title-bar">
          <span>🧭</span> Medidor de Tendencia — {currentShort}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px' }}>
          Resumen basado en +20 indicadores técnicos (RSI, MACD, Medias Móviles, Estocástico, Williams %R, etc.)
        </p>
        <div style={{
          width: '100%',
          height: '420px',
          borderRadius: '8px',
          overflow: 'hidden',
          background: 'rgba(0,0,0,0.2)',
        }}>
          <iframe
            key={`gauge-${selectedSymbol}-${interval}`}
            src={gaugeUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
            }}
            title={`Análisis Técnico ${currentShort}`}
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>

      {/* Candlestick Chart */}
      <div className="calc-panel-box" style={{ marginTop: '12px' }}>
        <div className="panel-title-bar">
          <span>🕯️</span> Gráfico de Velas — {currentShort}
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
            <strong style={{ color: '#ff5252' }}>Aviso Legal:</strong> Esta herramienta es únicamente informativa y educativa.
            Los indicadores técnicos y medidores de tendencia <strong>NO constituyen asesoría financiera</strong> ni recomendaciones de inversión.
            El rendimiento pasado no garantiza resultados futuros. Operar con criptomonedas, divisas y derivados conlleva un alto riesgo de pérdida de capital.
            Siempre haz tu propia investigación (DYOR) antes de tomar decisiones de inversión.
          </p>
        </div>
      </div>
    </div>
  );
}
