import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_lib/auth.js";
import { startOfWeek } from "../_lib/analytics.js";
import { badRequest, json, methodNotAllowed } from "../_lib/http.js";
import { getSupabaseAdmin } from "../_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res);
  const session = requireAdmin(req, res);
  if (!session) return;
  const weekStart = startOfWeek();
  const { data, error } = await getSupabaseAdmin().rpc("admin_dashboard_summary", { week_start: weekStart });
  if (error) return badRequest(res, error.message);
  return json(res, 200, data);
}
