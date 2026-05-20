import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcryptjs";
import { requireAdmin } from "../_lib/auth.js";
import { badRequest, json, methodNotAllowed, readBody, unauthorized } from "../_lib/http.js";
import { getSupabaseAdmin } from "../_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return methodNotAllowed(res);
  const session = requireAdmin(req, res);
  if (!session) return;

  const { currentPassword, newPassword } = readBody<{ currentPassword?: string; newPassword?: string }>(req);
  if (!currentPassword || !newPassword) return badRequest(res, "Current password and new password are required");
  if (newPassword.length < 6) return badRequest(res, "New password must be at least 6 characters");

  const supabase = getSupabaseAdmin();
  const { data: admin, error } = await supabase.from("admin_users").select("id, password_hash").eq("id", session.id).maybeSingle();
  if (error) return badRequest(res, error.message);
  if (!admin || !(await bcrypt.compare(currentPassword, admin.password_hash))) return unauthorized(res);

  const password_hash = await bcrypt.hash(newPassword, 12);
  const result = await supabase.from("admin_users").update({ password_hash }).eq("id", session.id);
  if (result.error) return badRequest(res, result.error.message);

  await supabase.from("activity_logs").insert({ actor_role: "admin", actor_id: session.id, actor_label: session.displayName, action: "admin_password_updated", details: {} });
  return json(res, 200, { ok: true });
}
