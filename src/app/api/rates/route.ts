import { NextResponse } from 'next/server';

// Revalidar cada 60 segundos (1 minuto) para no saturar la API externa
export const revalidate = 60;

export async function GET() {
  try {
    const response = await fetch('https://ve.dolarapi.com/v1/dolares', {
      next: { revalidate: 60 } // Next.js cache strategy
    });

    if (!response.ok) {
      throw new Error(`Error fetching rates: ${response.statusText}`);
    }

    const data = await response.json();
    
    // La API devuelve un array con varios orígenes. 
    // Buscamos 'oficial' (BCV) y 'paralelo' (Binance / Monitor)
    const bcv = data.find((item: any) => item.fuente === 'oficial')?.promedio || null;
    const paralelo = data.find((item: any) => item.fuente === 'paralelo')?.promedio || null;
    const date = data.find((item: any) => item.fuente === 'oficial')?.fechaActualizacion || new Date().toISOString();

    return NextResponse.json({
      bcv: bcv,
      paralelo: paralelo,
      lastUpdate: date
    });
  } catch (error: any) {
    console.error('Error in /api/rates:', error.message);
    return NextResponse.json({ error: 'Failed to fetch VES rates' }, { status: 500 });
  }
}
