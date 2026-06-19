"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { getDefaultNetworkFee } from '../data/networkFees';

interface SavedRoute {
  asset: string;
  source: string;
  target: string;
}

const SPOT_PAIRS = [
  { value: 'BTCUSDT', label: '₿ Bitcoin (BTC / USDT)' },
  { value: 'ETHUSDT', label: 'Ξ Ethereum (ETH / USDT)' },
  { value: 'SOLUSDT', label: '◎ Solana (SOL / USDT)' },
  { value: 'BNBUSDT', label: '◆ Binance Coin (BNB / USDT)' },
  { value: 'XRPUSDT', label: '✕ Ripple (XRP / USDT)' },
  { value: 'ADAUSDT', label: '♦ Cardano (ADA / USDT)' },
  { value: 'AVAXUSDT', label: '▲ Avalanche (AVAX / USDT)' },
  { value: 'DOTUSDT', label: '● Polkadot (DOT / USDT)' },
  { value: 'LINKUSDT', label: '⬡ Chainlink (LINK / USDT)' },
  { value: 'MATICUSDT', label: '⬟ Polygon (MATIC / USDT)' },
  { value: 'LTCUSDT', label: 'Ł Litecoin (LTC / USDT)' },
  { value: 'USDCUSDT', label: '$ USD Coin (USDC / USDT)' },
];

const EXCHANGES = [
  { value: 'binance', label: 'Binance' },
  { value: 'bybit', label: 'Bybit' },
  { value: 'okx', label: 'OKX' },
  { value: 'bitget', label: 'Bitget' },
  { value: 'gateio', label: 'Gate.io' },
  { value: 'kucoin', label: 'KuCoin' },
  { value: 'kraken', label: 'Kraken' },
  { value: 'mexc', label: 'MEXC' },
];

const EXCHANGE_LABELS: Record<string, string> = {};
EXCHANGES.forEach(e => { EXCHANGE_LABELS[e.value] = e.label; });

