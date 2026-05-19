import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parse, serialize } from "cookie";
import jwt from "jsonwebtoken";
import { unauthorized } from "./http.js";

const COOKIE_NAME = "murajah_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

export type SessionPayload =
  | { role: "admin"; id: string; username: string; displayName: string }
  | { role: "room"; id: string; username: string; roomName: string; floorName: string | null };

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("Missing JWT_SECRET");
  return value;
}

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, secret(), { expiresIn: MAX_AGE_SECONDS });
}

export function setSessionCookie(res: VercelResponse, token: string) {
  res.setHeader(
    "Set-Cookie",
    serialize(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.COOKIE_SECURE !== "false",
      path: "/",
      maxAge: MAX_AGE_SECONDS,
    }),
  );
}

export function clearSessionCookie(res: VercelResponse) {
  res.setHeader(
    "Set-Cookie",
    serialize(COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.COOKIE_SECURE !== "false",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    }),
  );
}

export function getSession(req: VercelRequest): SessionPayload | null {
  const token = parse(req.headers.cookie ?? "")[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, secret()) as SessionPayload;
  } catch {
    return null;
  }
}

export function requireAdmin(req: VercelRequest, res: VercelResponse) {
  const session = getSession(req);
  if (session?.role !== "admin") {
    unauthorized(res);
    return null;
  }
  return session;
}

export function requireRoom(req: VercelRequest, res: VercelResponse) {
  const session = getSession(req);
  if (session?.role !== "room") {
    unauthorized(res);
    return null;
  }
  return session;
}
