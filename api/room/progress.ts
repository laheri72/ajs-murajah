import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireRoom } from "../_lib/auth.js";
import { badRequest, json, methodNotAllowed, readBody } from "../_lib/http.js";
import { getSupabaseAdmin } from "../_lib/supabase.js";
import { getRoomDashboard } from "./dashboard.js";

const RUB_PER_JUZ = 4;
const TOTAL_JUZ = 30;
const SESSION_WINDOW_MINUTES = 15;

function getUnlockedJuz(completed: Set<number>) {
  for (let juz = 1; juz <= TOTAL_JUZ; juz += 1) {
    const start = (juz - 1) * RUB_PER_JUZ + 1;
    for (let offset = 0; offset < RUB_PER_JUZ; offset += 1) {
      if (!completed.has(start + offset)) return juz;
    }
  }
  return TOTAL_JUZ;
}

function validateCompletedRubSet(completed: Set<number>) {
  let foundIncompleteJuz = false;
  for (let juz = 1; juz <= TOTAL_JUZ; juz += 1) {
    const start = (juz - 1) * RUB_PER_JUZ + 1;
    const units = Array.from({ length: RUB_PER_JUZ }, (_, index) => start + index);
    const completedInJuz = units.filter((rub) => completed.has(rub)).length;
    if (foundIncompleteJuz && completedInJuz > 0) {
      return `Juz ${juz} is locked. Complete Juz ${getUnlockedJuz(completed)} first.`;
    }
    if (completedInJuz < RUB_PER_JUZ) foundIncompleteJuz = true;
  }
  return null;
}

function sortRub(numbers: number[]) {
  return [...numbers].sort((a, b) => a - b);
}

function applySessionNetting(existingCompleted: number[], existingUndone: number[], completedRub: number[], undoneRub: number[]) {
  const completed = new Set(existingCompleted);
  const undone = new Set(existingUndone);

  for (const rubNumber of completedRub) {
    undone.delete(rubNumber);
    completed.add(rubNumber);
  }

  for (const rubNumber of undoneRub) {
    completed.delete(rubNumber);
    undone.add(rubNumber);
  }

  return {
    completedRubNumbers: sortRub([...completed]),
    undoneRubNumbers: sortRub([...undone]),
  };
}

