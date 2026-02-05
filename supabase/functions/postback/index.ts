import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Try to extract a monetary value from any JSON payload
function extractValue(payload: Record<string, unknown>): number {
  const valueKeys = ['value', 'price', 'amount', 'total', 'revenue', 'subtotal', 'sale_price', 'unit_amount'];
  
  for (const key of valueKeys) {
    if (key in payload && typeof payload[key] === 'number') {
      return payload[key] as number;
    }
    if (key in payload && typeof payload[key] === 'string') {
      const parsed = parseFloat(payload[key] as string);
      if (!isNaN(parsed)) return parsed;
    }
  }

  // Search one level deep in nested objects (e.g. Stripe's data.object.amount)
  for (const val of Object.values(payload)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const nested = val as Record<string, unknown>;
      for (const key of valueKeys) {
        if (key in nested && typeof nested[key] === 'number') {
          return nested[key] as number;
        }
        if (key in nested && typeof nested[key] === 'string') {
          const parsed = parseFloat(nested[key] as string);
          if (!isNaN(parsed)) return parsed;
        }
      }
    }
  }

  return 0;
}

// Detect conversion type from payload
function detectType(payload: Record<string, unknown>): string {
  const typeKeys = ['type', 'event', 'event_type', 'action'];
  for (const key of typeKeys) {
    if (key in payload && typeof payload[key] === 'string') {
      const val = (payload[key] as string).toLowerCase();
      if (val.includes('lead') || val.includes('subscribe') || val.includes('signup') || val.includes('opt')) {
        return 'lead';
      }
    }
  }
  // Default to sale if value > 0, otherwise lead
  const value = extractValue(payload);
  return value > 0 ? 'sale' : 'lead';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const click_id = url.searchParams.get('click_id');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // =============================
    // MODE A: Token-based (for integrations)
    // =============================
    if (token) {
      // Look up integration by token
      const { data: integration, error: intError } = await supabase
        .from('integrations')
        .select('id, user_id, service_id, link_id, status')
        .eq('webhook_token', token)
        .single();

      if (intError || !integration) {
        console.error('Invalid token:', token, intError);
        return new Response(
          JSON.stringify({ status: 'error', message: 'Invalid webhook token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Parse payload
      let payload: Record<string, unknown> = {};
      try {
        if (req.method === 'POST' || req.method === 'PUT') {
          payload = await req.json();
        }
        // Also merge query params
        for (const [key, val] of url.searchParams.entries()) {
          if (key !== 'token') payload[key] = val;
        }
      } catch {
        // If JSON parsing fails, just use query params
        for (const [key, val] of url.searchParams.entries()) {
          if (key !== 'token') payload[key] = val;
        }
      }

      const value = extractValue(payload);
      const type = detectType(payload);
      const linkId = integration.link_id;

      // Find the most recent click for this link (for attribution)
      let attributedClickId: string | null = null;

      if (linkId) {
        const { data: recentClick } = await supabase
          .from('clicks')
          .select('id')
          .eq('link_id', linkId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (recentClick) {
          attributedClickId = recentClick.id;
        }
      }

      // If no click exists, create a virtual click for record-keeping
      if (!attributedClickId && linkId) {
        const { data: virtualClick, error: vcError } = await supabase
          .from('clicks')
          .insert({
            link_id: linkId,
            source: `integration:${integration.service_id}`,
          })
          .select('id')
          .single();

        if (!vcError && virtualClick) {
          attributedClickId = virtualClick.id;
        }
      }

      if (!attributedClickId) {
        console.error('No link assigned to integration or click creation failed:', integration.id);
        return new Response(
          JSON.stringify({ status: 'error', message: 'No link assigned to this integration. Assign a link in Ghost Link settings.' }),
          { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insert conversion
      const { error: insertError } = await supabase
        .from('conversions')
        .insert({
          click_id: attributedClickId,
          type,
          value: isNaN(value) ? 0 : value,
        });

      if (insertError) {
        console.error('Error inserting conversion:', insertError);
        return new Response(
          JSON.stringify({ status: 'error', message: 'Failed to record conversion' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update integration status to connected on first successful event
      if (integration.status === 'pending') {
        await supabase
          .from('integrations')
          .update({ 
            status: 'connected', 
            connected_at: new Date().toISOString(),
            last_verified_at: new Date().toISOString()
          })
          .eq('id', integration.id);
      } else {
        await supabase
          .from('integrations')
          .update({ last_verified_at: new Date().toISOString() })
          .eq('id', integration.id);
      }

      console.log('Token conversion recorded:', { token, type, value, click_id: attributedClickId, service: integration.service_id });

      return new Response(
        JSON.stringify({ status: 'success', recorded: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =============================
    // MODE B: Click ID (for affiliates & developers) — unchanged
    // =============================
    if (click_id) {
      let type: string | null = null;
      let value: number = 0;

      if (req.method === 'GET') {
        type = url.searchParams.get('type');
        const valueParam = url.searchParams.get('value');
        value = valueParam ? parseFloat(valueParam) : 0;
      } else if (req.method === 'POST') {
        const body = await req.json();
        type = body.type;
        value = body.value ?? 0;
      } else {
        return new Response(
          JSON.stringify({ status: 'error', message: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!type || !['lead', 'sale'].includes(type)) {
        console.error('Invalid type parameter:', type);
        return new Response(
          JSON.stringify({ status: 'error', message: 'Invalid type. Must be "lead" or "sale"' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(click_id)) {
        console.error('Invalid click_id format:', click_id);
        return new Response(
          JSON.stringify({ status: 'error', message: 'Invalid click_id format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify click exists
      const { data: click, error: clickError } = await supabase
        .from('clicks')
        .select('id')
        .eq('id', click_id)
        .single();

      if (clickError || !click) {
        console.error('Click not found:', click_id, clickError);
        return new Response(
          JSON.stringify({ status: 'error', message: 'Click ID not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insert conversion
      const { error: insertError } = await supabase
        .from('conversions')
        .insert({
          click_id,
          type,
          value: isNaN(value) ? 0 : value,
        });

      if (insertError) {
        console.error('Error inserting conversion:', insertError);
        return new Response(
          JSON.stringify({ status: 'error', message: 'Failed to record conversion' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Click conversion recorded:', { click_id, type, value });

      return new Response(
        JSON.stringify({ status: 'success', recorded: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No token or click_id provided
    return new Response(
      JSON.stringify({ status: 'error', message: 'Missing required parameter: token or click_id' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Postback error:', error);
    return new Response(
      JSON.stringify({ status: 'error', message: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
