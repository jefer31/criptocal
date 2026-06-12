export const withdrawalFees: Record<string, Record<string, number>> = {
  // USDT fees assume TRC20/BEP20 averages
  binance: {
    USDT: 1.0,
    BTC: 0.0002,
    ETH: 0.0012,
    SOL: 0.008,
    BNB: 0.0005,
    XRP: 0.2,
    ADA: 1.0,
    AVAX: 0.005,
    DOT: 0.02,
    LINK: 0.2,
    MATIC: 0.1,
    LTC: 0.001
  },
  bybit: {
    USDT: 1.0,
    BTC: 0.00025,
    ETH: 0.0012,
    SOL: 0.008,
    BNB: 0.001,
    XRP: 0.25,
    ADA: 1.0,
    AVAX: 0.01,
    DOT: 0.05,
    LINK: 0.2,
    MATIC: 0.1,
    LTC: 0.001
  },
  okx: {
    USDT: 1.0,
    BTC: 0.0002,
    ETH: 0.0012,
    SOL: 0.008,
    BNB: 0.001,
    XRP: 0.2,
    ADA: 1.0,
    AVAX: 0.01,
    DOT: 0.04,
    LINK: 0.1,
    MATIC: 0.1,
    LTC: 0.001
  },
  kucoin: {
    USDT: 1.0,
    BTC: 0.0003,
    ETH: 0.0015,
    SOL: 0.01,
    BNB: 0.002,
    XRP: 0.2,
    ADA: 1.0,
    AVAX: 0.01,
    DOT: 0.05,
    LINK: 0.2,
    MATIC: 0.1,
    LTC: 0.001
  },
  mexc: {
    USDT: 1.0,
    BTC: 0.0003,
    ETH: 0.0015,
    SOL: 0.01,
    BNB: 0.001,
    XRP: 0.2,
    ADA: 1.0,
    AVAX: 0.01,
    DOT: 0.05,
    LINK: 0.2,
    MATIC: 0.1,
    LTC: 0.001
  },
  bitget: {
    USDT: 1.0,
    BTC: 0.0002,
    ETH: 0.001,
    SOL: 0.01,
    BNB: 0.001,
    XRP: 0.1,
    ADA: 0.5,
    AVAX: 0.01,
    DOT: 0.05,
    LINK: 0.1,
    MATIC: 0.1,
    LTC: 0.001
  },
  gateio: {
    USDT: 1.0,
    BTC: 0.0005,
    ETH: 0.002,
    SOL: 0.01,
    BNB: 0.002,
    XRP: 0.5,
    ADA: 1.0,
    AVAX: 0.01,
    DOT: 0.05,
    LINK: 0.2,
    MATIC: 0.1,
    LTC: 0.002
  },
  kraken: {
    USDT: 2.5, // Kraken is notoriously expensive for USDT TRC20 usually
    BTC: 0.0002,
    ETH: 0.0012,
    SOL: 0.01,
    BNB: 0.002,
    XRP: 0.02,
    ADA: 1.0,
    AVAX: 0.01,
    DOT: 0.05,
    LINK: 0.2,
    MATIC: 0.1,
    LTC: 0.001
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
    USDT: 1.0,
    BTC: 0.0003,
    ETH: 0.0015,
    SOL: 0.01,
    XRP: 0.2,
    ADA: 1.0,
    LTC: 0.001,
    BNB: 0.001
  };

  return fallbacks[baseCoin] || 0;
};
