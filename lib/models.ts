import type { ModelProfile } from './types';

/** Illustrative model profiles for the demo. Prices, latencies and quality scores are example values, not measurements of any real provider's models. */
export const MODELS: ModelProfile[] = [
  { id: 'swift', label: 'Swift', tier: 'small / fast', costPer1k: 0.0002, latencyMs: 350, quality: 0.62, sweetSpot: 0.15, contextK: 32 },
  { id: 'mid', label: 'Meridian', tier: 'balanced', costPer1k: 0.0012, latencyMs: 900, quality: 0.81, sweetSpot: 0.5, contextK: 128 },
  { id: 'apex', label: 'Apex', tier: 'frontier', costPer1k: 0.006, latencyMs: 2200, quality: 0.94, sweetSpot: 0.85, contextK: 200 },
];
