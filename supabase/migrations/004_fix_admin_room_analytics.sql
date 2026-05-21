drop function if exists public.admin_room_analytics(uuid, timestamptz);

create function public.admin_room_analytics(p_room_id uuid, p_week_start timestamptz)
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
  where r.id = p_room_id
    and r.is_active = true
),
completed as (
  select count(*)::int as completed_rub
  from public.room_rub_progress
  where room_id = p_room_id
),
weekly as (
  select count(*)::int as weekly_completed
  from public.room_rub_progress
  where room_id = p_room_id
    and completed_at >= p_week_start
)
select case
  when exists(select 1 from room_base) then (
    select jsonb_build_object(
      'roomId', rb.room_id,
      'roomName', rb.room_name,
      'floorName', rb.floor_name,
      'completedRub', c.completed_rub,
      'weeklyCompleted', w.weekly_completed,
      'weeklyTarget', rb.weekly_target,
      'yearlyTarget', rb.yearly_target,
      'completionPercentage', case
        when rb.yearly_target = 0 then 0
        else least(100, c.completed_rub::numeric / rb.yearly_target * 100)
      end,
      'behindTarget', w.weekly_completed < rb.weekly_target
    )
    from room_base rb
    cross join completed c
    cross join weekly w
    limit 1
  )
  else null
end;
$$;