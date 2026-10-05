# Gym CRM — техническая карта проекта

Этот файл — снапшот того, что уже реализовано и как всё устроено технически.
Продуктовый контекст, роадмап и правила работы — в [CLAUDE.md](CLAUDE.md).
Перед новой задачей: сначала прочитай этот файл, потом уже открывай код —
это почти всегда быстрее, чем grep по всему проекту.

## Стек

- Next.js 14 (App Router, TypeScript), Tailwind CSS
- Supabase: Postgres + Auth + Storage
- PWA: manifest + service worker (кэш офлайн-чтения)
- Деплой: Vercel, https://gym-crm-off.vercel.app (импорт из GitHub, env: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)
- Репозиторий: https://github.com/ofitserovuralsk-hub/gym-crm

## Как запустить локально

```bash
npm install
npm run dev
```

Нужен `.env.local` (не в git, см. `.env.local.example`):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # это "publishable" ключ Supabase, не секретный
SUPABASE_SERVICE_ROLE_KEY=...       # СЕКРЕТНЫЙ, только сервер (раздел /staff)
```

**Аккаунты сотрудников** создаёт владелец в разделе `/staff` (создать, роль,
смена пароля, удаление). Публичной регистрации нет. **Самого первого владельца**
нужно создать вручную: Supabase Dashboard → Authentication → Users, затем роль:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "owner"}'::jsonb
where email = '...';
```

Роль хранится в `app_metadata` (меняется только сервером), **не** в `user_metadata`
(её пользователь может править сам). Роль по умолчанию — `admin`. Значения: `admin` | `owner`.
Для `/staff` нужен серверный `SUPABASE_SERVICE_ROLE_KEY` (в `.env.local` и в Vercel;
секретный, не коммитить, не светить в чатах).

## Структура

