create table if not exists public.room_progress_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  actor_id uuid,
  activity_log_id uuid references public.activity_logs(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz not null default now(),
  completed_count integer not null default 0 check (completed_count >= 0),
  undone_count integer not null default 0 check (undone_count >= 0),
  completed_rub_numbers integer[] not null default '{}'::integer[],
  undone_rub_numbers integer[] not null default '{}'::integer[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_room_progress_sessions_room_ended on public.room_progress_sessions(room_id, ended_at desc);
create index if not exists idx_room_progress_sessions_ended on public.room_progress_sessions(ended_at desc);

drop trigger if exists set_room_progress_sessions_updated_at on public.room_progress_sessions;
create trigger set_room_progress_sessions_updated_at before update on public.room_progress_sessions for each row execute function public.set_updated_at();

alter table public.room_progress_sessions enable row level security;
