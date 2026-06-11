import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We need a server-role supabase client here because this will be called by an external CRON 
// and needs to bypass RLS to read all users' alerts.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // IMPORTANT: You need to add this env var
const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function fetchPrice(exchange: string, symbol: string): Promise<number | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    let url = '';
    
    // We only need the ask price for the BUY exchange and bid price for the SELL exchange,
    // but to keep it simple we'll fetch both and return them depending on the context.
    // Actually, we'll return an object { ask, bid }
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
      default:
        return null;
    }
    clearTimeout(timeout);
    return { ask, bid } as any;
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
