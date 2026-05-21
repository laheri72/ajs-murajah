create or replace function public.admin_dashboard_summary(week_start timestamptz)
returns jsonb
language sql
stable
as $$
with rooms_base as (
  select
    r.id as room_id,
    r.name as room_name,
    r.floor_id,
    f.name as floor_name,
    coalesce(t.yearly_rub_target, 120) as yearly_target,
    coalesce(t.weekly_rub_target, 3) as weekly_target
  from public.rooms r
  left join public.floors f on f.id = r.floor_id
  left join public.targets t on t.room_id = r.id
  where r.is_active = true
),
completed_by_room as (
  select room_id, count(*)::int as completed_rub
  from public.room_rub_progress
  group by room_id
),
weekly_by_room as (
  select room_id, count(*)::int as weekly_completed
  from public.room_rub_progress
  where completed_at >= week_start
  group by room_id
),
room_stats as (
  select
    rb.room_id,
    rb.room_name,
    rb.floor_id,
    rb.floor_name,
    rb.yearly_target,
    rb.weekly_target,
    coalesce(cbr.completed_rub, 0) as completed_rub,
    coalesce(wbr.weekly_completed, 0) as weekly_completed
  from rooms_base rb
  left join completed_by_room cbr on cbr.room_id = rb.room_id
  left join weekly_by_room wbr on wbr.room_id = rb.room_id
),
weekly_trend as (
  select
    to_char(date_trunc('day', ended_at), 'Dy') as day,
    min(ended_at) as sort_ts,
    coalesce(sum(completed_count), 0)::int as completed,
    coalesce(sum(undone_count), 0)::int as undone
  from public.room_progress_sessions
  where ended_at >= week_start
  group by 1
),
floor_summary as (
  select
    floor_id,
    max(floor_name) as floor_name,
    count(*)::int as rooms,
    coalesce(sum(completed_rub), 0)::int as completed_rub,
    coalesce(sum(yearly_target), 0)::int as target_rub,
    case
      when coalesce(sum(yearly_target), 0) = 0 then 0
      else least(100, coalesce(sum(completed_rub), 0)::numeric / coalesce(sum(yearly_target), 0) * 100)
    end as completion_percentage
  from room_stats
  group by floor_id
),
top_rooms as (
  select *
  from room_stats
  order by completed_rub desc, room_name asc
  limit 8
),
rooms_behind_preview as (
  select *
  from room_stats
  where weekly_completed < weekly_target
  order by weekly_completed asc, room_name asc
  limit 6
)
select jsonb_build_object(
  'totals', jsonb_build_object(
    'floors', (select count(*)::int from public.floors),
    'rooms', (select count(*)::int from rooms_base),
    'activeRooms', (select count(*)::int from rooms_base),
    'completedRub', (select coalesce(sum(completed_rub), 0)::int from room_stats),
    'possibleRub', (select coalesce(sum(yearly_target), 0)::int from room_stats),
    'completionPercentage', case
      when (select coalesce(sum(yearly_target), 0) from room_stats) = 0 then 0
      else least(100, (select coalesce(sum(completed_rub), 0)::numeric from room_stats) / nullif((select coalesce(sum(yearly_target), 0)::numeric from room_stats), 0) * 100)
    end,
    'roomsBehindTarget', (select count(*)::int from room_stats where weekly_completed < weekly_target)
  ),
  'floorPerformance', coalesce((
    select jsonb_agg(jsonb_build_object(
      'floorId', floor_id,
      'floorName', floor_name,
      'rooms', rooms,
      'completedRub', completed_rub,
      'targetRub', target_rub,
      'completionPercentage', completion_percentage
    ) order by completion_percentage desc, floor_name asc)
    from floor_summary
  ), '[]'::jsonb),
  'topRooms', coalesce((
    select jsonb_agg(jsonb_build_object(
      'roomId', room_id,
      'roomName', room_name,
      'floorName', floor_name,
      'completedRub', completed_rub,
      'weeklyCompleted', weekly_completed,
      'weeklyTarget', weekly_target,
      'yearlyTarget', yearly_target,
      'completionPercentage', case
        when yearly_target = 0 then 0
        else least(100, completed_rub::numeric / yearly_target * 100)
      end,
      'behindTarget', weekly_completed < weekly_target
    ) order by completed_rub desc, room_name asc)
    from top_rooms
  ), '[]'::jsonb),
  'roomsBehindPreview', coalesce((
    select jsonb_agg(jsonb_build_object(
      'roomId', room_id,
      'roomName', room_name,
      'floorName', floor_name,
      'completedRub', completed_rub,
      'weeklyCompleted', weekly_completed,
      'weeklyTarget', weekly_target,
      'yearlyTarget', yearly_target,
      'completionPercentage', case
        when yearly_target = 0 then 0
        else least(100, completed_rub::numeric / yearly_target * 100)
      end,
      'behindTarget', weekly_completed < weekly_target
    ) order by weekly_completed asc, room_name asc)
    from rooms_behind_preview
  ), '[]'::jsonb),
  'weeklyTrend', coalesce((
    select jsonb_agg(jsonb_build_object(
      'day', day,
      'completed', completed,
      'undone', undone
    ) order by sort_ts)
    from weekly_trend
  ), '[]'::jsonb)
);
$$;

create or replace function public.admin_room_analytics(room_id uuid, week_start timestamptz)
returns jsonb
language sql
stable
as $$
with room_base as (
  select
    r.id as room_id,
    r.name as room_name,
    f.name as floor_name,
    coalesce(t.yearly_rub_target, 120) as yearly_target,
    coalesce(t.weekly_rub_target, 3) as weekly_target
  from public.rooms r
  left join public.floors f on f.id = r.floor_id
  left join public.targets t on t.room_id = r.id
  where r.id = room_id
    and r.is_active = true
),
completed as (
  select count(*)::int as completed_rub
  from public.room_rub_progress
  where room_id = room_id
),
weekly as (
  select count(*)::int as weekly_completed
  from public.room_rub_progress
  where room_id = room_id
    and completed_at >= week_start
)
select case
  when exists(select 1 from room_base) then jsonb_build_object(
    'roomId', (select room_id from room_base),
    'roomName', (select room_name from room_base),
    'floorName', (select floor_name from room_base),
    'completedRub', (select completed_rub from completed),
    'weeklyCompleted', (select weekly_completed from weekly),
    'weeklyTarget', (select weekly_target from room_base),
    'yearlyTarget', (select yearly_target from room_base),
    'completionPercentage', case
      when (select yearly_target from room_base) = 0 then 0
      else least(100, (select completed_rub from completed)::numeric / (select yearly_target from room_base) * 100)
    end,
    'behindTarget', (select weekly_completed from weekly) < (select weekly_target from room_base)
  )
  else null
end;
$$;