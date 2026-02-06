
CREATE OR REPLACE FUNCTION public.get_daily_analytics(p_user_id uuid, p_days integer DEFAULT 180)
 RETURNS json
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE result json;
BEGIN
  WITH click_agg AS (
    SELECT DATE(c.created_at) as day, c.link_id::text, COUNT(*)::integer as click_count
    FROM clicks c JOIN links l ON l.id = c.link_id
    WHERE l.user_id = p_user_id AND c.created_at >= (CURRENT_DATE - p_days)
    GROUP BY DATE(c.created_at), c.link_id
  ),
  conv_agg AS (
    SELECT DATE(cv.created_at) as day, c.link_id::text,
      COUNT(*) FILTER (WHERE cv.type = 'lead')::integer as lead_count,
      COUNT(*) FILTER (WHERE cv.type = 'sale')::integer as sale_count,
      COALESCE(SUM(cv.value) FILTER (WHERE cv.type = 'sale'), 0)::numeric as earnings
    FROM conversions cv
    JOIN clicks c ON c.id = cv.click_id
    JOIN links l ON l.id = c.link_id
    WHERE l.user_id = p_user_id AND cv.created_at >= (CURRENT_DATE - p_days)
    GROUP BY DATE(cv.created_at), c.link_id
  )
  SELECT COALESCE(json_agg(row_to_json(combined)), '[]'::json) INTO result
  FROM (
    SELECT
      COALESCE(ca.day, cva.day)::text as date,
      COALESCE(ca.link_id, cva.link_id) as "linkId",
      COALESCE(ca.click_count, 0) as clicks,
      COALESCE(cva.lead_count, 0) as leads,
      COALESCE(cva.sale_count, 0) as sales,
      COALESCE(cva.earnings, 0)::numeric as earnings
    FROM click_agg ca
    FULL OUTER JOIN conv_agg cva ON ca.day = cva.day AND ca.link_id = cva.link_id
    ORDER BY COALESCE(ca.day, cva.day)
  ) combined;
  RETURN result;
END;
$function$;
