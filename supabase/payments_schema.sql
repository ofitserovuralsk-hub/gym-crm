create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  subscription_id uuid references subscriptions(id) on delete set null,
  amount numeric(10, 2) not null check (amount > 0),
  method text not null check (method in ('cash', 'card', 'kaspi')),
  paid_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table payments enable row level security;

-- MVP: без авторизации, доступ открыт всем с anon-ключом.
-- Ужесточить политики при подключении ролей (админ / владелец) на этапе 2.
create policy "Allow all for anon (MVP, no auth yet)"
  on payments
  for all
  using (true)
  with check (true);
