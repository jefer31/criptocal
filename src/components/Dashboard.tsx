"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import DynamicFiatRates from './DynamicFiatRates';

interface SavedRoute {
  pair: string;
  buyExchange: string;
  buyMethod: string;
  sellExchange: string;
  sellMethod: string;
}

const P2P_PAIRS = [
  { value: 'USDTVES', label: '🇻🇪 Bolívar Venezolano (USDT → VES)', currency: 'VES', capital: 'USDT' },
  { value: 'USDTCOP', label: '🇨🇴 Peso Colombiano (USDT → COP)', currency: 'COP', capital: 'USDT' },
  { value: 'USDTARS', label: '🇦🇷 Peso Argentino (USDT → ARS)', currency: 'ARS', capital: 'USDT' },
  { value: 'USDTMXN', label: '🇲🇽 Peso Mexicano (USDT → MXN)', currency: 'MXN', capital: 'USDT' },
  { value: 'USDTBRL', label: '🇧🇷 Real Brasileño (USDT → BRL)', currency: 'BRL', capital: 'USDT' },
  { value: 'USDTPEN', label: '🇵🇪 Sol Peruano (USDT → PEN)', currency: 'PEN', capital: 'USDT' },
  { value: 'USDTCLP', label: '🇨🇱 Peso Chileno (USDT → CLP)', currency: 'CLP', capital: 'USDT' },
  { value: 'USDTEUR', label: '🇪🇺 Euro (USDT → EUR)', currency: 'EUR', capital: 'USDT' },
  { value: 'USDTUSD', label: '🇺🇸 Dólar USA (USDT → USD)', currency: 'USD', capital: 'USDT' },
  { value: 'USDTBOB', label: '🇧🇴 Boliviano (USDT → BOB)', currency: 'BOB', capital: 'USDT' },
  { value: 'USDTPYG', label: '🇵🇾 Guaraní Paraguayo (USDT → PYG)', currency: 'PYG', capital: 'USDT' },
  { value: 'USDTUYU', label: '🇺🇾 Peso Uruguayo (USDT → UYU)', currency: 'UYU', capital: 'USDT' },
  { value: 'USDTDOP', label: '🇩🇴 Peso Dominicano (USDT → DOP)', currency: 'DOP', capital: 'USDT' },
];

const EXCHANGES = [
  { value: 'binance_p2p', label: '🟢 Binance P2P (API en Vivo)' },
  { value: 'bybit_p2p', label: '⚙️ Bybit P2P (Manual)' },
  { value: 'bitget_p2p', label: '⚙️ Bitget P2P (Manual)' },
  { value: 'okx_p2p', label: '⚙️ OKX P2P (Manual)' },
  { value: 'mexc_p2p', label: '⚙️ MEXC P2P (Manual)' },
  { value: 'eldorado', label: '⚙️ El Dorado (Manual)' },
  { value: 'airtm', label: '⚙️ AirTM (Manual)' },
  { value: 'localbitcoins', label: '⚙️ LocalBitcoins (Manual)' },
  { value: 'paxful', label: '⚙️ Paxful (Manual)' },
  { value: 'otro', label: '⚙️ Otro (Manual)' }
];

const PAYMENT_METHODS = [
  { value: 'pago_movil', label: 'Pago Móvil', currencies: ['VES'] },
  { value: 'banesco', label: 'Banesco', currencies: ['VES'] },
  { value: 'mercantil', label: 'Mercantil', currencies: ['VES'] },
  { value: 'provincial', label: 'Provincial', currencies: ['VES'] },
  { value: 'zinli', label: 'Zinli', currencies: ['USD', 'PAB'] },
  { value: 'zelle', label: 'Zelle', currencies: ['USD'] },
  { value: 'nequi', label: 'Nequi', currencies: ['COP'] },
  { value: 'bancolombia', label: 'Bancolombia', currencies: ['COP'] },
  { value: 'mercadopago', label: 'MercadoPago', currencies: ['ARS', 'MXN', 'BRL'] },
  { value: 'paypal', label: 'PayPal', currencies: ['USD', 'EUR'] },
  { value: 'wise', label: 'Wise', currencies: ['USD', 'EUR', 'GBP'] },
  { value: 'reserve', label: 'Reserve' },
  { value: 'efectivo', label: 'Efectivo / Físico' },
  { value: 'banco_nacional', label: 'Transferencia Bancaria Nacional' }
];