function buildSessionDetails(completedRubNumbers: number[], undoneRubNumbers: number[]) {
  const completedCount = completedRubNumbers.length;
  const undoneCount = undoneRubNumbers.length;
  const summaryParts = [];
  if (completedCount) summaryParts.push(`${completedCount} Rub completed`);
  if (undoneCount) summaryParts.push(`${undoneCount} Rub corrected`);
  return {
    summary: summaryParts.length ? summaryParts.join(", ") : "No net progress changes",
    completedCount,
    undoneCount,
    completedRubNumbers,
    undoneRubNumbers,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res);
  const session = requireRoom(req, res);
  if (!session) return;

  const { completedRub, rubNumbers } = readBody<{ completedRub?: number[]; rubNumbers?: number[] }>(req);

  const supabase = getSupabaseAdmin();
  const currentProgress = await supabase.from("room_rub_progress").select("rub_number").eq("room_id", session.id);
  if (currentProgress.error) return badRequest(res, currentProgress.error.message);

  const currentCompleted = new Set((currentProgress.data ?? []).map((row) => row.rub_number));
  const targetCompleted = Array.isArray(completedRub)
    ? new Set(completedRub.filter((rub) => Number.isInteger(rub) && rub >= 1 && rub <= 120))
    : new Set(currentCompleted);

  if (!Array.isArray(completedRub)) {
    const uniqueRub = [...new Set(rubNumbers ?? [])].filter((rub) => Number.isInteger(rub) && rub >= 1 && rub <= 120);
    if (!uniqueRub.length) return badRequest(res, "Send completedRub or select at least one valid Rub' unit");
    uniqueRub.forEach((rub) => (targetCompleted.has(rub) ? targetCompleted.delete(rub) : targetCompleted.add(rub)));
  }

  const validationError = validateCompletedRubSet(targetCompleted);
  if (validationError) return badRequest(res, validationError);

  const completedRubNumbers = sortRub([...targetCompleted].filter((rub) => !currentCompleted.has(rub)));
  const undoneRubNumbers = sortRub([...currentCompleted].filter((rub) => !targetCompleted.has(rub)));

  if (undoneRubNumbers.length) {
    const deleted = await supabase.from("room_rub_progress").delete().eq("room_id", session.id).in("rub_number", undoneRubNumbers);
    if (deleted.error) return badRequest(res, deleted.error.message);
  }

  if (completedRubNumbers.length) {
    const inserted = await supabase.from("room_rub_progress").insert(completedRubNumbers.map((rubNumber) => ({ room_id: session.id, rub_number: rubNumber })));
    if (inserted.error) return badRequest(res, inserted.error.message);
  }

  if (!completedRubNumbers.length && !undoneRubNumbers.length) {
    return json(res, 200, await getRoomDashboard(session.id));
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const windowStartIso = new Date(now.getTime() - SESSION_WINDOW_MINUTES * 60 * 1000).toISOString();
  const sessionResult = await supabase
    .from("room_progress_sessions")
    .select("id, activity_log_id, completed_rub_numbers, undone_rub_numbers")
    .eq("room_id", session.id)
    .gte("ended_at", windowStartIso)
    .order("ended_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (sessionResult.error) return badRequest(res, sessionResult.error.message);

  const progressSession = sessionResult.data;
  const netted = applySessionNetting(
    (progressSession?.completed_rub_numbers ?? []) as number[],
    (progressSession?.undone_rub_numbers ?? []) as number[],
    completedRubNumbers,
    undoneRubNumbers,
  );
  const details = buildSessionDetails(netted.completedRubNumbers, netted.undoneRubNumbers);
  const sessionPayload = {
    actor_id: session.id,
    ended_at: nowIso,
    completed_count: details.completedCount,
    undone_count: details.undoneCount,
    completed_rub_numbers: netted.completedRubNumbers,
    undone_rub_numbers: netted.undoneRubNumbers,
  };

  const activityPayload = {
    actor_role: "room",
    actor_id: session.id,
    actor_label: session.roomName,
    room_id: session.id,
    action: "room_progress_session_updated",
    details,
    created_at: nowIso,
  };

  if (progressSession) {
    const updatedSession = await supabase.from("room_progress_sessions").update(sessionPayload).eq("id", progressSession.id);
    if (updatedSession.error) return badRequest(res, updatedSession.error.message);

    if (details.completedCount || details.undoneCount) {
      if (progressSession.activity_log_id) {
        const updatedActivity = await supabase.from("activity_logs").update(activityPayload).eq("id", progressSession.activity_log_id);
        if (updatedActivity.error) return badRequest(res, updatedActivity.error.message);
      } else {
        const activity = await supabase.from("activity_logs").insert(activityPayload).select("id").single();
        if (activity.error) return badRequest(res, activity.error.message);
        const linkedSession = await supabase.from("room_progress_sessions").update({ activity_log_id: activity.data.id }).eq("id", progressSession.id);
        if (linkedSession.error) return badRequest(res, linkedSession.error.message);
      }
    } else if (progressSession.activity_log_id) {
      const deletedActivity = await supabase.from("activity_logs").delete().eq("id", progressSession.activity_log_id);
      if (deletedActivity.error) return badRequest(res, deletedActivity.error.message);
      const unlinkedSession = await supabase.from("room_progress_sessions").update({ activity_log_id: null }).eq("id", progressSession.id);
      if (unlinkedSession.error) return badRequest(res, unlinkedSession.error.message);
    }
  } else {
    const createdSession = await supabase
      .from("room_progress_sessions")
      .insert({ room_id: session.id, started_at: nowIso, ...sessionPayload })
      .select("id")
      .single();
    if (createdSession.error) return badRequest(res, createdSession.error.message);

    if (details.completedCount || details.undoneCount) {
      const activity = await supabase.from("activity_logs").insert(activityPayload).select("id").single();
      if (activity.error) return badRequest(res, activity.error.message);
      const linkedSession = await supabase.from("room_progress_sessions").update({ activity_log_id: activity.data.id }).eq("id", createdSession.data.id);
      if (linkedSession.error) return badRequest(res, linkedSession.error.message);
    }
  }

  return json(res, 200, await getRoomDashboard(session.id));
}
