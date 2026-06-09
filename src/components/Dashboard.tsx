"use client";
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [calcStrategy, setCalcStrategy] = useState<'manual' | 'objetivo'>('manual');
  const [cryptoAsset, setCryptoAsset] = useState('BTCUSDT');
  const [exchangeSource, setExchangeSource] = useState('binance');
  const [exchangeTarget, setExchangeTarget] = useState('bybit');
  const [capital, setCapital] = useState(1000);
  
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  
  const [buyFee, setBuyFee] = useState(0.1);
  const [sellFee, setSellFee] = useState(0.1);
  const [networkFee, setNetworkFee] = useState(0);
  const [targetMargin, setTargetMargin] = useState(1.5);
  
  const [liveStatusBuy, setLiveStatusBuy] = useState('');
  const [liveStatusSell, setLiveStatusSell] = useState('');
  
  const [result, setResult] = useState<any>(null);

  const getCurrencyTags = () => {
    let networkTag = 'Tokens';
    let capitalTag = 'USDT';
    
    if (cryptoAsset === 'USDTUSDT' || cryptoAsset === 'USDCUSDT') networkTag = 'USDT';
    else if (cryptoAsset.endsWith('VES')) networkTag = cryptoAsset.replace('VES', '');
    else if (cryptoAsset.startsWith('USDT') && cryptoAsset !== 'USDTUSDT') networkTag = 'USDT';
    else if (cryptoAsset.endsWith('USDT')) networkTag = cryptoAsset.replace('USDT', '');
    
    if (cryptoAsset.startsWith('USDT') && cryptoAsset !== 'USDTUSDT') {
      capitalTag = cryptoAsset.replace('USDT', '');
    } else if (cryptoAsset === 'EURUSDT') {
      capitalTag = 'EUR';
    } else if (cryptoAsset === 'BTCVES') {
      capitalTag = 'VES';
    }
    
    return { networkTag, capitalTag };
  };

  const { networkTag, capitalTag } = getCurrencyTags();

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
    
    if (cryptoAsset === 'USDTUSDT') {
      if (isCompra) setBuyPrice('1.00');
      else setSellPrice('1.00');
      setStatus('✅ Listo');
      setTimeout(() => setStatus(''), 1000);
      return;
    }
    
    if (cryptoAsset === 'BTCVES') {
      if (isCompra) setBuyPrice('3500000.00');
      else setSellPrice('3520000.00');
      setStatus('💡 P2P Base');
      setTimeout(() => setStatus(''), 1500);
      return;
    }

    const fetchOnce = async (): Promise<any> => {
      const res = await fetch(`/api/crypto?exchange=${exchange}&symbol=${cryptoAsset}&type=${type}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error de conexión');
      }
      return await res.json();
    };

    try {
      let data;
      try {
        data = await fetchOnce();
      } catch {
        // Reintento automático después de 2 segundos
        setStatus('🔄 Reintentando...');
        await new Promise(r => setTimeout(r, 2000));
        data = await fetchOnce();
      }
      
      if (data.price) {
        let dec = parseFloat(data.price) > 500 ? 2 : (parseFloat(data.price) > 1 ? 4 : 6);
        if (cryptoAsset.includes('ARS') || cryptoAsset.includes('COP') || cryptoAsset.includes('CLP')) dec = 2;
        
        const finalPrice = parseFloat(data.price).toFixed(dec);
        if (isCompra) setBuyPrice(finalPrice);
        else setSellPrice(finalPrice);
        
        setStatus('✅ Listo');
        setTimeout(() => setStatus(''), 1200);
      } else {
        throw new Error('Sin datos de precio');
      }
    } catch (err: any) {
      console.error(err);
      setStatus(`⚠️ ${exchange} no respondió. Intenta de nuevo.`);
      setTimeout(() => setStatus(''), 4000);
    }
  };

  const calculateArbitrage = async () => {
    const bPrice = parseFloat(buyPrice);
    if (isNaN(capital) || capital <= 0 || isNaN(bPrice) || bPrice <= 0) {
      alert('⚠️ Por favor ingrese valores numéricos válidos.');
      return;
    }

    const capitalTrasCompra = capital * (1 - (buyFee / 100));
    let totalTokensAdquiridos = capitalTrasCompra / bPrice;
    
    if (networkFee > 0) {
      totalTokensAdquiridos -= networkFee;
      if (totalTokensAdquiridos <= 0) {
        alert('🚨 La comisión de retiro de red supera los tokens comprados. Operación inviable.');
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
        alert('⚠️ Por favor ingrese un Precio de Venta válido.');
        return;
      }
      capitalFinalBruto = totalTokensAdquiridos * precioDeVentaUtilizado;
      retornoNetoFinal = capitalFinalBruto * (1 - (sellFee / 100));
      spreadNetoPorcentaje = ((retornoNetoFinal - capital) / capital) * 100;
    } else {
      if (isNaN(targetMargin)) {
        alert('⚠️ Ingrese un porcentaje de margen objetivo válido.');
        return;
      }
      retornoNetoFinal = capital * (1 + (targetMargin / 100));
      capitalFinalBruto = retornoNetoFinal / (1 - (sellFee / 100));
      precioDeVentaUtilizado = capitalFinalBruto / totalTokensAdquiridos;
      spreadNetoPorcentaje = targetMargin;
    }
    
    let decPrecio = bPrice > 500 ? 2 : 4;
    if (cryptoAsset.includes('ARS') || cryptoAsset.includes('COP') || cryptoAsset.includes('VES')) decPrecio = 2;

    const monDestino = cryptoAsset.endsWith('USDT') ? 'USDT' : cryptoAsset.replace('USDT', '').replace('BTC', '');
    
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

    // Save history to Supabase
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.from('operation_history').insert([{
        user_id: session.user.id,
        fecha: new Date().toLocaleString(),
        estrategia: `${cryptoAsset} (${exchangeSource.toUpperCase()} ➔ ${exchangeTarget.toUpperCase()})`,
        capital: `${capitalTag} ${capital.toFixed(2)}`,
        compra: bPrice.toFixed(decPrecio),
        venta: resPayload.precioDeVentaUtilizado,
        neto: `${monDestino} ${resPayload.retornoNetoFinal}`,
        spread: resPayload.spreadNetoPorcentaje
      }]);
    }
  };

  return (
    <div className="standard-calc">
      <div className="calc-panel-box" onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') calculateArbitrage(); }}>
        <div className="panel-title-bar"><span>📥</span> Parámetros de Operación Cruzada</div>
        <div className="calc-mode-switch-container">
          <button className={`mode-switch-btn ${calcStrategy === 'manual' ? 'active' : ''}`} onClick={() => setCalcStrategy('manual')}>Modo Manual</button>
          <button className={`mode-switch-btn ${calcStrategy === 'objetivo' ? 'active' : ''}`} onClick={() => setCalcStrategy('objetivo')}>Modo Objetivo %</button>
        </div>

        <div className="input-group">
          <label>Activo Cripto a Evaluar</label>
          <select value={cryptoAsset} onChange={(e) => setCryptoAsset(e.target.value)}>
            <optgroup label="💵 MERCADO SPOT GLOBAL">
              <option value="BTCUSDT">Bitcoin (BTC / USDT)</option>
              <option value="ETHUSDT">Ethereum (ETH / USDT)</option>
              <option value="SOLUSDT">Solana (SOL / USDT)</option>
              <option value="BNBUSDT">Binance Coin (BNB / USDT)</option>
              <option value="XRPUSDT">Ripple (XRP / USDT)</option>
              <option value="ADAUSDT">Cardano (ADA / USDT)</option>
              <option value="AVAXUSDT">Avalanche (AVAX / USDT)</option>
              <option value="DOTUSDT">Polkadot (DOT / USDT)</option>
              <option value="LINKUSDT">Chainlink (LINK / USDT)</option>
              <option value="MATICUSDT">Polygon (MATIC / USDT)</option>
              <option value="LTCUSDT">Litecoin (LTC / USDT)</option>
            </optgroup>
            <optgroup label="🇪🇺 EURO & LATAM MERCADOS FIAT">
              <option value="EURUSDT">Euro de la UE (EUR / USDT)</option>
              <option value="BTCVES">Bolívar Venezolano (BTC / VES)*</option>
              <option value="USDTARS">Peso Argentino (USDT / ARS)</option>
              <option value="USDTCOP">Peso Colombiano (USDT / COP)</option>
              <option value="USDTMXN">Peso Mexicano (USDT / MXN)</option>
              <option value="USDTBRL">Real Brasileño (USDT / BRL)</option>
              <option value="USDTPEN">Sol Peruano (USDT / PEN)</option>
              <option value="USDTCLP">Peso Chileno (USDT / CLP)</option>
            </optgroup>
            <optgroup label="🔄 ESTABILIDAD INTER-EXCHANGE">
              <option value="USDTUSDT">Estabilidad Arbitraje Directo (USDT / USDT)</option>
              <option value="USDCUSDT">USD Coin / Tether (USDC / USDT)</option>
            </optgroup>
          </select>
        </div>

        <div className="input-grid-2">
          <div className="input-group">
            <label>Exchange A (Compra / Origen)</label>
            <select value={exchangeSource} onChange={(e) => handleExchangeChange(e, true)}>
              <option value="binance">Binance</option>
              <option value="bybit">Bybit</option>
              <option value="okx">OKX</option>
              <option value="bitget">Bitget</option>
              <option value="gateio">Gate.io</option>
              <option value="kucoin">KuCoin</option>
              <option value="kraken">Kraken</option>
              <option value="mexc">MEXC</option>
            </select>
          </div>
          <div className="input-group">
            <label>Exchange B (Venta / Destino)</label>
            <select value={exchangeTarget} onChange={(e) => handleExchangeChange(e, false)}>
              <option value="bybit">Bybit</option>
              <option value="binance">Binance</option>
              <option value="okx">OKX</option>
              <option value="bitget">Bitget</option>
              <option value="gateio">Gate.io</option>
              <option value="kucoin">KuCoin</option>
              <option value="kraken">Kraken</option>
              <option value="mexc">MEXC</option>
            </select>
          </div>
        </div>

        <div className="input-group">
          <label>Capital de Trabajo</label>
          <div className="input-group-wrapper">
            <input type="number" placeholder="0.00" step="any" value={capital} onChange={(e) => setCapital(parseFloat(e.target.value))} />
            <span className="currency-tag">{capitalTag}</span>
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
            <label>Comisión Compra (A)</label>
            <div className="input-group-wrapper">
              <input type="number" placeholder="0.1" step="any" value={buyFee} onChange={(e) => setBuyFee(parseFloat(e.target.value))} />
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
                <input type="number" placeholder="1.5" step="any" value={targetMargin} onChange={(e) => setTargetMargin(parseFloat(e.target.value))} />
                <span className="currency-tag">%</span>
              </div>
            </div>
          )}
          <div className="input-group">
            <label>Comisión Venta (B)</label>
            <div className="input-group-wrapper">
              <input type="number" placeholder="0.1" step="any" value={sellFee} onChange={(e) => setSellFee(parseFloat(e.target.value))} />
              <span className="currency-tag">%</span>
            </div>
          </div>
        </div>

        <div className="input-group">
          <label>Comisión de Retiro/Red (Monto Fijo entre A y B)</label>
          <div className="input-group-wrapper">
            <input type="number" placeholder="0.00" step="any" value={networkFee} onChange={(e) => setNetworkFee(parseFloat(e.target.value))} />
            <span className="currency-tag">{networkTag}</span>
          </div>
        </div>

        <button className="btn-primary" onClick={calculateArbitrage}>Ejecutar Simulación Matemática</button>
      </div>

      <div className="calc-panel-box">
        <div className="panel-title-bar"><span>📊</span> Desglose de Retorno Estimado</div>
        <div className="results-list-box">
          <div className="result-row-item">
            <span className="label-text">{calcStrategy === 'manual' ? 'Precio de Venta Requerido' : 'Precio de Venta Sugerido'}</span>
            <span className="value-num" style={{ color: '#fff' }}>
              {result ? `${result.monDestino} ${result.precioDeVentaUtilizado}` : '0.00'}
            </span>
          </div>
          <div className="result-row-item">
            <span className="label-text">Retorno Bruto en Operación</span>
            <span className="value-num" style={{ color: '#fff' }}>
              {result ? `${result.monDestino} ${result.capitalFinalBruto}` : '0.00'}
            </span>
          </div>
          <div className="result-row-item highlight-box">
            <span className="label-text" style={{ color: 'var(--primary)', fontWeight: 700 }}>Retorno Neto Capitalizado</span>
            <span className="value-num">
              {result ? `${result.monDestino} ${result.retornoNetoFinal}` : '0.00'}
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
                  ? `Spread muy bajo o nulo (${result.spreadNetoPorcentaje}%). Ojo con la volatilidad.`
                  : `Operación inviable. Pérdida del ${Math.abs(parseFloat(result.spreadNetoPorcentaje)).toFixed(2)}%.`)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
