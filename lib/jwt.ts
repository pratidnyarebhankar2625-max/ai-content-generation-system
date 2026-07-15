"use client";

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// ─── Constants ───────────────────────────────────────────────────────────────
// In production, this would come from process.env.SESSION_SECRET
const SECRET_KEY = "ai-content-studio-jwt-secret-key-2025";
const encodedKey = new TextEncoder().encode(SECRET_KEY);

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  name: string;
  expiresAt: number;
}

// ─── JWT Utilities ───────────────────────────────────────────────────────────

/**
 * Create a signed JWT token.
 * @param payload - Data to encode in the token
 * @param expiresIn - Expiration time string (e.g. "24h", "30d")
 */
export async function createToken(
  payload: Omit<SessionPayload, "expiresAt">,
  expiresIn: string = "24h"
): Promise<string> {
  const expiresAt = calculateExpiry(expiresIn);

  return new SignJWT({ ...payload, expiresAt } as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(encodedKey);
}

/**
 * Verify a JWT token and return the decoded payload.
 * Returns null if the token is invalid or expired.
 */
export async function verifyToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Check if a token is expired without full verification.
 */
export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;

    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return true;

    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calculateExpiry(expiresIn: string): number {
  const now = Date.now();
  const match = expiresIn.match(/^(\d+)(h|d|m|s)$/);
  if (!match) return now + 24 * 60 * 60 * 1000; // default 24h

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return now + value * 1000;
    case "m":
      return now + value * 60 * 1000;
    case "h":
      return now + value * 60 * 60 * 1000;
    case "d":
      return now + value * 24 * 60 * 60 * 1000;
    default:
      return now + 24 * 60 * 60 * 1000;
  }
}
