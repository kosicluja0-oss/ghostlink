
CREATE OR REPLACE FUNCTION public.get_link_analytics(
  p_link_id uuid,
  p_days integer DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result json;
  v_cutoff timestamptz;
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id FROM links WHERE id = p_link_id;
  IF v_user_id IS NULL OR v_user_id != auth.uid() THEN
    RETURN json_build_object('error', 'unauthorized');
  END IF;

  IF p_days IS NOT NULL THEN
    v_cutoff := now() - (p_days || ' days')::interval;
  ELSE
    v_cutoff := '1970-01-01'::timestamptz;
  END IF;

  SELECT json_build_object(
    'daily_clicks', COALESCE((
      SELECT json_agg(row_to_json(d) ORDER BY d.date) FROM (
        SELECT
          DATE(c.created_at)::text as date,
          COUNT(*)::integer as clicks,
          COUNT(cv.id) FILTER (WHERE cv.type = 'lead')::integer as leads,
          COUNT(cv.id) FILTER (WHERE cv.type = 'sale')::integer as sales,
          COALESCE(SUM(cv.value) FILTER (WHERE cv.type = 'sale'), 0)::numeric as earnings
        FROM clicks c
        LEFT JOIN conversions cv ON cv.click_id = c.id
        WHERE c.link_id = p_link_id AND c.created_at >= v_cutoff
        GROUP BY DATE(c.created_at)
        ORDER BY DATE(c.created_at)
      ) d
    ), '[]'::json),
    'placements', COALESCE((
      SELECT json_agg(row_to_json(p)) FROM (
        SELECT
          COALESCE(c.source, 'direct') as source,
          COUNT(*)::integer as clicks,
          COUNT(cv.id) FILTER (WHERE cv.type = 'lead')::integer as leads,
          COUNT(cv.id) FILTER (WHERE cv.type = 'sale')::integer as sales,
          COALESCE(SUM(cv.value) FILTER (WHERE cv.type = 'sale'), 0)::numeric as earnings
        FROM clicks c
        LEFT JOIN conversions cv ON cv.click_id = c.id
        WHERE c.link_id = p_link_id AND c.created_at >= v_cutoff
        GROUP BY c.source
        ORDER BY COUNT(*) DESC
        LIMIT 10
      ) p
    ), '[]'::json),
    'countries', COALESCE((
      SELECT json_agg(row_to_json(co)) FROM (
        SELECT
          COALESCE(UPPER(c.country), 'UNKNOWN') as code,
          COUNT(*)::integer as clicks,
          COUNT(cv.id) FILTER (WHERE cv.type = 'lead')::integer as leads,
          COUNT(cv.id) FILTER (WHERE cv.type = 'sale')::integer as sales,
          COALESCE(SUM(cv.value) FILTER (WHERE cv.type = 'sale'), 0)::numeric as earnings
        FROM clicks c
        LEFT JOIN conversions cv ON cv.click_id = c.id
        WHERE c.link_id = p_link_id AND c.created_at >= v_cutoff
        GROUP BY c.country
        ORDER BY COUNT(*) DESC
        LIMIT 10
      ) co
    ), '[]'::json),
    'funnel', (
      SELECT json_build_object(
        'total_clicks', COALESCE(click_count, 0),
        'total_leads', COALESCE(lead_count, 0),
        'total_sales', COALESCE(sale_count, 0),
        'total_earnings', COALESCE(total_earnings, 0),
        'epc', CASE WHEN COALESCE(click_count, 0) > 0 THEN COALESCE(total_earnings, 0) / click_count ELSE 0 END,
        'conversion_rate', CASE WHEN COALESCE(click_count, 0) > 0 THEN (COALESCE(lead_count, 0)::numeric / click_count) * 100 ELSE 0 END
      )
      FROM (
        SELECT
          (SELECT COUNT(*) FROM clicks c WHERE c.link_id = p_link_id AND c.created_at >= v_cutoff) as click_count,
          (SELECT COUNT(*) FROM conversions cv JOIN clicks c ON c.id = cv.click_id WHERE c.link_id = p_link_id AND c.created_at >= v_cutoff AND cv.type = 'lead') as lead_count,
          (SELECT COUNT(*) FROM conversions cv JOIN clicks c ON c.id = cv.click_id WHERE c.link_id = p_link_id AND c.created_at >= v_cutoff AND cv.type = 'sale') as sale_count,
          (SELECT COALESCE(SUM(cv.value), 0) FROM conversions cv JOIN clicks c ON c.id = cv.click_id WHERE c.link_id = p_link_id AND c.created_at >= v_cutoff AND cv.type = 'sale') as total_earnings
      ) stats
    )
  ) INTO result;

  RETURN result;
END;
$function$;
