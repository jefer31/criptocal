import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We need a server-role supabase client here because this will be called by an external CRON 
// and needs to bypass RLS to read all users' alerts.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // IMPORTANT: You need to add this env var
const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function fetchPrice(exchange: string, symbol: string): Promise<{ ask: number; bid: number } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let ask = 0, bid = 0;

    const opts = { signal: controller.signal };

    switch (exchange) {
      case 'binance': {
        // Try global first, then .us fallback
        let res;
        try {
          res = await fetch(`https://api.binance.com/api/v3/ticker/bookTicker?symbol=${symbol}`, opts).then(r => r.json());
          if (res.askPrice) {
            ask = parseFloat(res.askPrice);
            bid = parseFloat(res.bidPrice);
          }
        } catch (_) { /* global blocked, try .us */ }
        if (!ask) {
          try {
            res = await fetch(`https://api.binance.us/api/v3/ticker/bookTicker?symbol=${symbol}`, opts).then(r => r.json());
            ask = parseFloat(res.askPrice);
            bid = parseFloat(res.bidPrice);
          } catch (_) { /* .us also failed */ }
        }
        break;
      }
      case 'bybit': {
        const res = await fetch(`https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`, opts).then(r => r.json());
        if (res.result?.list?.[0]) {
          ask = parseFloat(res.result.list[0].ask1Price);
          bid = parseFloat(res.result.list[0].bid1Price);
        }
        break;
      }
      case 'mexc': {
        const res = await fetch(`https://api.mexc.com/api/v3/ticker/bookTicker?symbol=${symbol}`, opts).then(r => r.json());
        if (res.askPrice) {
          ask = parseFloat(res.askPrice);
          bid = parseFloat(res.bidPrice);
        }
        break;
      }
      case 'kucoin': {
        const kSym = symbol.replace('USDT', '-USDT');
        const res = await fetch(`https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${kSym}`, opts).then(r => r.json());
        if (res.data?.bestAsk) {
          ask = parseFloat(res.data.bestAsk);
          bid = parseFloat(res.data.bestBid);
        }
        break;
      }
      case 'okx': {
        const oSym = symbol.replace('USDT', '-USDT');
        const res = await fetch(`https://www.okx.com/api/v5/market/ticker?instId=${oSym}`, opts).then(r => r.json());
        if (res.data?.[0]?.askPx) {
          ask = parseFloat(res.data[0].askPx);
          bid = parseFloat(res.data[0].bidPx);
        }
        break;
      }
      case 'bitget': {
        const res = await fetch(`https://api.bitget.com/api/v2/spot/market/tickers?symbol=${symbol}`, opts).then(r => r.json());
        if (res.data?.[0]?.askPr) {
          ask = parseFloat(res.data[0].askPr);
          bid = parseFloat(res.data[0].bidPr);
        }
        break;
      }
      default:
        return null;
    }
    clearTimeout(timeout);

    // If exchange API failed (geo-blocked), use CoinGecko as universal fallback
    if (!ask || !bid || isNaN(ask) || isNaN(bid)) {
      try {
        const coinId = symbol.replace('USDT', '').toLowerCase();
        const coinMap: Record<string, string> = {
          btc: 'bitcoin', eth: 'ethereum', sol: 'solana', bnb: 'binancecoin', xrp: 'ripple'
        };
        const geckoId = coinMap[coinId] || coinId;
        const geckoRes = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd&include_24hr_change=true`,
          { signal: AbortSignal.timeout(5000) }
        ).then(r => r.json());
        
        if (geckoRes[geckoId]?.usd) {
          const price = geckoRes[geckoId].usd;
          // CoinGecko gives mid-price, simulate small spread
          ask = price * 1.0001;
          bid = price * 0.9999;
        }
      } catch (_) { /* CoinGecko also failed */ }
    }

    if (ask > 0 && bid > 0 && !isNaN(ask) && !isNaN(bid)) {
      return { ask, bid };
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const debugMode = url.searchParams.get('debug') === 'true';
  const forceNotify = url.searchParams.get('force') === 'true';

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'Telegram Bot Token not configured', hasToken: false }, { status: 500 });
  }

  try {
    // 1. Fetch all active alerts
    const { data: alerts, error } = await supabase
      .from('user_alerts')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    if (!alerts || alerts.length === 0) {
      return NextResponse.json({ message: 'No active alerts to process', alertCount: 0 });
    }

    let notificationsSent = 0;
    const debugInfo: any[] = [];

    // 2. Process each alert
    for (const alert of alerts) {
      const alertDebug: any = {
        alertId: alert.id,
        pair: alert.pair,
        chatId: alert.telegram_chat_id,
        exchangeBuy: alert.exchange_buy,
        exchangeSell: alert.exchange_sell,
        minSpread: alert.min_spread,
        isActive: alert.is_active,
      };

      const buyData: any = await fetchPrice(alert.exchange_buy, alert.pair);
      const sellData: any = await fetchPrice(alert.exchange_sell, alert.pair);

      alertDebug.buyDataRaw = buyData;
      alertDebug.sellDataRaw = sellData;

      if (buyData && sellData) {
        const buyPrice = buyData.ask;
        const sellPrice = sellData.bid;
        
        alertDebug.buyPrice = buyPrice;
        alertDebug.sellPrice = sellPrice;

        if (buyPrice > 0 && sellPrice > 0) {
          const spread = ((sellPrice - buyPrice) / buyPrice) * 100;
          alertDebug.spread = spread;
          alertDebug.wouldNotify = spread >= alert.min_spread;

          if (spread >= alert.min_spread || forceNotify) {
            const message = `
🚨 *OPORTUNIDAD DE ARBITRAJE* 🚨

Par: *${alert.pair}*
Comprar en: *${alert.exchange_buy.toUpperCase()}* ($${buyPrice.toFixed(2)})
Vender en: *${alert.exchange_sell.toUpperCase()}* ($${sellPrice.toFixed(2)})

✅ *Spread Bruto: ${spread.toFixed(4)}%*

Calcula las comisiones y red en:
[CriptoCal](https://criptocal.vercel.app)
            `.trim();

            const tgUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
            const tgRes = await fetch(tgUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: alert.telegram_chat_id,
                text: message,
                parse_mode: 'Markdown'
              })
            });
            const tgResult = await tgRes.json();
            alertDebug.telegramResponse = tgResult;
            if (tgResult.ok) {
              notificationsSent++;
            }
          }
        } else {
          alertDebug.error = 'Prices are zero or negative';
        }
      } else {
        alertDebug.error = `Failed to fetch prices: buy=${!!buyData}, sell=${!!sellData}`;
      }

      debugInfo.push(alertDebug);
    }

    const responseBody: any = { success: true, processed: alerts.length, notificationsSent };
    if (debugMode) responseBody.debug = debugInfo;
    return NextResponse.json(responseBody);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
