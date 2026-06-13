import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { fiat, tradeType, payType } = await request.json();

    if (!fiat || !tradeType) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios (fiat, tradeType).' }, { status: 400 });
    }

    // Map payType from our internal format to Binance format
    let binancePayType = [];
    if (payType === 'zinli') binancePayType = ['Zinli'];
    if (payType === 'pago_movil') binancePayType = ['PagoMovil'];
    if (payType === 'zelle') binancePayType = ['Zelle'];
    if (payType === 'nequi') binancePayType = ['Nequi'];

    const payload = {
      fiat: fiat.toUpperCase(),
      page: 1,
      rows: 5,
      tradeType: tradeType.toUpperCase(),
      asset: "USDT",
      countries: [],
      proMerchantAds: false,
      shieldMerchantAds: false,
      publisherType: null,
      payTypes: binancePayType,
      classifies: ["mass", "profession", "user"]
    };

    const url = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Binance API respondió con error: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== '000000' || !data.data || data.data.length === 0) {
      return NextResponse.json({ 
        error: 'No se encontraron anuncios para esta configuración en Binance P2P.',
        price: null 
      }, { status: 404 });
    }

    // Promediar los top 3 mejores precios para dar una tasa realista (o el primero si hay pocos)
    const topAds = data.data.slice(0, 3);
    const sum = topAds.reduce((acc: number, ad: any) => acc + parseFloat(ad.adv.price), 0);
    const avgPrice = (sum / topAds.length).toFixed(2);

    return NextResponse.json({ price: avgPrice });

  } catch (error: any) {
    console.error('Error fetching P2P data:', error);
    return NextResponse.json({ error: 'Error interno del servidor al consultar P2P.', details: error.message }, { status: 500 });
  }
}
