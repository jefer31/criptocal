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
    .select('binance_ref, bitget_ref, bybit_ref, okx_ref')
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

  // Códigos por defecto de Jeferson (admin/dueño)
  const defaultBinance = 'CPA_00O4X1'; // Reemplazar con el real
  const defaultBitget = 'TU_BITGET'; // Reemplazar
  const defaultBybit = 'TU_BYBIT'; // Reemplazar
  const defaultOkx = 'TU_OKX'; // Reemplazar

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

  return defaultUrl || `https://www.${lowerExchange}.com`;
}
