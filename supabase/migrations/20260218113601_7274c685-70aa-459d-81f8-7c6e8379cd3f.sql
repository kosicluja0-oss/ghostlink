
-- 1. Add is_test column to conversions
ALTER TABLE public.conversions ADD COLUMN is_test boolean NOT NULL DEFAULT false;

-- 2. Mark existing test conversions
UPDATE public.conversions SET is_test = true
WHERE click_id IN (SELECT id FROM public.clicks WHERE source = 'ghost_link_test');

-- 3. Add RLS policy for DELETE on conversions (link owners only)
CREATE POLICY "Users can delete conversions for their own links"
ON public.conversions
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM clicks
  JOIN links ON links.id = clicks.link_id
  WHERE clicks.id = conversions.click_id AND links.user_id = auth.uid()
));

-- 4. Rewrite get_traffic_distribution with p_days and source unification
CREATE OR REPLACE FUNCTION public.get_traffic_distribution(p_user_id uuid, p_days integer DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE result json;
  v_cutoff timestamptz;
BEGIN
  IF p_days IS NOT NULL THEN
    v_cutoff := now() - (p_days || ' days')::interval;
  ELSE
    v_cutoff := '1970-01-01'::timestamptz;
  END IF;

  SELECT json_build_object(
    'sources', COALESCE((
      SELECT json_agg(row_to_json(s)) FROM (
        SELECT
          unified_source as source,
          SUM(click_count)::integer as clicks,
          SUM(lead_count)::integer as leads,
          SUM(sale_count)::integer as sales,
          SUM(earnings)::numeric as earnings
        FROM (
          SELECT
            CASE
              WHEN c.source IS NULL OR c.source = 'direct' THEN 'direct'
              ELSE c.source
            END as unified_source,
            COUNT(DISTINCT c.id)::integer as click_count,
            COUNT(cv.id) FILTER (WHERE cv.type = 'lead' AND (cv.is_test = false))::integer as lead_count,
            COUNT(cv.id) FILTER (WHERE cv.type = 'sale' AND (cv.is_test = false))::integer as sale_count,
            COALESCE(SUM(cv.value) FILTER (WHERE cv.type = 'sale' AND (cv.is_test = false)), 0)::numeric as earnings
          FROM clicks c
          JOIN links l ON l.id = c.link_id
          LEFT JOIN conversions cv ON cv.click_id = c.id
          WHERE l.user_id = p_user_id AND c.created_at >= v_cutoff
          GROUP BY c.source
        ) raw_sources
        GROUP BY unified_source
        ORDER BY clicks DESC
        LIMIT 15
      ) s
    ), '[]'::json),
    'countries', COALESCE((
      SELECT json_agg(row_to_json(co)) FROM (
        SELECT
          COALESCE(c.country, 'UNKNOWN') as country,
          COUNT(DISTINCT c.id)::integer as clicks,
          COUNT(cv.id) FILTER (WHERE cv.type = 'lead' AND (cv.is_test = false))::integer as leads,
          COUNT(cv.id) FILTER (WHERE cv.type = 'sale' AND (cv.is_test = false))::integer as sales,
          COALESCE(SUM(cv.value) FILTER (WHERE cv.type = 'sale' AND (cv.is_test = false)), 0)::numeric as earnings
        FROM clicks c
        JOIN links l ON l.id = c.link_id
        LEFT JOIN conversions cv ON cv.click_id = c.id
        WHERE l.user_id = p_user_id AND c.created_at >= v_cutoff
        GROUP BY c.country
        ORDER BY COUNT(DISTINCT c.id) DESC
        LIMIT 15
      ) co
    ), '[]'::json)
  ) INTO result;
  RETURN result;
END;
$function$;

-- 5. Update get_user_stats to exclude test conversions
CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE result json;
BEGIN
  SELECT json_build_object(
    'total_clicks', (
      SELECT COUNT(*) FROM clicks c
      JOIN links l ON l.id = c.link_id
      WHERE l.user_id = p_user_id
    ),
    'total_leads', (
      SELECT COUNT(*) FROM conversions cv
      JOIN clicks c ON c.id = cv.click_id
      JOIN links l ON l.id = c.link_id
      WHERE l.user_id = p_user_id AND cv.type = 'lead' AND cv.is_test = false
    ),
    'total_sales', (
      SELECT COUNT(*) FROM conversions cv
      JOIN clicks c ON c.id = cv.click_id
      JOIN links l ON l.id = c.link_id
      WHERE l.user_id = p_user_id AND cv.type = 'sale' AND cv.is_test = false
    ),
    'total_earnings', COALESCE((
      SELECT SUM(cv.value) FROM conversions cv
      JOIN clicks c ON c.id = cv.click_id
      JOIN links l ON l.id = c.link_id
      WHERE l.user_id = p_user_id AND cv.type = 'sale' AND cv.is_test = false
    ), 0)
  ) INTO result;
  RETURN result;
END;
$function$;

-- 6. Update get_daily_analytics to exclude test conversions
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
    WHERE l.user_id = p_user_id AND cv.created_at >= (CURRENT_DATE - p_days) AND cv.is_test = false
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

-- 7. Update get_link_analytics to exclude test conversions
CREATE OR REPLACE FUNCTION public.get_link_analytics(p_link_id uuid, p_days integer DEFAULT NULL)
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
      SELECT json_agg(row_to_json(combined) ORDER BY combined.date) FROM (
        SELECT
          COALESCE(ca.day, cva.day)::text as date,
          COALESCE(ca.click_count, 0) as clicks,
          COALESCE(cva.lead_count, 0) as leads,
          COALESCE(cva.sale_count, 0) as sales,
          COALESCE(cva.earnings, 0)::numeric as earnings
        FROM (
          SELECT DATE(c.created_at) as day, COUNT(*)::integer as click_count
          FROM clicks c WHERE c.link_id = p_link_id AND c.created_at >= v_cutoff
          GROUP BY DATE(c.created_at)
        ) ca
        FULL OUTER JOIN (
          SELECT DATE(cv.created_at) as day,
            COUNT(*) FILTER (WHERE cv.type = 'lead')::integer as lead_count,
            COUNT(*) FILTER (WHERE cv.type = 'sale')::integer as sale_count,
            COALESCE(SUM(cv.value) FILTER (WHERE cv.type = 'sale'), 0)::numeric as earnings
          FROM conversions cv JOIN clicks c ON c.id = cv.click_id
          WHERE c.link_id = p_link_id AND cv.created_at >= v_cutoff AND cv.is_test = false
          GROUP BY DATE(cv.created_at)
        ) cva ON ca.day = cva.day
      ) combined
    ), '[]'::json),
    'placements', COALESCE((
      SELECT json_agg(row_to_json(p)) FROM (
        SELECT
          COALESCE(combined_p.source, 'direct') as source,
          COALESCE(combined_p.click_count, 0) as clicks,
          COALESCE(combined_p.lead_count, 0) as leads,
          COALESCE(combined_p.sale_count, 0) as sales,
          COALESCE(combined_p.earnings, 0)::numeric as earnings
        FROM (
          SELECT
            COALESCE(ca.source, cva.source) as source,
            ca.click_count, cva.lead_count, cva.sale_count, cva.earnings
          FROM (
            SELECT COALESCE(c.source, 'direct') as source, COUNT(*)::integer as click_count
            FROM clicks c WHERE c.link_id = p_link_id AND c.created_at >= v_cutoff
            GROUP BY c.source
          ) ca
          FULL OUTER JOIN (
            SELECT COALESCE(c.source, 'direct') as source,
              COUNT(*) FILTER (WHERE cv.type = 'lead')::integer as lead_count,
              COUNT(*) FILTER (WHERE cv.type = 'sale')::integer as sale_count,
              COALESCE(SUM(cv.value) FILTER (WHERE cv.type = 'sale'), 0)::numeric as earnings
            FROM conversions cv JOIN clicks c ON c.id = cv.click_id
            WHERE c.link_id = p_link_id AND cv.created_at >= v_cutoff AND cv.is_test = false
            GROUP BY c.source
          ) cva ON ca.source = cva.source
        ) combined_p
        ORDER BY COALESCE(combined_p.click_count, 0) DESC
        LIMIT 10
      ) p
    ), '[]'::json),
    'countries', COALESCE((
      SELECT json_agg(row_to_json(co)) FROM (
        SELECT
          COALESCE(combined_c.code, 'UNKNOWN') as code,
          COALESCE(combined_c.click_count, 0) as clicks,
          COALESCE(combined_c.lead_count, 0) as leads,
          COALESCE(combined_c.sale_count, 0) as sales,
          COALESCE(combined_c.earnings, 0)::numeric as earnings
        FROM (
          SELECT
            COALESCE(ca.country, cva.country) as code,
            ca.click_count, cva.lead_count, cva.sale_count, cva.earnings
          FROM (
            SELECT COALESCE(UPPER(c.country), 'UNKNOWN') as country, COUNT(*)::integer as click_count
            FROM clicks c WHERE c.link_id = p_link_id AND c.created_at >= v_cutoff
            GROUP BY c.country
          ) ca
          FULL OUTER JOIN (
            SELECT COALESCE(UPPER(c.country), 'UNKNOWN') as country,
              COUNT(*) FILTER (WHERE cv.type = 'lead')::integer as lead_count,
              COUNT(*) FILTER (WHERE cv.type = 'sale')::integer as sale_count,
              COALESCE(SUM(cv.value) FILTER (WHERE cv.type = 'sale'), 0)::numeric as earnings
            FROM conversions cv JOIN clicks c ON c.id = cv.click_id
            WHERE c.link_id = p_link_id AND cv.created_at >= v_cutoff AND cv.is_test = false
            GROUP BY c.country
          ) cva ON ca.country = cva.country
        ) combined_c
        ORDER BY COALESCE(combined_c.click_count, 0) DESC
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
          (SELECT COUNT(*) FROM conversions cv JOIN clicks c ON c.id = cv.click_id WHERE c.link_id = p_link_id AND cv.created_at >= v_cutoff AND cv.type = 'lead' AND cv.is_test = false) as lead_count,
          (SELECT COUNT(*) FROM conversions cv JOIN clicks c ON c.id = cv.click_id WHERE c.link_id = p_link_id AND cv.created_at >= v_cutoff AND cv.type = 'sale' AND cv.is_test = false) as sale_count,
          (SELECT COALESCE(SUM(cv.value), 0) FROM conversions cv JOIN clicks c ON c.id = cv.click_id WHERE c.link_id = p_link_id AND cv.created_at >= v_cutoff AND cv.type = 'sale' AND cv.is_test = false) as total_earnings
      ) stats
    )
  ) INTO result;
  RETURN result;
