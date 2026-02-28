-- Recent fights: check status and last updated time
select
  id,
  fighter1_name as fighter_a,
  fighter2_name as fighter_b,
  status,
  last_updated
from public.fights
order by last_updated desc
limit 10;
