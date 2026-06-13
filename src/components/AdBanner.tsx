import React from 'react';

interface AdBannerProps {
  placement?: 'top' | 'bottom' | 'sidebar';
  onUpgrade?: () => void;
}

const AdBanner: React.FC<AdBannerProps> = ({ placement = 'top', onUpgrade }) => {
  return (
    <div className={`ad-banner-container placement-${placement}`} style={{
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px dashed rgba(255, 255, 255, 0.2)',
      borderRadius: '8px',
      padding: '20px',
      margin: '15px 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      color: 'var(--text-muted)'
    }}>
      <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', opacity: 0.7 }}>
        Publicidad
      </div>
      <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-color)' }}>
        [ Espacio Reservado para Anuncios ]
      </div>
      <p style={{ fontSize: '13px', marginTop: '5px', maxWidth: '400px' }}>
        Este espacio generará ingresos pasivos mostrando anuncios a los usuarios del plan gratuito. 
        Los usuarios PRO no verán esto.
      </p>
      <button onClick={onUpgrade} style={{
        marginTop: '15px',
        padding: '8px 16px',
        backgroundColor: 'var(--primary)',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        cursor: 'pointer'
      }}>
        Eliminar anuncios (Hazte PRO)
      </button>
    </div>
  );
};

export default AdBanner;
