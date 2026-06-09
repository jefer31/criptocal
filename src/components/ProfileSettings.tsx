"use client";
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function ProfileSettings() {
    const [avatarUrl, setAvatarUrl] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150&auto=format&fit=crop');
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                const meta = session.user.user_metadata;
                if (meta?.username) setUsername(meta.username);
                if (meta?.phone) setPhone(meta.phone);
                if (meta?.avatar_url) setAvatarUrl(meta.avatar_url);
            }
        };
        fetchProfile();
    }, []);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        
        try {
            setLoading(true);
            setMessage('Subiendo imagen...');
            
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            
            const { error: uploadError, data } = await supabase.storage
                .from('avatars')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            setAvatarUrl(publicUrl);
            
            // Guardar en metadata en lugar de tabla externa
            await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
            setMessage('Imagen actualizada ✅');
        } catch (error: any) {
            setMessage('Error al subir: ' + error.message);
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleUpdate = async () => {
        if (!user) return;
        setLoading(true);
        setMessage('Guardando datos...');

        try {
            // Update profile info in user_metadata
            const { error: profileError } = await supabase.auth.updateUser({
                data: { username, phone }
            });

            if (profileError) throw profileError;

            // Update password if typed
            if (password.length >= 6) {
                const { error: authError } = await supabase.auth.updateUser({ password });
                if (authError) throw authError;
            }

            setMessage('¡Datos guardados en la nube! ✅');
            setPassword('');
        } catch (error: any) {
            setMessage('Error: ' + error.message);
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <div className="profile-settings-container">
            <div className="profile-avatar-management-box">
                <img className="management-avatar-preview" src={avatarUrl} alt="Avatar" />
                <div>
                    <button className="btn-secondary" disabled={loading} onClick={() => fileInputRef.current?.click()}>
                        Cambiar Imagen
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={handleFileSelect} 
                    />
                    <span>Formatos aceptados: PNG, JPG o WEBP.</span>
                </div>
            </div>

            <div className="form-group">
                <label>Nombre de Usuario</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tu Apodo" />
            </div>

            <div className="form-group">
                <label>Número de Teléfono</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 8900" />
            </div>

            <div className="form-group">
                <label>Cambiar Contraseña (Mín. 6 caracteres)</label>
                <div className="password-container">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="••••••••" 
                    />
                    <button type="button" className="toggle-password-btn" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? "🙈" : "👁️"}
                    </button>
                </div>
            </div>

            <button className="btn-primary" onClick={handleUpdate} disabled={loading}>
                {loading ? 'Procesando...' : 'Guardar en la Nube'}
            </button>
            {message && <p style={{ color: message.includes('Error') ? 'red' : 'var(--neon-blue)', marginTop: '10px' }}>{message}</p>}
        </div>
    );
}
