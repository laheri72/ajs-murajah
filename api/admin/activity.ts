import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_lib/auth";
import { badRequest, json, methodNotAllowed } from "../_lib/http";
import { getSupabaseAdmin } from "../_lib/supabase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res);
  const session = requireAdmin(req, res);
  if (!session) return;
  const { data, error } = await getSupabaseAdmin().from("activity_logs").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) return badRequest(res, error.message);
  return json(res, 200, data);
}
