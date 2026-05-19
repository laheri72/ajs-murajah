import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcryptjs";
import { requireAdmin } from "../_lib/auth.js";
import { badRequest, json, methodNotAllowed, readBody } from "../_lib/http.js";
import { getSupabaseAdmin } from "../_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = requireAdmin(req, res);
  if (!session) return;
  const supabase = getSupabaseAdmin();

  if (req.method === "GET") {
    const { data, error } = await supabase.from("rooms").select("id, floor_id, name, username, member_count, is_active, created_at, floor:floors(*)").order("name");
    if (error) return badRequest(res, error.message);
    return json(res, 200, data);
  }

  if (req.method === "POST") {
    const body = readBody<{ id?: string; name?: string; username?: string; password?: string; floor_id?: string | null; member_count?: number; is_active?: boolean }>(req);
    if (!body.name || !body.username) return badRequest(res, "Room name and username are required");
    if (!body.id && !body.password) return badRequest(res, "Password is required for new rooms");

    const payload: Record<string, unknown> = {
      name: body.name,
      username: body.username,
      floor_id: body.floor_id ?? null,
      member_count: body.member_count ?? 1,
      is_active: body.is_active ?? true,
    };
    if (body.password) payload.password_hash = await bcrypt.hash(body.password, 12);

    const result = body.id
      ? await supabase.from("rooms").update(payload).eq("id", body.id).select("id, floor_id, name, username, member_count, is_active, created_at, floor:floors(*)").single()
      : await supabase.from("rooms").insert(payload).select("id, floor_id, name, username, member_count, is_active, created_at, floor:floors(*)").single();

    if (result.error) return badRequest(res, result.error.message);
    if (!body.id) {
      await supabase.from("targets").insert({ room_id: result.data.id, yearly_rub_target: 120, weekly_rub_target: 3, monthly_rub_target: 12 });
    }
    await supabase.from("activity_logs").insert({ actor_role: "admin", actor_id: session.id, actor_label: session.displayName, room_id: result.data.id, action: body.id ? "room_updated" : "room_created", details: { name: body.name, username: body.username } });
    return json(res, 200, result.data);
  }

  return methodNotAllowed(res);
}
