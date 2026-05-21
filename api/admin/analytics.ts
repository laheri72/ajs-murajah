import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_lib/auth.js";
import { percent, startOfWeek } from "../_lib/analytics.js";
import { badRequest, json, methodNotAllowed } from "../_lib/http.js";
import { getSupabaseAdmin } from "../_lib/supabase.js";

type RoomRow = {
  id: string;
  name: string;
  floor_id: string | null;
  floors?: { id: string; name: string } | { id: string; name: string }[] | null;
  targets?: { yearly_rub_target: number; weekly_rub_target: number }[] | null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res);
  const session = requireAdmin(req, res);
  if (!session) return;
  const supabase = getSupabaseAdmin();
  const weekStart = startOfWeek();

  const [floorsResult, roomsResult, progressResult, weeklyProgressResult, weeklySessionsResult, activityResult] = await Promise.all([
    supabase.from("floors").select("id, name"),
    supabase.from("rooms").select("id, name, floor_id, is_active, floors(id, name), targets(yearly_rub_target, weekly_rub_target)").eq("is_active", true),
    supabase.from("room_rub_progress").select("room_id, rub_number, completed_at"),
    supabase.from("room_rub_progress").select("room_id, completed_at").gte("completed_at", weekStart),
    supabase.from("room_progress_sessions").select("completed_count, undone_count, ended_at").gte("ended_at", weekStart),
    supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(10),
  ]);

  const error = floorsResult.error ?? roomsResult.error ?? progressResult.error ?? weeklyProgressResult.error ?? weeklySessionsResult.error ?? activityResult.error;
  if (error) return badRequest(res, error.message);

  const rooms = (roomsResult.data ?? []) as RoomRow[];
  const completedByRoom = new Map<string, number>();
  for (const row of progressResult.data ?? []) completedByRoom.set(row.room_id, (completedByRoom.get(row.room_id) ?? 0) + 1);

  const weeklyByRoom = new Map<string, number>();
  for (const row of weeklyProgressResult.data ?? []) {
    weeklyByRoom.set(row.room_id, (weeklyByRoom.get(row.room_id) ?? 0) + 1);
  }

  const weeklyTrendMap = new Map<string, { day: string; completed: number; undone: number }>();
  for (const row of weeklySessionsResult.data ?? []) {
    const day = new Date(row.ended_at).toLocaleDateString(undefined, { weekday: "short" });
    const existing = weeklyTrendMap.get(day) ?? { day, completed: 0, undone: 0 };
    existing.completed += row.completed_count ?? 0;
    existing.undone += row.undone_count ?? 0;
    weeklyTrendMap.set(day, existing);
  }

  const roomPerformance = rooms.map((room) => {
    const target = room.targets?.[0] ?? { yearly_rub_target: 120, weekly_rub_target: 3 };
    const floor = Array.isArray(room.floors) ? room.floors[0] : room.floors;
    const completedRub = completedByRoom.get(room.id) ?? 0;
    const weeklyCompleted = weeklyByRoom.get(room.id) ?? 0;
    return {
      roomId: room.id,
      roomName: room.name,
      floorName: floor?.name ?? null,
      completedRub,
      weeklyCompleted,
      weeklyTarget: target.weekly_rub_target,
      yearlyTarget: target.yearly_rub_target,
      completionPercentage: percent(completedRub, target.yearly_rub_target),
      behindTarget: weeklyCompleted < target.weekly_rub_target,
    };
  }).sort((a, b) => b.completedRub - a.completedRub);

  const floorPerformance = (floorsResult.data ?? []).map((floor) => {
    const floorRooms = rooms.filter((room) => room.floor_id === floor.id);
    const completedRub = floorRooms.reduce((sum, room) => sum + (completedByRoom.get(room.id) ?? 0), 0);
    const targetRub = floorRooms.reduce((sum, room) => sum + (room.targets?.[0]?.yearly_rub_target ?? 120), 0);
    return {
      floorId: floor.id,
      floorName: floor.name,
      rooms: floorRooms.length,
      completedRub,
      targetRub,
      completionPercentage: percent(completedRub, targetRub),
    };
  });

  const possibleRub = rooms.reduce((sum, room) => sum + (room.targets?.[0]?.yearly_rub_target ?? 120), 0);
  const completedRub = [...completedByRoom.values()].reduce((sum, value) => sum + value, 0);

  return json(res, 200, {
    totals: {
      floors: floorsResult.data?.length ?? 0,
      rooms: rooms.length,
      activeRooms: rooms.length,
      completedRub,
      possibleRub,
      completionPercentage: percent(completedRub, possibleRub),
      roomsBehindTarget: roomPerformance.filter((room) => room.behindTarget).length,
    },
    floorPerformance,
    roomPerformance,
    weeklyTrend: [...weeklyTrendMap.values()],
    activity: activityResult.data ?? [],
  });
}
