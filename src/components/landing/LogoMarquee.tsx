const LOGOS = [
  { name: 'Gumroad', slug: 'gumroad', color: 'FF90E8' },
  { name: 'Shopify', slug: 'shopify', color: '7AB55C' },
  { name: 'Stripe', slug: 'stripe', color: '6772E5' },
  { name: 'Whop', slug: 'whop', color: 'FF6243' },
  { name: 'LemonSqueezy', slug: 'lemonsqueezy', color: 'FFC233' },
  { name: 'ClickBank', slug: 'clickbank', color: '2E7D32' },
  { name: 'Hotmart', slug: 'hotmart', color: 'F04E23' },
  { name: 'ThriveCart', slug: 'thrivecart', color: '2962FF' },
];

// Double the list for seamless looping
const MARQUEE_LOGOS = [...LOGOS, ...LOGOS];

export function LogoMarquee() {
  return (
    <div className="w-full py-6 md:py-8 group">
      <p className="text-center text-[11px] md:text-xs text-muted-foreground/60 uppercase tracking-[0.2em] font-medium mb-5 md:mb-6">
        Works with your favourite platforms
      </p>
      <div
        className="relative overflow-hidden mx-auto max-w-3xl"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
        }}
      >
        <div className="flex w-max animate-[marquee_25s_linear_infinite] group-hover:[animation-play-state:paused]">
          {MARQUEE_LOGOS.map((logo, i) => (
            <div
              key={`${logo.slug}-${i}`}
              className="flex items-center justify-center mx-6 md:mx-10 shrink-0"
            >
              <img
                src={`https://cdn.simpleicons.org/${logo.slug}/${logo.color}`}
                alt={logo.name}
                className="h-5 md:h-6 w-auto object-contain transition-all duration-300 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
