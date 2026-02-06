
-- ============================================================
-- P0 FIX: Server-side aggregation functions to replace
-- client-side processing that hits the 1000-row Supabase limit.
-- ============================================================

-- 1. Aggregated stats totals for a user (replaces counting all clicks in memory)
CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
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
      WHERE l.user_id = p_user_id AND cv.type = 'lead'
    ),
    'total_sales', (
      SELECT COUNT(*) FROM conversions cv
      JOIN clicks c ON c.id = cv.click_id
      JOIN links l ON l.id = c.link_id
      WHERE l.user_id = p_user_id AND cv.type = 'sale'
    ),
    'total_earnings', COALESCE((
      SELECT SUM(cv.value) FROM conversions cv
      JOIN clicks c ON c.id = cv.click_id
      JOIN links l ON l.id = c.link_id
      WHERE l.user_id = p_user_id AND cv.type = 'sale'
    ), 0)
  ) INTO result;
  RETURN result;
END;
$$;

-- 2. Daily analytics grouped by date+link for chart (replaces iterating all clicks)
CREATE OR REPLACE FUNCTION public.get_daily_analytics(p_user_id uuid, p_days integer DEFAULT 180)
RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
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
      COUNT(*) FILTER (WHERE cv.type = 'sale')::integer as sale_count
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
      COALESCE(cva.sale_count, 0) as sales
    FROM click_agg ca
    FULL OUTER JOIN conv_agg cva ON ca.day = cva.day AND ca.link_id = cva.link_id
    ORDER BY COALESCE(ca.day, cva.day)
  ) combined;
  RETURN result;
END;
$$;

-- 3. Paginated recent activity (replaces downloading all clicks+conversions)
CREATE OR REPLACE FUNCTION public.get_recent_activity(
  p_user_id uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_type text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
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
    WHERE l.user_id = p_user_id
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
$$;

-- 4. Source and country distributions (replaces iterating all clicks for placements/countries)
CREATE OR REPLACE FUNCTION public.get_traffic_distribution(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE result json;
BEGIN
  SELECT json_build_object(
    'sources', COALESCE((
      SELECT json_agg(row_to_json(s)) FROM (
        SELECT COALESCE(c.source, 'direct') as source, COUNT(*)::integer as count
        FROM clicks c JOIN links l ON l.id = c.link_id WHERE l.user_id = p_user_id
        GROUP BY c.source ORDER BY count DESC LIMIT 15
      ) s
    ), '[]'::json),
    'countries', COALESCE((
      SELECT json_agg(row_to_json(co)) FROM (
        SELECT COALESCE(c.country, 'UNKNOWN') as country, COUNT(*)::integer as count
        FROM clicks c JOIN links l ON l.id = c.link_id WHERE l.user_id = p_user_id
        GROUP BY c.country ORDER BY count DESC LIMIT 15
      ) co
    ), '[]'::json)
  ) INTO result;
  RETURN result;
END;
$$;

-- 5. Period stats for trend calculations (replaces fetching all clicks for 2 periods)
CREATE OR REPLACE FUNCTION public.get_period_stats(
  p_user_id uuid,
  p_start timestamptz,
  p_end timestamptz
)
RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE result json;
BEGIN
  SELECT json_build_object(
    'clicks', (
      SELECT COUNT(*) FROM clicks c JOIN links l ON l.id = c.link_id
      WHERE l.user_id = p_user_id AND c.created_at >= p_start AND c.created_at < p_end
    ),
    'leads', (
      SELECT COUNT(*) FROM conversions cv JOIN clicks c ON c.id = cv.click_id JOIN links l ON l.id = c.link_id
      WHERE l.user_id = p_user_id AND cv.type = 'lead' AND cv.created_at >= p_start AND cv.created_at < p_end
    ),
    'sales', (
      SELECT COUNT(*) FROM conversions cv JOIN clicks c ON c.id = cv.click_id JOIN links l ON l.id = c.link_id
      WHERE l.user_id = p_user_id AND cv.type = 'sale' AND cv.created_at >= p_start AND cv.created_at < p_end
    ),
    'earnings', COALESCE((
      SELECT SUM(cv.value) FROM conversions cv JOIN clicks c ON c.id = cv.click_id JOIN links l ON l.id = c.link_id
      WHERE l.user_id = p_user_id AND cv.type = 'sale' AND cv.created_at >= p_start AND cv.created_at < p_end
    ), 0)
  ) INTO result;
  RETURN result;
END;
$$;

-- 6. Link stats aggregation (fixes N+1 queries in useLinks - 3 queries per link → 1 total)
CREATE OR REPLACE FUNCTION public.get_link_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
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
      GROUP BY c.link_id
    ) conv_stats ON conv_stats.link_id = l.id
    WHERE l.user_id = p_user_id
    ORDER BY l.created_at DESC
  ) ls;
  RETURN result;
END;
$$;