const EXCHANGE_LABELS: Record<string, string> = {};
EXCHANGES.forEach(m => { EXCHANGE_LABELS[m.value] = m.label; });

const METHOD_LABELS: Record<string, string> = {};
PAYMENT_METHODS.forEach(m => { METHOD_LABELS[m.value] = m.label; });

export default function Dashboard() {
  const [calcStrategy, setCalcStrategy] = useState<'manual' | 'objetivo'>('manual');
  const [selectedPair, setSelectedPair] = useState('USDTVES');
  const [buyExchange, setBuyExchange] = useState('binance_p2p');
  const [buyMethod, setBuyMethod] = useState('pago_movil');
  const [sellExchange, setSellExchange] = useState('binance_p2p');
  const [sellMethod, setSellMethod] = useState<string>('pago_movil');
  const [capital, setCapital] = useState<number | ''>(100);
  
  // Crypto Asset State
  const [cryptoAsset, setCryptoAsset] = useState<string>('USDT');

  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');

  const [buyFee, setBuyFee] = useState<number | ''>(0);
  const [sellFee, setSellFee] = useState<number | ''>(0);
  const [targetMargin, setTargetMargin] = useState<number | ''>(2.0);

  const [liveStatusBuy, setLiveStatusBuy] = useState('');
  const [liveStatusSell, setLiveStatusSell] = useState('');

  const [result, setResult] = useState<any>(null);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);

  const pairInfo = P2P_PAIRS.find(p => p.value === selectedPair) || P2P_PAIRS[0];

  useEffect(() => {
    const saved = localStorage.getItem('criptocal_p2p_routes');
    if (saved) {
      try { setSavedRoutes(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveRoute = () => {
    const newRoute = { pair: selectedPair, buyExchange, buyMethod, sellExchange, sellMethod };
    if (savedRoutes.some(r => r.pair === newRoute.pair && r.buyExchange === newRoute.buyExchange && r.buyMethod === newRoute.buyMethod && r.sellExchange === newRoute.sellExchange && r.sellMethod === newRoute.sellMethod)) {
      alert('Esta ruta ya está guardada en tus favoritos.');
      return;
    }
    const updated = [...savedRoutes, newRoute];
    setSavedRoutes(updated);
    localStorage.setItem('criptocal_p2p_routes', JSON.stringify(updated));
  };

  const loadRoute = (route: SavedRoute) => {
    setSelectedPair(route.pair);
    setBuyExchange(route.buyExchange || 'binance_p2p');
    setBuyMethod(route.buyMethod);
    setSellExchange(route.sellExchange || 'binance_p2p');
    setSellMethod(route.sellMethod);
    setBuyPrice('');
    setSellPrice('');
    setResult(null);
  };

  const deleteRoute = (index: number) => {
    const updated = [...savedRoutes];
    updated.splice(index, 1);
    setSavedRoutes(updated);
    localStorage.setItem('criptocal_p2p_routes', JSON.stringify(updated));
  };

  const fetchLivePrice = async (type: 'compra' | 'venta') => {
    const isCompra = type === 'compra';
    const method = isCompra ? buyMethod : sellMethod;
    const exchange = isCompra ? buyExchange : sellExchange;
    const setStatus = isCompra ? setLiveStatusBuy : setLiveStatusSell;
    
    if (exchange !== 'binance_p2p') {
      alert('Los precios en vivo solo están disponibles para Binance P2P por ahora.');
      return;
    }

    // Como somos P2P Makers: 
    // Paso 1 (Compra USDT): Publicamos un anuncio de COMPRA -> En Binance es un ad BUY.
    // Paso 2 (Venta USDT): Publicamos un anuncio de VENTA -> En Binance es un ad SELL.
    // WAIT: En la API de Binance P2P, para ver a qué precio debo publicar mi anuncio de COMPRA (para competir), 
    // debo mirar los anuncios de VENTA de los demás (tradeType = SELL). 
    // Y para publicar mi anuncio de VENTA, debo mirar los de COMPRA (tradeType = BUY).
    const tradeType = isCompra ? 'SELL' : 'BUY';

    setStatus('⏳ Buscando P2P...');

    try {
      const res = await fetch('/api/p2p', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fiat: pairInfo.currency,
          tradeType: tradeType,
          payType: method,
          asset: cryptoAsset
        })
      });

      const data = await res.json();

      if (data.error) throw new Error(data.error);

      if (data.price) {
        if (isCompra) setBuyPrice(data.price);
        else setSellPrice(data.price);

        setStatus('✅ Listo');
        setTimeout(() => setStatus(''), 1500);
      } else {
        throw new Error('Precio no encontrado');
      }
    } catch (err: any) {
      console.error(err);
      setStatus('⚠️ Sin anuncios hoy');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const calculateP2P = async () => {
    const p1Price = parseFloat(buyPrice);
    const numCapital = typeof capital === 'string' ? parseFloat(capital) : capital;
    if (isNaN(numCapital) || numCapital <= 0 || isNaN(p1Price) || p1Price <= 0) {
      alert('⚠️ Por favor ingrese valores numéricos válidos en el Paso 1.');
      return;
    }

    let ganancia = 0;
    let spreadNetoPorcentaje = 0;
    let resPayload: any = {};
    const sPrice = parseFloat(sellPrice);

    // Flujo Maker Estricto (FIAT -> CRYPTO -> FIAT)
    // Paso 1: Comprar CRYPTO con Capital en Moneda Local
    const numBuyFee = typeof buyFee === 'string' ? parseFloat(buyFee) || 0 : buyFee;
    const capitalTrasFee = numCapital * (1 - (numBuyFee / 100));
    const cantidadCripto = capitalTrasFee / p1Price; // Divido Fiat / PrecioCompra = Cripto

    if (calcStrategy === 'manual') {
      if (isNaN(sPrice) || sPrice <= 0) return alert('⚠️ Ingrese un precio válido en el Paso 2.');
      // Paso 2: Vender CRYPTO para recuperar Moneda Local
      const numSellFee = typeof sellFee === 'string' ? parseFloat(sellFee) || 0 : sellFee;
      const retornoBruto = cantidadCripto * sPrice; // Multiplico Cripto * PrecioVenta = Fiat
      const retornoFinal = retornoBruto * (1 - (numSellFee / 100));
      ganancia = retornoFinal - numCapital;
      spreadNetoPorcentaje = (ganancia / numCapital) * 100;
      
      resPayload = {
        retornoFinal: retornoFinal.toFixed(2),
        ganancia: ganancia.toFixed(2),
        monedaGanancia: pairInfo.currency,
        cantidadCripto: cantidadCripto.toFixed(8),
        spreadNetoPorcentaje: spreadNetoPorcentaje.toFixed(2),
        precioPaso2: sellPrice
      };
    } else {
      const numTargetMargin = typeof targetMargin === 'string' ? parseFloat(targetMargin) || 0 : targetMargin;
      const numSellFee = typeof sellFee === 'string' ? parseFloat(sellFee) || 0 : sellFee;
      if (isNaN(numTargetMargin)) return alert('⚠️ Ingrese un porcentaje válido.');
      const retornoObjetivo = numCapital * (1 + (numTargetMargin / 100)); // Quiero X% más de Fiat
      const retornoBrutoNecesario = retornoObjetivo / (1 - (numSellFee / 100));
      const precioPaso2Sugerido = retornoBrutoNecesario / cantidadCripto;
      setSellPrice(precioPaso2Sugerido.toFixed(2));
      spreadNetoPorcentaje = numTargetMargin;
      resPayload = {
        retornoFinal: retornoObjetivo.toFixed(2),
        ganancia: (retornoObjetivo - numCapital).toFixed(2),
        monedaGanancia: pairInfo.currency,
        cantidadCripto: cantidadCripto.toFixed(8),
        spreadNetoPorcentaje: spreadNetoPorcentaje.toFixed(2),
        precioPaso2: precioPaso2Sugerido.toFixed(2)
      };
    }

    resPayload.monedaLocal = pairInfo.currency;
    resPayload.isPositive = spreadNetoPorcentaje >= 0;
    resPayload.isHighlyProfitable = spreadNetoPorcentaje >= 0.5;

    setResult(resPayload);

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.from('operation_history').insert([{
        user_id: session.user.id,
        fecha: new Date().toLocaleString(),
        estrategia: `P2P Maker ${pairInfo.currency} (${EXCHANGE_LABELS[buyExchange]} ➔ ${EXCHANGE_LABELS[sellExchange]})`,
        capital: `${pairInfo.currency} ${numCapital.toFixed(2)}`,
        compra: p1Price.toFixed(2),
        venta: resPayload.precioPaso2,
        neto: `${resPayload.monedaGanancia} ${resPayload.retornoFinal}`,
        spread: resPayload.spreadNetoPorcentaje
      }]);
    }
  };

  const showBuyLive = buyExchange === 'binance_p2p';
  const showSellLive = sellExchange === 'binance_p2p';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <DynamicFiatRates fiatCurrency={pairInfo.currency} />
      <div className="calc-panel-box" onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') calculateP2P(); }}>
        <div className="panel-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><span>🌍</span> Calculadora P2P (Moneda Local)</div>
          <button className="btn-save-route" onClick={saveRoute} type="button">⭐ Guardar Ruta</button>
        </div>

        <div style={{ backgroundColor: 'rgba(0, 173, 181, 0.08)', borderLeft: '4px solid #00ADB5', padding: '12px', margin: '15px 0', borderRadius: '4px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <strong>💡 Lógica Maker P2P</strong><br/>
          Esta calculadora está diseñada estrictamente para comerciantes P2P (Makers). El flujo lógico es: <strong>Moneda Local ➔ {cryptoAsset} ➔ Moneda Local</strong>.<br/>
          Pones anuncios para comprar {cryptoAsset} más barato con tu banco, y luego anuncios para vender esos {cryptoAsset} más caro a tu banco. Tu capital inicial debe ser tu Moneda Local.
        </div>

        {savedRoutes.length > 0 && (
          <div className="saved-routes-container">
            <span className="saved-routes-label">Rutas Rápidas Guardadas:</span>
            <div className="saved-routes-list">
              {savedRoutes.map((route, i) => (
                <div key={i} className="saved-route-chip">
                  <span onClick={() => loadRoute(route)}>
                    {route.pair.replace('USDT', '')}: {EXCHANGE_LABELS[route.buyExchange] || 'Binance'} ({METHOD_LABELS[route.buyMethod]}) ➔ {EXCHANGE_LABELS[route.sellExchange] || 'Binance'} ({METHOD_LABELS[route.sellMethod]})
                  </span>
                  <button type="button" className="del-route-btn" onClick={() => deleteRoute(i)} title="Eliminar ruta">×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>País / Moneda Local</label>
            <select value={selectedPair} onChange={(e) => {
              setSelectedPair(e.target.value);
              const pair = P2P_PAIRS.find(p => p.value === e.target.value);
              if (pair) {
                setBuyPrice('');
                setSellPrice('');
              }
            }}>
              {P2P_PAIRS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Criptomoneda a Operar</label>
            <select value={cryptoAsset} onChange={(e) => {
              setCryptoAsset(e.target.value);
              setBuyPrice('');
              setSellPrice('');
            }}>
              <option value="USDT">USDT</option>
              <option value="BTC">Bitcoin (BTC)</option>
              <option value="ETH">Ethereum (ETH)</option>
              <option value="BNB">Binance Coin (BNB)</option>
              <option value="FDUSD">FDUSD</option>
              <option value="USDC">USDC</option>
            </select>
          </div>
        </div>

        <div className="input-group" style={{ marginBottom: '20px' }}>
          <label>Capital Inicial (En tu banco local)</label>
          <div className="input-group-wrapper">
              <input type="number" placeholder="Ej: 100" step="any" value={capital} onChange={(e) => setCapital(e.target.value === '' ? '' : parseFloat(e.target.value))} />
            <span className="currency-tag">{pairInfo.currency}</span>
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '15px', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 15px 0', color: 'var(--primary)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🛒 Paso 1: Comprar {cryptoAsset} (Tu anuncio)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Exchange (Plataforma)</label>
              <select value={buyExchange} onChange={(e) => setBuyExchange(e.target.value)}>
                {EXCHANGES.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Método de Pago (Banco)</label>
              <select value={buyMethod} onChange={(e) => setBuyMethod(e.target.value)}>
                {PAYMENT_METHODS.filter(m => !('currencies' in m) || (m as any).currencies.includes(pairInfo.currency)).map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>
                Precio de Compra
                {showBuyLive && (
                  <span className="live-api-btn" onClick={() => fetchLivePrice('compra')} title="Extraer precio real de Binance P2P">
                    {liveStatusBuy || '🔄 En vivo'}
                  </span>
                )}
              </label>
              <div className="input-group-wrapper">
                <input type="number" placeholder="Ej: 39.50" step="any" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} />
                <span className="currency-tag">{pairInfo.currency}</span>
              </div>
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Comisión de Plataforma</label>
              <div className="input-group-wrapper">
                <input type="number" placeholder="0" step="any" value={buyFee} onChange={(e) => setBuyFee(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                <span className="currency-tag">%</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '15px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <h4 style={{ margin: 0, color: 'var(--primary)', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              💰 Paso 2: Vender {cryptoAsset} (Tu anuncio)
            </h4>
            <div className="calc-mode-switch-container" style={{ margin: 0, width: '100%', maxWidth: 'max-content' }}>
              <button className={`mode-switch-btn ${calcStrategy === 'manual' ? 'active' : ''}`} style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => setCalcStrategy('manual')}>Manual</button>
              <button className={`mode-switch-btn ${calcStrategy === 'objetivo' ? 'active' : ''}`} style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => setCalcStrategy('objetivo')}>Objetivo %</button>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Exchange (Plataforma)</label>
              <select value={sellExchange} onChange={(e) => setSellExchange(e.target.value)}>
                {EXCHANGES.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Método de Pago (Banco)</label>
              <select value={sellMethod} onChange={(e) => setSellMethod(e.target.value)}>
                {PAYMENT_METHODS.filter(m => !('currencies' in m) || (m as any).currencies.includes(pairInfo.currency)).map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          
            {calcStrategy === 'manual' ? (
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>
                  Precio de Venta
                  {showSellLive && (
                    <span className="live-api-btn" onClick={() => fetchLivePrice('venta')} title="Extraer precio real de Binance P2P">
                      {liveStatusSell || '🔄 En vivo'}
                    </span>
                  )}
                </label>
                <div className="input-group-wrapper">
                  <input type="number" placeholder="Ej: 40.00" step="any" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} />
                  <span className="currency-tag">{pairInfo.currency}</span>
                </div>
              </div>
            ) : (
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Margen Objetivo (Ej: 2.0%)</label>
                <div className="input-group-wrapper">
                  <input type="number" placeholder="2.0" step="any" value={targetMargin} onChange={(e) => setTargetMargin(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                  <span className="currency-tag">%</span>
                </div>
              </div>
            )}
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Comisión de Plataforma</label>
              <div className="input-group-wrapper">
                <input type="number" placeholder="0" step="any" value={sellFee} onChange={(e) => setSellFee(e.target.value === '' ? '' : parseFloat(e.target.value))} />
                <span className="currency-tag">%</span>
              </div>
            </div>
          </div>
        </div>

        <button className="btn-primary" style={{ width: '100%', padding: '15px', marginTop: '10px' }} onClick={calculateP2P}>
          📊 CALCULAR OPORTUNIDAD P2P (MAKER)
        </button>

        {result && (
          <div className={`result-card ${result.isHighlyProfitable ? 'highly-profitable' : result.isPositive ? 'positive' : 'negative'}`}>
            <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
              Resultado de Arbitraje P2P Maker
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px', marginBottom: '15px' }}>
              <div className="stat-item">
                <div className="stat-label">Retorno Final</div>
                <div className="stat-value">{result.retornoFinal} <span style={{fontSize: '0.6em'}}>{result.monedaGanancia}</span></div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Ganancia Neta</div>
                <div className="stat-value" style={{ color: result.isPositive ? 'var(--success)' : 'var(--danger)' }}>
                  {result.isPositive ? '+' : ''}{result.ganancia} <span style={{fontSize: '0.6em'}}>{result.monedaGanancia}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span>Spread Neto Final: <strong style={{ color: result.isPositive ? 'var(--success)' : 'var(--danger)' }}>{result.spreadNetoPorcentaje}%</strong></span>
              <span>{cryptoAsset} Adquiridos: <strong>{result.cantidadCripto} {cryptoAsset}</strong></span>
            </div>

            {calcStrategy === 'objetivo' && (
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '4px', textAlign: 'center', marginTop: '10px' }}>
                <div className="stat-label">Precio Sugerido para el Paso 2 (Venta {cryptoAsset})</div>
                <div className="stat-value" style={{ color: 'var(--primary)' }}>{result.precioPaso2} <span style={{fontSize: '0.6em'}}>{pairInfo.currency}</span></div>
              </div>
            )}
          </div>
        )}
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
                ? `Oportunidad rentable detectada (${result.spreadNetoPorcentaje}%). ¡Ejecuta esta ruta P2P!`
                : (result.isPositive
                  ? `Spread muy bajo (${result.spreadNetoPorcentaje}%). Verifica los precios antes de operar.`
                  : `Operación inviable. Pérdida del ${Math.abs(parseFloat(result.spreadNetoPorcentaje)).toFixed(2)}%. Busca mejores precios.`)}
            </span>
          </div>
        )}

        {result && (
          <div className="share-result-container">
            <button className="btn-share" onClick={() => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if (!ctx) return;

              canvas.width = 600;
              canvas.height = 420;

              const drawAndShare = (logoLoaded: boolean, logoImg: HTMLImageElement) => {
                const bg = ctx.createLinearGradient(0, 0, 600, 420);
                bg.addColorStop(0, '#0a0a1a');
                bg.addColorStop(1, '#111827');
                ctx.fillStyle = bg;
                ctx.fillRect(0, 0, 600, 420);

                ctx.strokeStyle = '#00ADB5';
                ctx.lineWidth = 2;
                ctx.strokeRect(1, 1, 598, 418);

                if (logoLoaded) {
                  ctx.drawImage(logoImg, 30, 20, 32, 32);
                  ctx.fillStyle = '#00ADB5';
                  ctx.font = 'bold 22px Inter, Arial, sans-serif';
                  ctx.fillText('CriptoCal — Arbitraje P2P', 75, 45);
                } else {
                  ctx.fillStyle = '#00ADB5';
                  ctx.font = 'bold 22px Inter, Arial, sans-serif';
                  ctx.fillText('CriptoCal — Arbitraje P2P', 30, 45);
                }

                ctx.strokeStyle = 'rgba(0, 173, 181, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(30, 65); ctx.lineTo(570, 65); ctx.stroke();

                ctx.fillStyle = '#9CA3AF';
                ctx.font = '15px Inter, Arial, sans-serif';
                ctx.fillText(`${pairInfo.currency}  |  ${METHOD_LABELS[buyMethod]} -> ${METHOD_LABELS[sellMethod]}`, 30, 95);

                const formatNum = (val: string | number) => parseFloat(val.toString()).toString();

                const rows = [
                  ['Capital invertido', `${pairInfo.currency} ${formatNum(capital)}`],
                  [`Precio Compra (${pairInfo.currency}/${cryptoAsset})`, `${formatNum(buyPrice)}`],
                  [`Precio Venta (${pairInfo.currency}/${cryptoAsset})`, `${formatNum(result.precioPaso2)}`],
                  [`${cryptoAsset} Adquiridos en Paso 1`, `${cryptoAsset} ${formatNum(result.cantidadCripto)}`],
                  ['Retorno Bruto', `${pairInfo.currency} ${formatNum(result.retornoFinal)}`],
                ];

                let y = 135;
                rows.forEach(([label, value]) => {
                  ctx.fillStyle = '#6B7280';
                  ctx.font = '14px Inter, Arial, sans-serif';
                  ctx.fillText(label, 30, y);
                  ctx.fillStyle = '#E5E7EB';
                  ctx.font = 'bold 15px Inter, Arial, sans-serif';
                  ctx.textAlign = 'right';
                  ctx.fillText(value, 570, y);
                  ctx.textAlign = 'left';
                  y += 32;
                });

                ctx.fillStyle = 'rgba(0, 173, 181, 0.1)';
                ctx.fillRect(20, y + 10, 560, 50);
                ctx.strokeStyle = 'rgba(0, 173, 181, 0.4)';
                ctx.strokeRect(20, y + 10, 560, 50);

                ctx.fillStyle = '#00ADB5';
                ctx.font = 'bold 16px Inter, Arial, sans-serif';
                ctx.fillText('Ganancia Neta P2P', 35, y + 41);
                ctx.fillStyle = result.isPositive ? '#10B981' : '#EF4444';
                ctx.font = 'bold 22px Inter, Arial, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(`${formatNum(result.ganancia)} ${pairInfo.currency} (${formatNum(result.spreadNetoPorcentaje)}%)`, 565, y + 43);
                ctx.textAlign = 'left';

                ctx.fillStyle = '#4B5563';
                ctx.font = '12px Inter, Arial, sans-serif';
                ctx.fillText('criptocal.vercel.app — Calculadora P2P', 30, 400);
                ctx.fillText(new Date().toLocaleString('es-ES'), 430, 400);

                canvas.toBlob(async (blob) => {
                  if (!blob) return;
                  const file = new File([blob], 'criptocal-p2p.png', { type: 'image/png' });

                  if (navigator.share && navigator.canShare?.({ files: [file] })) {
                    try {
                      await navigator.share({
                        title: 'CriptoCal — Resultado P2P Maker',
                        text: `Ganancia de ${formatNum(result.ganancia)} ${pairInfo.currency} (${formatNum(result.spreadNetoPorcentaje)}%) haciendo arbitraje. Calculado con criptocal.vercel.app`,
                        files: [file],
                      });
                    } catch { /* user cancelled */ }
                  } else {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'criptocal-p2p.png';
                    a.click();
                    URL.revokeObjectURL(url);
                  }
                }, 'image/png');
              };

              const logoImg = new window.Image();
              logoImg.crossOrigin = 'Anonymous';
              let logoLoaded = false;

              logoImg.onload = () => {
                logoLoaded = true;
                drawAndShare(logoLoaded, logoImg);
              };
              logoImg.onerror = () => {
                drawAndShare(logoLoaded, logoImg);
              };
              logoImg.src = '/logo.png';
            }}>
              📤 Compartir Resultado
            </button>
          </div>
      )}
    </div>
  );
}
