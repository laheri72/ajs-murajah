import type { VercelRequest, VercelResponse } from "@vercel/node";

export function json(res: VercelResponse, status: number, payload: unknown) {
  return res.status(status).json(payload);
}

export function badRequest(res: VercelResponse, message: string) {
  return json(res, 400, { error: message });
}

export function unauthorized(res: VercelResponse) {
  return json(res, 401, { error: "Unauthorized" });
}

export function methodNotAllowed(res: VercelResponse) {
  return json(res, 405, { error: "Method not allowed" });
}

export function readBody<T>(req: VercelRequest): T {
  if (typeof req.body === "string") return JSON.parse(req.body) as T;
  return (req.body ?? {}) as T;
}