```
middleware.ts                        — гейт авторизации (редирект на /login), обновление сессии

app/
  layout.tsx                         — root layout, async: подгружает текущего юзера, рендерит <UserBar>
  user-bar.tsx                       — верхняя панель (email · роль · Выйти), не рендерится если не залогинен
  page.tsx                           — список клиентов (/), + ссылки "Напоминания"/"Аналитика" (последняя — только owner)
  clients-list.tsx                   — клиентский компонент: поиск по имени/телефону + фильтр по статусу
  login/page.tsx                     — форма входа (email/password через Supabase Auth)
  reminders/page.tsx                 — клиенты с истекающим абонементом (окно из lib/reminders.ts)
  staff/                             — owner-only: управление аккаунтами (Auth Admin API через service_role)
    actions.ts                      — createStaff, changeStaffRole, resetStaffPassword, deleteStaff; везде requireOwner(),
                                       нельзя удалить себя / сменить себе роль / удалить последнего владельца
  trainers/                          — тренеры: список, добавление (ФИО, телефон), удаление; у каждого видны его занятия
  schedule/                          — расписание групповых занятий (недельное, повторяющееся)
    page.tsx                        — неделя по дням (?week=YYYY-MM-DD, стрелки ‹ ›); записи грузятся на даты выбранной недели
    actions.ts                      — addGroupClass, deleteGroupClass, enrollClient, unenrollClient
    class-form.tsx / delete-class-button.tsx — добавление/удаление занятия
    enrollment-panel.tsx            — раскрывающийся список записавшихся + поиск клиента для записи
  analytics/page.tsx                 — owner-only: выручка (всего/по месяцам/по способу), отток клиентов
  clients/
    actions.ts                      — createClient, updateClient, deleteClient (deleteClient проверяет role==="owner" на сервере)
    client-form.tsx                 — форма создания/редактирования клиента, включает камеру
    camera-capture.tsx              — снимок с веб-камеры (getUserMedia) → Blob → загрузка в Storage при сабмите формы
    new/page.tsx                    — страница создания клиента
    [id]/
      page.tsx                     — карточка клиента, грузит client+subscriptions+payments+checkIns+currentUser параллельно
      actions.ts                   — addSubscription, addPayment, addCheckIn
      client-header.tsx            — фото (160×160) + инфо + кнопки Редактировать/Удалить(owner)
      subscriptions-section.tsx    — таблица абонементов + форма добавления
      payments-section.tsx         — таблица оплат + форма (с опциональной привязкой к абонементу)
      class-enrollments-section.tsx — записи клиента на групповые занятия (последние 20)
      checkins-section.tsx         — история посещений + кнопка "Отметить приход"; при сетевой
                                       ошибке кладёт чек-ин в офлайн-очередь (lib/offline-queue.ts)
                                       и показывает его в списке с пометкой "ждёт синхронизации"
  offline-sync.tsx                  — без UI, смонтирован в layout при наличии юзера: при загрузке
                                       и по событию "online" досылает очередь через addCheckIn,
                                       затем router.refresh() и CustomEvent "offline-queue-synced"

lib/
  auth.ts                           — getCurrentUser(): { id, email, role } | null, читает app_metadata.role (не user_metadata — её юзер может менять сам)
  status.ts                         — все константы/форматтеры: STATUS_LABEL/STYLE, SUBSCRIPTION_TYPE_*,
                                       PAYMENT_METHOD_*, formatDate/formatDateTime/formatCurrency, getGymToday(), GYM_TIME_ZONE
  reminders.ts                      — getExpiringClients(), REMINDER_WINDOW_DAYS = 7
  offline-queue.ts                  — очередь чек-инов в IndexedDB (gym-crm-offline/pending_checkins):
                                       queueCheckIn/getQueuedCheckIns/syncQueuedCheckIns; чисто клиентский
                                       модуль (guard на typeof window), синхронизацией не занимается сам —
                                       это делает вызывающий (offline-sync.tsx)
  supabase/
    admin.ts                       — клиент с service_role (только сервер, обходит RLS)
    client.ts                      — browser client (createBrowserClient), для client components
    server.ts                      — server client (createServerClient, cookie-aware), для Server Components/Actions

public/
  manifest.json, service-worker.js, offline.html, icons/  — PWA

supabase/*.sql                      — миграции, ВСЕ уже выполнены в проекте (см. ниже про auth_policies.sql)
```

## Схема БД (Supabase Postgres)

| Таблица | Ключевые поля | Примечания |
|---|---|---|
| `clients` | full_name, phone, birth_date, photo_url, membership_status, membership_end_date | status: `active`\|`expired`\|`frozen` (англ., несмотря на русский UI) |
| `subscriptions` | client_id, type, start_date, end_date, status | **Создана пользователем до меня**, не мной. type: `unlimited`\|`single`\|`sessions`. Есть триггер (тоже не мой), синхронизирующий `clients.membership_status`/`membership_end_date` из активного абонемента |
| `payments` | client_id, subscription_id (nullable), amount, method, paid_at | method: `cash`\|`card`\|`kaspi` |
| `check_ins` | client_id, checked_in_at | просто лог посещений |
| `trainers` | full_name, phone | назначаются на занятия через group_classes.trainer_id |
| `group_classes` | name, trainer (устар. текст), trainer_id, weekday (1=Пн…7=Вс), start_time, duration_minutes | повторяется каждую неделю |
| `class_enrollments` | class_id, client_id, class_date | unique(class_id, client_id, class_date); лимита мест нет |
| Storage bucket `client-photos` | — | публичный бакет для фото с камеры |

RLS на всех 4 таблицах и на `storage.objects` (для `client-photos`) требует
`auth.role() = 'authenticated'` — анонимный доступ по publishable-ключу
запрещён везде.

