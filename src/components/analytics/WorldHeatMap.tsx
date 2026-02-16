import { useMemo, useState, useRef, useCallback } from 'react';
import { WORLD_MAP_PATHS, WORLD_MAP_VIEWBOX } from '@/lib/worldMapPaths';
import { getCountryInfo, type CountryData } from './TopCountriesCard';
import { CircleFlag } from '@/components/ui/circle-flag';

interface WorldHeatMapProps {
  countries: CountryData[];
  metricColor?: string;
}

function computeInterestScores(countries: CountryData[]): Map<string, number> {
  const raw = new Map<string, number>();
  let max = 0;
  for (const c of countries) {
    const score = c.clicks + c.leads * 10 + c.sales * 50 + c.earnings * 2;
    if (score > 0) {
      raw.set(c.code.toUpperCase(), score);
      if (score > max) max = score;
    }
  }
  const normalized = new Map<string, number>();
  if (max > 0) {
    raw.forEach((v, k) => normalized.set(k, (v / max) * 100));
  }
  return normalized;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (m) return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  // Try hsl / named – fall back
  return null;
}

function getCountryFill(code: string, scores: Map<string, number>, color: string): string {
  const pct = scores.get(code) ?? 0;
  if (pct === 0) return 'hsl(var(--muted))';
  const rgb = hexToRgb(color);
  if (rgb) {
    const alpha = 0.15 + (pct / 100) * 0.85;
    return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
  }
  // fallback: use opacity with the color string
  const alpha = 0.15 + (pct / 100) * 0.85;
  return `rgba(59,130,246,${alpha})`;
}

export const WorldHeatMap = ({ countries, metricColor = '#3b82f6' }: WorldHeatMapProps) => {
  const scores = useMemo(() => computeInterestScores(countries), [countries]);

  // Pan / zoom state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Tooltip
  const [tooltip, setTooltip] = useState<{ x: number; y: number; code: string; pct: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setScale((s) => Math.min(4, Math.max(1, s - e.deltaY * 0.002)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging.current) {
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      setTranslate((t) => ({ x: t.x + dx, y: t.y + dy }));
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const handleDoubleClick = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const handleCountryEnter = useCallback(
    (e: React.MouseEvent, code: string) => {
      const pct = scores.get(code) ?? 0;
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top - 8, code, pct });
      }
    },
    [scores]
  );

  const handleCountryMove = useCallback(
    (e: React.MouseEvent, code: string) => {
      const pct = scores.get(code) ?? 0;
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top - 8, code, pct });
      }
    },
    [scores]
  );

  const handleCountryLeave = useCallback(() => setTooltip(null), []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { handleMouseUp(); handleCountryLeave(); }}
      onDoubleClick={handleDoubleClick}
    >
      <svg
        viewBox={WORLD_MAP_VIEWBOX}
        className="w-full h-full"
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: dragging.current ? 'none' : 'transform 0.15s ease-out',
        }}
      >
        {Object.entries(WORLD_MAP_PATHS).map(([code, path]) => {
          if (!path) return null;
          return (
            <path
              key={code}
              d={path}
              fill={getCountryFill(code, scores, metricColor)}
              stroke="hsl(var(--border))"
              strokeWidth={0.5}
              className="transition-colors duration-150"
              onMouseEnter={(e) => handleCountryEnter(e, code)}
              onMouseMove={(e) => handleCountryMove(e, code)}
              onMouseLeave={handleCountryLeave}
            />
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-50 flex items-center gap-1.5 rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <CircleFlag code={tooltip.code} size={14} />
          <span className="font-medium">{getCountryInfo(tooltip.code).name}</span>
          <span className="text-muted-foreground font-mono">{tooltip.pct.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
};