END;
$function$;

-- 8. Update get_recent_activity to exclude test conversions
CREATE OR REPLACE FUNCTION public.get_recent_activity(p_user_id uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0, p_type text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE result json;
BEGIN
  WITH all_events AS (
    SELECT c.id::text, 'click'::text as event_type, c.link_id::text, l.custom_alias as link_alias,
           c.source, c.country, 0::numeric as value, c.created_at
    FROM clicks c JOIN links l ON l.id = c.link_id
    WHERE l.user_id = p_user_id
    UNION ALL
    SELECT cv.id::text, cv.type as event_type, c.link_id::text, l.custom_alias as link_alias,
           c.source, c.country, cv.value, cv.created_at
    FROM conversions cv
    JOIN clicks c ON c.id = cv.click_id
    JOIN links l ON l.id = c.link_id
    WHERE l.user_id = p_user_id AND cv.is_test = false
  ),
  filtered AS (
    SELECT * FROM all_events
    WHERE (p_type IS NULL OR event_type = p_type)
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET p_offset
  ),
  total AS (
    SELECT COUNT(*)::integer as cnt FROM all_events
    WHERE (p_type IS NULL OR event_type = p_type)
  )
  SELECT json_build_object(
    'events', COALESCE((SELECT json_agg(row_to_json(f)) FROM filtered f), '[]'::json),
    'total_count', (SELECT cnt FROM total)
  ) INTO result;
  RETURN result;
END;
$function$;

-- 9. Update get_period_stats to exclude test conversions
CREATE OR REPLACE FUNCTION public.get_period_stats(p_user_id uuid, p_start timestamptz, p_end timestamptz)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE result json;
BEGIN
  SELECT json_build_object(
    'clicks', (
      SELECT COUNT(*) FROM clicks c JOIN links l ON l.id = c.link_id
      WHERE l.user_id = p_user_id AND c.created_at >= p_start AND c.created_at < p_end
    ),
    'leads', (
      SELECT COUNT(*) FROM conversions cv JOIN clicks c ON c.id = cv.click_id JOIN links l ON l.id = c.link_id
      WHERE l.user_id = p_user_id AND cv.type = 'lead' AND cv.created_at >= p_start AND cv.created_at < p_end AND cv.is_test = false
    ),
    'sales', (
      SELECT COUNT(*) FROM conversions cv JOIN clicks c ON c.id = cv.click_id JOIN links l ON l.id = c.link_id
      WHERE l.user_id = p_user_id AND cv.type = 'sale' AND cv.created_at >= p_start AND cv.created_at < p_end AND cv.is_test = false
    ),
    'earnings', COALESCE((
      SELECT SUM(cv.value) FROM conversions cv JOIN clicks c ON c.id = cv.click_id JOIN links l ON l.id = c.link_id
      WHERE l.user_id = p_user_id AND cv.type = 'sale' AND cv.created_at >= p_start AND cv.created_at < p_end AND cv.is_test = false
    ), 0)
  ) INTO result;
  RETURN result;
END;
$function$;

-- 10. Update get_link_stats to exclude test conversions
CREATE OR REPLACE FUNCTION public.get_link_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE result json;
BEGIN
  SELECT COALESCE(json_agg(row_to_json(ls)), '[]'::json) INTO result
  FROM (
    SELECT
      l.id::text as link_id,
      l.custom_alias as alias,
      l.target_url,
      l.created_at,
      COALESCE(click_stats.click_count, 0)::integer as clicks,
      COALESCE(conv_stats.lead_count, 0)::integer as leads,
      COALESCE(conv_stats.sale_count, 0)::integer as sales,
      COALESCE(conv_stats.earnings, 0)::numeric as earnings
    FROM links l
    LEFT JOIN (
      SELECT link_id, COUNT(*) as click_count
      FROM clicks GROUP BY link_id
    ) click_stats ON click_stats.link_id = l.id
    LEFT JOIN (
      SELECT c.link_id,
        COUNT(*) FILTER (WHERE cv.type = 'lead') as lead_count,
        COUNT(*) FILTER (WHERE cv.type = 'sale') as sale_count,
        COALESCE(SUM(cv.value) FILTER (WHERE cv.type = 'sale'), 0) as earnings
      FROM conversions cv JOIN clicks c ON c.id = cv.click_id
      WHERE cv.is_test = false
      GROUP BY c.link_id
    ) conv_stats ON conv_stats.link_id = l.id
    WHERE l.user_id = p_user_id
    ORDER BY l.created_at DESC
  ) ls;
  RETURN result;
END;
$function$;
