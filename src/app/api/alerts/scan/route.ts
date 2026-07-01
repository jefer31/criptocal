import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Configuración de webpush movida dentro de la función o envuelta para evitar errores en build
try {
  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      'mailto:soporte@criptocal.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }
} catch (e) {
  console.warn('Web push no inicializado en build time');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Lista de monedas sólidas/populares para evitar shitcoins sin liquidez
const TOP_COINS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT', 
  'TRXUSDT', 'TONUSDT', 'DOTUSDT', 'MATICUSDT', 'LTCUSDT', 'SHIBUSDT', 'BCHUSDT', 
  'LINKUSDT', 'AVAXUSDT', 'NEARUSDT', 'UNIUSDT', 'ATOMUSDT', 'XLMUSDT', 'PEPEUSDT',
  'ICPUSDT', 'FILUSDT', 'ETCUSDT', 'APTUSDT', 'STXUSDT', 'IMXUSDT', 'OPUSDT', 
  'INJUSDT', 'RNDRUSDT', 'WIFUSDT', 'ARBUSDT', 'MNTUSDT', 'CROUSDT', 'VETUSDT',
  'MKRUSDT', 'GRTUSDT', 'LDOUSDT', 'TIAUSDT', 'RUNEUSDT', 'ARUSDT', 'THETAUSDT',
  'FTMUSDT', 'AAVEUSDT', 'ALGOUSDT', 'FLOKIUSDT', 'QNTUSDT'
];

// Oportunidad detectada
interface Opportunity {
  pair: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
}

// Fetchers masivos
async function fetchBinance() {
  try {
    const data = await fetch('https://data-api.binance.vision/api/v3/ticker/bookTicker').then(r => r.json());
    const map = new Map<string, {ask: number, bid: number}>();
    if (Array.isArray(data)) {
      data.forEach((t: any) => {
        if (TOP_COINS.includes(t.symbol)) map.set(t.symbol, { ask: parseFloat(t.askPrice), bid: parseFloat(t.bidPrice) });
      });
    }
    return map;
  } catch (e) { return new Map(); }
}

async function fetchBybit() {
  try {
    const data = await fetch('https://api.bybit.com/v5/market/tickers?category=spot').then(r => r.json());
    const map = new Map<string, {ask: number, bid: number}>();
    if (data?.result?.list) {
      data.result.list.forEach((t: any) => {
        if (TOP_COINS.includes(t.symbol)) map.set(t.symbol, { ask: parseFloat(t.ask1Price), bid: parseFloat(t.bid1Price) });
      });
    }
    return map;
  } catch (e) { return new Map(); }
}

async function fetchBitget() {
  try {
    const data = await fetch('https://api.bitget.com/api/v2/spot/market/tickers').then(r => r.json());
    const map = new Map<string, {ask: number, bid: number}>();
    if (data?.data) {
      data.data.forEach((t: any) => {
        if (TOP_COINS.includes(t.symbol)) map.set(t.symbol, { ask: parseFloat(t.askPr), bid: parseFloat(t.bidPr) });
      });
    }
    return map;
  } catch (e) { return new Map(); }
}

async function fetchOkx() {
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
  } catch (e) { return new Map(); }
}

