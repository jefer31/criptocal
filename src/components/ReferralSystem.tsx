'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function ReferralSystem({ user }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [binanceRef, setBinanceRef] = useState('');
  const [bitgetRef, setBitgetRef] = useState('');
  const [bybitRef, setBybitRef] = useState('');
  const [okxRef, setOkxRef] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_referrals')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setProfile(data);
        setUsername(data.username || '');
        setBinanceRef(data.binance_ref || '');
        setBitgetRef(data.bitget_ref || '');
        setBybitRef(data.bybit_ref || '');
        setOkxRef(data.okx_ref || '');
      }
    } catch (error) {
      console.error('Error loading referral profile', error);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!username.match(/^[a-zA-Z0-9_]{4,20}$/)) {
      toast.error('El nombre de usuario debe tener entre 4 y 20 caracteres (solo letras, números y _)');
      return;
    }

    setLoading(true);
    try {
      const updates = {
        user_id: user.id,
        username,
        binance_ref: binanceRef,
        bitget_ref: bitgetRef,
        bybit_ref: bybitRef,
        okx_ref: okxRef,
      };

      const { error } = await supabase
        .from('user_referrals')
        .upsert(updates, { onConflict: 'user_id' });

      if (error) {
        if (error.code === '23505') {
          toast.error('Ese nombre de usuario ya está en uso');
        } else {
          toast.error('Error al guardar el perfil: ' + error.message);
        }
      } else {
        toast.success('¡Perfil de referidos guardado!');
        loadProfile();
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const shareLink = typeof window !== 'undefined' ? `${window.location.origin}/?ref=${profile?.username}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success('Enlace copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="card text-center p-4">
        <h2 style={{ marginBottom: '15px' }}>Programa de Marca Blanca</h2>
        <p>Inicia sesión para crear tu enlace de referido y ganar comisiones de los exchanges.</p>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <h2 style={{ marginBottom: '15px', color: 'var(--primary)' }}>🤝 Programa de Referidos</h2>
      <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
        Comparte CriptoCal con tus seguidores. Cuando ellos hagan clic en los botones de "Comprar/Vender en Exchange" dentro de la plataforma, ¡se registrarán con TUS códigos de referido!
      </p>

      {profile && (
        <div style={{ 
          background: 'rgba(56, 189, 248, 0.1)', 
          border: '1px solid var(--primary)', 
          borderRadius: '8px', 
          padding: '15px',
          marginBottom: '25px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Tu enlace para compartir:</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              readOnly 
              value={shareLink} 
              className="input-field" 
              style={{ margin: 0, flex: 1, backgroundColor: 'var(--bg-card)' }}
            />
            <button className="btn-primary" onClick={copyLink} style={{ width: 'auto' }}>
              {copied ? '✅ Copiado' : 'Copiar'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '20px', marginTop: '15px', fontSize: '14px' }}>
            <div>📈 <b>Clics Recibidos:</b> {profile.clicks_received || 0}</div>
            <div>👥 <b>Usuarios Invitados:</b> {profile.users_invited || 0}</div>
          </div>
        </div>
      )}

      <form onSubmit={saveProfile}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
            Tu Usuario CriptoCal (URL única)
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="ej: mario_cripto"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            required
          />
          <small style={{ color: 'var(--text-secondary)' }}>Este será tu identificador en el enlace.</small>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
            ID Referido Binance (Opcional)
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="ej: CPA_00O4X1"
            value={binanceRef}
            onChange={(e) => setBinanceRef(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
            ID Referido Bitget (Opcional)
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="ej: 3A4B5C"
            value={bitgetRef}
            onChange={(e) => setBitgetRef(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
            ID Referido Bybit (Opcional)
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="ej: QWERTY"
            value={bybitRef}
            onChange={(e) => setBybitRef(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
            ID Referido OKX (Opcional)
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="ej: 12345678"
            value={okxRef}
            onChange={(e) => setOkxRef(e.target.value)}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Mis Enlaces'}
        </button>
      </form>
    </div>
  );
}
