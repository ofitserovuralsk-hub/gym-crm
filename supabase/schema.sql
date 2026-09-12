create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  birth_date date,
  photo_url text,
  membership_status text not null default 'active'
    check (membership_status in ('active', 'expired', 'frozen')),
  membership_end_date date,
  created_at timestamptz not null default now()
);

alter table clients enable row level security;

-- MVP: без авторизации, доступ открыт всем с anon-ключом.
-- Ужесточить политики при подключении ролей (админ / владелец) на этапе 2.
create policy "Allow all for anon (MVP, no auth yet)"
  on clients
  for all
  using (true)
  with check (true);

insert into clients (full_name, phone, membership_status, membership_end_date) values
  ('Асель Нурланова', '+7 701 234 5678', 'active', '2026-10-15'),
  ('Данияр Ахметов', '+7 702 345 6789', 'expired', '2026-08-30'),
  ('Гульмира Сериковна', '+7 705 456 7890', 'active', '2026-09-20'),
  ('Ержан Тулегенов', '+7 707 567 8901', 'frozen', '2026-11-01'),
  ('Айгерим Жаксыбекова', '+7 700 678 9012', 'active', '2026-09-14'),
  ('Тимур Сагындыков', '+7 747 789 0123', 'expired', '2026-07-05');
