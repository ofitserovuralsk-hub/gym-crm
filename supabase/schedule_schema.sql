-- Групповые занятия: повторяющееся недельное расписание.
-- weekday: 1 = понедельник ... 7 = воскресенье (ISO).
create table if not exists group_classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trainer text,
  weekday smallint not null check (weekday between 1 and 7),
  start_time time not null,
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  created_at timestamptz not null default now()
);

alter table group_classes enable row level security;

-- Как и на остальных таблицах: доступ только авторизованным.
-- (Политики в этом проекте создаются через Dashboard → Authentication → Policies,
-- см. примечание в README про SQL Editor.)
create policy "Authenticated full access"
  on group_classes
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
