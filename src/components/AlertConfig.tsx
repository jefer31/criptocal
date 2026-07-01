"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { isVipAdmin } from '@/lib/admin';
import toast from 'react-hot-toast';

interface AlertConfigType {
  id?: string;
  pair: string;
  exchange_buy: string;
  exchange_sell: string;
  min_spread: number;
  telegram_chat_id: string;
  is_active: boolean;
}

const PAIRS = [
  { value: 'BTCUSDT', label: '₿ Bitcoin (BTC / USDT)' },
  { value: 'ETHUSDT', label: 'Ξ Ethereum (ETH / USDT)' },
  { value: 'SOLUSDT', label: '◎ Solana (SOL / USDT)' },
  { value: 'XRPUSDT', label: '✕ Ripple (XRP / USDT)' },
  { value: 'BNBUSDT', label: '◆ Binance Coin (BNB / USDT)' },
  { value: 'ADAUSDT', label: '♦ Cardano (ADA / USDT)' },
  { value: 'DOGEUSDT', label: 'Ð Dogecoin (DOGE / USDT)' },
  { value: 'TRXUSDT', label: '✧ TRON (TRX / USDT)' },
  { value: 'TONUSDT', label: '💎 Toncoin (TON / USDT)' },
  { value: 'DOTUSDT', label: '● Polkadot (DOT / USDT)' },
  { value: 'MATICUSDT', label: '⬟ Polygon (MATIC / USDT)' },
  { value: 'LTCUSDT', label: 'Ł Litecoin (LTC / USDT)' },
  { value: 'SHIBUSDT', label: '🐕 Shiba Inu (SHIB / USDT)' },
  { value: 'BCHUSDT', label: 'Ƀ Bitcoin Cash (BCH / USDT)' },
  { value: 'LINKUSDT', label: '⬡ Chainlink (LINK / USDT)' },
  { value: 'AVAXUSDT', label: '▲ Avalanche (AVAX / USDT)' },
  { value: 'NEARUSDT', label: 'N NEAR Protocol (NEAR / USDT)' },
  { value: 'UNIUSDT', label: '🦄 Uniswap (UNI / USDT)' },
  { value: 'ATOMUSDT', label: '⚛ Cosmos (ATOM / USDT)' },
  { value: 'XLMUSDT', label: '★ Stellar (XLM / USDT)' },
  { value: 'PEPEUSDT', label: '🐸 Pepe (PEPE / USDT)' },
  { value: 'ICPUSDT', label: '∞ Internet Computer (ICP / USDT)' },
  { value: 'FILUSDT', label: '⨎ Filecoin (FIL / USDT)' },
  { value: 'ETCUSDT', label: 'ξ Ethereum Classic (ETC / USDT)' },
  { value: 'APTUSDT', label: 'Aptos (APT / USDT)' },
  { value: 'STXUSDT', label: 'Stacks (STX / USDT)' },
  { value: 'IMXUSDT', label: 'Immutable (IMX / USDT)' },
  { value: 'OPUSDT', label: 'Optimism (OP / USDT)' },
  { value: 'INJUSDT', label: 'Injective (INJ / USDT)' },
  { value: 'RNDRUSDT', label: 'Render (RNDR / USDT)' },
  { value: 'WIFUSDT', label: 'dogwifhat (WIF / USDT)' },
  { value: 'ARBUSDT', label: 'Arbitrum (ARB / USDT)' },
  { value: 'MNTUSDT', label: 'Mantle (MNT / USDT)' },
  { value: 'CROUSDT', label: 'Cronos (CRO / USDT)' },
  { value: 'VETUSDT', label: 'VeChain (VET / USDT)' },
  { value: 'MKRUSDT', label: 'Maker (MKR / USDT)' },
  { value: 'GRTUSDT', label: 'The Graph (GRT / USDT)' },
  { value: 'LDOUSDT', label: 'Lido DAO (LDO / USDT)' },
  { value: 'TIAUSDT', label: 'Celestia (TIA / USDT)' },
  { value: 'RUNEUSDT', label: 'THORChain (RUNE / USDT)' },
  { value: 'ARUSDT', label: 'Arweave (AR / USDT)' },
  { value: 'THETAUSDT', label: 'Theta Network (THETA / USDT)' },
  { value: 'FTMUSDT', label: 'Fantom (FTM / USDT)' },
  { value: 'AAVEUSDT', label: 'Aave (AAVE / USDT)' },
  { value: 'ALGOUSDT', label: 'Algorand (ALGO / USDT)' },
  { value: 'FLOKIUSDT', label: 'Floki (FLOKI / USDT)' },
  { value: 'QNTUSDT', label: 'Quant (QNT / USDT)' },
];