⚠️ `supabase/auth_policies.sql` в репозитории — это то, что **должно** быть
применено, но SQL Editor в этом проекте Supabase не может выполнять
`DROP POLICY`/`ALTER TABLE` (падает `must be owner of relation X`, хотя
`pg_tables.tableowner = postgres`). Реальные политики создавались вручную
через Dashboard → Authentication → Policies. Файл — для справки/истории,
не для повторного запуска as-is.

## Известные грабли (уже наступали — не наступай снова)

1. **Не смешивай `next build` и `next dev` в одной `.next`.** После продакшен-сборки
   `.next` содержит несовместимые артефакты для dev-режима → почти все JS-чанки
   отдают 404, React не гидратируется, клики по кнопкам ничего не делают.
   Всегда `rm -rf .next` при переключении режимов.
2. **Service worker регистрируется только в production** (`app/register-sw.tsx`
   проверяет `NODE_ENV`). В dev он мешает — кэширует старый HTML, вызывает
   рассинхрон с новым JS-бандлом (ошибки гидратации) при живой разработке.
3. **Service worker не должен трогать не-GET запросы** — Server Actions идут
   через POST, а `Cache.put()` кидает исключение на не-GET. В fetch-хендлере
   первым делом `if (request.method !== "GET") return;`.
4. **Таймзона фиксирована на `Asia/Oral`** (`GYM_TIME_ZONE` в `lib/status.ts`).
   Сервер может рендериться в любом часовом поясе (UTC на Vercel, что угодно
   локально) — без явного `timeZone` в `toLocaleDateString` даты сдвигаются
   на день.
5. **Supabase-клиенты всегда с `cache: "no-store"`**, страницы с
   `export const dynamic = "force-dynamic"` — иначе `next build` падает
   ("Dynamic server usage") или показывает статичные закэшированные данные.
6. **Next.js `<Link>` не делает полный HTTP-запрос документа** (клиентская
   RSC-навигация) — офлайн-кэш service worker'а реально ловит только полные
   переходы (прямой заход по URL/перезагрузка), не клики по ссылкам.
7. **Камера (`camera-capture.tsx`)**: привязывать `stream` к `videoRef.current`
   нужно в `useEffect` по `isCameraOn`, а не сразу после `setIsCameraOn(true)` —
   `<video>` рендерится условно и ещё не смонтирован в момент вызова.
8. **Пароли/секреты не ввожу сам ни при каких обстоятельствах** — даже если
   пользователь явно даёт логин/пароль в чате. Тестирование логина — только
   руками пользователя или через Claude in Chrome с их подтверждением на
   каждом шаге, без ввода credentials с моей стороны.

## Роли и права

- `owner`: видит /analytics, видит и может нажать "Удалить" на карточке клиента
- `admin`: всё остальное (полный CRUD клиентов/абонементов/оплат/чек-инов)
- Проверка роли всегда дублируется на сервере (в Server Action), не только
  скрытием кнопки в UI — см. `deleteClient` в `app/clients/actions.ts`

## Что не реализовано (см. CLAUDE.md за планом)

- Расписание: лимит мест/лист ожидания, редактирование занятия (сейчас только
  добавить/удалить), отмена отдельного занятия на конкретную дату

## Офлайн-очередь чек-инов

Если "Отметить приход" не смог уйти на сервер (нет сети — `TypeError` от
`fetch` или `navigator.onLine === false`), запись кладётся в IndexedDB
(`lib/offline-queue.ts`) и сразу показывается в списке посещений с меткой
"офлайн · ждёт синхронизации". `app/offline-sync.tsx` смонтирован в
layout и досылает очередь через тот же Server Action `addCheckIn`: при
загрузке приложения и по событию `online`. Ограничение по конструкции: это
чисто клиентская JS-очередь, а не Background Sync API — синхронизация
происходит, только пока открыта вкладка с приложением (что и требовалось:
ресепшен не закрывает вкладку в течение смены). Страница карточки клиента
при этом должна быть уже открыта/закэширована до потери сети — см. пункт 6
в "Известные грабли" про то, что SW кэширует только полные переходы.