export default function SpotCalculator() {
  const [calcStrategy, setCalcStrategy] = useState<'manual' | 'objetivo'>('manual');
  const [cryptoAsset, setCryptoAsset] = useState('BTCUSDT');
  const [exchangeSource, setExchangeSource] = useState('binance');
  const [exchangeTarget, setExchangeTarget] = useState('bybit');
  const [capital, setCapital] = useState<number | ''>(1000);

  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');

  const [buyFee, setBuyFee] = useState<number | ''>(0.1);
  const [sellFee, setSellFee] = useState<number | ''>(0.1);
  const [networkFee, setNetworkFee] = useState<number | ''>(0.0002);
  const [targetMargin, setTargetMargin] = useState<number | ''>(1.5);

  const [liveStatusBuy, setLiveStatusBuy] = useState('');
  const [liveStatusSell, setLiveStatusSell] = useState('');

  const [result, setResult] = useState<any>(null);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);

  const networkTag = cryptoAsset.replace('USDT', '');

  useEffect(() => {
    const saved = localStorage.getItem('criptocal_spot_routes');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        // Avoid setting state in effect if possible, or suppress the warning if it's intentional
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setSavedRoutes(parsed); 
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const defaultFee = getDefaultNetworkFee(exchangeSource, cryptoAsset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setNetworkFee(defaultFee);
  }, [cryptoAsset, exchangeSource]);

  const saveRoute = () => {
    const newRoute = { asset: cryptoAsset, source: exchangeSource, target: exchangeTarget };
    if (savedRoutes.some(r => r.source === exchangeSource && r.target === exchangeTarget && r.asset === cryptoAsset)) {
      toast.error('Esta ruta ya está guardada.');
      return;
    }
    const updated = [...savedRoutes, newRoute];
    setSavedRoutes(updated);
    localStorage.setItem('criptocal_spot_routes', JSON.stringify(updated));
  };

  const loadRoute = (route: SavedRoute) => {
    setCryptoAsset(route.asset);
    setExchangeSource(route.source);
    setExchangeTarget(route.target);
    setBuyPrice('');
    setSellPrice('');
    setResult(null);
  };

  const deleteRoute = (index: number) => {
    const updated = [...savedRoutes];
    updated.splice(index, 1);
    setSavedRoutes(updated);
    localStorage.setItem('criptocal_spot_routes', JSON.stringify(updated));
  };

  const handleExchangeChange = (e: React.ChangeEvent<HTMLSelectElement>, isSource: boolean) => {
    if (isSource) setExchangeSource(e.target.value);
    else setExchangeTarget(e.target.value);
    setBuyPrice('');
    setSellPrice('');
  };

  const fetchLivePrice = async (type: 'compra' | 'venta') => {
    const isCompra = type === 'compra';
    const exchange = isCompra ? exchangeSource : exchangeTarget;
    const setStatus = isCompra ? setLiveStatusBuy : setLiveStatusSell;

    setStatus('⏳ Buscando...');

    const fetchDirect = async () => {
      let url = '';
      const sym = cryptoAsset;

      switch (exchange) {
        case 'binance':
          url = `https://api.binance.com/api/v3/ticker/bookTicker?symbol=${sym}`;
          const resBin = await fetch(url).then(r => r.json());
          return parseFloat(isCompra ? resBin.askPrice : resBin.bidPrice);

        case 'bybit':
          url = `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${sym}`;
          const resByb = await fetch(url).then(r => r.json());
          return parseFloat(isCompra ? resByb.result.list[0].ask1Price : resByb.result.list[0].bid1Price);

        case 'mexc':
          url = `https://api.mexc.com/api/v3/ticker/bookTicker?symbol=${sym}`;
          const resMexc = await fetch(url).then(r => r.json());
          return parseFloat(isCompra ? resMexc.askPrice : resMexc.bidPrice);

        case 'kucoin':
          const kSym = sym.replace('USDT', '-USDT');
          url = `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${kSym}`;
          const resKuc = await fetch(url).then(r => r.json());
          return parseFloat(isCompra ? resKuc.data.bestAsk : resKuc.data.bestBid);

        case 'okx':
          const oSym = sym.replace('USDT', '-USDT');
          url = `https://www.okx.com/api/v5/market/ticker?instId=${oSym}`;
          const resOkx = await fetch(url).then(r => r.json());
          return parseFloat(isCompra ? resOkx.data[0].askPx : resOkx.data[0].bidPx);

        case 'bitget':
          url = `https://api.bitget.com/api/v2/spot/market/tickers?symbol=${sym}`;
          const resBit = await fetch(url).then(r => r.json());
          return parseFloat(isCompra ? resBit.data[0].askPr : resBit.data[0].bidPr);

        case 'gateio':
          const gSym = sym.replace('USDT', '_USDT');
          url = `https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${gSym}`;
          const resGate = await fetch(url).then(r => r.json());
          return parseFloat(isCompra ? resGate[0].lowest_ask : resGate[0].highest_bid);

        case 'kraken':
          let krSym = sym;
          if (sym === 'BTCUSDT') krSym = 'XBTUSDT';
          url = `https://api.kraken.com/0/public/Ticker?pair=${krSym}`;
          const resKr = await fetch(url).then(r => r.json());
          const pairKey = Object.keys(resKr.result)[0];
          return parseFloat(isCompra ? resKr.result[pairKey].a[0] : resKr.result[pairKey].b[0]);

        default:
          throw new Error('Exchange no soportado');
      }
    };

    try {
      let price;
      try {
        price = await fetchDirect();
      } catch (e) {
        setStatus('🔄 Conectando vía servidor...');
        const res = await fetch(`/api/crypto?exchange=${exchange}&symbol=${cryptoAsset}&type=${type}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        price = data.price;
      }

      if (price && !isNaN(price)) {
        const dec = parseFloat(price) > 500 ? 2 : (parseFloat(price) > 1 ? 4 : 6);
        const finalPrice = parseFloat(price).toFixed(dec);
        if (isCompra) setBuyPrice(finalPrice);
        else setSellPrice(finalPrice);

        setStatus('✅ Listo');
        setTimeout(() => setStatus(''), 1200);
      } else {
        throw new Error('Precio inválido');
      }
    } catch (err: any) {
      console.error(err);
      setStatus(`⚠️ ${exchange} bloqueado en tu región.`);
      setTimeout(() => setStatus(''), 4000);
    }
  };

  const calculateSpotArbitrage = async () => {
    const bPrice = parseFloat(buyPrice);
    const numCapital = typeof capital === 'string' ? parseFloat(capital) : capital;
    if (isNaN(numCapital) || numCapital <= 0 || isNaN(bPrice) || bPrice <= 0) {
      toast.error('Por favor ingrese valores numéricos válidos.');
      return;
    }

    if (exchangeSource === exchangeTarget) {
      toast.error('El exchange de compra y venta deben ser diferentes para realizar un arbitraje Spot.');
      return;
    }

    const numBuyFee = typeof buyFee === 'string' ? parseFloat(buyFee) || 0 : buyFee;
    const capitalTrasCompra = numCapital * (1 - (numBuyFee / 100));
    let totalTokensAdquiridos = capitalTrasCompra / bPrice;

    const numNetFee = typeof networkFee === 'string' ? parseFloat(networkFee) || 0 : networkFee;
    if (numNetFee > 0) {
      totalTokensAdquiridos -= numNetFee;
      if (totalTokensAdquiridos <= 0) {
        toast.error('La comisión de retiro de red supera los tokens comprados. Operación inviable.');
        return;
      }
    }

    let precioDeVentaUtilizado = 0;
    let capitalFinalBruto = 0;
    let retornoNetoFinal = 0;
    let spreadNetoPorcentaje = 0;

    if (calcStrategy === 'manual') {
      precioDeVentaUtilizado = parseFloat(sellPrice);
      if (isNaN(precioDeVentaUtilizado) || precioDeVentaUtilizado <= 0) {
        toast.error('Por favor ingrese un Precio de Venta válido.');
        return;
      }
      capitalFinalBruto = totalTokensAdquiridos * precioDeVentaUtilizado;
      const numSellFee = typeof sellFee === 'string' ? parseFloat(sellFee) || 0 : sellFee;
      retornoNetoFinal = capitalFinalBruto * (1 - (numSellFee / 100));
      spreadNetoPorcentaje = ((retornoNetoFinal - numCapital) / numCapital) * 100;
    } else {
      const numTargetMargin = typeof targetMargin === 'string' ? parseFloat(targetMargin) || 0 : targetMargin;
      const numSellFee = typeof sellFee === 'string' ? parseFloat(sellFee) || 0 : sellFee;
      if (isNaN(numTargetMargin)) {
        toast.error('Ingrese un porcentaje de margen objetivo válido.');
        return;
      }
      retornoNetoFinal = numCapital * (1 + (numTargetMargin / 100));
      capitalFinalBruto = retornoNetoFinal / (1 - (numSellFee / 100));
      precioDeVentaUtilizado = capitalFinalBruto / totalTokensAdquiridos;
      spreadNetoPorcentaje = numTargetMargin;
    }

    const decPrecio = bPrice > 500 ? 2 : 4;
    const monDestino = 'USDT';

    const resPayload = {
      monDestino,
      precioDeVentaUtilizado: precioDeVentaUtilizado.toFixed(decPrecio),
      capitalFinalBruto: capitalFinalBruto.toFixed(2),
      retornoNetoFinal: retornoNetoFinal.toFixed(2),
      spreadNetoPorcentaje: spreadNetoPorcentaje.toFixed(2),
      isPositive: spreadNetoPorcentaje >= 0,
      isHighlyProfitable: spreadNetoPorcentaje >= 0.5
    };

    setResult(resPayload);

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.from('operation_history').insert([{
        user_id: session.user.id,
        fecha: new Date().toLocaleString(),
        estrategia: `SPOT ${cryptoAsset} (${exchangeSource.toUpperCase()} ➔ ${exchangeTarget.toUpperCase()})`,
        capital: `USDT ${numCapital.toFixed(2)}`,
        compra: bPrice.toFixed(decPrecio),
        venta: resPayload.precioDeVentaUtilizado,
        neto: `USDT ${resPayload.retornoNetoFinal}`,
        spread: resPayload.spreadNetoPorcentaje
      }]);
    }
  };

  return (
    <div className="standard-calc">
      <div className="calc-panel-box" onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') calculateSpotArbitrage(); }}>
        <div className="panel-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><span>📈</span> Calculadora Spot (Cripto a Cripto)</div>
          <button className="btn-save-route" onClick={saveRoute} type="button">⭐ Guardar Ruta</button>
        </div>

        <div style={{ backgroundColor: 'rgba(255, 165, 0, 0.08)', borderLeft: '4px solid #FFA500', padding: '12px', margin: '15px 0', borderRadius: '4px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <strong>⚠️ Importante: Arbitraje Spot</strong><br/>
          Compras una criptomoneda en un exchange a un precio, la retiras a otro exchange pagando <strong>comisión de red</strong> (gas/withdrawal fee), y la vendes más cara. Solo es rentable con capitales altos donde la ganancia supera las tarifas. Los precios en vivo se obtienen directamente de las APIs de cada exchange.
        </div>

        {savedRoutes.length > 0 && (
          <div className="saved-routes-container">
            <span className="saved-routes-label">Rutas Rápidas Guardadas:</span>
            <div className="saved-routes-list">
              {savedRoutes.map((route, i) => (
                <div key={i} className="saved-route-chip">
                  <span onClick={() => loadRoute(route)}>
                    {route.asset.replace('USDT', '')}: {EXCHANGE_LABELS[route.source]} ➔ {EXCHANGE_LABELS[route.target]}
                  </span>
                  <button type="button" className="del-route-btn" onClick={() => deleteRoute(i)} title="Eliminar ruta">×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="calc-mode-switch-container">
          <button className={`mode-switch-btn ${calcStrategy === 'manual' ? 'active' : ''}`} onClick={() => setCalcStrategy('manual')}>Modo Manual</button>
          <button className={`mode-switch-btn ${calcStrategy === 'objetivo' ? 'active' : ''}`} onClick={() => setCalcStrategy('objetivo')}>Modo Objetivo %</button>
        </div>

        <div className="input-group">
          <label>Criptomoneda</label>
          <select value={cryptoAsset} onChange={(e) => { setCryptoAsset(e.target.value); setBuyPrice(''); setSellPrice(''); setResult(null); }}>
            {SPOT_PAIRS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="input-grid-2">
          <div className="input-group">
            <label>Exchange A (Compra)</label>
            <select value={exchangeSource} onChange={(e) => handleExchangeChange(e, true)}>
              {EXCHANGES.map(ex => (
                <option key={ex.value} value={ex.value}>{ex.label}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Exchange B (Venta)</label>
            <select value={exchangeTarget} onChange={(e) => handleExchangeChange(e, false)}>
              {EXCHANGES.map(ex => (
                <option key={ex.value} value={ex.value}>{ex.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="input-group">
          <label>Capital de Trabajo</label>
          <div className="input-group-wrapper">
            <input type="number" placeholder="1000" step="any" value={capital} onChange={(e) => setCapital(e.target.value === '' ? '' : parseFloat(e.target.value))} />
            <span className="currency-tag">USDT</span>
          </div>
        </div>

        <div className="input-grid-2">
          <div className="input-group">
            <label>
              Precio Compra (A)
              <span className="live-api-btn" onClick={() => fetchLivePrice('compra')}>
                {liveStatusBuy || '🔄 En vivo'}
              </span>
            </label>
            <input type="number" placeholder="0.00" step="any" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Comisión Trading (A)</label>
            <div className="input-group-wrapper">
              <input type="number" placeholder="0.1" step="any" value={buyFee} onChange={(e) => setBuyFee(e.target.value === '' ? '' : parseFloat(e.target.value))} />
              <span className="currency-tag">%</span>
            </div>
          </div>
        </div>

        <div className="input-grid-2">
          {calcStrategy === 'manual' ? (
            <div className="input-group">
              <label>
                Precio Venta (B)
                <span className="live-api-btn" onClick={() => fetchLivePrice('venta')}>
                  {liveStatusSell || '🔄 En vivo'}
                </span>
              </label>
              <input type="number" placeholder="0.00" step="any" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} />
            </div>
          ) : (
            <div className="input-group">
              <label>Margen Objetivo Deseado</label>
              <div className="input-group-wrapper">
                <input type="number" placeholder="1.5" step="any" value={targetMargin} onChange={(e) => setTargetMargin(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                <span className="currency-tag">%</span>
              </div>
            </div>
          )}
          <div className="input-group">
            <label>Comisión Trading (B)</label>
            <div className="input-group-wrapper">
              <input type="number" placeholder="0.1" step="any" value={sellFee} onChange={(e) => setSellFee(e.target.value === '' ? '' : parseFloat(e.target.value))} />
              <span className="currency-tag">%</span>
            </div>
          </div>
        </div>

        <div className="input-group">
          <label>Comisión de Retiro/Red (Withdrawal Fee fijo)</label>
          <div className="input-group-wrapper">
            <input type="number" placeholder="0.0002" step="any" value={networkFee} onChange={(e) => setNetworkFee(e.target.value === '' ? '' : parseFloat(e.target.value))} />
            <span className="currency-tag">{networkTag}</span>
          </div>
        </div>

        <button className="btn-primary" onClick={calculateSpotArbitrage}>Calcular Arbitraje Spot</button>
      </div>

      <div className="calc-panel-box">
        <div className="panel-title-bar"><span>📊</span> Desglose de Retorno Estimado</div>
        <div className="results-list-box">
          <div className="result-row-item">
            <span className="label-text">{calcStrategy === 'manual' ? 'Precio de Venta Real' : 'Precio de Venta Sugerido'}</span>
            <span className="value-num" style={{ color: '#fff' }}>
              {result ? `USDT ${result.precioDeVentaUtilizado}` : '0.00'}
            </span>
          </div>
          <div className="result-row-item">
            <span className="label-text">Retorno Bruto en Operación</span>
            <span className="value-num" style={{ color: '#fff' }}>
              {result ? `USDT ${result.capitalFinalBruto}` : '0.00'}
            </span>
          </div>
          <div className="result-row-item highlight-box">
            <span className="label-text" style={{ color: 'var(--primary)', fontWeight: 700 }}>Retorno Neto Capitalizado</span>
            <span className="value-num">
              {result ? `USDT ${result.retornoNetoFinal}` : '0.00'}
            </span>
          </div>
          <div className="result-row-item">
            <span className="label-text">Spread Neto Final</span>
            <span className="value-num" style={{ color: result ? (result.isPositive ? 'var(--success)' : 'var(--danger)') : 'var(--success)', fontWeight: 700 }}>
              {result ? `${result.spreadNetoPorcentaje}%` : '0.00%'}
            </span>
          </div>
        </div>

        {result && (
          <div className="margin-status-alert" style={{
            display: 'flex',
            background: result.isHighlyProfitable ? 'rgba(0, 173, 181, 0.05)' : (result.isPositive ? 'rgba(255, 183, 77, 0.05)' : 'rgba(255, 82, 82, 0.05)'),
            borderColor: result.isHighlyProfitable ? 'rgba(0, 173, 181, 0.2)' : (result.isPositive ? 'rgba(255, 183, 77, 0.2)' : 'rgba(255, 82, 82, 0.2)'),
            color: result.isHighlyProfitable ? 'var(--primary)' : (result.isPositive ? 'var(--warning)' : 'var(--danger)')
          }}>
            <span style={{ fontSize: '20px' }}>
              {result.isHighlyProfitable ? '🚀' : (result.isPositive ? '⚠️' : '🚨')}
            </span>
            <span>
              {result.isHighlyProfitable
                ? `Oportunidad rentable detectada (${result.spreadNetoPorcentaje}%). Ruta viable.`
                : (result.isPositive
                  ? `Spread muy bajo o nulo (${result.spreadNetoPorcentaje}%). Ojo con la volatilidad y gas fees.`
                  : `Operación inviable. Pérdida del ${Math.abs(parseFloat(result.spreadNetoPorcentaje)).toFixed(2)}%.`)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
