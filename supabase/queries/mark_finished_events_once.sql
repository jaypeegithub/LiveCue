-- One-time: set event_status = 'finished' for events where all fights are Finished.
-- Run after migration 005. Keeps existing past events labeled correctly.
update public.events e
set event_status = 'finished'
where e.event_status = 'upcoming'
  and not exists (
    select 1 from public.fights f
    where f.event_id = e.id and f.status != 'Finished'
  )
  and exists (select 1 from public.fights f where f.event_id = e.id);
