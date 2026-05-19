import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_lib/auth.js";
import { badRequest, json, methodNotAllowed, readBody } from "../_lib/http.js";
import { getSupabaseAdmin } from "../_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = requireAdmin(req, res);
  if (!session) return;
  const supabase = getSupabaseAdmin();

  if (req.method === "GET") {
    const { data, error } = await supabase.from("targets").select("*, room:rooms(id, name, username, member_count, floor_id, is_active, created_at)").order("updated_at", { ascending: false });
    if (error) return badRequest(res, error.message);
    return json(res, 200, data);
  }

  if (req.method === "POST") {
    const body = readBody<{ room_id?: string; yearly_rub_target?: number; weekly_rub_target?: number; monthly_rub_target?: number | null }>(req);
    if (!body.room_id) return badRequest(res, "Room is required");
    const payload = {
      room_id: body.room_id,
      yearly_rub_target: body.yearly_rub_target ?? 120,
      weekly_rub_target: body.weekly_rub_target ?? 3,
      monthly_rub_target: body.monthly_rub_target ?? null,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from("targets").upsert(payload, { onConflict: "room_id" }).select("*").single();
    if (error) return badRequest(res, error.message);
    await supabase.from("activity_logs").insert({ actor_role: "admin", actor_id: session.id, actor_label: session.displayName, room_id: body.room_id, action: "target_updated", details: payload });
    return json(res, 200, data);
  }

  return methodNotAllowed(res);
}
