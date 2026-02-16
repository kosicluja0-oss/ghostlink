import countryShapes from 'world-map-country-shapes';

/**
 * World map SVG paths keyed by ISO 3166-1 alpha-2 codes.
 * Data sourced from world-map-country-shapes (Natural Earth).
 * ViewBox: 0 0 2000 1001
 */
export const WORLD_MAP_PATHS: Record<string, string> = {};
for (const c of countryShapes) {
  if (c.shape) WORLD_MAP_PATHS[c.id] = c.shape;
}

/** The SVG viewBox for the world map */
export const WORLD_MAP_VIEWBOX = "0 0 2000 1001";
