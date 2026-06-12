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
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '22%',
            overflow: 'hidden',
            background: 'transparent',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="Logo"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      ),
      {
        width: 1024,
        height: 1024,
      }
    );
  } catch (e) {
    return new NextResponse('Error generating image', { status: 500 });
  }
}
