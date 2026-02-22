-- LiveCue UFC Notify: events, fights, subscriptions
-- Run this in Supabase SQL editor or via Supabase CLI

-- Events (one per UFC card/date)
create table if not exists ufc_events (
  id uuid primary key default gen_random_uuid(),
  espn_event_id text not null unique,
  name text not null,
  event_date date not null,
  venue text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Fights (one per bout; order_index = card order, 0 = first fight)
create table if not exists ufc_fights (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references ufc_events(id) on delete cascade,
  espn_competition_id text not null,
  fighter1_name text not null,
  fighter2_name text not null,
  weight_class text,
  order_index int not null,
  status text not null check (status in ('not_started', 'in_progress', 'complete')),
  winner_athlete_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(event_id, espn_competition_id)
);

create index if not exists ufc_fights_event_id on ufc_fights(event_id);
create index if not exists ufc_fights_status on ufc_fights(status);

-- User subscriptions: notify when the fight *before* this one completes
create table if not exists ufc_subscriptions (
  id uuid primary key default gen_random_uuid(),
  fight_id uuid not null references ufc_fights(id) on delete cascade,
  phone text not null,
  notified_at timestamptz,
  created_at timestamptz default now(),
  unique(fight_id, phone)
);

create index if not exists ufc_subscriptions_fight_id on ufc_subscriptions(fight_id);
create index if not exists ufc_subscriptions_phone on ufc_subscriptions(phone);
