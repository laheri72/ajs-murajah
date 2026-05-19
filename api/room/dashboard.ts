import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireRoom } from "../_lib/auth";
import { percent, startOfWeek } from "../_lib/analytics";
import { badRequest, json, methodNotAllowed } from "../_lib/http";
import { getSupabaseAdmin } from "../_lib/supabase";

export async function getRoomDashboard(roomId: string) {
  const supabase = getSupabaseAdmin();
  const weekStart = startOfWeek();
  const [roomResult, targetResult, progressResult, weeklyResult, activityResult] = await Promise.all([
    supabase.from("rooms").select("id, floor_id, name, username, member_count, is_active, created_at, floor:floors(*)").eq("id", roomId).single(),
    supabase.from("targets").select("*").eq("room_id", roomId).maybeSingle(),
    supabase.from("room_rub_progress").select("rub_number").eq("room_id", roomId).order("rub_number"),
    supabase.from("progress_entries").select("id").eq("room_id", roomId).eq("action", "complete").gte("created_at", weekStart),
    supabase.from("activity_logs").select("*").eq("room_id", roomId).order("created_at", { ascending: false }).limit(10),
  ]);

  const error = roomResult.error ?? targetResult.error ?? progressResult.error ?? weeklyResult.error ?? activityResult.error;
  if (error) throw error;
  const completedRub = (progressResult.data ?? []).map((row) => row.rub_number);
  const totalTarget = targetResult.data?.yearly_rub_target ?? 120;
  const weeklyTarget = targetResult.data?.weekly_rub_target ?? 3;
  const totalCompleted = completedRub.length;
  return {
    room: roomResult.data,
    target: targetResult.data,
    completedRub,
    stats: {
      totalCompleted,
      totalTarget,
      completionPercentage: percent(totalCompleted, totalTarget),
      weeklyCompleted: weeklyResult.data?.length ?? 0,
      weeklyTarget,
      remainingTarget: Math.max(0, totalTarget - totalCompleted),
    },
    activity: activityResult.data ?? [],
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res);
  const session = requireRoom(req, res);
  if (!session) return;
  try {
    return json(res, 200, await getRoomDashboard(session.id));
  } catch (error) {
    return badRequest(res, error instanceof Error ? error.message : "Dashboard unavailable");
  }
}
