-- Однократная миграция: роль переезжает из user_metadata (её пользователь
-- может менять сам) в app_metadata (меняется только сервером).
update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', raw_user_meta_data->>'role')
where raw_user_meta_data ? 'role';

-- Чтобы никто не остался с "старой" ролью в user_metadata:
update auth.users
set raw_user_meta_data = raw_user_meta_data - 'role'
where raw_user_meta_data ? 'role';
