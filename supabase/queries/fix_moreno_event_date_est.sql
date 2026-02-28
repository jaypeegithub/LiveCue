-- One-time: fix event_date stored as UTC to EST for Moreno vs Kavanagh (and same-day UTC dates).
-- Moreno (2026-03-01T01:00Z = 28 Feb 8pm EST) was stored as 2026-03-01; should be 2026-02-28.
update public.events
set event_date = '2026-02-28'
where espn_event_id = '600057330'
  and event_date = '2026-03-01';

-- If you have other events with the same off-by-one (UTC date instead of EST), run for each:
-- update public.events set event_date = 'YYYY-MM-DD' where espn_event_id = '...' and event_date = '...';
