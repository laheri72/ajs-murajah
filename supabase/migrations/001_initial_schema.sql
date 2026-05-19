create extension if not exists "pgcrypto";

create table if not exists public.floors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  display_name text not null,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  floor_id uuid references public.floors(id) on delete set null,
  name text not null,
  username text not null unique,
  password_hash text not null,
  member_count integer not null default 1 check (member_count > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.targets (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null unique references public.rooms(id) on delete cascade,
  yearly_rub_target integer not null default 120 check (yearly_rub_target between 1 and 120),
  weekly_rub_target integer not null default 3 check (weekly_rub_target between 0 and 120),
  monthly_rub_target integer check (monthly_rub_target between 0 and 120),
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_rub_progress (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  rub_number integer not null check (rub_number between 1 and 120),
  completed_at timestamptz not null default now(),
  unique (room_id, rub_number)
);

create table if not exists public.progress_entries (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  rub_number integer not null check (rub_number between 1 and 120),
  action text not null check (action in ('complete', 'undo')),
  actor_role text not null check (actor_role in ('admin', 'room')),
  actor_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_role text not null check (actor_role in ('admin', 'room')),
  actor_id uuid,
  actor_label text not null,
  room_id uuid references public.rooms(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  room_id uuid references public.rooms(id) on delete cascade,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_rooms_floor_id on public.rooms(floor_id);
create index if not exists idx_room_rub_progress_room_id on public.room_rub_progress(room_id);
create index if not exists idx_progress_entries_room_created on public.progress_entries(room_id, created_at desc);
create index if not exists idx_activity_logs_created on public.activity_logs(created_at desc);
create index if not exists idx_activity_logs_room_created on public.activity_logs(room_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_floors_updated_at on public.floors;
create trigger set_floors_updated_at before update on public.floors for each row execute function public.set_updated_at();

drop trigger if exists set_admin_users_updated_at on public.admin_users;
create trigger set_admin_users_updated_at before update on public.admin_users for each row execute function public.set_updated_at();

drop trigger if exists set_rooms_updated_at on public.rooms;
create trigger set_rooms_updated_at before update on public.rooms for each row execute function public.set_updated_at();

drop trigger if exists set_targets_updated_at on public.targets;
create trigger set_targets_updated_at before update on public.targets for each row execute function public.set_updated_at();

alter table public.floors enable row level security;
alter table public.admin_users enable row level security;
alter table public.rooms enable row level security;
alter table public.targets enable row level security;
alter table public.room_rub_progress enable row level security;
alter table public.progress_entries enable row level security;
alter table public.activity_logs enable row level security;
alter table public.notifications enable row level security;
