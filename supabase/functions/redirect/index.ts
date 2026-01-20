import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    // Expected path: /redirect/[alias] or just the alias as a query param
    const alias = pathParts[pathParts.length - 1] || url.searchParams.get('alias');

    if (!alias) {
      console.log('No alias provided, redirecting to home');
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': '/' },
      });
    }

    console.log(`Processing redirect for alias: ${alias}`);

    // Create Supabase client with service role for full access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up the link by alias
    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('id, target_url, has_bridge_page, bridge_page_config')
      .eq('custom_alias', alias)
      .maybeSingle();

    if (linkError) {
      console.error('Error fetching link:', linkError);
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': '/' },
      });
    }

    if (!link) {
      console.log(`Link not found for alias: ${alias}`);
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': '/' },
      });
    }

    // Get source tracking parameter (from Smart Copy feature)
    const source = url.searchParams.get('s') || url.searchParams.get('source') || null;
    
    console.log(`Found link: ${link.id}, target: ${link.target_url}, source: ${source}`);

    // Log the click asynchronously with source tracking (don't await to minimize latency)
    supabase
      .from('clicks')
      .insert({ link_id: link.id, source: source })
      .then(({ error }) => {
        if (error) {
          console.error('Error logging click:', error);
        } else {
          console.log(`Click logged for link: ${link.id}, source: ${source}`);
        }
      });

    // Perform the redirect
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': link.target_url,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Redirect error:', error);
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, 'Location': '/' },
    });
  }
});
