"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { getExchangeUrl } from '../lib/referrals';

interface SpreadResult {
  pair: string;
  pairLabel: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  spreadPercent: number;
}

const TOP_COINS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT', 
  'TRXUSDT', 'TONUSDT', 'DOTUSDT', 'MATICUSDT', 'LTCUSDT', 'SHIBUSDT', 'BCHUSDT', 
  'LINKUSDT', 'AVAXUSDT', 'NEARUSDT', 'UNIUSDT', 'ATOMUSDT', 'XLMUSDT', 'PEPEUSDT',
  'ICPUSDT', 'FILUSDT', 'ETCUSDT', 'APTUSDT', 'STXUSDT', 'IMXUSDT', 'OPUSDT', 
  'INJUSDT', 'RNDRUSDT', 'WIFUSDT', 'ARBUSDT', 'MNTUSDT', 'CROUSDT', 'VETUSDT',
  'MKRUSDT', 'GRTUSDT', 'LDOUSDT', 'TIAUSDT', 'RUNEUSDT', 'ARUSDT', 'THETAUSDT',
  'FTMUSDT', 'AAVEUSDT', 'ALGOUSDT', 'FLOKIUSDT', 'QNTUSDT'
];

const COIN_LABELS: Record<string, string> = {
  BTCUSDT: '₿ BTC', ETHUSDT: 'Ξ ETH', SOLUSDT: '◎ SOL', XRPUSDT: '✕ XRP',
  BNBUSDT: '◆ BNB', ADAUSDT: '♦ ADA', DOGEUSDT: 'Ð DOGE', TRXUSDT: '✧ TRX',
  TONUSDT: '💎 TON', DOTUSDT: '● DOT', MATICUSDT: '⬟ MATIC', LTCUSDT: 'Ł LTC',
  SHIBUSDT: '🐕 SHIB', BCHUSDT: 'Ƀ BCH', LINKUSDT: '⬡ LINK', AVAXUSDT: '▲ AVAX',
  NEARUSDT: 'Ⓝ NEAR', UNIUSDT: '🦄 UNI', ATOMUSDT: '⚛ ATOM', XLMUSDT: '★ XLM',
  PEPEUSDT: '🐸 PEPE', ICPUSDT: '∞ ICP', FILUSDT: '⨎ FIL', ETCUSDT: 'ξ ETC',
  APTUSDT: 'APT', STXUSDT: 'STX', IMXUSDT: 'IMX', OPUSDT: 'OP',
  INJUSDT: 'INJ', RNDRUSDT: 'RNDR', WIFUSDT: 'WIF', ARBUSDT: 'ARB',
  MNTUSDT: 'MNT', CROUSDT: 'CRO', VETUSDT: 'VET', MKRUSDT: 'MKR',
  GRTUSDT: 'GRT', LDOUSDT: 'LDO', TIAUSDT: 'TIA', RUNEUSDT: 'RUNE',
  ARUSDT: 'AR', THETAUSDT: 'THETA', FTMUSDT: 'FTM', AAVEUSDT: 'AAVE',
  ALGOUSDT: 'ALGO', FLOKIUSDT: 'FLOKI', QNTUSDT: 'QNT'
};

const EXCHANGE_LABELS: Record<string, string> = {
  binance: 'Binance', bybit: 'Bybit', okx: 'OKX', bitget: 'Bitget'
};

// Fetchers masivos — 1 sola petición por exchange trae TODAS las monedas
async function fetchBinanceBulk() {
  try {
    const data = await fetch('https://api.binance.com/api/v3/ticker/bookTicker').then(r => r.json());
    const map = new Map<string, {ask: number, bid: number}>();
    if (Array.isArray(data)) {
      data.forEach((t: any) => {
        if (TOP_COINS.includes(t.symbol)) map.set(t.symbol, { ask: parseFloat(t.askPrice), bid: parseFloat(t.bidPrice) });
      });
    }
    return map;
  } catch { return new Map(); }
}

