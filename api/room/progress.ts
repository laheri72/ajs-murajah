import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireRoom } from "../_lib/auth";
import { badRequest, json, methodNotAllowed, readBody } from "../_lib/http";
import { getSupabaseAdmin } from "../_lib/supabase";
import { getRoomDashboard } from "./dashboard";

const RUB_PER_JUZ = 4;
const TOTAL_JUZ = 30;

function getJuz(rubNumber: number) {
  return Math.ceil(rubNumber / RUB_PER_JUZ);
}

function getEndOfJuz(rubNumber: number) {
  return getJuz(rubNumber) * RUB_PER_JUZ;
}

function getUnlockedJuz(completed: Set<number>) {
  for (let juz = 1; juz <= TOTAL_JUZ; juz += 1) {
    const start = (juz - 1) * RUB_PER_JUZ + 1;
    for (let offset = 0; offset < RUB_PER_JUZ; offset += 1) {
      if (!completed.has(start + offset)) return juz;
    }
  }
  return TOTAL_JUZ;
}

function validateLadderAction(rubNumber: number, completed: Set<number>) {
  const isCompleted = completed.has(rubNumber);
  if (!isCompleted) {
    const unlockedJuz = getUnlockedJuz(completed);
    if (getJuz(rubNumber) !== unlockedJuz) {
      return `Juz ${getJuz(rubNumber)} is locked. Complete Juz ${unlockedJuz} first.`;
    }
    return null;
  }

  const endOfJuz = getEndOfJuz(rubNumber);
  const hasLaterProgress = [...completed].some((completedRub) => completedRub > endOfJuz);
  if (hasLaterProgress) {
    return "Undo later Juz progress before changing this Juz.";
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res);
  const session = requireRoom(req, res);
  if (!session) return;

  const { rubNumbers } = readBody<{ rubNumbers?: number[] }>(req);
  const uniqueRub = [...new Set(rubNumbers ?? [])].filter((rub) => Number.isInteger(rub) && rub >= 1 && rub <= 120);
  if (!uniqueRub.length) return badRequest(res, "Select at least one valid Rub' unit");

  const supabase = getSupabaseAdmin();
  const currentProgress = await supabase.from("room_rub_progress").select("rub_number").eq("room_id", session.id);
  if (currentProgress.error) return badRequest(res, currentProgress.error.message);

  const completed = new Set((currentProgress.data ?? []).map((row) => row.rub_number));

  for (const rubNumber of uniqueRub) {
    const validationError = validateLadderAction(rubNumber, completed);
    if (validationError) return badRequest(res, validationError);

    const action = completed.has(rubNumber) ? "undo" : "complete";
    if (action === "undo") {
      const deleted = await supabase.from("room_rub_progress").delete().eq("room_id", session.id).eq("rub_number", rubNumber);
      if (deleted.error) return badRequest(res, deleted.error.message);
      completed.delete(rubNumber);
    } else {
      const inserted = await supabase.from("room_rub_progress").insert({ room_id: session.id, rub_number: rubNumber });
      if (inserted.error) return badRequest(res, inserted.error.message);
      completed.add(rubNumber);
    }

    await supabase.from("progress_entries").insert({ room_id: session.id, rub_number: rubNumber, action, actor_role: "room", actor_id: session.id });
    await supabase.from("activity_logs").insert({
      actor_role: "room",
      actor_id: session.id,
      actor_label: session.roomName,
      room_id: session.id,
      action: action === "complete" ? "rub_completed" : "rub_undone",
      details: { rubNumber },
    });
  }

  return json(res, 200, await getRoomDashboard(session.id));
}
