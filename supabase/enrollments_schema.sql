-- Запись клиентов на конкретную дату занятия (занятие повторяется каждую неделю,
-- поэтому запись привязана к class_date). Лимита мест нет.
create table if not exists class_enrollments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references group_classes(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  class_date date not null,
  created_at timestamptz not null default now(),
  unique (class_id, client_id, class_date)
);

alter table class_enrollments enable row level security;

create policy "Authenticated full access"
  on class_enrollments
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