async function fetchBybitBulk() {
  try {
    const data = await fetch('https://api.bybit.com/v5/market/tickers?category=spot').then(r => r.json());
    const map = new Map<string, {ask: number, bid: number}>();
    if (data?.result?.list) {
      data.result.list.forEach((t: any) => {
        if (TOP_COINS.includes(t.symbol)) map.set(t.symbol, { ask: parseFloat(t.ask1Price), bid: parseFloat(t.bid1Price) });
      });
    }
    return map;
  } catch { return new Map(); }
}

async function fetchBitgetBulk() {
  try {
    const data = await fetch('https://api.bitget.com/api/v2/spot/market/tickers').then(r => r.json());
    const map = new Map<string, {ask: number, bid: number}>();
    if (data?.data) {
      data.data.forEach((t: any) => {
        if (TOP_COINS.includes(t.symbol)) map.set(t.symbol, { ask: parseFloat(t.askPr), bid: parseFloat(t.bidPr) });
      });
    }
    return map;
  } catch { return new Map(); }
}

async function fetchOkxBulk() {
  try {
    const data = await fetch('https://www.okx.com/api/v5/market/ticker?instType=SPOT').then(r => r.json());
    const map = new Map<string, {ask: number, bid: number}>();
    if (data?.data) {
      data.data.forEach((t: any) => {
        const sym = t.instId.replace('-', '');
        if (TOP_COINS.includes(sym)) map.set(sym, { ask: parseFloat(t.askPx), bid: parseFloat(t.bidPx) });
      });
    }
    return map;
  } catch { return new Map(); }
}

