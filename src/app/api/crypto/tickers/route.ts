import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch("https://data-api.binance.vision/api/v3/ticker/price");
    if (!res.ok) throw new Error('Failed to fetch from Binance');
    
    const data = await res.json();
    
    // We only care about these global tickers
    const targetSymbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];
    
    const result: Record<string, string> = {};
    
    data.forEach((item: any) => {
      if (targetSymbols.includes(item.symbol)) {
        const valNum = parseFloat(item.price);
        result[item.symbol] = valNum > 10 ? valNum.toFixed(2) : valNum.toFixed(4);
      }
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Tickers Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
