import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSession } from "../_lib/auth";
import { json, methodNotAllowed } from "../_lib/http";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res);
  return json(res, 200, { user: getSession(req) });
}