async function sendTelegramMessage(chatId: string, text: string) {
  if (!TELEGRAM_BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
    });
  } catch (err) { console.error('Telegram error', err); }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const debugMode = url.searchParams.get('debug') === 'true';
  const forceNotify = url.searchParams.get('force') === 'true';
  const GLOBAL_SPREAD_THRESHOLD = forceNotify ? 0.01 : 0.5; // 0.5% mínimo para envíos globales

  const authHeader = request.headers.get('authorization');
  const cronKey = url.searchParams.get('cron_key');
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && cronKey !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Descarga masiva del mercado global
    const [binanceData, bybitData, bitgetData, okxData] = await Promise.all([
      fetchBinance(), fetchBybit(), fetchBitget(), fetchOkx()
    ]);

    const exchanges = [
      { name: 'binance', data: binanceData },
      { name: 'bybit', data: bybitData },
      { name: 'bitget', data: bitgetData },
      { name: 'okx', data: okxData }
    ];

    // 2. Cruce de Precios Global
    const globalOpportunities: Opportunity[] = [];

    for (const symbol of TOP_COINS) {
      // Encontrar el exchange con el menor precio de venta (Mejor para Comprar - Ask)
      let bestBuy = { exchange: '', price: Infinity };
      // Encontrar el exchange con el mayor precio de compra (Mejor para Vender - Bid)
      let bestSell = { exchange: '', price: 0 };

      for (const ex of exchanges) {
        const prices = ex.data.get(symbol);
        if (prices && prices.ask > 0 && prices.bid > 0) {
          if (prices.ask < bestBuy.price) bestBuy = { exchange: ex.name, price: prices.ask };
          if (prices.bid > bestSell.price) bestSell = { exchange: ex.name, price: prices.bid };
        }
      }

      // Validar si encontramos par válido en distintos exchanges
      if (bestBuy.exchange && bestSell.exchange && bestBuy.exchange !== bestSell.exchange) {
        const spread = ((bestSell.price - bestBuy.price) / bestBuy.price) * 100;
        
        // Filtro de liquidez/salud (spread irreal > 10% probablemente es error de API o mercado cerrado)
        if (spread >= GLOBAL_SPREAD_THRESHOLD && spread < 10) {
          globalOpportunities.push({
            pair: symbol,
            buyExchange: bestBuy.exchange,
            sellExchange: bestSell.exchange,
            buyPrice: bestBuy.price,
            sellPrice: bestSell.price,
            spread
          });
        }
      }
    }

    // Ordenar las oportunidades globales por spread
    globalOpportunities.sort((a, b) => b.spread - a.spread);
    const topGlobal = globalOpportunities.slice(0, 3); // Solo enviamos las mejores 3 para no spamear

    let pushSentGlobal = 0;

    // 3. ENVIAR NOTIFICACIONES GLOBALES A TODOS LOS USUARIOS
    if (topGlobal.length > 0) {
      const { data: allSubs } = await supabase.from('push_subscriptions').select('*');
      
      if (allSubs && allSubs.length > 0) {
        for (const opp of topGlobal) {
          const pushPayload = JSON.stringify({
            title: `🌐 RADAR GLOBAL: ${opp.pair} (+${opp.spread.toFixed(2)}%)`,
            body: `Compra en ${opp.buyExchange.toUpperCase()} a $${opp.buyPrice.toFixed(4)} y Vende en ${opp.sellExchange.toUpperCase()}`
          });

          for (const sub of allSubs) {
            try {
              await webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth }
              }, pushPayload);
              pushSentGlobal++;
            } catch (err: any) {
              if (err.statusCode === 410 || err.statusCode === 404) {
                await supabase.from('push_subscriptions').delete().eq('id', sub.id);
              }
            }
          }
        }
      }
    }

    // 4. MANTENER LÓGICA DE ALERTAS PERSONALIZADAS DE LOS USUARIOS (Prioridad Baja)
    // Extraemos solo lo que el usuario pidió y revisamos en nuestra data cacheada
    const { data: userAlerts } = await supabase.from('user_alerts').select('*').eq('is_active', true);
    
    let notificationsSentPersonal = 0;
    
    if (userAlerts) {
      for (const alert of userAlerts) {
        // Encontrar data en caché
        const exBuyData = exchanges.find(e => e.name === alert.exchange_buy)?.data.get(alert.pair);
        const exSellData = exchanges.find(e => e.name === alert.exchange_sell)?.data.get(alert.pair);

        if (exBuyData && exSellData) {
          const buyP = exBuyData.ask;
          const sellP = exSellData.bid;
          const spread = ((sellP - buyP) / buyP) * 100;

          if (spread >= alert.min_spread && spread < 15) { // Ignorar mayores a 15% (errores API)
            // Telegram
            if (alert.telegram_chat_id) {
              const msg = `🚨 *Alerta Personalizada* 🚨\n\nPar: *${alert.pair}*\nComprar: *${alert.exchange_buy.toUpperCase()}* ($${buyP.toFixed(2)})\nVender: *${alert.exchange_sell.toUpperCase()}* ($${sellP.toFixed(2)})\n\nSpread Estimado: *${spread.toFixed(2)}%* 🚀`;
              await sendTelegramMessage(alert.telegram_chat_id, msg);
            }
            
            // Web Push Personal
            if (alert.user_id) {
              const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('user_id', alert.user_id);
              if (subs && subs.length > 0) {
                const payload = JSON.stringify({
                  title: `🎯 ALERTA PERSONAL: ${alert.pair}`,
                  body: `Tu alerta superó ${alert.min_spread}%. Spread actual: +${spread.toFixed(2)}%`
                });
                for (const sub of subs) {
                  try {
                    await webpush.sendNotification({
                      endpoint: sub.endpoint,
                      keys: { p256dh: sub.p256dh, auth: sub.auth }
                    }, payload);
                    notificationsSentPersonal++;
                  } catch (e) {}
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      marketScanned: TOP_COINS.length,
      globalOpportunitiesFound: globalOpportunities.length,
      globalPushSent: pushSentGlobal,
      personalAlertsSent: notificationsSentPersonal,
      topGlobal
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
