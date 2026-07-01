// Comisiones de retiro aproximadas por exchange y moneda
// Datos basados en las redes más económicas disponibles (TRC20, BEP20, red nativa)
// Última actualización: Julio 2026

export const withdrawalFees: Record<string, Record<string, number>> = {
  binance: {
    USDT: 1.0, BTC: 0.0002, ETH: 0.0012, SOL: 0.008, BNB: 0.0005,
    XRP: 0.2, ADA: 1.0, AVAX: 0.005, DOT: 0.02, LINK: 0.2,
    MATIC: 0.1, LTC: 0.001, DOGE: 5.0, TRX: 1.0, TON: 0.01,
    SHIB: 50000, BCH: 0.001, NEAR: 0.01, UNI: 0.3, ATOM: 0.005,
    XLM: 0.01, PEPE: 500000, ICP: 0.0003, FIL: 0.001, ETC: 0.01,
    APT: 0.01, STX: 0.1, IMX: 1.0, OP: 0.1, INJ: 0.01,
    RNDR: 0.5, WIF: 0.1, ARB: 0.1, MNT: 0.1, CRO: 1.0,
    VET: 20.0, MKR: 0.002, GRT: 1.0, LDO: 0.3, TIA: 0.01,
    RUNE: 0.01, AR: 0.01, THETA: 0.3, FTM: 1.0, AAVE: 0.02,
    ALGO: 0.01, FLOKI: 50000, QNT: 0.05, USDC: 1.0
  },
  bybit: {
    USDT: 1.0, BTC: 0.00025, ETH: 0.0012, SOL: 0.008, BNB: 0.001,
    XRP: 0.25, ADA: 1.0, AVAX: 0.01, DOT: 0.05, LINK: 0.2,
    MATIC: 0.1, LTC: 0.001, DOGE: 5.0, TRX: 1.0, TON: 0.01,
    SHIB: 50000, BCH: 0.001, NEAR: 0.01, UNI: 0.5, ATOM: 0.005,
    XLM: 0.01, PEPE: 500000, ICP: 0.0003, FIL: 0.001, ETC: 0.01,
    APT: 0.01, STX: 0.1, IMX: 1.5, OP: 0.1, INJ: 0.01,
    RNDR: 0.8, WIF: 0.1, ARB: 0.1, MNT: 0.1, CRO: 1.0,
    VET: 20.0, MKR: 0.003, GRT: 1.5, LDO: 0.5, TIA: 0.01,
    RUNE: 0.02, AR: 0.01, THETA: 0.5, FTM: 1.0, AAVE: 0.03,
    ALGO: 0.01, FLOKI: 50000, QNT: 0.05, USDC: 1.0
  },
  okx: {
    USDT: 1.0, BTC: 0.0002, ETH: 0.0012, SOL: 0.008, BNB: 0.001,
    XRP: 0.2, ADA: 1.0, AVAX: 0.01, DOT: 0.04, LINK: 0.1,
    MATIC: 0.1, LTC: 0.001, DOGE: 5.0, TRX: 1.0, TON: 0.01,
    SHIB: 50000, BCH: 0.001, NEAR: 0.01, UNI: 0.3, ATOM: 0.005,
    XLM: 0.01, PEPE: 500000, ICP: 0.0003, FIL: 0.001, ETC: 0.01,
    APT: 0.01, STX: 0.1, IMX: 1.0, OP: 0.1, INJ: 0.01,
    RNDR: 0.5, WIF: 0.1, ARB: 0.1, MNT: 0.1, CRO: 1.0,
    VET: 20.0, MKR: 0.002, GRT: 1.0, LDO: 0.3, TIA: 0.01,
    RUNE: 0.01, AR: 0.01, THETA: 0.3, FTM: 1.0, AAVE: 0.02,
    ALGO: 0.01, FLOKI: 50000, QNT: 0.05, USDC: 1.0
  },
  bitget: {
    USDT: 1.0, BTC: 0.0002, ETH: 0.001, SOL: 0.01, BNB: 0.001,
    XRP: 0.1, ADA: 0.5, AVAX: 0.01, DOT: 0.05, LINK: 0.1,
    MATIC: 0.1, LTC: 0.001, DOGE: 5.0, TRX: 1.0, TON: 0.01,
    SHIB: 50000, BCH: 0.001, NEAR: 0.01, UNI: 0.5, ATOM: 0.005,
    XLM: 0.01, PEPE: 500000, ICP: 0.0003, FIL: 0.001, ETC: 0.01,
    APT: 0.01, STX: 0.1, IMX: 1.5, OP: 0.1, INJ: 0.01,
    RNDR: 0.8, WIF: 0.1, ARB: 0.1, MNT: 0.1, CRO: 1.0,
    VET: 20.0, MKR: 0.003, GRT: 1.5, LDO: 0.5, TIA: 0.01,
    RUNE: 0.02, AR: 0.01, THETA: 0.5, FTM: 1.0, AAVE: 0.03,
    ALGO: 0.01, FLOKI: 50000, QNT: 0.05, USDC: 1.0
  },
  kucoin: {
    USDT: 1.0, BTC: 0.0003, ETH: 0.0015, SOL: 0.01, BNB: 0.002,
    XRP: 0.2, ADA: 1.0, AVAX: 0.01, DOT: 0.05, LINK: 0.2,
    MATIC: 0.1, LTC: 0.001, DOGE: 5.0, TRX: 1.0, TON: 0.02,
    SHIB: 100000, BCH: 0.001, NEAR: 0.02, UNI: 0.5, ATOM: 0.01,
    XLM: 0.02, PEPE: 1000000, ICP: 0.001, FIL: 0.01, ETC: 0.01,
    APT: 0.02, STX: 0.2, IMX: 2.0, OP: 0.2, INJ: 0.02,
    RNDR: 1.0, WIF: 0.2, ARB: 0.2, MNT: 0.2, CRO: 2.0,
    VET: 30.0, MKR: 0.005, GRT: 2.0, LDO: 0.5, TIA: 0.02,
    RUNE: 0.02, AR: 0.02, THETA: 0.5, FTM: 2.0, AAVE: 0.05,
    ALGO: 0.01, FLOKI: 100000, QNT: 0.1, USDC: 1.0
  },
  mexc: {
    USDT: 1.0, BTC: 0.0003, ETH: 0.0015, SOL: 0.01, BNB: 0.001,
    XRP: 0.2, ADA: 1.0, AVAX: 0.01, DOT: 0.05, LINK: 0.2,
    MATIC: 0.1, LTC: 0.001, DOGE: 5.0, TRX: 1.0, TON: 0.02,
    SHIB: 100000, BCH: 0.001, NEAR: 0.02, UNI: 0.5, ATOM: 0.01,
    XLM: 0.02, PEPE: 1000000, ICP: 0.001, FIL: 0.01, ETC: 0.01,
    APT: 0.02, STX: 0.2, IMX: 2.0, OP: 0.2, INJ: 0.02,
    RNDR: 1.0, WIF: 0.2, ARB: 0.2, MNT: 0.2, CRO: 2.0,
    VET: 30.0, MKR: 0.005, GRT: 2.0, LDO: 0.5, TIA: 0.02,
    RUNE: 0.02, AR: 0.02, THETA: 0.5, FTM: 2.0, AAVE: 0.05,
    ALGO: 0.01, FLOKI: 100000, QNT: 0.1, USDC: 1.0
  },
  gateio: {
    USDT: 1.0, BTC: 0.0005, ETH: 0.002, SOL: 0.01, BNB: 0.002,
    XRP: 0.5, ADA: 1.0, AVAX: 0.01, DOT: 0.05, LINK: 0.2,
    MATIC: 0.1, LTC: 0.002, DOGE: 5.0, TRX: 1.0, TON: 0.02,
    SHIB: 100000, BCH: 0.001, NEAR: 0.02, UNI: 0.5, ATOM: 0.01,
    XLM: 0.02, PEPE: 1000000, ICP: 0.001, FIL: 0.01, ETC: 0.01,
    APT: 0.02, STX: 0.2, IMX: 2.0, OP: 0.2, INJ: 0.02,
    RNDR: 1.0, WIF: 0.2, ARB: 0.2, MNT: 0.2, CRO: 2.0,
    VET: 30.0, MKR: 0.005, GRT: 2.0, LDO: 0.5, TIA: 0.02,
    RUNE: 0.02, AR: 0.02, THETA: 0.5, FTM: 2.0, AAVE: 0.05,
    ALGO: 0.01, FLOKI: 100000, QNT: 0.1, USDC: 1.0
  },
  kraken: {
    USDT: 2.5, BTC: 0.0002, ETH: 0.0012, SOL: 0.01, BNB: 0.002,
    XRP: 0.02, ADA: 1.0, AVAX: 0.01, DOT: 0.05, LINK: 0.2,
    MATIC: 0.1, LTC: 0.001, DOGE: 5.0, TRX: 1.0, TON: 0.02,
    SHIB: 100000, BCH: 0.001, NEAR: 0.02, UNI: 0.5, ATOM: 0.01,
    XLM: 0.02, PEPE: 1000000, ICP: 0.001, FIL: 0.01, ETC: 0.01,
    APT: 0.02, STX: 0.2, IMX: 2.0, OP: 0.2, INJ: 0.02,
    RNDR: 1.0, WIF: 0.2, ARB: 0.2, MNT: 0.2, CRO: 2.0,
    VET: 30.0, MKR: 0.005, GRT: 2.0, LDO: 0.5, TIA: 0.02,
    RUNE: 0.02, AR: 0.02, THETA: 0.5, FTM: 2.0, AAVE: 0.05,
    ALGO: 0.01, FLOKI: 100000, QNT: 0.1, USDC: 1.0
  }
};

