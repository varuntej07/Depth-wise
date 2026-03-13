import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Depthwise – Explore Any Topic as a Knowledge Tree';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #050D0B 0%, #0D1A16 50%, #050D0B 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background g`low */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)',
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #10b981, #34d399)',
            marginBottom: '32px',
          }}
        >
          {/* Simple tree/network icon using divs */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#04120e' }} />
            <div style={{ display: 'flex', gap: '18px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#04120e' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#04120e' }} />
            </div>
          </div>
        </div>

        {/* Brand name */}
        <div
          style={{
            fontSize: '72px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-2px',
            marginBottom: '20px',
          }}
        >
          Depthwise
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '32px',
            color: 'rgba(255,255,255,0.65)',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.3,
          }}
        >
          Explore Any Topic as a Knowledge Tree
        </div>

        {/* Bottom accent bar */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '4px',
            background: 'linear-gradient(90deg, transparent, #10b981, #34d399, transparent)',
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
