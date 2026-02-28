-- One-time: fix all event_date values that were stored as UTC (off by 1 day vs EST).
-- UFC events are evening US time, so UTC date was often the next day. Subtract 1 day.
update public.events
set event_date = (event_date - interval '1 day')::date;
