import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';

export interface RequestContext {
  clientId: string | null;
  ipAddress: string | null;
  ipHash: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  userAgent: string | null;
}

function sanitizeValue(value: string | null | undefined, maxLength = 255): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
}

function getClientIp(request: NextRequest): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }

  return (
    sanitizeValue(request.headers.get('x-real-ip'), 120) ||
    sanitizeValue(request.headers.get('cf-connecting-ip'), 120) ||
    sanitizeValue(request.headers.get('x-vercel-forwarded-for'), 120)
  );
}

function hashIp(ipAddress: string | null): string | null {
  if (!ipAddress) {
    return null;
  }

  // Stable salted hash preserves cohorting while avoiding plain-IP dependence in analytics queries.
  const hashSalt =
    process.env.IP_HASH_SALT ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'depthwise-default-ip-salt';

  return createHash('sha256').update(`${hashSalt}:${ipAddress}`).digest('hex');
}

function getCountry(request: NextRequest): string | null {
  return (
    sanitizeValue(request.headers.get('x-vercel-ip-country'), 8) ||
    sanitizeValue(request.headers.get('cf-ipcountry'), 8)
  );
}

function getRegion(request: NextRequest): string | null {
  return sanitizeValue(request.headers.get('x-vercel-ip-country-region'), 16);
}

function getCity(request: NextRequest): string | null {
  return sanitizeValue(request.headers.get('x-vercel-ip-city'), 120);
}

export function getRequestContext(request: NextRequest, clientId?: unknown): RequestContext {
  const ipAddress = getClientIp(request);

  return {
    clientId: typeof clientId === 'string' ? sanitizeValue(clientId, 128) : null,
    ipAddress,
    ipHash: hashIp(ipAddress),
    country: getCountry(request),
    region: getRegion(request),
    city: getCity(request),
    userAgent: sanitizeValue(request.headers.get('user-agent'), 500),
  };
}
