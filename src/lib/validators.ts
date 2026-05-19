import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const floorSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Floor name is required"),
  sort_order: z.coerce.number().int().min(0).default(0),
});

export const roomSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Room name is required"),
  floor_id: z.string().uuid().nullable().optional(),
  username: z.string().min(2, "Username is required"),
  password: z.string().min(4, "Use at least 4 characters").optional().or(z.literal("")),
  member_count: z.coerce.number().int().min(1).default(1),
  is_active: z.boolean().default(true),
});

export const targetSchema = z.object({
  room_id: z.string().uuid(),
  yearly_rub_target: z.coerce.number().int().min(1).max(120),
  weekly_rub_target: z.coerce.number().int().min(0).max(120),
  monthly_rub_target: z.coerce.number().int().min(0).max(120).nullable().optional(),
});
