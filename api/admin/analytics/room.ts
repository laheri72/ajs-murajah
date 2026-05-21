import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../../_lib/auth.js";
import { badRequest, json, methodNotAllowed } from "../../_lib/http.js";
import { getSupabaseAdmin } from "../../_lib/supabase.js";
import { firstQueryValue } from "../../_lib/query.js";
import { startOfWeek } from "../../_lib/analytics.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res);
  const session = requireAdmin(req, res);
  if (!session) return;

  const roomId = firstQueryValue(req.query.roomId);
  if (!roomId) return badRequest(res, "roomId is required");

  const weekStart = startOfWeek();
  const { data, error } = await getSupabaseAdmin().rpc("admin_room_analytics", { p_room_id: roomId, p_week_start: weekStart });
  if (error) return badRequest(res, error.message);
  if (!data) return badRequest(res, "Room not found");
  return json(res, 200, data);
}