import { supabase } from './supabase';

let cachedReferrer: any = null;
let fetchPromise: Promise<any> | null = null;

export async function getReferrerProfile() {
  if (cachedReferrer !== null) return cachedReferrer;
  
  const refUsername = typeof window !== 'undefined' ? localStorage.getItem('criptocal_ref') : null;
  if (!refUsername) {
    cachedReferrer = false;
    return false;
  }

  if (fetchPromise) return fetchPromise;

  fetchPromise = supabase
    .from('user_referrals')
    .select('binance_ref, bitget_ref, bybit_ref, okx_ref, mexc_ref, kucoin_ref, gateio_ref, kraken_ref')
    .eq('username', refUsername)
    .single()
    .then(({ data }) => {
      if (data) {
        cachedReferrer = data;
        
        // Registrar clic (solo la primera vez por sesión)
        if (!sessionStorage.getItem('ref_click_counted')) {
          sessionStorage.setItem('ref_click_counted', 'true');
          // Podríamos incrementar clicks_received aquí con una RPC o dejarlo así por ahora
        }
        
        return data;
      }
      cachedReferrer = false;
      return false;
    })
    .catch(() => {
      cachedReferrer = false;
      return false;
    });

  return fetchPromise;
}

export async function getExchangeUrl(exchange: string, defaultUrl: string = '') {
  const referrer = await getReferrerProfile();
  const lowerExchange = exchange.toLowerCase();

  // Códigos por defecto del dueño de la app
  const defaultBinance = '746465101';
  const defaultBitget = '';
  const defaultBybit = 'YVDXZQ';
  const defaultOkx = '46866734';
  const defaultMexc = '';
  const defaultKucoin = '';
  const defaultGateio = '';
  const defaultKraken = '';

  if (lowerExchange.includes('binance')) {
    const refCode = referrer && referrer.binance_ref ? referrer.binance_ref : defaultBinance;
    return `https://accounts.binance.com/register?ref=${refCode}`;
  }
  if (lowerExchange.includes('bitget')) {
    const refCode = referrer && referrer.bitget_ref ? referrer.bitget_ref : defaultBitget;
    return `https://www.bitget.com/register?clacCode=${refCode}`;
  }
  if (lowerExchange.includes('bybit')) {
    const refCode = referrer && referrer.bybit_ref ? referrer.bybit_ref : defaultBybit;
    return `https://www.bybit.com/register?affiliate_id=${refCode}`;
  }
  if (lowerExchange.includes('okx')) {
    const refCode = referrer && referrer.okx_ref ? referrer.okx_ref : defaultOkx;
    return `https://www.okx.com/join/${refCode}`;
  }
  if (lowerExchange.includes('mexc')) {
    const refCode = referrer && referrer.mexc_ref ? referrer.mexc_ref : defaultMexc;
    return `https://www.mexc.com/register?inviteCode=${refCode}`;
  }
  if (lowerExchange.includes('kucoin')) {
    const refCode = referrer && referrer.kucoin_ref ? referrer.kucoin_ref : defaultKucoin;
    return `https://www.kucoin.com/ucenter/signup?rcode=${refCode}`;
  }
  if (lowerExchange.includes('gate')) {
    const refCode = referrer && referrer.gateio_ref ? referrer.gateio_ref : defaultGateio;
    return `https://www.gate.io/signup/${refCode}`;
  }
  if (lowerExchange.includes('kraken')) {
    const refCode = referrer && referrer.kraken_ref ? referrer.kraken_ref : defaultKraken;
    return `https://www.kraken.com/sign-up?ref=${refCode}`;
  }

  return defaultUrl || `https://www.${lowerExchange}.com`;
}
