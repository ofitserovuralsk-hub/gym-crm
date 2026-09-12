create table if not exists check_ins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  checked_in_at timestamptz not null default now()
);

alter table check_ins enable row level security;

-- MVP: без авторизации, доступ открыт всем с anon-ключом.
-- Ужесточить политики при подключении ролей (админ / владелец) на этапе 2.
create policy "Allow all for anon (MVP, no auth yet)"
  on check_ins
  for all
  using (true)
  with check (true);
