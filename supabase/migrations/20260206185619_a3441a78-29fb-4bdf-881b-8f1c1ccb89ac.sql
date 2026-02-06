
-- Update get_traffic_distribution to return multi-metric breakdowns (clicks, leads, sales, earnings)
-- per source and per country, so the frontend can display "Top by X" for any metric.
CREATE OR REPLACE FUNCTION public.get_traffic_distribution(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE result json;
BEGIN
  SELECT json_build_object(
    'sources', COALESCE((
      SELECT json_agg(row_to_json(s)) FROM (
        SELECT
          COALESCE(c.source, 'direct') as source,
          COUNT(*)::integer as clicks,
          COUNT(cv.id) FILTER (WHERE cv.type = 'lead')::integer as leads,
          COUNT(cv.id) FILTER (WHERE cv.type = 'sale')::integer as sales,
          COALESCE(SUM(cv.value) FILTER (WHERE cv.type = 'sale'), 0)::numeric as earnings
        FROM clicks c
        JOIN links l ON l.id = c.link_id
        LEFT JOIN conversions cv ON cv.click_id = c.id
        WHERE l.user_id = p_user_id
        GROUP BY c.source
        ORDER BY COUNT(*) DESC
        LIMIT 15
      ) s
    ), '[]'::json),
    'countries', COALESCE((
      SELECT json_agg(row_to_json(co)) FROM (
        SELECT
          COALESCE(c.country, 'UNKNOWN') as country,
          COUNT(*)::integer as clicks,
          COUNT(cv.id) FILTER (WHERE cv.type = 'lead')::integer as leads,
          COUNT(cv.id) FILTER (WHERE cv.type = 'sale')::integer as sales,
          COALESCE(SUM(cv.value) FILTER (WHERE cv.type = 'sale'), 0)::numeric as earnings
        FROM clicks c
        JOIN links l ON l.id = c.link_id
        LEFT JOIN conversions cv ON cv.click_id = c.id
        WHERE l.user_id = p_user_id
        GROUP BY c.country
        ORDER BY COUNT(*) DESC
        LIMIT 15
      ) co
    ), '[]'::json)
  ) INTO result;
  RETURN result;
END;
$function$;
