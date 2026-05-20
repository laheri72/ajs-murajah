export type Role = "admin" | "room";

export type SessionUser =
  | { role: "admin"; id: string; username: string; displayName: string }
  | { role: "room"; id: string; username: string; roomName: string; floorName: string | null };

export type Floor = {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export type Room = {
  id: string;
  floor_id: string | null;
  name: string;
  username: string;
  member_count: number;
  is_active: boolean;
  created_at: string;
  floor?: Floor | null;
};

export type Target = {
  id: string;
  room_id: string;
  yearly_rub_target: number;
  weekly_rub_target: number;
  monthly_rub_target: number | null;
  starts_on: string | null;
  ends_on: string | null;
};

export type ActivityLog = {
  id: string;
  actor_role: Role;
  actor_label: string;
  room_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
};

export type RoomDashboardData = {
  room: Room & { floor: Floor | null };
  target: Target | null;
  completedRub: number[];
  stats: {
    totalCompleted: number;
    totalTarget: number;
    completionPercentage: number;
    weeklyCompleted: number;
    weeklyTarget: number;
    remainingTarget: number;
  };
  activity: ActivityLog[];
};

export type AdminAnalytics = {
  totals: {
    floors: number;
    rooms: number;
    activeRooms: number;
    completedRub: number;
    possibleRub: number;
    completionPercentage: number;
    roomsBehindTarget: number;
  };
  floorPerformance: Array<{ floorId: string; floorName: string; rooms: number; completedRub: number; targetRub: number; completionPercentage: number }>;
  roomPerformance: Array<{ roomId: string; roomName: string; floorName: string | null; completedRub: number; weeklyCompleted: number; weeklyTarget: number; yearlyTarget: number; completionPercentage: number; behindTarget: boolean }>;
  weeklyTrend: Array<{ day: string; completed: number; undone: number }>;
  activity: ActivityLog[];
};
