"use client";
import React, { useState, useEffect, useRef } from 'react';

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
  { value: '1', label: '1 min' },
  { value: '5', label: '5 min' },
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '60', label: '1 hora' },
  { value: '240', label: '4 horas' },
  { value: 'D', label: '1 día' },
];

export default function MarketRadar() {
  const [market, setMarket] = useState<'crypto' | 'forex'>('crypto');
  const [selectedSymbol, setSelectedSymbol] = useState('BINANCE:BTCUSDT');
  const [interval, setInterval] = useState('15');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const gaugeContainerRef = useRef<HTMLDivElement>(null);

  const symbols = market === 'crypto' ? CRYPTO_SYMBOLS : FOREX_SYMBOLS;

  // Load TradingView chart widget
  useEffect(() => {
    if (!chartContainerRef.current) return;
    chartContainerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: selectedSymbol,
      interval: interval,
      timezone: "America/New_York",
      theme: "dark",
      style: "1",
      locale: "es",
      backgroundColor: "rgba(10, 10, 26, 1)",
      gridColor: "rgba(255, 255, 255, 0.04)",
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: "https://www.tradingview.com",
      studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies"],
    });

    const container = document.createElement('div');
    container.className = 'tradingview-widget-container__widget';
    container.style.height = '100%';
    container.style.width = '100%';

    chartContainerRef.current.appendChild(container);
    chartContainerRef.current.appendChild(script);
  }, [selectedSymbol, interval]);

  // Load TradingView technical analysis gauge widget
  useEffect(() => {
    if (!gaugeContainerRef.current) return;
    gaugeContainerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      interval: interval,
      width: "100%",
      isTransparent: true,
      height: "450",
      symbol: selectedSymbol,
      showIntervalTabs: true,
      displayMode: "single",
      locale: "es",
      colorTheme: "dark",
    });

    const container = document.createElement('div');
    container.className = 'tradingview-widget-container__widget';

    gaugeContainerRef.current.appendChild(container);
    gaugeContainerRef.current.appendChild(script);
  }, [selectedSymbol, interval]);

  return (
    <div className="standard-calc">
      {/* Market Selector */}
      <div className="calc-panel-box">
        <div className="panel-title-bar">
          <span>📡</span> Radar de Mercado — Análisis Técnico en Tiempo Real
        </div>

        {/* Market type tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button
            onClick={() => { setMarket('crypto'); setSelectedSymbol('BINANCE:BTCUSDT'); }}
            className={market === 'crypto' ? 'btn-primary' : 'btn-secondary'}
            style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 600 }}
          >
            🪙 Criptomonedas
          </button>
          <button
            onClick={() => { setMarket('forex'); setSelectedSymbol('FX:EURUSD'); }}
            className={market === 'forex' ? 'btn-primary' : 'btn-secondary'}
            style={{ flex: 1, padding: '12px', fontSize: '14px', fontWeight: 600 }}
          >
            💱 Forex
          </button>
        </div>

        {/* Symbol selector */}
        <div className="input-group" style={{ marginBottom: '10px' }}>
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
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {INTERVALS.map(i => (
            <button
              key={i.value}
              onClick={() => setInterval(i.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: interval === i.value ? '1px solid var(--neon-blue)' : '1px solid var(--border)',
                background: interval === i.value ? 'rgba(0, 173, 181, 0.15)' : 'rgba(255,255,255,0.03)',
                color: interval === i.value ? 'var(--neon-blue)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: interval === i.value ? 700 : 400,
                transition: 'all 0.2s ease',
              }}
            >
              {i.label}
            </button>
          ))}
        </div>
      </div>

      {/* Technical Analysis Gauge */}
      <div className="calc-panel-box" style={{ marginTop: '15px' }}>
        <div className="panel-title-bar">
          <span>🧭</span> Medidor de Tendencia — {symbols.find(s => s.value === selectedSymbol)?.short || selectedSymbol}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '10px' }}>
          Resumen basado en más de 20 indicadores técnicos (RSI, MACD, Medias Móviles, Estocástico, Williams %R, etc.)
        </p>
        <div
          ref={gaugeContainerRef}
          className="tradingview-widget-container"
          style={{ minHeight: '450px' }}
        />
      </div>

      {/* Candlestick Chart */}
      <div className="calc-panel-box" style={{ marginTop: '15px' }}>
        <div className="panel-title-bar">
          <span>🕯️</span> Gráfico de Velas — {symbols.find(s => s.value === selectedSymbol)?.short || selectedSymbol}
        </div>
        <div
          ref={chartContainerRef}
          className="tradingview-widget-container"
          style={{ height: '500px', minHeight: '400px' }}
        />
      </div>

      {/* Disclaimer */}
      <div className="calc-panel-box" style={{
        marginTop: '15px',
        background: 'rgba(255, 82, 82, 0.05)',
        border: '1px solid rgba(255, 82, 82, 0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '5px 0' }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
              <strong style={{ color: '#ff5252' }}>Aviso Legal:</strong> Esta herramienta es únicamente informativa y educativa.
              Los indicadores técnicos y medidores de tendencia <strong>NO constituyen asesoría financiera</strong> ni recomendaciones de inversión.
              El rendimiento pasado no garantiza resultados futuros. Operar con criptomonedas, divisas y derivados conlleva un alto riesgo de pérdida de capital.
              Siempre haz tu propia investigación (DYOR) y consulta con un asesor financiero certificado antes de tomar decisiones de inversión.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
