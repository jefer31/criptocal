"use client";
export const dynamic = "force-dynamic";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../lib/supabase';
import Dashboard from '../components/Dashboard';
import SpreadScanner from '../components/SpreadScanner';
import HistoryTable from '../components/HistoryTable';
import MathCalculator from '../components/MathCalculator';
import ProfileSettings from '../components/ProfileSettings';
import AlertConfig from '../components/AlertConfig';
import AdBanner from '../components/AdBanner';
import PricingModal from '../components/PricingModal';
import VenezuelaRates from '../components/VenezuelaRates';

export default function Home() {
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [activeTab, setActiveTab] = useState('calculadora');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      // Restore remember-me email
      const savedEmail = localStorage.getItem('rememberedEmail');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
      
      // ANONYMOUS 7-DAY TRIAL LOGIC
      const firstVisit = localStorage.getItem('criptocal_first_visit');
      if (!firstVisit) {
        localStorage.setItem('criptocal_first_visit', Date.now().toString());
        setTrialDaysLeft(7);
      } else {
        const firstVisitDate = parseInt(firstVisit, 10);
        const daysElapsed = Math.floor((Date.now() - firstVisitDate) / (1000 * 60 * 60 * 24));
        const daysLeft = Math.max(0, 7 - daysElapsed);
        setTrialDaysLeft(daysLeft);
        
        // Block if 7 days passed AND user is not logged in
        if (daysLeft === 0) {
          setShowTrialExpiredModal(true);
        }
      }
    }

    const checkAndSetTrial = async (sessionUser: any) => {
      if (!sessionUser) {
        setUser(null);
        return;
      }
      
      setUser(sessionUser);
      setShowTrialExpiredModal(false); // If logged in, never show the anonymous trial block
      
      // Si es un usuario nuevo y no tiene configurado el fin de prueba, le damos 7 días
      if (!sessionUser.user_metadata?.trial_ends_at) {
        const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: updatedUser } = await supabase.auth.updateUser({
          data: { trial_ends_at: trialEndsAt, is_premium: false }
        });
        if (updatedUser?.user) {
          setUser(updatedUser.user);
        }
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAndSetTrial(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAndSetTrial(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Update expired modal visibility if user logs out while time is expired
  useEffect(() => {
    if (isClient && !user && trialDaysLeft === 0) {
      setShowTrialExpiredModal(true);
    }
  }, [user, trialDaysLeft, isClient]);

  const [currentTime, setCurrentTime] = useState('Cargando fecha...');
  
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });
      const dateStr = now.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      setCurrentTime(`${timeStr} | ${dateStr}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAuth = async () => {
    if (authLoading) return;
    setAuthError('');
    setAuthLoading(true);

    try {
      if (isLoginMode) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setAuthError(error.message);
        } else {
          // Handle remember-me
          if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
          } else {
            localStorage.removeItem('rememberedEmail');
          }
          setShowAuthModal(false);
          setShowTrialExpiredModal(false);
        }
      } else {
        if (!username || !phone) {
          setAuthError('Nombre de usuario y teléfono son obligatorios');
          setAuthLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              username: username,
              phone: `${countryCode} ${phone}`
            }
          }
        });
        if (error) {
          setAuthError(error.message);
        } else {
          setAuthError('¡Revisa tu correo para confirmar tu cuenta!');
        }
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      setAuthError(error.message);
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setAuthError('Ingresa tu correo primero para restablecer la contraseña.');
      return;
    }
    setAuthLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setAuthLoading(false);
    if (error) {
      setAuthError(error.message);
    } else {
      setAuthError('✅ Revisa tu correo — te enviamos un enlace para restablecer tu contraseña.');
    }
  };

  const isFreeUser = user && !user.user_metadata?.is_premium;

  return (
    <>
      
{showTerms && (
<div className="terms-modal-overlay" id="termsModal" style={{ zIndex: 9999, display: 'flex' }}>
    <div className="terms-modal-card" style={{ maxWidth: '650px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div className="panel-title-bar" >
            <span>⚖️ Términos, Privacidad y Política de Cookies</span>
        </div>
        <div className="terms-modal-body" style={{ textAlign: 'left', fontSize: '14px', lineHeight: '1.6' }}>
            <h3>1. Naturaleza de la Aplicación y Riesgos</h3>
            <p>CriptoCal es una herramienta estrictamente matemática diseñada para la simulación financiera y el cálculo de spreads. <strong>No constituye asesoramiento financiero</strong> ni una invitación a invertir. El mercado de criptomonedas presenta una alta volatilidad, riesgos de liquidez, y variaciones en comisiones de red. El usuario asume total responsabilidad por cualquier operación ejecutada en plataformas externas.</p>
            <h3>2. Privacidad y Seguridad de Datos (Cloud)</h3>
            <p>La plataforma almacena tu información de perfil, configuraciones e historial de cálculos de manera segura en la nube (a través de infraestructura de Supabase). Al usar inicio de sesión con Google o correo, autorizas el almacenamiento cifrado de tu identidad básica para garantizar el acceso multiplataforma.</p>
            <h3>3. Política de Cookies</h3>
            <p>Utilizamos <strong>únicamente cookies técnicas y de sesión</strong> (como tokens JWT) estrictamente necesarias para mantener tu sesión activa y guardar tus preferencias de interfaz (ej. aceptación de estos términos). No utilizamos cookies de rastreo de terceros ni vendemos tu información a agencias de publicidad.</p>
            <h3>4. Modificaciones del Servicio</h3>
            <p>El desarrollador se reserva el derecho de modificar o suspender el servicio de cálculos, así como las conexiones a las APIs de exchanges de terceros (como Binance o KuCoin) sin previo aviso si sus políticas cambian.</p>
        </div>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', padding: '0 24px 24px' }}>
            <button className="btn-secondary" onClick={() => setShowTerms(false)} >Entendido y Acepto las Políticas</button>
        </div>
    </div>
</div>
)}

{showTrialExpiredModal && (
<div className="terms-modal-overlay" style={{ zIndex: 9999, display: 'flex', background: 'rgba(10, 10, 26, 0.95)', backdropFilter: 'blur(10px)' }}>
    <div className="terms-modal-card" style={{ maxWidth: '500px', textAlign: 'center', padding: '40px 30px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
        <h2 style={{ fontSize: '24px', marginBottom: '15px', color: 'var(--text-color)' }}>Tu prueba de 7 días ha finalizado</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px', lineHeight: '1.6' }}>
            Esperamos que hayas descubierto grandes oportunidades de arbitraje. Para seguir utilizando CriptoCal y acceder a tus historiales, debes crear una cuenta gratuita.
        </p>
        <button className="btn-primary" onClick={() => { setShowAuthModal(true); setIsLoginMode(false); }} style={{ width: '100%', marginBottom: '15px', padding: '15px' }}>
            Registrarse Gratis
        </button>
        <button className="btn-secondary" onClick={() => { setShowAuthModal(true); setIsLoginMode(true); }} style={{ width: '100%', padding: '15px' }}>
            Ya tengo una cuenta
        </button>
    </div>
</div>
)}

<div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} id="sidebarOverlay" onClick={() => setIsSidebarOpen(false)}></div>

{showAuthModal && (<div className="welcome-screen" id="welcomeScreen" style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 10000, background: 'rgba(0,0,0,0.85)'}}>
    <div className="portada-card" onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') handleAuth(); }}>
        <button onClick={() => setShowAuthModal(false)} style={{position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', zIndex: 10}}>✕</button>
        <div className="logo-area">
            <div className="login-logo-wrapper">
              <Image src="/logo.png" alt="CriptoCal Logo" width={64} height={64} className="login-logo-img" priority />
            </div>
            <h1 id="portadaTitle">{isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta'}</h1>
            <p id="portadaDesc">Calculadora de Arbitraje Cripto Profesional</p>
        </div>

        <div className="form-group">
            <label>Correo Electrónico</label>
            <input type="email" id="loginEmail" placeholder="nombre@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        {!isLoginMode && (
            <>
                <div className="form-group">
                    <label>Nombre de Usuario</label>
                    <input type="text" placeholder="Tu Apodo (Ej: CryptoTrader)" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Teléfono Celular</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} style={{ width: '100px', backgroundColor: 'var(--bg-dark)', color: 'var(--text-color)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '10px' }}>
                            <option value="+1">🇺🇸/🇨🇦 +1</option>
                            <option value="+58">🇻🇪 +58</option>
                            <option value="+57">🇨🇴 +57</option>
                            <option value="+54">🇦🇷 +54</option>
                            <option value="+52">🇲🇽 +52</option>
                            <option value="+56">🇨🇱 +56</option>
                            <option value="+51">🇵🇪 +51</option>
                            <option value="+55">🇧🇷 +55</option>
                            <option value="+34">🇪🇸 +34</option>
                            <option value="+44">🇬🇧 +44</option>
                            <option value="+49">🇩🇪 +49</option>
                        </select>
                        <input type="tel" placeholder="234 567 8900" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ flex: 1 }} />
                    </div>
                </div>
            </>
        )}

        <div className="form-group">
            <label>Contraseña</label>
            <div className="password-container">
                <input type={showPassword ? 'text' : 'password'} id="loginPassword" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className="toggle-password-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? '🙈' : '👁️'}
                </button>
            </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
          <label className="remember-checkbox-container" id="rememberMeContainer" style={{ marginBottom: 0 }}>
              <input 
                type="checkbox" 
                id="chkRememberMe" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Recordar mis datos</span>
          </label>
          {isLoginMode && (
            <span 
              onClick={handleForgotPassword}
              style={{ fontSize: '12px', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
            >
              ¿Olvidaste tu contraseña?
            </span>
          )}
        </div>

        <button className="btn-primary" id="btnSubmitPortada" onClick={handleAuth} disabled={authLoading}>
            {authLoading ? (
              <><div className="btn-spinner"></div> {isLoginMode ? 'Ingresando...' : 'Creando cuenta...'}</>
            ) : (
              isLoginMode ? 'Ingresar al Sistema' : 'Crear Nueva Cuenta'
            )}
        </button>
        {authError && (
          <p style={{ 
            color: authError.startsWith('✅') ? 'var(--success)' : 'var(--danger)', 
            marginTop: '10px', 
            fontSize: '13px',
            textAlign: 'center'
          }}>
            {authError}
          </p>
        )}

        <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>O</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
        </div>

        <button 
            type="button" 
            onClick={handleGoogleLogin} 
            disabled={authLoading}
            style={{ 
                width: '100%', 
                padding: '12px', 
                backgroundColor: 'white', 
                color: '#333', 
                borderRadius: '8px', 
                border: 'none', 
                fontWeight: 'bold', 
                cursor: authLoading ? 'not-allowed' : 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '10px',
                marginBottom: '20px',
                opacity: authLoading ? 0.7 : 1,
                transition: 'opacity 0.2s ease'
            }}
        >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '20px', height: '20px' }} />
            Continuar con Google
        </button>

        <div className="portada-switch-text" id="portadaSwitchWrapper">
     {isLoginMode ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'} 
     <span onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(''); }} style={{cursor: 'pointer', color: 'var(--neon-blue)', marginLeft: '5px'}}>
       {isLoginMode ? 'Regístrate aquí' : 'Inicia Sesión'}
     </span>
  </div>
    </div>
</div>)}

<div className="mainAppWrapper" id="mainAppWrapper" style={{ display: 'block' }}>
    <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`} id="appSidebar">
        <div className="sidebar-header">
            <div className="sidebar-brand">
              <Image src="/logo.png" alt="Logo" width={28} height={28} style={{ borderRadius: '6px' }} />
              CriptoCal
            </div>
            <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)}>✕</button>
        </div>

        <div className="user-profile-section" id="sidebarUserProfile">
            <img className="sidebar-avatar" id="sidebarAvatar" src={user?.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=150&auto=format&fit=crop"} alt="User Profile" />
            <div className="user-info-meta">
                <span className="user-meta-name" id="sidebarTxtName">{user?.user_metadata?.username || 'Modo Invitado'}</span>
                <span className="user-meta-role" id="sidebarTxtRole">{user?.email || 'Sin cuenta'}</span>
            </div>
        </div>

        <div className="sidebar-menu">
                            <div className={`menu-item ${activeTab === 'calculadora' ? 'active' : ''}`} onClick={() => { setActiveTab('calculadora'); setIsSidebarOpen(false); }}>
                                <span>📈</span> Pro Arbitraje
                            </div>
                            <div className={`menu-item ${activeTab === 'alertas' ? 'active' : ''}`} onClick={() => { setActiveTab('alertas'); setIsSidebarOpen(false); }}>
                                <span>🔔</span> Alertas Bot
                            </div>
                            <div className={`menu-item ${activeTab === 'historial' ? 'active' : ''}`} onClick={() => { 
              if (!user) { setShowAuthModal(true); setIsSidebarOpen(false); return; }
              setActiveTab('historial'); setIsSidebarOpen(false); 
            }}><span>📋</span> Mis Operaciones</div>
            <div className={`menu-item ${activeTab === 'matematica' ? 'active' : ''}`} id="menu-matematica" onClick={() => { setActiveTab('matematica'); setIsSidebarOpen(false); }}>🧮 Calculadora Común</div>
            <div className={`menu-item ${activeTab === 'perfil' ? 'active' : ''}`} id="menu-perfil" onClick={() => { 
              if (!user) { setShowAuthModal(true); setIsSidebarOpen(false); return; }
              setActiveTab('perfil'); setIsSidebarOpen(false); 
            }}>⚙️ Mi Cuenta</div>
            <div className="menu-item" onClick={() => { setShowTerms(true); setIsSidebarOpen(false); }}>⚖️ Términos Legales</div>
        </div>

        <div className="sidebar-footer">
            {user ? (
              <button className="btn-logout" type="button" onClick={handleLogout}>
                  🚪 Cerrar Sesión
              </button>
            ) : (
              <button className="btn-logout" type="button" onClick={() => { setShowAuthModal(true); setIsSidebarOpen(false); }} style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}>
                  👤 Iniciar Sesión / Registro
              </button>
            )}
        </div>
    </div>

    <div className="main-content">
        <div className="content-header">
            <button className="hamburger-btn" id="globalMenuToggle" onClick={() => setIsSidebarOpen(true)}>
                <span></span>
                <span></span>
                <span></span>
            </button>
            <h2 id="mainContentTabTitle">
                {activeTab === 'calculadora' ? 'Calculadora Pro' : activeTab === 'historial' ? 'Historial Local' : activeTab === 'matematica' ? 'Calculadora Común' : activeTab === 'alertas' ? 'Alertas Telegram' : 'Mi Cuenta'}
            </h2>
            <div  id="topHeaderClock">{currentTime}</div>
        </div>

        {isClient && !user && trialDaysLeft !== null && trialDaysLeft > 0 && (
          <div style={{ backgroundColor: 'var(--primary)', color: '#fff', padding: '10px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}>
            Prueba Gratuita: Te quedan {trialDaysLeft} {trialDaysLeft === 1 ? 'día' : 'días'}. ¡Crea una cuenta para no perder el acceso!
          </div>
        )}

        <div id="calculadora-tab" className={`tab-content ${activeTab === 'calculadora' ? 'active' : ''}`}>
            {isFreeUser && <AdBanner placement="top" onUpgrade={() => setShowPricingModal(true)} />}
            <VenezuelaRates />
            <SpreadScanner />
            <Dashboard />
        </div>

        <div id="historial-tab" className={`tab-content ${activeTab === 'historial' ? 'active' : ''}`}>
            {isFreeUser && <AdBanner placement="top" onUpgrade={() => setShowPricingModal(true)} />}
            <HistoryTable />
        </div>

        <div id="matematica-tab" className={`tab-content ${activeTab === 'matematica' ? 'active' : ''}`}>
            {isFreeUser && <AdBanner placement="top" onUpgrade={() => setShowPricingModal(true)} />}
            <MathCalculator />
        </div>

        {showPricingModal && (
          <PricingModal onClose={() => setShowPricingModal(false)} userEmail={user?.email} />
        )}

        <div id="perfil-tab" className={`tab-content ${activeTab === 'perfil' ? 'active' : ''}`}>
            <ProfileSettings />
        </div>

        <div id="alertas-tab" className={`tab-content ${activeTab === 'alertas' ? 'active' : ''}`}>
            {isFreeUser && <AdBanner placement="top" onUpgrade={() => setShowPricingModal(true)} />}
            <AlertConfig />
        </div>

    </div>
</div>



{/* Botón flotante de Telegram */}
<a 
  href="https://t.me/CriptoCal31" 
  target="_blank" 
  rel="noopener noreferrer"
  className="telegram-float-btn"
  style={{
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    backgroundColor: '#0088cc',
    color: '#fff',
    borderRadius: '50%',
    width: '60px',
    height: '60px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 15px rgba(0, 136, 204, 0.4)',
    zIndex: 9998,
    textDecoration: 'none',
    transition: 'all 0.3s ease',
  }}
  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
  title="Únete a la comunidad en Telegram"
>
  <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.18-.08-.05-.19-.02-.27 0-.12.03-1.97 1.25-5.54 3.66-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.29-.48.79-.74 3.08-1.34 5.15-2.23 6.19-2.66 2.95-1.22 3.56-1.43 3.96-1.43.09 0 .28.02.41.11.11.08.15.19.16.29 0 .04.01.12 0 .22z" />
  </svg>
</a>
    </>
  );
}
