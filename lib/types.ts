export type Policy = { quality: number; cost: number; latency: number };

export type ModelProfile = {
  id: string; label: string; tier: string;
  costPer1k: number; latencyMs: number; quality: number; sweetSpot: number; contextK: number;
};

export type InboxRequest = {
  id: string; channel: string; author: string; text: string; tag: string; sortOrder: number;
};

export type Classification = { complexity: number; estTokens: number; features: string[] };

export type ModelScore = {
  model: ModelProfile; costUsd: number; latencyMs: number;
  qualityFit: number; observedAdj: number | null; score: number; notes: string[];
};

export type RouteResult = {
  classification: Classification; chosen: ModelScore; candidates: ModelScore[];
  margin: number; policy: Policy; observedSample: number;
};

export type DecisionView = {
  id: string; requestId: string | null; requestText: string; channel: string; author: string;
  result: RouteResult; answer: string; rating: number | null; createdAt: string;
};
