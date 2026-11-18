import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { deriveStoryPoints, FeatureRequest } from '../types/product';

interface SprintVelocityProps {
  requests: FeatureRequest[];
}

interface SprintBucket {
  name: string;
  orderKey: number;
  deliveredPoints: number;
  committedPoints: number;
  shippedCount: number;
  totalCount: number;
}

function getTimestampMillis(ts: unknown): number {
  if (!ts) return 0;
  if (typeof ts === 'object' && ts !== null && 'toMillis' in ts && typeof (ts as { toMillis: () => number }).toMillis === 'function') {
    return (ts as { toMillis: () => number }).toMillis();
  }
  if (typeof ts === 'object' && ts !== null && 'seconds' in ts && typeof (ts as { seconds: number }).seconds === 'number') {
    return (ts as { seconds: number }).seconds * 1000;
  }
  return 0;
}

function extractSprintName(req: FeatureRequest): string | null {
  const rawSprint = req.sprint?.trim();
  if (
    rawSprint &&
    rawSprint.toLowerCase() !== 'backlog' &&
    rawSprint.toLowerCase() !== 'declined' &&
    rawSprint.toLowerCase() !== 'tbd'
  ) {
    return rawSprint;
  }
  const tf = req.timeframe?.trim() || '';
  const sprintMatch = tf.match(/sprint\s*\d+/i);
  if (sprintMatch) {
    return sprintMatch[0].replace(/\s+/g, ' ');
  }
  if (req.status === 'shipped' && tf) {
    return tf.replace(/^shipped\s+/i, '').trim();
  }
  return null;
}

function extractSprintOrder(name: string, fallbackTs: number): number {
  const numMatch = name.match(/sprint\s*(\d+)/i);
  if (numMatch) {
    return Number(numMatch[1]) * 1_000_000;
  }
  const weekMatch = name.match(/week\s*(\d+)/i);
  if (weekMatch) {
    return Number(weekMatch[1]) * 1_000;
  }
  return fallbackTs || 0;
}

export function SprintVelocity({ requests }: SprintVelocityProps) {
  const velocity = useMemo(() => {
    const bucketMap = new Map<string, SprintBucket>();

    for (const req of requests) {
      if (req.horizon === 'not_building' || req.status === 'deferred') continue;
      const sprintName = extractSprintName(req);
      if (!sprintName) continue;

      const pts = deriveStoryPoints(req);
      const ts = getTimestampMillis(req.updatedAt) || getTimestampMillis(req.createdAt);
      const existing = bucketMap.get(sprintName) || {
        name: sprintName,
        orderKey: extractSprintOrder(sprintName, ts),
        deliveredPoints: 0,
        committedPoints: 0,
        shippedCount: 0,
        totalCount: 0,
      };

      existing.committedPoints += pts;
      existing.totalCount += 1;
      if (req.status === 'shipped') {
        existing.deliveredPoints += pts;
        existing.shippedCount += 1;
      }
      existing.orderKey = Math.max(existing.orderKey, extractSprintOrder(sprintName, ts));
      bucketMap.set(sprintName, existing);
    }

    const allBuckets = Array.from(bucketMap.values()).sort((a, b) => a.orderKey - b.orderKey);
    const completedBuckets = allBuckets.filter((b) => b.shippedCount > 0);

    // Prefer last 3 completed sprints; if fewer than 3 completed sprints exist, fill with most recent sprints
    const lastThree =
      completedBuckets.length >= 3
        ? completedBuckets.slice(-3)
        : allBuckets.slice(-3);

    const divisor = lastThree.length > 0 ? Math.min(3, lastThree.length) : 0;
    const totalDelivered = lastThree.reduce((sum, b) => sum + b.deliveredPoints, 0);
    const totalCommitted = lastThree.reduce((sum, b) => sum + b.committedPoints, 0);
    const avgDelivered = divisor > 0 ? Math.round((totalDelivered / divisor) * 10) / 10 : 0;
    const completionPct =
      totalCommitted > 0 ? Math.round((totalDelivered / totalCommitted) * 100) : 0;
    const maxPts = Math.max(
      1,
      ...lastThree.map((b) => Math.max(b.committedPoints, b.deliveredPoints))
    );

    return {
      sprints: lastThree,
      avgDelivered,
      totalDelivered,
      totalCommitted,
      completionPct,
      maxPts,
    };
  }, [requests]);

  return (
    <section
      aria-label="Sprint Velocity"
      className="bg-white border border-slate-200 rounded-lg p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
    >
      {/* Left: 3-Sprint Rolling Average Summary */}
      <div className="lg:col-span-5 space-y-2 lg:border-r lg:border-slate-200 lg:pr-6">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <TrendingUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Sprint Velocity · Last {velocity.sprints.length || 3} Sprints</span>
        </div>

        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-2xl font-semibold tabular-nums text-slate-900">
            {velocity.avgDelivered.toFixed(1)} pts
          </span>
          <span className="text-xs text-slate-600">avg delivered / sprint</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums text-slate-600">
          <span>
            {velocity.totalDelivered} delivered / {velocity.totalCommitted} committed
          </span>
          <span aria-hidden="true">·</span>
          <span
            className={
              velocity.completionPct >= 80
                ? 'text-green-700 font-medium'
                : velocity.completionPct >= 50
                ? 'text-amber-700 font-medium'
                : 'text-slate-600'
            }
          >
            {velocity.completionPct}% completion
          </span>
        </div>
      </div>

      {/* Right: Last 3 Sprints Breakdown */}
      <div className="lg:col-span-7">
        {velocity.sprints.length === 0 ? (
          <p className="text-xs text-slate-500">
            Assign a Sprint and Story Points to feature requests and mark completed work as Shipped to calculate rolling velocity.
          </p>
        ) : (
          <div className="space-y-3">
            {velocity.sprints.map((sprint) => {
              const deliveredWidth = Math.round((sprint.deliveredPoints / velocity.maxPts) * 100);
              const committedWidth = Math.round((sprint.committedPoints / velocity.maxPts) * 100);
              const sprintPct =
                sprint.committedPoints > 0
                  ? Math.round((sprint.deliveredPoints / sprint.committedPoints) * 100)
                  : 0;

              return (
                <div key={sprint.name} className="grid grid-cols-12 items-center gap-3 text-xs">
                  <div className="col-span-4 sm:col-span-3 truncate">
                    <span className="font-medium text-slate-900">{sprint.name}</span>
                    <span className="block text-[11px] text-slate-500 font-mono tabular-nums">
                      {sprint.shippedCount}/{sprint.totalCount} shipped
                    </span>
                  </div>

                  <div className="col-span-5 sm:col-span-6">
                    <div
                      className="h-2.5 w-full bg-slate-100 rounded-sm overflow-hidden relative"
                      aria-label={`${sprint.name}: ${sprint.deliveredPoints} of ${sprint.committedPoints} points delivered`}
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-slate-300/80 rounded-sm"
                        style={{ width: `${committedWidth}%` }}
                      />
                      <div
                        className={`absolute inset-y-0 left-0 rounded-sm ${
                          sprint.deliveredPoints > 0 ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                        style={{ width: `${deliveredWidth}%` }}
                      />
                    </div>
                  </div>

                  <div className="col-span-3 text-right font-mono tabular-nums whitespace-nowrap">
                    <span className="font-semibold text-slate-900">{sprint.deliveredPoints}</span>
                    <span className="text-slate-400"> / {sprint.committedPoints} pts</span>
                    <span className="hidden sm:inline text-[11px] text-slate-500 ml-1.5">
                      ({sprintPct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
