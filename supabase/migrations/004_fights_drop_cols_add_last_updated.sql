-- Remove weight_class, fighter1_record, fighter2_record from fights
alter table public.fights
  drop column if exists weight_class,
  drop column if exists fighter1_record,
  drop column if exists fighter2_record;

-- Add last_updated (set on insert and on every update)
alter table public.fights
  add column if not exists last_updated timestamptz default now();

comment on column public.fights.last_updated is 'When the row was last updated';

-- Trigger to set last_updated on update
create or replace function public.set_fights_last_updated()
returns trigger
language plpgsql
as $$
begin
  new.last_updated = now();
  return new;
end;
$$;

drop trigger if exists fights_set_last_updated on public.fights;
create trigger fights_set_last_updated
  before update on public.fights
  for each row
  execute function public.set_fights_last_updated();