export default function SpreadScanner() {
  const [spreads, setSpreads] = useState<SpreadResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [exchangesOnline, setExchangesOnline] = useState(0);
  const [totalScanned, setTotalScanned] = useState(0);
  const [countdown, setCountdown] = useState(30);

  const scanSpreads = useCallback(async () => {
    setIsScanning(true);

    // 4 peticiones en paralelo — trae TODAS las monedas de golpe
    const [binance, bybit, bitget, okx] = await Promise.all([
      fetchBinanceBulk(), fetchBybitBulk(), fetchBitgetBulk(), fetchOkxBulk()
    ]);

    const exchanges = [
      { name: 'binance', data: binance },
      { name: 'bybit', data: bybit },
      { name: 'bitget', data: bitget },
      { name: 'okx', data: okx }
    ];

    let online = exchanges.filter(e => e.data.size > 0).length;
    let scanned = 0;
    const allSpreads: SpreadResult[] = [];

    for (const symbol of TOP_COINS) {
      let bestBuy = { exchange: '', price: Infinity };
      let bestSell = { exchange: '', price: 0 };

      for (const ex of exchanges) {
        const prices = ex.data.get(symbol);
        if (prices && prices.ask > 0 && prices.bid > 0) {
          scanned++;
          if (prices.ask < bestBuy.price) bestBuy = { exchange: ex.name, price: prices.ask };
          if (prices.bid > bestSell.price) bestSell = { exchange: ex.name, price: prices.bid };
        }
      }

      if (bestBuy.exchange && bestSell.exchange && bestBuy.exchange !== bestSell.exchange) {
        const spread = ((bestSell.price - bestBuy.price) / bestBuy.price) * 100;
        if (spread > -5 && spread < 10) {
          allSpreads.push({
            pair: symbol,
            pairLabel: COIN_LABELS[symbol] || symbol.replace('USDT', ''),
            buyExchange: bestBuy.exchange,
            sellExchange: bestSell.exchange,
            buyPrice: bestBuy.price,
            sellPrice: bestSell.price,
            spreadPercent: spread,
          });
        }
      }
    }

    allSpreads.sort((a, b) => b.spreadPercent - a.spreadPercent);
    setSpreads(allSpreads.slice(0, 10));
    setExchangesOnline(online);
    setTotalScanned(scanned);
    setLastUpdate(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setIsScanning(false);
    setCountdown(30);
  }, []);

  useEffect(() => {
    scanSpreads();
    const interval = setInterval(scanSpreads, 30000);
    return () => clearInterval(interval);
  }, [scanSpreads]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 30));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatPrice = (price: number) => {
    if (price > 500) return price.toFixed(2);
    if (price > 1) return price.toFixed(4);
    return price.toFixed(6);
  };

  const handleExchangeClick = async (exchangeName: string) => {
    const url = await getExchangeUrl(exchangeName);
    window.open(url, '_blank');
  };

  return (
    <div className="spread-scanner-container">
      <div className="spread-scanner-header">
        <div className="spread-scanner-title">
          <span className="scanner-icon">📡</span>
          <div>
            <h2>Scanner de Spreads en Tiempo Real (47 Monedas × 4 Exchanges)</h2>
            <p className="scanner-subtitle">
              {exchangesOnline} exchanges conectados • {totalScanned} precios escaneados • {TOP_COINS.length} monedas
              {lastUpdate && <> • Última actualización: {lastUpdate}</>}
            </p>
          </div>
        </div>
        <button 
          className={`scanner-refresh-btn ${isScanning ? 'scanning' : ''}`} 
          onClick={scanSpreads} 
          disabled={isScanning}
        >
          {isScanning ? '⏳ Escaneando...' : `🔄 Actualizar (${countdown}s)`}
        </button>
      </div>

      <div style={{ backgroundColor: 'rgba(255, 165, 0, 0.1)', borderLeft: '4px solid #FFA500', padding: '12px', margin: '0 0 15px 0', borderRadius: '4px', fontSize: '13px', color: 'var(--text-muted)' }}>
        <strong>⚠️ Atención: Mercado Spot Global</strong><br/>
        Este escáner rastrea las <strong>47 criptomonedas más grandes</strong> del mundo entre Binance, Bybit, OKX y Bitget en tiempo real. Las oportunidades aquí <strong>NO incluyen comisiones de retiro de red</strong> (gas fees). Usa la calculadora para un análisis preciso.
      </div>

      {isScanning && spreads.length === 0 ? (
        <div className="scanner-loading">
          <div className="scanner-pulse"></div>
          <p>Conectando con 4 exchanges globales...</p>
        </div>
      ) : spreads.length > 0 ? (
        <div className="spread-table-wrapper">
          <table className="spread-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Par</th>
                <th>Comprar en</th>
                <th>Vender en</th>
                <th>Precio Compra</th>
                <th>Precio Venta</th>
                <th>Spread</th>
              </tr>
            </thead>
            <tbody>
              {spreads.map((s, idx) => (
                <tr key={idx} className={`spread-row ${s.spreadPercent > 0.3 ? 'hot' : s.spreadPercent > 0 ? 'warm' : 'cold'}`}>
                  <td className="spread-rank">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                  </td>
                  <td className="spread-pair">{s.pairLabel}</td>
                  <td className="spread-exchange">
                    <span 
                      className="exchange-badge buy" 
                      onClick={() => handleExchangeClick(s.buyExchange)} 
                      style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                      title={`Ir a ${EXCHANGE_LABELS[s.buyExchange]}`}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {EXCHANGE_LABELS[s.buyExchange]}
                    </span>
                  </td>
                  <td className="spread-exchange">
                    <span 
                      className="exchange-badge sell" 
                      onClick={() => handleExchangeClick(s.sellExchange)} 
                      style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                      title={`Ir a ${EXCHANGE_LABELS[s.sellExchange]}`}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {EXCHANGE_LABELS[s.sellExchange]}
                    </span>
                  </td>
                  <td className="spread-price">${formatPrice(s.buyPrice)}</td>
                  <td className="spread-price">${formatPrice(s.sellPrice)}</td>
                  <td className={`spread-percent ${s.spreadPercent > 0.3 ? 'positive-hot' : s.spreadPercent > 0 ? 'positive' : 'negative'}`}>
                    {s.spreadPercent > 0 ? '+' : ''}{s.spreadPercent.toFixed(3)}%
                    {s.spreadPercent > 0.5 && ' 🔥'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="scanner-empty">
          <p>⚠️ No se pudieron obtener precios. Tu conexión o región puede estar bloqueando algunos exchanges.</p>
          <button className="scanner-refresh-btn" onClick={scanSpreads}>🔄 Reintentar</button>
        </div>
      )}
      
      <div className="scanner-footer">
        <span>💡 Los spreads no incluyen comisiones de trading ni de retiro de red. Usa la calculadora para un análisis preciso.</span>
      </div>
    </div>
  );
}