export const getDefaultNetworkFee = (exchange: string, asset: string): number => {
  const ex = exchange.toLowerCase();
  
  // Extract the base coin from the trading pair (e.g., BTCUSDT -> BTC)
  let baseCoin = 'USDT';
  if (asset.endsWith('USDT') && asset !== 'USDTUSDT') {
    baseCoin = asset.replace('USDT', '');
  } else if (asset === 'BTCVES') {
    baseCoin = 'BTC';
  } else if (asset.startsWith('USDT')) {
    baseCoin = 'USDT';
  } else if (asset.endsWith('USDT')) {
    baseCoin = asset.replace('USDT', '');
  }

  // Find fee in dictionary
  if (withdrawalFees[ex] && withdrawalFees[ex][baseCoin] !== undefined) {
    return withdrawalFees[ex][baseCoin];
  }

  // Fallback defaults if exact match not found
  const fallbacks: Record<string, number> = {
    USDT: 1.0, BTC: 0.0003, ETH: 0.0015, SOL: 0.01,
    XRP: 0.2, ADA: 1.0, LTC: 0.001, BNB: 0.001,
    DOGE: 5.0, TRX: 1.0, DOT: 0.05, LINK: 0.2,
    AVAX: 0.01, MATIC: 0.1, ATOM: 0.01, NEAR: 0.02,
    TON: 0.02, FTM: 1.0, ALGO: 0.01
  };

  return fallbacks[baseCoin] || 0.5; // Default 0.5 unidades en vez de 0 para no inflar ganancia
};
