-- Add notification_preference to user_fight_watches (sms or call)
alter table public.user_fight_watches
  add column if not exists notification_preference text not null default 'sms'
    check (notification_preference in ('sms', 'call'));

comment on column public.user_fight_watches.notification_preference is 'How the user wants to be notified: sms or call';

-- RLS so users can only manage their own rows (required for /api/watch with anon + JWT)
alter table public.user_fight_watches enable row level security;

create policy "Users can read own user_fight_watches"
  on public.user_fight_watches for select
  using (auth.uid() = user_id);

create policy "Users can insert own user_fight_watches"
  on public.user_fight_watches for insert
  with check (auth.uid() = user_id);

create policy "Users can update own user_fight_watches"
  on public.user_fight_watches for update
  using (auth.uid() = user_id);
