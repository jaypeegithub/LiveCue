-- Events: one row per UFC event
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  espn_event_id text not null unique,
  name text not null,
  event_date date,
  created_at timestamptz default now()
);

-- Fights: main card fights with fighter names and status
create table if not exists public.fights (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  espn_competition_id text not null,
  weight_class text,
  fighter1_name text not null,
  fighter2_name text not null,
  fighter1_record text,
  fighter2_record text,
  status text not null check (status in ('Finished', 'In progress', 'Not started')),
  order_index int not null,
  created_at timestamptz default now(),
  unique(event_id, espn_competition_id)
);

create index if not exists fights_event_id_idx on public.fights(event_id);