const EXCHANGES = [
  { value: 'binance', label: 'Binance' },
  { value: 'bybit', label: 'Bybit' },
  { value: 'okx', label: 'OKX' },
  { value: 'bitget', label: 'Bitget' },
];

const EXCHANGE_LABELS: Record<string, string> = {};
EXCHANGES.forEach(e => { EXCHANGE_LABELS[e.value] = e.label; });

const MAX_ALERTS = 5;

export default function AlertConfig({ isPremium = false, onUpgrade }: { isPremium?: boolean; onUpgrade?: () => void }) {
  const [alerts, setAlerts] = useState<AlertConfigType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [pair, setPair] = useState('BTCUSDT');
  const [exchangeBuy, setExchangeBuy] = useState('binance');
  const [exchangeSell, setExchangeSell] = useState('bybit');
  const [minSpread, setMinSpread] = useState<number | ''>(0.5);
  const [chatId, setChatId] = useState('');
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setPair('BTCUSDT');
    setExchangeBuy('binance');
    setExchangeSell('bybit');
    setMinSpread(0.5);
    setIsActive(true);
    setEditingId(null);
  };

  useEffect(() => {
    const fetchSessionAndConfig = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      setUserId(session.user.id);
      setUserEmail(session.user.email ?? null);

      try {
        const res = await fetch('/api/alerts/config', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.configs) {
            setAlerts(data.configs);
            // Pre-fill chatId from first alert if available
            if (data.configs.length > 0 && !chatId) {
              setChatId(data.configs[0].telegram_chat_id);
            }
          } else if (data.config) {
            // Backward compat
            setAlerts([data.config]);
            setChatId(data.config.telegram_chat_id);
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
    const isVipAdminSave = isVipAdmin(userEmail);
    if (!isPremium && !isVipAdminSave) {
      toast.error('Las alertas automáticas son una función PRO. Actualiza tu plan para activarlas.');
      onUpgrade?.();
      return;
    }
    if (!chatId) {
      toast.error('Necesitas ingresar tu Chat ID de Telegram para recibir alertas.');
      return;
    }
    if (exchangeBuy === exchangeSell) {
      toast.error('El exchange de compra y el de venta deben ser diferentes.');
      return;
    }
    const numSpread = typeof minSpread === 'string' ? parseFloat(minSpread) : minSpread;
    if (isNaN(numSpread) || numSpread <= 0) {
      toast.error('El spread mínimo debe ser un porcentaje positivo (ej: 0.5%).');
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const payload: any = {
        pair,
        exchange_buy: exchangeBuy,
        exchange_sell: exchangeSell,
        min_spread: numSpread,
        telegram_chat_id: chatId,
        is_active: isActive
      };

      if (editingId) {
        payload.id = editingId;
      }

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
        if (editingId) {
          setAlerts(prev => prev.map(a => a.id === editingId ? data.config : a));
          toast.success('Alerta actualizada correctamente.');
        } else {
          setAlerts(prev => [...prev, data.config]);
          toast.success('Alerta creada correctamente.');
        }
        resetForm();
        setShowForm(false);
      } else {
        const errData = await res.json();
        toast.error(`Error: ${errData.error || 'Verifica tu conexión.'}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Error inesperado: ${err.message}`);
    }
    setSaving(false);
  };

  const handleDelete = async (alertId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/alerts/config?id=${alertId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (res.ok) {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
        toast.success('Alerta eliminada.');
      } else {
        toast.error('Error al eliminar la alerta.');
      }
    } catch (err) {
      toast.error('Error de conexión.');
    }
  };

  const handleEdit = (alert: AlertConfigType) => {
    setPair(alert.pair);
    setExchangeBuy(alert.exchange_buy);
    setExchangeSell(alert.exchange_sell);
    setMinSpread(alert.min_spread);
    setChatId(alert.telegram_chat_id);
    setIsActive(alert.is_active);
    setEditingId(alert.id || null);
    setShowForm(true);
  };

  const toggleActive = async (alert: AlertConfigType) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/alerts/config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ...alert,
          id: alert.id,
          is_active: !alert.is_active
        })
      });

      if (res.ok) {
        setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, is_active: !a.is_active } : a));
        toast.success(alert.is_active ? 'Alerta pausada.' : 'Alerta activada.');
      }
    } catch (err) {
      toast.error('Error al cambiar estado.');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando configuración...</div>;
  if (!userId) return <div className="p-8 text-center text-red-400">⚠️ Necesitas iniciar sesión para configurar alertas.</div>;

  const isVipAdminCheck = isVipAdmin(userEmail);
  
  if (!isPremium && !isVipAdminCheck) {
    return (
      <div className="standard-calc">
        <div className="calc-panel-box" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔒</div>
          <h3 style={{ marginBottom: '10px' }}>Función PRO: Alertas Automáticas por Telegram</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.6' }}>
            Con PRO, nuestros servidores escanean los exchanges 24/7 y te envían alertas instantáneas a Telegram cuando detectan spreads rentables.
          </p>
          <button className="btn-primary" onClick={() => onUpgrade?.()}>
            🚀 Desbloquear Alertas PRO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="standard-calc">
      {/* Telegram Instructions */}
      <div className="calc-panel-box">
        <div className="panel-title-bar">
          <span style={{ fontSize: '20px' }}>🔔</span> Alertas Automáticas por Telegram
        </div>
        
        <div className="mb-6 p-4 rounded-lg bg-blue-900 bg-opacity-20 border border-blue-800 text-sm text-blue-200">
          <p className="mb-3 font-bold text-blue-400">🤖 ¿Cómo conecto mi Telegram?</p>
          <div className="mb-4">
            <a href="https://t.me/CriptoCal_bot" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition-all text-decoration-none">
              <span>🚀</span> Abrir Telegram y Enlazar Bot
            </a>
          </div>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Haz clic en el botón azul de arriba.</li>
            <li>Se abrirá Telegram, presiona <strong>"Iniciar"</strong> o envía el comando <strong>/start</strong>.</li>
            <li>El bot te responderá automáticamente con tu <strong>Chat ID</strong> (un número largo).</li>
            <li>Copia ese número y pégalo aquí abajo.</li>
          </ol>
        </div>

        <div className="input-group">
          <label>Telegram Chat ID (compartido entre todas tus alertas)</label>
          <input 
            type="text" 
            placeholder="Ej: 123456789" 
            value={chatId} 
            onChange={(e) => setChatId(e.target.value)} 
          />
        </div>
      </div>

      {/* Saved Alerts List */}
      <div className="calc-panel-box">
        <div className="panel-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><span>📋</span> Mis Alertas ({alerts.length}/{MAX_ALERTS})</div>
          {alerts.length < MAX_ALERTS && (
            <button 
              className="btn-save-route" 
              onClick={() => { resetForm(); setShowForm(!showForm); }}
              type="button"
            >
              {showForm ? '✕ Cancelar' : '＋ Nueva Alerta'}
            </button>
          )}
        </div>

        {alerts.length === 0 && !showForm && (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>📡</div>
            <p>No tienes alertas configuradas todavía.</p>
            <button 
              className="btn-primary" 
              style={{ marginTop: '15px' }}
              onClick={() => { resetForm(); setShowForm(true); }}
            >
              ＋ Crear mi primera alerta
            </button>
          </div>
        )}

        {/* Alert cards */}
        {alerts.map((alert) => (
          <div key={alert.id} style={{
            background: 'rgba(0,0,0,0.2)',
            border: `1px solid ${alert.is_active ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255,255,255,0.05)'}`,
            borderRadius: '10px',
            padding: '15px',
            marginBottom: '10px',
            opacity: alert.is_active ? 1 : 0.6,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>
                  {alert.is_active ? '🟢' : '⏸️'} {alert.pair.replace('USDT', ' / USDT')}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {EXCHANGE_LABELS[alert.exchange_buy] || alert.exchange_buy} → {EXCHANGE_LABELS[alert.exchange_sell] || alert.exchange_sell} &nbsp;|&nbsp; Min: {alert.min_spread}%
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => toggleActive(alert)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}
                  title={alert.is_active ? 'Pausar' : 'Activar'}
                >
                  {alert.is_active ? '⏸️' : '▶️'}
                </button>
                <button
                  onClick={() => handleEdit(alert)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(alert.id!)}
                  style={{ background: 'rgba(255, 82, 82, 0.1)', border: '1px solid rgba(255, 82, 82, 0.2)', borderRadius: '6px', padding: '6px 10px', color: 'var(--danger)', cursor: 'pointer', fontSize: '12px' }}
                  title="Eliminar"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Create/Edit Form */}
        {showForm && (
          <div style={{ background: 'rgba(0, 173, 181, 0.05)', border: '1px solid rgba(0, 173, 181, 0.15)', borderRadius: '10px', padding: '20px', marginTop: '10px' }}>
            <h4 style={{ margin: '0 0 15px 0', color: 'var(--primary)', fontSize: '14px' }}>
              {editingId ? '✏️ Editar Alerta' : '✨ Nueva Alerta'}
            </h4>

            <div className="input-group">
              <label>Activo a Monitorear</label>
              <select value={pair} onChange={(e) => setPair(e.target.value)}>
                {PAIRS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            <div className="input-grid-2">
              <div className="input-group">
                <label>Comprar en (Exchange A)</label>
                <select value={exchangeBuy} onChange={(e) => setExchangeBuy(e.target.value)}>
                  {EXCHANGES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Vender en (Exchange B)</label>
                <select value={exchangeSell} onChange={(e) => setExchangeSell(e.target.value)}>
                  {EXCHANGES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
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
                  onChange={(e) => setMinSpread(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                />
                <span className="currency-tag">%</span>
              </div>
            </div>

            <div className="remember-checkbox-container" onClick={() => setIsActive(!isActive)} style={{ marginTop: '10px' }}>
              <input type="checkbox" checked={isActive} readOnly />
              <span>Activar escaneo automático 24/7 (cada 5 min)</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button 
                className="btn-primary" 
                style={{ flex: 1 }}
                onClick={handleSave} 
                disabled={saving}
              >
                {saving ? 'Guardando...' : (editingId ? '💾 Actualizar Alerta' : '💾 Guardar Nueva Alerta')}
              </button>
              <button 
                className="btn-secondary" 
                style={{ padding: '12px 20px' }}
                onClick={() => { resetForm(); setShowForm(false); }}
                type="button"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="calc-panel-box">
        <div className="panel-title-bar"><span>ℹ️</span> ¿Cómo funciona el Robot?</div>
        <div className="text-gray-300 text-sm leading-relaxed space-y-4">
          <p>
            Al activar esta función, nuestros servidores en la nube monitorearán los precios de los exchanges que elegiste de forma constante, <strong>incluso cuando tengas la página web cerrada</strong>.
          </p>
          <p>
            Puedes crear hasta <strong>{MAX_ALERTS} alertas simultáneas</strong> con diferentes pares y rutas de exchanges. Cada alerta se escanea independientemente cada 5 minutos.
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
