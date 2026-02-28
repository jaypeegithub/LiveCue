-- Mark events as upcoming or finished (for keeping track of watched events)
alter table public.events
  add column if not exists event_status text not null default 'upcoming'
    check (event_status in ('upcoming', 'finished'));

comment on column public.events.event_status is 'upcoming = not yet finished; finished = all fights done (user can use for watch history)';
