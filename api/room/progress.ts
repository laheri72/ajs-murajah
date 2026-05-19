import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireRoom } from "../_lib/auth";
import { badRequest, json, methodNotAllowed, readBody } from "../_lib/http";
import { getSupabaseAdmin } from "../_lib/supabase";
import { getRoomDashboard } from "./dashboard";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res);
  const session = requireRoom(req, res);
  if (!session) return;
  const { rubNumbers } = readBody<{ rubNumbers?: number[] }>(req);
  const uniqueRub = [...new Set(rubNumbers ?? [])].filter((rub) => Number.isInteger(rub) && rub >= 1 && rub <= 120);
  if (!uniqueRub.length) return badRequest(res, "Select at least one valid Rub’ unit");

  const supabase = getSupabaseAdmin();
  for (const rubNumber of uniqueRub) {
    const existing = await supabase.from("room_rub_progress").select("id").eq("room_id", session.id).eq("rub_number", rubNumber).maybeSingle();
    if (existing.error) return badRequest(res, existing.error.message);
    const action = existing.data ? "undo" : "complete";

    if (action === "undo") {
      const deleted = await supabase.from("room_rub_progress").delete().eq("room_id", session.id).eq("rub_number", rubNumber);
      if (deleted.error) return badRequest(res, deleted.error.message);
    } else {
      const inserted = await supabase.from("room_rub_progress").insert({ room_id: session.id, rub_number: rubNumber });
      if (inserted.error) return badRequest(res, inserted.error.message);
    }

    await supabase.from("progress_entries").insert({ room_id: session.id, rub_number: rubNumber, action, actor_role: "room", actor_id: session.id });
    await supabase.from("activity_logs").insert({ actor_role: "room", actor_id: session.id, actor_label: session.roomName, room_id: session.id, action: action === "complete" ? "rub_completed" : "rub_undone", details: { rubNumber } });
  }

  return json(res, 200, await getRoomDashboard(session.id));
}
