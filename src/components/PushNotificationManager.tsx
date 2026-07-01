'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
    } else {
      setLoading(false);
    }
  }, []);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
      setLoading(false);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      setLoading(false);
    }
  }

  async function subscribeToPush() {
    try {
      setLoading(true);
      const registration = await navigator.serviceWorker.ready;
      
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) {
        throw new Error("Falta configurar NEXT_PUBLIC_VAPID_PUBLIC_KEY");
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
      
      setSubscription(sub);

      // Obtener el user_id de Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Debes iniciar sesión para activar alertas");
        setLoading(false);
        return;
      }

      // Enviar la suscripción a nuestro backend
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(sub)
      });

      if (!response.ok) {
        throw new Error("No se pudo guardar la suscripción en el servidor");
      }

      toast.success("¡Notificaciones activadas con éxito!");
    } catch (error: any) {
      console.error('Error suscribiendo a push:', error);
      toast.error(error.message || "No se pudieron activar las notificaciones");
    } finally {
      setLoading(false);
    }
  }

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-4 text-center">
        <p className="text-yellow-200 text-sm">Tu navegador no soporta Notificaciones Push o estás en modo incógnito.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg mb-4 flex flex-col items-center justify-center text-center">
      <h3 className="text-lg font-bold mb-2">Notificaciones de Arbitraje (Beta)</h3>
      <p className="text-sm text-gray-400 mb-4">
        {subscription 
          ? "Ya estás recibiendo alertas directamente en tu dispositivo cuando hay oportunidades de ganancia." 
          : "Activa las notificaciones web para recibir alertas de arbitraje en tiempo real, incluso con la app cerrada."}
      </p>
      
      {!subscription ? (
        <button 
          onClick={subscribeToPush}
          disabled={loading}
          className="px-6 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? "Configurando..." : "Activar Notificaciones"}
        </button>
      ) : (
        <span className="text-green-400 font-semibold flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          Notificaciones Activas
        </span>
      )}
    </div>
  );
}
