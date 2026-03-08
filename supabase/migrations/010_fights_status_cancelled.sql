-- Allow 'Cancelled' status on fights (from ESPN when a bout is canceled).
alter table public.fights
  drop constraint if exists fights_status_check;

alter table public.fights
  add constraint fights_status_check
  check (status in ('Finished', 'In progress', 'Not started', 'Cancelled'));
