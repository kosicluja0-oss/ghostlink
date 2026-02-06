import { cn } from '@/lib/utils';

const FLAG_CDN = 'https://hatscripts.github.io/circle-flags/flags';

interface CircleFlagProps {
  code: string;
  size?: number;
  className?: string;
}

/**
 * Renders a circular country flag from the circle-flags CDN.
 * Falls back to a globe placeholder for unknown codes.
 */
export const CircleFlag = ({ code, size = 20, className }: CircleFlagProps) => {
  const lowerCode = code?.toLowerCase() || '';
  const isUnknown = !lowerCode || lowerCode === 'xx' || lowerCode === 'unknown';

  if (isUnknown) {
    return (
      <span
        className={cn('inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground shrink-0', className)}
        style={{ width: size, height: size, fontSize: size * 0.6 }}
      >
        🌍
      </span>
    );
  }

  // Map UK alias to GB for the CDN
  const flagCode = lowerCode === 'uk' ? 'gb' : lowerCode;

  return (
    <img
      src={`${FLAG_CDN}/${flagCode}.svg`}
      alt={`${code} flag`}
      width={size}
      height={size}
      loading="lazy"
      className={cn('rounded-full object-cover shrink-0', className)}
      style={{ width: size, height: size }}
      onError={(e) => {
        // Fallback to globe on load error
        const target = e.currentTarget;
        target.style.display = 'none';
        const fallback = document.createElement('span');
        fallback.textContent = '🌍';
        fallback.style.cssText = `display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;font-size:${size * 0.6}px;`;
        target.parentNode?.insertBefore(fallback, target);
      }}
    />
  );
};
