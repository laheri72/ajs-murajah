insert into public.admin_users (username, display_name, password_hash)
values ('admin', 'Maskan Admin', crypt('admin123', gen_salt('bf')))
on conflict (username) do nothing;

insert into public.floors (name, sort_order)
values
  ('Ground Floor', 0),
  ('Floor 1', 1),
  ('Floor 2', 2)
on conflict (name) do nothing;

with floor_one as (
  select id from public.floors where name = 'Floor 1' limit 1
), floor_two as (
  select id from public.floors where name = 'Floor 2' limit 1
)
insert into public.rooms (floor_id, name, username, password_hash, member_count)
values
  ((select id from floor_one), 'Room 101', 'room101', crypt('room123', gen_salt('bf')), 4),
  ((select id from floor_one), 'Room 102', 'room102', crypt('room123', gen_salt('bf')), 3),
  ((select id from floor_two), 'Room 201', 'room201', crypt('room123', gen_salt('bf')), 5)
on conflict (username) do nothing;

insert into public.targets (room_id, yearly_rub_target, weekly_rub_target, monthly_rub_target)
select id, 120, 3, 12 from public.rooms
on conflict (room_id) do nothing;

insert into public.room_rub_progress (room_id, rub_number)
select rooms.id, series.rub_number
from public.rooms
join lateral generate_series(1, case when rooms.username = 'room101' then 8 when rooms.username = 'room102' then 4 else 2 end) as series(rub_number) on true
on conflict (room_id, rub_number) do nothing;

insert into public.room_progress_sessions (room_id, actor_id, started_at, ended_at, completed_count, completed_rub_numbers)
select
  room_id,
  room_id,
  min(completed_at),
  max(completed_at),
  count(*)::integer,
  array_agg(rub_number order by rub_number)
from public.room_rub_progress
group by room_id;

insert into public.activity_logs (actor_role, actor_id, actor_label, room_id, action, details)
select
  'room',
  rooms.id,
  rooms.name,
  rooms.id,
  'room_progress_session_updated',
  jsonb_build_object('summary', count(progress.rub_number)::text || ' Rub completed', 'completedCount', count(progress.rub_number), 'source', 'seed')
from public.rooms
left join public.room_rub_progress progress on progress.room_id = rooms.id
group by rooms.id, rooms.name
on conflict do nothing;
