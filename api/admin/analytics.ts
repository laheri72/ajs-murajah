import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireAdmin } from "../_lib/auth";
import { percent, startOfWeek } from "../_lib/analytics";
import { badRequest, json, methodNotAllowed } from "../_lib/http";
import { getSupabaseAdmin } from "../_lib/supabase";

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

  const [floorsResult, roomsResult, progressResult, weeklyResult, activityResult] = await Promise.all([
    supabase.from("floors").select("id, name"),
    supabase.from("rooms").select("id, name, floor_id, is_active, floors(id, name), targets(yearly_rub_target, weekly_rub_target)").eq("is_active", true),
    supabase.from("room_rub_progress").select("room_id, rub_number"),
    supabase.from("progress_entries").select("room_id, action, created_at").gte("created_at", weekStart),
    supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(10),
  ]);

  const error = floorsResult.error ?? roomsResult.error ?? progressResult.error ?? weeklyResult.error ?? activityResult.error;
  if (error) return badRequest(res, error.message);

  const rooms = (roomsResult.data ?? []) as RoomRow[];
  const completedByRoom = new Map<string, number>();
  for (const row of progressResult.data ?? []) completedByRoom.set(row.room_id, (completedByRoom.get(row.room_id) ?? 0) + 1);

  const weeklyByRoom = new Map<string, number>();
  const weeklyTrendMap = new Map<string, { day: string; completed: number; undone: number }>();
  for (const row of weeklyResult.data ?? []) {
    const day = new Date(row.created_at).toLocaleDateString(undefined, { weekday: "short" });
    const existing = weeklyTrendMap.get(day) ?? { day, completed: 0, undone: 0 };
    if (row.action === "complete") {
      existing.completed += 1;
      weeklyByRoom.set(row.room_id, (weeklyByRoom.get(row.room_id) ?? 0) + 1);
    } else {
      existing.undone += 1;
    }
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
