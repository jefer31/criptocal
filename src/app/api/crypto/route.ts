import { NextResponse } from 'next/server';

const CACHE_TTL_MS = 5000;
const priceCache: Record<string, { price: number; timestamp: number }> = {};

// Funciones nativas ultra-rápidas (evitan el límite de 10s de Vercel y la pesada librería CCXT)
const fetchers: Record<string, (symbol: string, isBuy: boolean) => Promise<number>> = {
  binance: async (sym, isBuy) => {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/bookTicker?symbol=${sym}`);
    const data = await res.json();
    return parseFloat(isBuy ? data.askPrice : data.bidPrice);
  },
  bybit: async (sym, isBuy) => {
    const res = await fetch(`https://api.bybit.com/v5/market/tickers?category=spot&symbol=${sym}`);
    const data = await res.json();
    return parseFloat(isBuy ? data.result.list[0].ask1Price : data.result.list[0].bid1Price);
  },
  mexc: async (sym, isBuy) => {
    const res = await fetch(`https://api.mexc.com/api/v3/ticker/bookTicker?symbol=${sym}`);
    const data = await res.json();
    return parseFloat(isBuy ? data.askPrice : data.bidPrice);
  },
  kucoin: async (sym, isBuy) => {
    const kSym = sym.replace('USDT', '-USDT').replace('BTC', '-BTC');
    const res = await fetch(`https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${kSym}`);
    const data = await res.json();
    return parseFloat(isBuy ? data.data.bestAsk : data.data.bestBid);
  },
  okx: async (sym, isBuy) => {
    const oSym = sym.replace('USDT', '-USDT').replace('BTC', '-BTC');
    const res = await fetch(`https://www.okx.com/api/v5/market/ticker?instId=${oSym}`);
    const data = await res.json();
    return parseFloat(isBuy ? data.data[0].askPx : data.data[0].bidPx);
  },
  bitget: async (sym, isBuy) => {
    const res = await fetch(`https://api.bitget.com/api/v2/spot/market/tickers?symbol=${sym}`);
    const data = await res.json();
    return parseFloat(isBuy ? data.data[0].askPr : data.data[0].bidPr);
  },
  gateio: async (sym, isBuy) => {
    const gSym = sym.replace('USDT', '_USDT').replace('BTC', '_BTC');
    const res = await fetch(`https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${gSym}`);
    const data = await res.json();
    return parseFloat(isBuy ? data[0].lowest_ask : data[0].highest_bid);
  },
  kraken: async (sym, isBuy) => {
    let kSym = sym;
    if (sym === 'BTCUSDT') kSym = 'XBTUSDT';
    if (sym === 'BTCVES') throw new Error("Kraken no soporta VES");
    const res = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${kSym}`);
    const data = await res.json();
    const pairKey = Object.keys(data.result)[0];
    return parseFloat(isBuy ? data.result[pairKey].a[0] : data.result[pairKey].b[0]);
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const exchangeId = searchParams.get('exchange')?.toLowerCase();
  let rawSymbol = searchParams.get('symbol')?.toUpperCase();
  const type = searchParams.get('type')?.toLowerCase(); // 'compra' o 'venta'

  if (!exchangeId || !rawSymbol || !type) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
  }

  // Normalizar símbolo EUR
  if (rawSymbol === 'EURUSDT' && (exchangeId === 'binance' || exchangeId === 'kraken')) {
    rawSymbol = 'EURUSDT';
  } else if (rawSymbol === 'EURUSDT') {
    rawSymbol = 'EURUSDT'; // Dependiendo del exchange puede fallar, pero mantenemos formato base
  }

  try {
    const cacheKey = `${exchangeId}-${rawSymbol}-${type}`;
    if (priceCache[cacheKey] && Date.now() - priceCache[cacheKey].timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ price: priceCache[cacheKey].price, cached: true });
    }

    const fetcher = fetchers[exchangeId];
    if (!fetcher) {
      return NextResponse.json({ error: 'Exchange no soportado temporalmente' }, { status: 400 });
    }

    const isBuy = type === 'compra'; // Compra = necesitamos el Ask
    const price = await fetcher(rawSymbol, isBuy);

    if (!price || isNaN(price)) {
      throw new Error('Precio inválido devuelto por la API');
    }

    priceCache[cacheKey] = { price, timestamp: Date.now() };

    return NextResponse.json({ price, cached: false });

  } catch (error: any) {
    console.error(`Fetch API Error [${exchangeId}]:`, error.message);
    return NextResponse.json(
      { error: error.message || 'Fallo de conexión con el exchange' },
      { status: 500 }
    );
  }
}

