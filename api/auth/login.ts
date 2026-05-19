import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcryptjs";
import { signSession, setSessionCookie } from "../_lib/auth";
import { badRequest, json, methodNotAllowed, readBody } from "../_lib/http";
import { getSupabaseAdmin } from "../_lib/supabase";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res);
  const { username, password } = readBody<{ username?: string; password?: string }>(req);
  if (!username || !password) return badRequest(res, "Username and password are required");

  const supabase = getSupabaseAdmin();
  const admin = await supabase.from("admin_users").select("id, username, display_name, password_hash, is_active").eq("username", username).maybeSingle();
  if (admin.data?.is_active && (await bcrypt.compare(password, admin.data.password_hash))) {
    const user = { role: "admin" as const, id: admin.data.id, username: admin.data.username, displayName: admin.data.display_name };
    setSessionCookie(res, signSession(user));
    return json(res, 200, { user });
  }

  const room = await supabase.from("rooms").select("id, username, name, password_hash, is_active, floors(name)").eq("username", username).maybeSingle();
  if (room.data?.is_active && (await bcrypt.compare(password, room.data.password_hash))) {
    const floors = room.data.floors as { name: string } | { name: string }[] | null;
    const floorName = Array.isArray(floors) ? floors[0]?.name ?? null : floors?.name ?? null;
    const user = { role: "room" as const, id: room.data.id, username: room.data.username, roomName: room.data.name, floorName };
    setSessionCookie(res, signSession(user));
    return json(res, 200, { user });
  }

  return json(res, 401, { error: "Invalid username or password" });
}
