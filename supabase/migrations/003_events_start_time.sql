-- Event start time (from ESPN) so the fight-status cron can skip work until the event has started
alter table public.events
  add column if not exists event_start_time timestamptz;

comment on column public.events.event_start_time is 'When the event starts (ESPN event.date); used to avoid calling ESPN every minute before start';
