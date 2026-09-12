-- Теперь есть авторизация — убираем открытый доступ по anon-ключу и
-- разрешаем чтение/запись только вошедшим пользователям.

do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('clients', 'subscriptions', 'payments', 'check_ins')
  loop
    execute format('drop policy if exists %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

create policy "Authenticated users only" on clients
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated users only" on subscriptions
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated users only" on payments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Authenticated users only" on check_ins
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Allow all for anon on client-photos (MVP, no auth yet)" on storage.objects;

create policy "Authenticated users only on client-photos" on storage.objects
  for all using (bucket_id = 'client-photos' and auth.role() = 'authenticated')
  with check (bucket_id = 'client-photos' and auth.role() = 'authenticated');
