import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_lib/auth.js";
import { badRequest, json, methodNotAllowed } from "../_lib/http.js";
import { getSupabaseAdmin } from "../_lib/supabase.js";
import { firstQueryValue, parsePositiveInt } from "../_lib/query.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res);
  const session = requireAdmin(req, res);
  if (!session) return;
  const page = parsePositiveInt(req.query.page, 1, { min: 1 });
  const pageSize = parsePositiveInt(req.query.limit, 20, { min: 1, max: 50 });
  const role = firstQueryValue(req.query.role);
  const search = firstQueryValue(req.query.q)?.trim();

  let query = getSupabaseAdmin().from("activity_logs").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (role === "admin" || role === "room") query = query.eq("actor_role", role);
  if (search) query = query.or(`actor_label.ilike.%${search}%,action.ilike.%${search}%`);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await query.range(from, to);
  if (error) return badRequest(res, error.message);
  return json(res, 200, { items: data ?? [], page, pageSize, total: count ?? 0 });
}
