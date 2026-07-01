export const TOP_COINS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT', 
  'TRXUSDT', 'TONUSDT', 'DOTUSDT', 'MATICUSDT', 'LTCUSDT', 'SHIBUSDT', 'BCHUSDT', 
  'LINKUSDT', 'AVAXUSDT', 'NEARUSDT', 'UNIUSDT', 'ATOMUSDT', 'XLMUSDT', 'PEPEUSDT',
  'ICPUSDT', 'FILUSDT', 'ETCUSDT', 'APTUSDT', 'STXUSDT', 'IMXUSDT', 'OPUSDT', 
  'INJUSDT', 'RNDRUSDT', 'WIFUSDT', 'ARBUSDT', 'MNTUSDT', 'CROUSDT', 'VETUSDT',
  'MKRUSDT', 'GRTUSDT', 'LDOUSDT', 'TIAUSDT', 'RUNEUSDT', 'ARUSDT', 'THETAUSDT',
  'FTMUSDT', 'AAVEUSDT', 'ALGOUSDT', 'FLOKIUSDT', 'QNTUSDT'
];

export const COIN_LABELS: Record<string, string> = {
  BTCUSDT: '₿ BTC', ETHUSDT: 'Ξ ETH', SOLUSDT: '◎ SOL', XRPUSDT: '✕ XRP',
  BNBUSDT: '◆ BNB', ADAUSDT: '♦ ADA', DOGEUSDT: 'Ð DOGE', TRXUSDT: '✧ TRX',
  TONUSDT: '💎 TON', DOTUSDT: '● DOT', MATICUSDT: '⬟ MATIC', LTCUSDT: 'Ł LTC',
  SHIBUSDT: '🐕 SHIB', BCHUSDT: 'Ƀ BCH', LINKUSDT: '⬡ LINK', AVAXUSDT: '▲ AVAX',
  NEARUSDT: 'Ⓝ NEAR', UNIUSDT: '🦄 UNI', ATOMUSDT: '⚛ ATOM', XLMUSDT: '★ XLM',
  PEPEUSDT: '🐸 PEPE', ICPUSDT: '∞ ICP', FILUSDT: '⨎ FIL', ETCUSDT: 'ξ ETC',
  APTUSDT: 'APT', STXUSDT: 'STX', IMXUSDT: 'IMX', OPUSDT: 'OP',
  INJUSDT: 'INJ', RNDRUSDT: 'RNDR', WIFUSDT: 'WIF', ARBUSDT: 'ARB',
  MNTUSDT: 'MNT', CROUSDT: 'CRO', VETUSDT: 'VET', MKRUSDT: 'MKR',
  GRTUSDT: 'GRT', LDOUSDT: 'LDO', TIAUSDT: 'TIA', RUNEUSDT: 'RUNE',
  ARUSDT: 'AR', THETAUSDT: 'THETA', FTMUSDT: 'FTM', AAVEUSDT: 'AAVE',
  ALGOUSDT: 'ALGO', FLOKIUSDT: 'FLOKI', QNTUSDT: 'QNT'
};

export const ALL_EXCHANGES = [
  { value: 'binance', label: 'Binance' },
  { value: 'bybit', label: 'Bybit' },
  { value: 'okx', label: 'OKX' },
  { value: 'bitget', label: 'Bitget' },
  { value: 'mexc', label: 'MEXC' },
  { value: 'kucoin', label: 'KuCoin' },
  { value: 'gateio', label: 'Gate.io' },
  { value: 'kraken', label: 'Kraken' }
];

export type ExchangeName = 'binance' | 'bybit' | 'okx' | 'kucoin' | 'mexc' | 'gateio' | 'kraken' | 'bitget';
