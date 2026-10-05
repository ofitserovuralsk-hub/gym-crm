-- Тренеры и назначение их на групповые занятия.
create table if not exists trainers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);

alter table trainers enable row level security;

create policy "Authenticated full access"
  on trainers
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Связь занятия с тренером. При удалении тренера занятие остаётся без тренера.
alter table group_classes
  add column if not exists trainer_id uuid references trainers(id) on delete set null;

-- Однократный перенос: тренеры, раньше вписанные в занятия текстом,
-- становятся записями в trainers и привязываются к своим занятиям.
-- Запускать один раз (повторный запуск создаст дубликаты тренеров).
insert into trainers (full_name)
select distinct trim(trainer)
from group_classes
where trainer is not null and trim(trainer) <> '';

update group_classes g
set trainer_id = t.id
from trainers t
where g.trainer_id is null and trim(g.trainer) = t.full_name;
