import { NextResponse } from 'next/server';

// Fetch 24 hours of 1-hour klines (candlesticks)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let symbol = searchParams.get('symbol')?.toUpperCase() || 'BTCUSDT';

  try {
    // 1. Fetch Binance Klines (Oldest to Newest)
    const binanceRes = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=24`);
    const binanceData = await binanceRes.json();
    
    if (!Array.isArray(binanceData)) {
      throw new Error("Invalid response from Binance API");
    }

    // Binance format: [ [Open time (ms), Open, High, Low, Close, Volume, Close time, ...], ... ]
    const binanceMap = new Map<number, number>();
    binanceData.forEach((candle: any) => {
      const timestamp = parseInt(candle[0]); // Open time
      const closePrice = parseFloat(candle[4]);
      // Round to nearest hour to ensure matching
      const roundedHour = Math.floor(timestamp / 3600000) * 3600000;
      binanceMap.set(roundedHour, closePrice);
    });

    // 2. Fetch Bybit Klines (Newest to Oldest)
    const bybitRes = await fetch(`https://api.bybit.com/v5/market/kline?category=spot&symbol=${symbol}&interval=60&limit=24`);
    const bybitJson = await bybitRes.json();

    if (!bybitJson || !bybitJson.result || !Array.isArray(bybitJson.result.list)) {
      throw new Error("Invalid response from Bybit API");
    }

    const bybitData = bybitJson.result.list;
    // Bybit format: [ [startTime (ms), openPrice, highPrice, lowPrice, closePrice, volume, turnover], ... ]
    const bybitMap = new Map<number, number>();
    bybitData.forEach((candle: any) => {
      const timestamp = parseInt(candle[0]); // Start time
      const closePrice = parseFloat(candle[4]);
      const roundedHour = Math.floor(timestamp / 3600000) * 3600000;
      bybitMap.set(roundedHour, closePrice);
    });

    // 3. Match them chronologically
    const result: Array<{
      timestamp: number;
      timeLabel: string;
      binancePrice: number;
      bybitPrice: number;
      spreadPercent: number;
    }> = [];

    // Get all unique hours, sort ascending (oldest first)
    const allHours = Array.from(new Set([...binanceMap.keys(), ...bybitMap.keys()])).sort((a, b) => a - b);

    allHours.forEach(hourMs => {
      const binancePrice = binanceMap.get(hourMs);
      const bybitPrice = bybitMap.get(hourMs);

      if (binancePrice && bybitPrice) {
        // Calculate spread (buying on Binance, selling on Bybit)
        const spreadPercent = ((bybitPrice - binancePrice) / binancePrice) * 100;

        // Format time label (e.g. "14:00")
        const date = new Date(hourMs);
        const timeLabel = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

        result.push({
          timestamp: hourMs,
          timeLabel,
          binancePrice,
          bybitPrice,
          spreadPercent: parseFloat(spreadPercent.toFixed(4))
        });
      }
    });

    // Optional: Fill gaps or ensure we have exact 24 points?
    // It's fine if some are missing, Recharts handles it gracefully.

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("API /history error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
