-- Notification logs: one row per notification sent (e.g. "your fight is up")
create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fight_id uuid not null references public.fights(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists notification_logs_user_id_idx on public.notification_logs(user_id);
create index if not exists notification_logs_fight_id_idx on public.notification_logs(fight_id);

alter table public.notification_logs enable row level security;

-- Users can only read their own rows
create policy "Users can read own notification_logs"
  on public.notification_logs
  for select
  using (auth.uid() = user_id);

-- Users can insert rows for themselves (e.g. when app records a sent notification)
create policy "Users can insert own notification_logs"
  on public.notification_logs
  for insert
  with check (auth.uid() = user_id);
