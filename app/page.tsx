import Desk from '@/components/Desk';
import { loadInbox, listDecisions, getPolicy, observedQuality, seedNote } from '@/lib/repo';
import { ownerId } from '@/lib/http';
import { DEFAULT_POLICY } from '@/lib/validate';
import { MODELS } from '@/lib/engine';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const owner = await ownerId();
  const inbox = await loadInbox();
  const decisions = await listDecisions(owner);
  const policy = (await getPolicy(owner)) ?? DEFAULT_POLICY;
  const observed = await observedQuality(owner);
  const note = await seedNote();
  const routedIds = new Set(decisions.map((d) => d.requestId));
  return (
    <main>
      <div className="mt-6 max-w-3xl">
        <h1 className="text-2xl font-semibold sm:text-3xl">One inbox, three model profiles, an explicit reason for every route.</h1>
        <p className="mt-2 text-sm text-mute">
          Each workspace question below is scored against three illustrative model profiles on quality fit, cost and latency, under the routing policy you choose.
          A transparent heuristic classifies complexity; nothing is a black box. Answers are simulated locally (no real model is called); the decision, the numbers and your ratings are real, persisted state. {note}
        </p>
      </div>
      <Desk inbox={inbox.filter((r) => !routedIds.has(r.id))} decisions={decisions} initialPolicy={policy} models={MODELS} observed={observed} />
    </main>
  );
}
