import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BridgePageConfig {
  headline: string;
  description: string;
  ctaText: string;
  delaySeconds: number;
}

// Map of country codes to country names (for logging purposes)
const getCountryFromIP = async (ip: string): Promise<string | null> => {
  try {
    // Use ip-api.com free service (no API key required, 45 requests per minute limit)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`);
    if (response.ok) {
      const data = await response.json();
      if (data.countryCode) {
        return data.countryCode;
      }
    }
  } catch (error) {
    console.error('Error fetching country from IP:', error);
  }
  return null;
};

// Generate bridge page HTML
const generateBridgePage = (targetUrl: string, config: BridgePageConfig, clickId: string): string => {
  const { headline, description, ctaText, delaySeconds } = config;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      color: #ffffff;
      padding: 20px;
    }
    
    .container {
      text-align: center;
      max-width: 480px;
      animation: fadeIn 0.6s ease-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 24px;
      border-radius: 16px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 40px rgba(99, 102, 241, 0.3);
    }
    
    .icon svg {
      width: 32px;
      height: 32px;
      color: white;
    }
    
    h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 12px;
      background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    p {
      font-size: 16px;
      color: #94a3b8;
      margin-bottom: 32px;
      line-height: 1.6;
    }
    
    .countdown {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 24px;
    }
    
    .countdown span {
      font-weight: 600;
      color: #8b5cf6;
    }
    
    .progress-bar {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      margin-bottom: 32px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
      border-radius: 2px;
      width: 0%;
      transition: width 1s linear;
    }
    
    .cta-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 16px 32px;
      font-size: 16px;
      font-weight: 600;
      color: white;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      border: none;
      border-radius: 12px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.3s ease;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 30px rgba(99, 102, 241, 0.5);
    }
    
    .cta-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    
    .cta-button svg {
      width: 20px;
      height: 20px;
    }
    
    .footer {
      margin-top: 48px;
      font-size: 12px;
      color: #475569;
    }
    
    .footer a {
      color: #6366f1;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    </div>
    
    <h1>${escapeHtml(headline)}</h1>
    <p>${escapeHtml(description)}</p>
    
    <div class="countdown">
      Redirecting in <span id="timer">${delaySeconds}</span> seconds...
    </div>
    
    <div class="progress-bar">
      <div class="progress-fill" id="progress"></div>
    </div>
    
    <a href="${escapeHtml(targetUrl)}" class="cta-button" id="ctaBtn">
      ${escapeHtml(ctaText)}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    </a>
    
    <div class="footer">
      Powered by <a href="https://ghostlink.lovable.app" target="_blank">Ghost Link</a>
    </div>
  </div>
  
  <script>
    const totalSeconds = ${delaySeconds};
    let remaining = totalSeconds;
    const timerEl = document.getElementById('timer');
    const progressEl = document.getElementById('progress');
    const targetUrl = '${escapeHtml(targetUrl)}';
    
    // Start progress animation
    setTimeout(() => {
      progressEl.style.width = '100%';
      progressEl.style.transitionDuration = totalSeconds + 's';
    }, 100);
    
    const interval = setInterval(() => {
      remaining--;
      timerEl.textContent = remaining;
      
      if (remaining <= 0) {
        clearInterval(interval);
        window.location.href = targetUrl;
      }
    }, 1000);
  </script>
</body>
</html>`;
};

// Helper to escape HTML special characters
const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
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
    
    // Get visitor IP for geolocation
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('cf-connecting-ip') 
      || req.headers.get('x-real-ip')
      || null;
    
    console.log(`Found link: ${link.id}, target: ${link.target_url}, source: ${source}, IP: ${clientIP}, bridge: ${link.has_bridge_page}`);

    // Fetch country from IP (run in parallel with redirect)
    const countryPromise = clientIP ? getCountryFromIP(clientIP) : Promise.resolve(null);

    // Log the click and get the click ID
    const country = await countryPromise;
    console.log(`Country detected: ${country}`);
    
    const { data: clickData, error: clickError } = await supabase
      .from('clicks')
      .insert({ link_id: link.id, source: source, country: country })
      .select('id')
      .single();
    
    if (clickError) {
      console.error('Error logging click:', clickError);
    } else {
      console.log(`Click logged for link: ${link.id}, click_id: ${clickData?.id}, source: ${source}, country: ${country}`);
    }

    // If bridge page is enabled, serve the HTML page
    if (link.has_bridge_page && link.bridge_page_config) {
      const config = link.bridge_page_config as BridgePageConfig;
      const clickId = clickData?.id || '';
      const bridgeHtml = generateBridgePage(link.target_url, config, clickId);
      
      return new Response(bridgeHtml, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // Direct redirect (no bridge page)
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
