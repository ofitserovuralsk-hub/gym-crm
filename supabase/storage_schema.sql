insert into storage.buckets (id, name, public)
values ('client-photos', 'client-photos', true)
on conflict (id) do nothing;

-- MVP: без авторизации, доступ открыт всем с anon-ключом.
-- Ужесточить политики при подключении ролей (админ / владелец) на этапе 2.
create policy "Allow all for anon on client-photos (MVP, no auth yet)"
  on storage.objects
  for all
  using (bucket_id = 'client-photos')
  with check (bucket_id = 'client-photos');
