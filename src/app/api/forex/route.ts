import { NextResponse } from 'next/server';

// We store the key directly here for ease of deployment, 
// though typically it would go in .env.local
const FINNHUB_API_KEY = 'db3gaepr01qr9lhq71egdb3gaepr01qr9lhq71f0';

// Simple in-memory cache to prevent hitting Finnhub rate limits (60/min)
const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_DURATION_MS = 15000; // 15 seconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol'); // e.g., 'EUR_USD'
  const resolution = searchParams.get('resolution'); // 1, 5, 15, 30, 60, D

  if (!symbol || !resolution) {
    return NextResponse.json({ error: 'Missing symbol or resolution' }, { status: 400 });
  }

  const cacheKey = `${symbol}-${resolution}`;
  const now = Date.now();

  // Return cached data if valid
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION_MS) {
    return NextResponse.json(cache[cacheKey].data);
  }

  // Calculate timestamps for Finnhub (unix seconds)
  // We need enough candles to calculate a 14-period RSI. 
  // Let's fetch the last 30 candles just to be safe.
  const resToMinutes: Record<string, number> = {
    '1': 1, '5': 5, '15': 15, '30': 30, '60': 60, 'D': 1440
  };
  const minutes = resToMinutes[resolution] || 60;
  const to = Math.floor(now / 1000);
  const from = to - (minutes * 60 * 30); // 30 candles back

  const url = `https://finnhub.io/api/v1/forex/candle?symbol=OANDA:${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.s !== 'ok' || !data.c || data.c.length === 0) {
      return NextResponse.json({ error: 'No data returned from Finnhub', details: data }, { status: 400 });
    }

    // Return the closes array (c) and the latest price
    const result = {
      closes: data.c.slice(-15), // get last 15 closes to match binance logic
      currentPrice: data.c[data.c.length - 1]
    };

    // Save to cache
    cache[cacheKey] = {
      data: result,
      timestamp: now
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Finnhub Fetch Error:', error);
    return NextResponse.json({ error: 'Failed to fetch forex data' }, { status: 500 });
  }
}
