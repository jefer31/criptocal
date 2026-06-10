"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AlertConfigType {
  id?: string;
  pair: string;
  exchange_buy: string;
  exchange_sell: string;
  min_spread: number;
  telegram_chat_id: string;
  is_active: boolean;
}

export default function AlertConfig() {
  const [config, setConfig] = useState<AlertConfigType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Form states
  const [pair, setPair] = useState('BTCUSDT');
  const [exchangeBuy, setExchangeBuy] = useState('binance');
  const [exchangeSell, setExchangeSell] = useState('bybit');
  const [minSpread, setMinSpread] = useState(0.5);
  const [chatId, setChatId] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const fetchSessionAndConfig = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      setUserId(session.user.id);

      // Fetch config from Supabase via our API
      try {
        const res = await fetch('/api/alerts/config', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.config) {
            setConfig(data.config);
            setPair(data.config.pair);
            setExchangeBuy(data.config.exchange_buy);
            setExchangeSell(data.config.exchange_sell);
            setMinSpread(data.config.min_spread);
            setChatId(data.config.telegram_chat_id);
            setIsActive(data.config.is_active);
          }
        }
      } catch (err) {
        console.error("Error cargando configuración", err);
      }
      setLoading(false);
    };

    fetchSessionAndConfig();
  }, []);

  const handleSave = async () => {
    if (!chatId) {
      alert('⚠️ Necesitas ingresar tu Chat ID de Telegram para recibir alertas.');
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const payload = {
        pair,
        exchange_buy: exchangeBuy,
        exchange_sell: exchangeSell,
        min_spread: minSpread,
        telegram_chat_id: chatId,
        is_active: isActive
      };

      const res = await fetch('/api/alerts/config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        alert('✅ Configuración de alertas guardada correctamente.');
      } else {
        const errData = await res.json();
        alert(`❌ Error al guardar: ${errData.error || 'Verifica tu conexión.'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`❌ Hubo un error inesperado al guardar: ${err.message}`);
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando configuración...</div>;
  if (!userId) return <div className="p-8 text-center text-red-400">⚠️ Necesitas iniciar sesión para configurar alertas.</div>;

  return (
    <div className="standard-calc">
      <div className="calc-panel-box">
        <div className="panel-title-bar">
          <span style={{ fontSize: '20px' }}>🔔</span> Configuración de Alertas por Telegram
        </div>
        
        <div className="mb-6 p-4 rounded-lg bg-blue-900 bg-opacity-20 border border-blue-800 text-sm text-blue-200">
          <p className="mb-2 font-bold text-blue-400">🤖 ¿Cómo conecto mi Telegram?</p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Abre Telegram y busca a nuestro bot oficial: <strong>@CriptoCalBot</strong></li>
            <li>Envíale el mensaje <strong>/start</strong></li>
            <li>El bot te responderá con tu <strong>Chat ID</strong> (un número largo).</li>
            <li>Copia ese número y pégalo aquí abajo.</li>
          </ol>
        </div>

        <div className="input-group">
          <label>Telegram Chat ID</label>
          <input 
            type="text" 
            placeholder="Ej: 123456789" 
            value={chatId} 
            onChange={(e) => setChatId(e.target.value)} 
          />
        </div>

        <div className="input-group">
          <label>Activo a Monitorear</label>
          <select value={pair} onChange={(e) => setPair(e.target.value)}>
            <option value="BTCUSDT">Bitcoin (BTC / USDT)</option>
            <option value="ETHUSDT">Ethereum (ETH / USDT)</option>
            <option value="SOLUSDT">Solana (SOL / USDT)</option>
            <option value="BNBUSDT">Binance Coin (BNB / USDT)</option>
            <option value="XRPUSDT">Ripple (XRP / USDT)</option>
          </select>
        </div>

        <div className="input-grid-2">
          <div className="input-group">
            <label>Comprar en (Exchange A)</label>
            <select value={exchangeBuy} onChange={(e) => setExchangeBuy(e.target.value)}>
              <option value="binance">Binance</option>
              <option value="bybit">Bybit</option>
              <option value="okx">OKX</option>
              <option value="bitget">Bitget</option>
              <option value="kucoin">KuCoin</option>
              <option value="mexc">MEXC</option>
            </select>
          </div>
          <div className="input-group">
            <label>Vender en (Exchange B)</label>
            <select value={exchangeSell} onChange={(e) => setExchangeSell(e.target.value)}>
              <option value="bybit">Bybit</option>
              <option value="binance">Binance</option>
              <option value="okx">OKX</option>
              <option value="bitget">Bitget</option>
              <option value="kucoin">KuCoin</option>
              <option value="mexc">MEXC</option>
            </select>
          </div>
        </div>

        <div className="input-group">
          <label>Notificarme si el Spread Neto supera el:</label>
          <div className="input-group-wrapper">
            <input 
              type="number" 
              placeholder="0.5" 
              step="0.1" 
              value={minSpread} 
              onChange={(e) => setMinSpread(parseFloat(e.target.value))} 
            />
            <span className="currency-tag">%</span>
          </div>
        </div>

        <div className="remember-checkbox-container" onClick={() => setIsActive(!isActive)} style={{ marginTop: '20px' }}>
          <input type="checkbox" checked={isActive} readOnly />
          <span>Activar escaneo automático 24/7 (cada 5 min)</span>
        </div>

        <button 
          className="btn-primary" 
          style={{ marginTop: '10px' }} 
          onClick={handleSave} 
          disabled={saving}
        >
          {saving ? 'Guardando...' : '💾 Guardar Configuración de Alerta'}
        </button>
      </div>

      <div className="calc-panel-box">
        <div className="panel-title-bar"><span>ℹ️</span> ¿Cómo funciona el Robot?</div>
        <div className="text-gray-300 text-sm leading-relaxed space-y-4">
          <p>
            Al activar esta función, nuestros servidores en la nube monitorearán los precios de los exchanges que elegiste de forma constante, <strong>incluso cuando tengas la página web cerrada</strong>.
          </p>
          <p>
            Si detectamos que el spread (ganancia bruta) supera tu margen objetivo configurado, te enviaremos una notificación instantánea a tu Telegram para que puedas ejecutar la operación antes de que la oportunidad desaparezca.
          </p>
          <div className="p-3 bg-red-900 bg-opacity-20 border border-red-800 rounded-lg text-red-300 mt-4">
            <strong>⚠️ Nota importante:</strong>
            <p className="mt-1">
              No nos hacemos responsables por demoras en la red o congestiones en los exchanges. Siempre verifica los libros de órdenes y las comisiones de retiro antes de inyectar capital.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
