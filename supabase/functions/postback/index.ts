import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse parameters from query string (GET) or body (POST)
    let click_id: string | null = null;
    let type: string | null = null;
    let value: number = 0;

    if (req.method === 'GET') {
      const url = new URL(req.url);
      click_id = url.searchParams.get('click_id');
      type = url.searchParams.get('type');
      const valueParam = url.searchParams.get('value');
      value = valueParam ? parseFloat(valueParam) : 0;
    } else if (req.method === 'POST') {
      const body = await req.json();
      click_id = body.click_id;
      type = body.type;
      value = body.value ?? 0;
    } else {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required parameters
    if (!click_id) {
      console.error('Missing click_id parameter');
      return new Response(
        JSON.stringify({ status: 'error', message: 'Missing required parameter: click_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify click_id exists in clicks table
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

    // Insert conversion record
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

    console.log('Conversion recorded:', { click_id, type, value });

    return new Response(
      JSON.stringify({ status: 'success', recorded: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Postback error:', error);
    return new Response(
      JSON.stringify({ status: 'error', message: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
