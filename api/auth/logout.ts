import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clearSessionCookie } from "../_lib/auth.js";
import { json, methodNotAllowed } from "../_lib/http.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res);
  clearSessionCookie(res);
  return json(res, 200, { ok: true });
}
