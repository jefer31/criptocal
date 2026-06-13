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
  { value: 'binance_p2p', label: 'Binance P2P' },
  { value: 'bybit_p2p', label: 'Bybit P2P' },
  { value: 'bitget_p2p', label: 'Bitget P2P' },
  { value: 'okx_p2p', label: 'OKX P2P' },
  { value: 'mexc_p2p', label: 'MEXC P2P' },
  { value: 'eldorado', label: 'El Dorado' },
  { value: 'airtm', label: 'AirTM' },
  { value: 'localbitcoins', label: 'LocalBitcoins' },
  { value: 'paxful', label: 'Paxful' },
  { value: 'otro', label: 'Otro (Manual)' }
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
  const [sellMethod, setSellMethod] = useState('pago_movil');
  const [capital, setCapital] = useState(100);

  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');

  const [buyFee, setBuyFee] = useState(0);
  const [sellFee, setSellFee] = useState(0);
  const [targetMargin, setTargetMargin] = useState(2.0);

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

    // In Binance P2P API, if user is BUYING USDT with Fiat, they are taking a SELL ad.
    // If user is SELLING USDT for Fiat, they are taking a BUY ad.
    const tradeType = isCompra ? 'SELL' : 'BUY';

    setStatus('⏳ Buscando P2P...');

    try {
      const res = await fetch('/api/p2p', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fiat: pairInfo.currency,
          tradeType: tradeType,
          payType: method
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
    const bPrice = parseFloat(buyPrice);
    if (isNaN(capital) || capital <= 0 || isNaN(bPrice) || bPrice <= 0) {
      alert('⚠️ Por favor ingrese valores numéricos válidos.');
      return;
    }

    const capitalTrasFeeCompra = capital * (1 - (buyFee / 100));
    const cantidadMonedaLocal = capitalTrasFeeCompra * bPrice;

    let retornoUSDT = 0;
    let spreadNetoPorcentaje = 0;

    if (calcStrategy === 'manual') {
      const sPrice = parseFloat(sellPrice);
      if (isNaN(sPrice) || sPrice <= 0) {
        alert('⚠️ Por favor ingrese un Precio de Venta válido.');
        return;
      }
      const retornoBruto = cantidadMonedaLocal / sPrice;
      retornoUSDT = retornoBruto * (1 - (sellFee / 100));
      spreadNetoPorcentaje = ((retornoUSDT - capital) / capital) * 100;
    } else {
      if (isNaN(targetMargin)) {
        alert('⚠️ Ingrese un porcentaje de margen objetivo válido.');
        return;
      }
      retornoUSDT = capital * (1 + (targetMargin / 100));
      const retornoBrutoNecesario = retornoUSDT / (1 - (sellFee / 100));
      const precioVentaSugerido = cantidadMonedaLocal / retornoBrutoNecesario;
      setSellPrice(precioVentaSugerido.toFixed(2));
      spreadNetoPorcentaje = targetMargin;
    }

    const gananciaUSDT = retornoUSDT - capital;

    const resPayload = {
      monedaLocal: pairInfo.currency,
      cantidadMonedaLocal: cantidadMonedaLocal.toFixed(2),
      retornoUSDT: retornoUSDT.toFixed(2),
      gananciaUSDT: gananciaUSDT.toFixed(2),
      spreadNetoPorcentaje: spreadNetoPorcentaje.toFixed(2),
      isPositive: spreadNetoPorcentaje >= 0,
      isHighlyProfitable: spreadNetoPorcentaje >= 0.5,
      precioVenta: calcStrategy === 'manual' ? sellPrice : (cantidadMonedaLocal / (retornoUSDT / (1 - (sellFee / 100)))).toFixed(2),
    };

    setResult(resPayload);

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.from('operation_history').insert([{
        user_id: session.user.id,
        fecha: new Date().toLocaleString(),
        estrategia: `P2P ${pairInfo.currency} (${EXCHANGE_LABELS[buyExchange]} ${METHOD_LABELS[buyMethod]} ➔ ${EXCHANGE_LABELS[sellExchange]} ${METHOD_LABELS[sellMethod]})`,
        capital: `USDT ${capital.toFixed(2)}`,
        compra: bPrice.toFixed(2),
        venta: resPayload.precioVenta,
        neto: `USDT ${resPayload.retornoUSDT}`,
        spread: resPayload.spreadNetoPorcentaje
      }]);
    }
  };

  const showBuyLive = buyExchange === 'binance_p2p';
  const showSellLive = sellExchange === 'binance_p2p';

  return (
    <div className="standard-calc">
      <DynamicFiatRates fiatCurrency={pairInfo.currency} />
      <div className="calc-panel-box" onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') calculateP2P(); }}>
        <div className="panel-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><span>🌍</span> Calculadora P2P (Moneda Local)</div>
          <button className="btn-save-route" onClick={saveRoute} type="button">⭐ Guardar Ruta</button>
        </div>

        <div style={{ backgroundColor: 'rgba(0, 173, 181, 0.08)', borderLeft: '4px solid #00ADB5', padding: '12px', margin: '15px 0', borderRadius: '4px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <strong>💡 ¿Cómo funciona?</strong><br/>
          Simula la compra de moneda local (Bolívares, Pesos, etc.) usando USDT en una plataforma P2P, y luego la reventa en otra plataforma a un precio mayor. La diferencia entre el precio de compra y venta es tu ganancia.
          <strong>Ejemplo:</strong> Compras USDT a 39.50 Bs en El Dorado (usando Pago Móvil), y vendes a 40.00 Bs en Binance P2P (usando Pago Móvil). Ganancia: +1.27%.
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

        <div className="calc-mode-switch-container">
          <button className={`mode-switch-btn ${calcStrategy === 'manual' ? 'active' : ''}`} onClick={() => setCalcStrategy('manual')}>Modo Manual</button>
          <button className={`mode-switch-btn ${calcStrategy === 'objetivo' ? 'active' : ''}`} onClick={() => setCalcStrategy('objetivo')}>Modo Objetivo %</button>
        </div>

        <div className="input-group">
          <label>Par de Moneda Local</label>
          <select value={selectedPair} onChange={(e) => { setSelectedPair(e.target.value); setBuyPrice(''); setSellPrice(''); setResult(null); }}>
            {P2P_PAIRS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="input-grid-2">
          <div className="input-group">
            <label>Exchange de Compra</label>
            <select value={buyExchange} onChange={(e) => setBuyExchange(e.target.value)}>
              {EXCHANGES.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Método de Pago (Compra)</label>
            <select value={buyMethod} onChange={(e) => setBuyMethod(e.target.value)}>
              {PAYMENT_METHODS.filter(m => !('currencies' in m) || (m as any).currencies.includes(pairInfo.currency)).map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="input-grid-2">
          <div className="input-group">
            <label>Exchange de Venta</label>
            <select value={sellExchange} onChange={(e) => setSellExchange(e.target.value)}>
              {EXCHANGES.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Método de Pago (Venta)</label>
            <select value={sellMethod} onChange={(e) => setSellMethod(e.target.value)}>
              {PAYMENT_METHODS.filter(m => !('currencies' in m) || (m as any).currencies.includes(pairInfo.currency)).map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="input-group">
          <label>Capital de Trabajo</label>
          <div className="input-group-wrapper">
            <input type="number" placeholder="100" step="any" value={capital} onChange={(e) => setCapital(parseFloat(e.target.value))} />
            <span className="currency-tag">USDT</span>
          </div>
        </div>

        <div className="input-grid-2">
          <div className="input-group">
            <label>
              Precio Compra ({pairInfo.currency} por 1 USDT)
              {showBuyLive && (
                <span className="live-api-btn" onClick={() => fetchLivePrice('compra')} title="Extraer precio real de Binance P2P">
                  {liveStatusBuy || '🔄 En vivo (Binance)'}
                </span>
              )}
            </label>
            <div className="input-group-wrapper">
              <input type="number" placeholder="Ej: 39.50" step="any" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} />
              <span className="currency-tag">{pairInfo.currency}</span>
            </div>
          </div>
          <div className="input-group">
            <label>Comisión Plataforma Compra</label>
            <div className="input-group-wrapper">
              <input type="number" placeholder="0" step="any" value={buyFee} onChange={(e) => setBuyFee(parseFloat(e.target.value))} />
              <span className="currency-tag">%</span>
            </div>
          </div>
        </div>

        <div className="input-grid-2">
          {calcStrategy === 'manual' ? (
            <div className="input-group">
              <label>
                Precio Venta ({pairInfo.currency} por 1 USDT)
                {showSellLive && (
                  <span className="live-api-btn" onClick={() => fetchLivePrice('venta')} title="Extraer precio real de Binance P2P">
                    {liveStatusSell || '🔄 En vivo (Binance)'}
                  </span>
                )}
              </label>
              <div className="input-group-wrapper">
                <input type="number" placeholder="Ej: 40.00" step="any" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} />
                <span className="currency-tag">{pairInfo.currency}</span>
              </div>
            </div>
          ) : (
            <div className="input-group">
              <label>Margen Objetivo Deseado</label>
              <div className="input-group-wrapper">
                <input type="number" placeholder="2.0" step="any" value={targetMargin} onChange={(e) => setTargetMargin(parseFloat(e.target.value))} />
                <span className="currency-tag">%</span>
              </div>
            </div>
          )}
          <div className="input-group">
            <label>Comisión Plataforma Venta</label>
            <div className="input-group-wrapper">
              <input type="number" placeholder="0" step="any" value={sellFee} onChange={(e) => setSellFee(parseFloat(e.target.value))} />
              <span className="currency-tag">%</span>
            </div>
          </div>
        </div>

        <button className="btn-primary" onClick={calculateP2P}>Calcular Ganancia P2P</button>
      </div>

      <div className="calc-panel-box">
        <div className="panel-title-bar"><span>📊</span> Desglose de Retorno Estimado</div>
        <div className="results-list-box">
          <div className="result-row-item">
            <span className="label-text">Capital Invertido</span>
            <span className="value-num" style={{ color: '#fff' }}>
              USDT {capital ? capital.toFixed(2) : '0.00'}
            </span>
          </div>
          <div className="result-row-item">
            <span className="label-text">Moneda Local Obtenida</span>
            <span className="value-num" style={{ color: '#fff' }}>
              {result ? `${result.monedaLocal} ${result.cantidadMonedaLocal}` : `${pairInfo.currency} 0.00`}
            </span>
          </div>
          <div className="result-row-item">
            <span className="label-text">Precio de Venta Utilizado</span>
            <span className="value-num" style={{ color: '#fff' }}>
              {result ? `${result.monedaLocal} ${result.precioVenta}` : '0.00'}
            </span>
          </div>
          <div className="result-row-item highlight-box">
            <span className="label-text" style={{ color: 'var(--primary)', fontWeight: 700 }}>Retorno Neto en USDT</span>
            <span className="value-num">
              {result ? `USDT ${result.retornoUSDT}` : 'USDT 0.00'}
            </span>
          </div>
          <div className="result-row-item">
            <span className="label-text">Ganancia / Pérdida</span>
            <span className="value-num" style={{ color: result ? (result.isPositive ? 'var(--success)' : 'var(--danger)') : 'var(--success)', fontWeight: 700 }}>
              {result ? `${parseFloat(result.gananciaUSDT) >= 0 ? '+' : ''}${result.gananciaUSDT} USDT` : '+0.00 USDT'}
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
                  ['Capital invertido', `USDT ${formatNum(capital)}`],
                  [`Precio Compra (${pairInfo.currency})`, `${pairInfo.currency} ${formatNum(buyPrice)}`],
                  [`Precio Venta (${pairInfo.currency})`, `${pairInfo.currency} ${formatNum(result.precioVenta)}`],
                  ['Moneda Local Obtenida', `${pairInfo.currency} ${formatNum(result.cantidadMonedaLocal)}`],
                  ['Retorno Neto', `USDT ${formatNum(result.retornoUSDT)}`],
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
                ctx.fillText('Ganancia Neta', 35, y + 41);
                ctx.fillStyle = result.isPositive ? '#10B981' : '#EF4444';
                ctx.font = 'bold 22px Inter, Arial, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(`${formatNum(result.gananciaUSDT)} USDT (${formatNum(result.spreadNetoPorcentaje)}%)`, 565, y + 43);
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
                        title: 'CriptoCal — Resultado P2P',
                        text: `Ganancia de ${formatNum(result.gananciaUSDT)} USDT (${formatNum(result.spreadNetoPorcentaje)}%) en ${pairInfo.currency}. Calculado con criptocal.vercel.app`,
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
    </div>
  );
}
