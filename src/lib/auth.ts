import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const COOKIE_NAME = 'ams_token';

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
}

/** Sign a session token (7-day expiry). */
export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/** Verify a token; returns null on failure. */
export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

/** Read session from cookies (Server Components / Route Handlers). */
export function getSession(): SessionPayload | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Read session from an incoming request (middleware-style). */
export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export const AUTH_COOKIE = COOKIE_NAME;
