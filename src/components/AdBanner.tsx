import React from 'react';

interface AdBannerProps {
  placement?: 'top' | 'bottom' | 'sidebar';
  onUpgrade?: () => void;
}

const AdBanner: React.FC<AdBannerProps> = ({ placement = 'top', onUpgrade }) => {
  return (
    <div className={`ad-banner-container placement-${placement}`} style={{
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '8px',
      padding: '10px',
      margin: '15px 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--text-muted)', opacity: 0.7 }}>
        Publicidad
      </div>
      
      {/* A-Ads Real Ad Unit */}
      <div id="frame" style={{ width: '100%', maxWidth: '728px', margin: 'auto', zIndex: 99998, height: 'auto', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
        <iframe 
          data-aa="2443961" 
          src="//ad.a-ads.com/2443961/?size=728x90"
          style={{ border: 0, padding: 0, width: '728px', maxWidth: '100%', height: '90px', overflow: 'hidden', display: 'block', margin: 'auto' }}
          title="Crypto Advertisement"
        ></iframe>
      </div>

      <button onClick={onUpgrade} style={{
        marginTop: '10px',
        padding: '6px 12px',
        backgroundColor: 'transparent',
        color: 'var(--text-muted)',
        border: '1px solid var(--text-muted)',
        borderRadius: '4px',
        fontSize: '11px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onMouseOver={(e) => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
      onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
      >
        Ocultar anuncios (Hazte PRO)
      </button>
    </div>
  );
};

export default AdBanner;
