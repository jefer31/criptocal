import { ImageResponse } from 'next/og';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const logoUrl = `${url.origin}/logo.png`;

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            background: '#0a0a1a',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="Logo"
            style={{ width: '70%', height: '70%', objectFit: 'contain' }}
          />
        </div>
      ),
      {
        width: 512,
        height: 512,
      }
    );
  } catch (e) {
    return new NextResponse('Error generating image', { status: 500 });
  }
}
