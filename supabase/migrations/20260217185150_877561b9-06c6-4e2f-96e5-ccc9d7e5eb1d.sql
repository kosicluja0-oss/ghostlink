
-- 1. Create integration_links junction table
CREATE TABLE public.integration_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES public.integrations(id) ON DELETE CASCADE,
  link_id uuid NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(integration_id, link_id)
);

ALTER TABLE public.integration_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own integration_links"
ON public.integration_links FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.integrations i WHERE i.id = integration_links.integration_id AND i.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own integration_links"
ON public.integration_links FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.integrations i WHERE i.id = integration_links.integration_id AND i.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own integration_links"
ON public.integration_links FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.integrations i WHERE i.id = integration_links.integration_id AND i.user_id = auth.uid()
));

-- Migrate existing link_id data
INSERT INTO public.integration_links (integration_id, link_id)
SELECT id, link_id FROM public.integrations WHERE link_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 2. Rewrite get_link_analytics with FULL OUTER JOIN for correct conversion dates
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
          FROM clicks c
          WHERE c.link_id = p_link_id AND c.created_at >= v_cutoff
          GROUP BY DATE(c.created_at)
        ) ca
        FULL OUTER JOIN (
          SELECT DATE(cv.created_at) as day,
            COUNT(*) FILTER (WHERE cv.type = 'lead')::integer as lead_count,
            COUNT(*) FILTER (WHERE cv.type = 'sale')::integer as sale_count,
            COALESCE(SUM(cv.value) FILTER (WHERE cv.type = 'sale'), 0)::numeric as earnings
          FROM conversions cv
          JOIN clicks c ON c.id = cv.click_id
          WHERE c.link_id = p_link_id AND cv.created_at >= v_cutoff
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
            ca.click_count,
            cva.lead_count,
            cva.sale_count,
            cva.earnings
          FROM (
            SELECT COALESCE(c.source, 'direct') as source, COUNT(*)::integer as click_count
            FROM clicks c
            WHERE c.link_id = p_link_id AND c.created_at >= v_cutoff
            GROUP BY c.source
          ) ca
          FULL OUTER JOIN (
            SELECT COALESCE(c.source, 'direct') as source,
              COUNT(*) FILTER (WHERE cv.type = 'lead')::integer as lead_count,
              COUNT(*) FILTER (WHERE cv.type = 'sale')::integer as sale_count,
              COALESCE(SUM(cv.value) FILTER (WHERE cv.type = 'sale'), 0)::numeric as earnings
            FROM conversions cv
            JOIN clicks c ON c.id = cv.click_id
            WHERE c.link_id = p_link_id AND cv.created_at >= v_cutoff
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
            ca.click_count,
            cva.lead_count,
            cva.sale_count,
            cva.earnings
          FROM (
            SELECT COALESCE(UPPER(c.country), 'UNKNOWN') as country, COUNT(*)::integer as click_count
            FROM clicks c
            WHERE c.link_id = p_link_id AND c.created_at >= v_cutoff
            GROUP BY c.country
          ) ca
          FULL OUTER JOIN (
            SELECT COALESCE(UPPER(c.country), 'UNKNOWN') as country,
              COUNT(*) FILTER (WHERE cv.type = 'lead')::integer as lead_count,
              COUNT(*) FILTER (WHERE cv.type = 'sale')::integer as sale_count,
              COALESCE(SUM(cv.value) FILTER (WHERE cv.type = 'sale'), 0)::numeric as earnings
            FROM conversions cv
            JOIN clicks c ON c.id = cv.click_id
            WHERE c.link_id = p_link_id AND cv.created_at >= v_cutoff
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
          (SELECT COUNT(*) FROM conversions cv JOIN clicks c ON c.id = cv.click_id WHERE c.link_id = p_link_id AND cv.created_at >= v_cutoff AND cv.type = 'lead') as lead_count,
          (SELECT COUNT(*) FROM conversions cv JOIN clicks c ON c.id = cv.click_id WHERE c.link_id = p_link_id AND cv.created_at >= v_cutoff AND cv.type = 'sale') as sale_count,
          (SELECT COALESCE(SUM(cv.value), 0) FROM conversions cv JOIN clicks c ON c.id = cv.click_id WHERE c.link_id = p_link_id AND cv.created_at >= v_cutoff AND cv.type = 'sale') as total_earnings
      ) stats
    )
  ) INTO result;

  RETURN result;
END;
$function$;
