-- User watch list: which fight a user wants to be notified about (e.g. "up next")
create table if not exists public.user_fight_watches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fight_id uuid not null references public.fights(id) on delete cascade,
  opted_in boolean not null default true,
  created_at timestamptz not null default now(),
  unique(user_id, fight_id)
);

create index if not exists user_fight_watches_fight_id_idx on public.user_fight_watches(fight_id);
create index if not exists user_fight_watches_user_id_idx on public.user_fight_watches(user_id);
