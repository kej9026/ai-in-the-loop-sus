-- Function to get dashboard stats efficiently
create or replace function get_dashboard_stats(p_user_id uuid, p_media_type text default 'all')
returns json
language plpgsql
security definer
as $$
declare
  v_total bigint;
  v_this_month bigint;
  v_in_progress bigint;
  v_avg_rating numeric;
begin
  -- Total
  select count(*) into v_total
  from user_logs ul
  left join media_items mi on ul.media_id = mi.id
  where ul.user_id = p_user_id
  and (p_media_type = 'all' or mi.type = p_media_type);

  -- This Month
  select count(*) into v_this_month
  from user_logs ul
  left join media_items mi on ul.media_id = mi.id
  where ul.user_id = p_user_id
  and (p_media_type = 'all' or mi.type = p_media_type)
  and ul.created_at >= date_trunc('month', now());

  -- In Progress
  select count(*) into v_in_progress
  from user_logs ul
  left join media_items mi on ul.media_id = mi.id
  where ul.user_id = p_user_id
  and (p_media_type = 'all' or mi.type = p_media_type)
  and ul.status = 'in-progress';

  -- Avg Rating
  select coalesce(avg(ul.rating) filter (where ul.rating > 0), 0) into v_avg_rating
  from user_logs ul
  left join media_items mi on ul.media_id = mi.id
  where ul.user_id = p_user_id
  and (p_media_type = 'all' or mi.type = p_media_type);

  return json_build_object(
    'total', v_total,
    'thisMonth', v_this_month,
    'inProgress', v_in_progress,
    'avgRating', round(v_avg_rating, 1)
  );
end;
$$;
