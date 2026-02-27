import gumroadLogo from '@/assets/logos/gumroad.svg';
import clickbankLogo from '@/assets/logos/clickbank.png';
import hotmartLogo from '@/assets/logos/hotmart.png';
import thrivecartLogo from '@/assets/logos/thrivecart.png';
import whopLogo from '@/assets/logos/whop.png';

const LOGOS = [
  { name: 'Gumroad', src: `https://cdn.simpleicons.org/gumroad/FF90E8` },
  { name: 'Shopify', src: `https://cdn.simpleicons.org/shopify/7AB55C` },
  { name: 'Stripe', src: `https://cdn.simpleicons.org/stripe/6772E5` },
  { name: 'Whop', src: whopLogo },
  { name: 'LemonSqueezy', src: `https://cdn.simpleicons.org/lemonsqueezy/FFC233` },
  { name: 'ClickBank', src: clickbankLogo },
  { name: 'Hotmart', src: hotmartLogo },
  { name: 'ThriveCart', src: thrivecartLogo },
];

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
        <div className="flex w-max animate-marquee">
          {MARQUEE_LOGOS.map((logo, i) => (
            <div
              key={`${logo.name}-${i}`}
              className="flex items-center justify-center mx-6 md:mx-10 shrink-0"
            >
              <img
                src={logo.src}
                alt={logo.name}
                className="h-5 md:h-6 w-auto object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
