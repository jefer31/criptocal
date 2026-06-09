import { NextResponse } from 'next/server';
import ccxt from 'ccxt';

// Cache de instancias de exchanges para no recrearlas en cada petición
// Así los mercados solo se cargan una vez y las consultas siguientes son instantáneas
const exchangeCache: Record<string, any> = {};

// Cache de precios para evitar llamadas masivas a los exchanges (TTL)
const priceCache: Record<string, { price: number; timestamp: number }> = {};
const CACHE_TTL_MS = 10000; // 10 segundos de vida útil para cada precio

function getExchange(exchangeId: string) {
  if (!exchangeCache[exchangeId]) {
    // @ts-ignore
    const ExchangeClass = ccxt[exchangeId];
    exchangeCache[exchangeId] = new ExchangeClass({
      enableRateLimit: true,
      timeout: 20000, // 20 segundos para la primera carga de mercados
    });
  }
  return exchangeCache[exchangeId];
}

// Normalizar el símbolo para CCXT (ej: BTCUSDT -> BTC/USDT)
function formatSymbol(sym: string): string {
  if (sym === 'EURUSDT') return 'EUR/USDT';
  if (sym.startsWith('USDT') && sym.length > 4) return 'USDT/' + sym.replace('USDT', '');
  if (sym.endsWith('USDT')) return sym.replace('USDT', '/USDT');
  return sym;
}

// Función con reintentos automáticos
async function fetchWithRetry(exchange: any, symbol: string, maxRetries = 3): Promise<any> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const ticker = await exchange.fetchTicker(symbol);
      return ticker;
    } catch (error: any) {
      lastError = error;
      console.warn(`Intento ${attempt}/${maxRetries} falló para ${exchange.id} ${symbol}: ${error.message}`);
      if (attempt < maxRetries) {
        // Espera progresiva: 1s, 2s, 3s...
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
  }
  throw lastError;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const exchangeId = searchParams.get('exchange')?.toLowerCase();
  const rawSymbol = searchParams.get('symbol')?.toUpperCase();
  const type = searchParams.get('type')?.toLowerCase();

  if (!exchangeId || !rawSymbol || !type) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
  }

  try {
    if (!ccxt.exchanges.includes(exchangeId)) {
      return NextResponse.json({ error: 'Exchange no soportado' }, { status: 400 });
    }

    const symbol = formatSymbol(rawSymbol);
    const cacheKey = `${exchangeId}-${symbol}-${type}`;

    // Revisar si tenemos un precio válido y reciente en caché
    if (priceCache[cacheKey] && Date.now() - priceCache[cacheKey].timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ price: priceCache[cacheKey].price, cached: true });
    }

    const exchange = getExchange(exchangeId);

    const ticker = await fetchWithRetry(exchange, symbol);

    // Compra = ask (precio más bajo de venta), Venta = bid (precio más alto de compra)
    let price = type === 'compra' ? ticker.ask : ticker.bid;

    // Fallback si el orderbook está vacío
    if (!price || price <= 0) {
      price = ticker.last;
    }

    if (!price || price <= 0) {
      throw new Error('Precio no disponible en el exchange');
    }

    // Guardar el precio exitoso en caché
    priceCache[cacheKey] = { price, timestamp: Date.now() };

    return NextResponse.json({ price, cached: false });

  } catch (error: any) {
    console.error(`CCXT Error [${exchangeId}]:`, error.message);
    
    // Si falló todo, limpiar caché de ese exchange para forzar reconexión la próxima vez
    if (exchangeId && exchangeCache[exchangeId]) {
      delete exchangeCache[exchangeId];
    }

    return NextResponse.json(
      { error: error.message || 'Fallo de API externa' },
      { status: 500 }
    );
  }
}
