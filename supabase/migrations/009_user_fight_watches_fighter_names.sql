-- Add fighter names to user_fight_watches for easier troubleshooting (which fight without joining)
alter table public.user_fight_watches
  add column if not exists fighter1_name text,
  add column if not exists fighter2_name text;

comment on column public.user_fight_watches.fighter1_name is 'Fighter 1 name from the watched fight (denormalized for readability)';
comment on column public.user_fight_watches.fighter2_name is 'Fighter 2 name from the watched fight (denormalized for readability)';

-- Backfill from fights
update public.user_fight_watches u
set
  fighter1_name = f.fighter1_name,
  fighter2_name = f.fighter2_name
from public.fights f
where u.fight_id = f.id
  and (u.fighter1_name is distinct from f.fighter1_name or u.fighter2_name is distinct from f.fighter2_name);

-- Trigger: keep fighter names in sync when fight_id is set/updated
create or replace function public.sync_user_fight_watches_fighter_names()
returns trigger
language plpgsql
security definer
as $$
begin
  select fighter1_name, fighter2_name
  into new.fighter1_name, new.fighter2_name
  from public.fights
  where id = new.fight_id;
  return new;
end;
$$;

drop trigger if exists user_fight_watches_sync_fighter_names on public.user_fight_watches;
create trigger user_fight_watches_sync_fighter_names
  before insert or update of fight_id
  on public.user_fight_watches
  for each row
  execute function public.sync_user_fight_watches_fighter_names();
