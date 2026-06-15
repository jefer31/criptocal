"use client";
import React, { useState, useEffect, useCallback } from 'react';

interface SpreadResult {
  pair: string;
  pairLabel: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  spreadPercent: number;
}

interface ExchangePrice {
  exchange: string;
  ask: number;
  bid: number;
}

const EXCHANGES = ['binance', 'bybit', 'mexc', 'kucoin', 'okx', 'bitget', 'gateio', 'kraken'];
const PAIRS = [
  { symbol: 'BTCUSDT', label: 'BTC/USDT', icon: '₿' },
  { symbol: 'ETHUSDT', label: 'ETH/USDT', icon: 'Ξ' },
  { symbol: 'SOLUSDT', label: 'SOL/USDT', icon: '◎' },
  { symbol: 'XRPUSDT', label: 'XRP/USDT', icon: '✕' },
  { symbol: 'BNBUSDT', label: 'BNB/USDT', icon: '◆' },
];

const EXCHANGE_LABELS: Record<string, string> = {
  binance: 'Binance', bybit: 'Bybit', mexc: 'MEXC', kucoin: 'KuCoin',
  okx: 'OKX', bitget: 'Bitget', gateio: 'Gate.io', kraken: 'Kraken'
};

async function fetchPrice(exchange: string, symbol: string): Promise<ExchangePrice | null> {
  const fetchDirect = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    let url = '';
    let ask = 0, bid = 0;

    switch (exchange) {
      case 'binance':
        url = `https://api.binance.com/api/v3/ticker/bookTicker?symbol=${symbol}`;
        const resBin = await fetch(url, { signal: controller.signal }).then(r => r.json());
        ask = parseFloat(resBin.askPrice); bid = parseFloat(resBin.bidPrice);
        break;
      case 'bybit':
        url = `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`;
        const resByb = await fetch(url, { signal: controller.signal }).then(r => r.json());
        ask = parseFloat(resByb.result.list[0].ask1Price); bid = parseFloat(resByb.result.list[0].bid1Price);
        break;
      case 'mexc':
        url = `https://api.mexc.com/api/v3/ticker/bookTicker?symbol=${symbol}`;
        const resMexc = await fetch(url, { signal: controller.signal }).then(r => r.json());
        ask = parseFloat(resMexc.askPrice); bid = parseFloat(resMexc.bidPrice);
        break;
      case 'kucoin':
        const kSym = symbol.replace('USDT', '-USDT');
        url = `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${kSym}`;
        const resKuc = await fetch(url, { signal: controller.signal }).then(r => r.json());
        ask = parseFloat(resKuc.data.bestAsk); bid = parseFloat(resKuc.data.bestBid);
        break;
      case 'okx':
        const oSym = symbol.replace('USDT', '-USDT');
        url = `https://www.okx.com/api/v5/market/ticker?instId=${oSym}`;
        const resOkx = await fetch(url, { signal: controller.signal }).then(r => r.json());
        ask = parseFloat(resOkx.data[0].askPx); bid = parseFloat(resOkx.data[0].bidPx);
        break;
      case 'bitget':
        url = `https://api.bitget.com/api/v2/spot/market/tickers?symbol=${symbol}`;
        const resBit = await fetch(url, { signal: controller.signal }).then(r => r.json());
        ask = parseFloat(resBit.data[0].askPr); bid = parseFloat(resBit.data[0].bidPr);
        break;
      case 'gateio':
        const gSym = symbol.replace('USDT', '_USDT');
        url = `https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${gSym}`;
        const resGate = await fetch(url, { signal: controller.signal }).then(r => r.json());
        ask = parseFloat(resGate[0].lowest_ask); bid = parseFloat(resGate[0].highest_bid);
        break;
      case 'kraken':
        let krSym = symbol;
        if (symbol === 'BTCUSDT') krSym = 'XBTUSDT';
        url = `https://api.kraken.com/0/public/Ticker?pair=${krSym}`;
        const resKr = await fetch(url, { signal: controller.signal }).then(r => r.json());
        const pairKey = Object.keys(resKr.result)[0];
        ask = parseFloat(resKr.result[pairKey].a[0]); bid = parseFloat(resKr.result[pairKey].b[0]);
        break;
    }
    clearTimeout(timeout);
    return { ask, bid };
  };

  try {
    let prices;
    try {
      prices = await fetchDirect();
    } catch (e) {
      // Proxy fallback si bloquea CORS o adblock
      const res = await fetch(`/api/crypto?exchange=${exchange}&symbol=${symbol}&type=both`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      prices = data;
    }

    if (!prices || !prices.ask || !prices.bid || isNaN(prices.ask) || isNaN(prices.bid)) return null;
    return { exchange, ask: prices.ask, bid: prices.bid };
  } catch {
    return null;
  }
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
    const allSpreads: SpreadResult[] = [];
    let onlineCount = 0;
    let scannedCount = 0;

    for (const pair of PAIRS) {
      const promises = EXCHANGES.map(ex => fetchPrice(ex, pair.symbol));
      const results = await Promise.all(promises);
      const validPrices = results.filter((r): r is ExchangePrice => r !== null);
      
      onlineCount = Math.max(onlineCount, validPrices.length);
      scannedCount += validPrices.length;

      // Calculate spreads between all pairs of exchanges
      for (let i = 0; i < validPrices.length; i++) {
        for (let j = 0; j < validPrices.length; j++) {
          if (i === j) continue;
          // Buy at exchange i (ask), sell at exchange j (bid)
          const buyAt = validPrices[i].ask;
          const sellAt = validPrices[j].bid;
          const spread = ((sellAt - buyAt) / buyAt) * 100;
          
          allSpreads.push({
            pair: pair.symbol,
            pairLabel: `${pair.icon} ${pair.label}`,
            buyExchange: validPrices[i].exchange,
            sellExchange: validPrices[j].exchange,
            buyPrice: buyAt,
            sellPrice: sellAt,
            spreadPercent: spread,
          });
        }
      }
    }

    // Sort by spread descending and take top 5
    allSpreads.sort((a, b) => b.spreadPercent - a.spreadPercent);
    setSpreads(allSpreads.slice(0, 5));
    setExchangesOnline(onlineCount);
    setTotalScanned(scannedCount);
    setLastUpdate(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setIsScanning(false);
    setCountdown(30);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <div className="spread-scanner-container">
      <div className="spread-scanner-header">
        <div className="spread-scanner-title">
          <span className="scanner-icon">📡</span>
          <div>
            <h2>Scanner de Spreads en Tiempo Real (Mercado Spot)</h2>
            <p className="scanner-subtitle">
              {exchangesOnline} exchanges conectados • {totalScanned} precios escaneados
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
        Este escáner rastrea precios de criptomonedas puras (Ej. BTC/USDT) entre exchanges mundiales. Las oportunidades aquí <strong>NO incluyen comisiones de retiro de red</strong> (gas fees). Solo es rentable para capitales altos donde la ganancia supera la tarifa de transferencia del exchange. Para arbitraje local con dinero fiat (Ej. Bolívares o Pesos), usa la pestaña de Arbitraje P2P.
      </div>

      {isScanning && spreads.length === 0 ? (
        <div className="scanner-loading">
          <div className="scanner-pulse"></div>
          <p>Conectando con exchanges globales...</p>
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
                    <span className="exchange-badge buy">{EXCHANGE_LABELS[s.buyExchange]}</span>
                  </td>
                  <td className="spread-exchange">
                    <span className="exchange-badge sell">{EXCHANGE_LABELS[s.sellExchange]}</span>
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
