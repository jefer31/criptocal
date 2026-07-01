'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      // Guardar el código de referido en localStorage
      // Usaremos esto luego cuando el usuario se registre o haga clic en un enlace de exchange
      localStorage.setItem('criptocal_ref', ref);
    }
  }, [searchParams]);

  return null;
}
