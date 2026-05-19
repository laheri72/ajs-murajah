import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_lib/auth";
import { badRequest, json, methodNotAllowed, readBody } from "../_lib/http";
import { getSupabaseAdmin } from "../_lib/supabase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const session = requireAdmin(req, res);
  if (!session) return;
  const supabase = getSupabaseAdmin();

  if (req.method === "GET") {
    const { data, error } = await supabase.from("floors").select("*").order("sort_order");
    if (error) return badRequest(res, error.message);
    return json(res, 200, data);
  }

  if (req.method === "POST") {
    const body = readBody<{ id?: string; name?: string; sort_order?: number }>(req);
    if (!body.name) return badRequest(res, "Floor name is required");
    const payload = { name: body.name, sort_order: body.sort_order ?? 0 };
    const result = body.id
      ? await supabase.from("floors").update(payload).eq("id", body.id).select("*").single()
      : await supabase.from("floors").insert(payload).select("*").single();
    if (result.error) return badRequest(res, result.error.message);
    await supabase.from("activity_logs").insert({ actor_role: "admin", actor_id: session.id, actor_label: session.displayName, action: body.id ? "floor_updated" : "floor_created", details: payload });
    return json(res, 200, result.data);
  }

  return methodNotAllowed(res);
}
