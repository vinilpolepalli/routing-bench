import assert from 'node:assert';
import { classify, route, simulatedAnswer, MODELS } from '../lib/engine.ts';
import { POLICY_PRESETS } from '../lib/validate.ts';

const trivial = classify('Summarize the standup thread into three bullets.');
const complexT = classify('Compare two rollout strategies for the migration, weigh support load and onboarding friction, explain why the foreign key error appeared after the deploy, and recommend a path? Also review this function for edge cases?');
assert.ok(trivial.complexity < complexT.complexity, `trivial ${trivial.complexity} < complex ${complexT.complexity}`);
assert.ok(complexT.estTokens > 0 && trivial.estTokens >= 64);

const none = {};
const q = route(complexT ? 'Compare two rollout strategies and explain why the error appeared? Review this function?' : '', POLICY_PRESETS['quality-first'], none);
assert.equal(q.chosen.model.id, 'apex', `quality-first complex -> apex, got ${q.chosen.model.id}`);
const c = route('Summarize the thread into three bullets.', POLICY_PRESETS['cost-first'], none);
assert.equal(c.chosen.model.id, 'swift', `cost-first trivial -> swift, got ${c.chosen.model.id}`);
const b = route('Draft a reply to ticket 4821 about the refund delay.', POLICY_PRESETS.balanced, none);
assert.ok(['swift', 'mid'].includes(b.chosen.model.id));
for (const r of [q, c, b]) {
  assert.equal(r.candidates.length, MODELS.length);
  assert.ok(r.margin > 0 && r.candidates[0].score >= r.candidates[1].score);
}
const nudged = route('Draft a reply to the customer about their refund.', POLICY_PRESETS.balanced, { mid: { avg: 1, n: 10 }, swift: { avg: -1, n: 10 } });
assert.ok(nudged.observedSample === 20);
const ans = simulatedAnswer('hello', 'draft', MODELS[0]);
assert.ok(ans.includes('Simulated answer'));
console.log('engine tests pass');
