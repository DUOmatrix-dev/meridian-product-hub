import { Ban, Lock, MessageSquareText, Plus } from 'lucide-react';
import {
  FeatureRequest,
  FeedbackItem,
  Horizon,
  STATUS_LABELS,
} from '../types/product';
import { Avatar } from './Avatar';

interface RoadmapViewProps {
  requests: FeatureRequest[];
  feedback: FeedbackItem[];
  onSelectRequest: (request: FeatureRequest) => void;
  onChangeHorizon: (request: FeatureRequest, nextHorizon: Horizon) => void;
  onNewRequest: () => void;
}

const HORIZON_COLUMNS: {
  key: Exclude<Horizon, 'not_building'>;
  title: string;
  subtitle: string;
}[] = [
  {
    key: 'now',
    title: 'Now — Active This Quarter',
    subtitle: 'Committed work. Engineering, design, and PM aligned.',
  },
  {
    key: 'next',
    title: 'Next — 1 to 2 Quarters',
    subtitle: 'Directionally committed. Requires scoping before dev start.',
  },
  {
    key: 'later',
    title: 'Later — 3 to 6 Months',
    subtitle: 'Strategic bets. Advances when user evidence or priority warrants.',
  },
];

export function RoadmapView({
  requests,
  feedback,
  onSelectRequest,
  onChangeHorizon,
  onNewRequest,
}: RoadmapViewProps) {
  const evidenceCount = (reqId: string) =>
    feedback.filter((f) => f.linkedRequestId === reqId).length;

  const notBuilding = requests.filter((r) => r.horizon === 'not_building');

  return (
    <div className="space-y-8">
      {/* Now / Next / Later Columns */}
      <section aria-label="Now Next Later Roadmap" className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {HORIZON_COLUMNS.map((col) => {
          const items = requests.filter((r) => r.horizon === col.key);
          return (
            <div key={col.key} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-sm font-semibold text-slate-900">
                    {col.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">{col.subtitle}</p>
                </div>
                <span className="font-mono text-xs font-medium tabular-nums text-slate-600 shrink-0">
                  {items.length}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="p-6 text-center space-y-2">
                  <p className="text-xs text-slate-500">No initiatives in {col.title.split(' ')[0]}.</p>
                  <button
                    type="button"
                    onClick={onNewRequest}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add initiative</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {items.map((item) => {
                    const isLocked = item.status === 'shipped';
                    const evCount = evidenceCount(item.id);
                    return (
                      <div key={item.id} className="p-4 space-y-3 hover:bg-slate-50/70 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => onSelectRequest(item)}
                            className="text-left font-medium text-sm text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
                          >
                            {item.title}
                          </button>
                          <span className="font-mono text-xs font-semibold tabular-nums text-slate-700 shrink-0">
                            {item.riceScore.toFixed(0)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {item.problemStatement}
                        </p>

                        <div className="text-xs text-slate-600 space-y-1 pt-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-500">Metric:</span>
                            <span className="font-medium text-slate-800 truncate max-w-[200px]">
                              {item.successMetric}
                            </span>
                          </div>
                          {(item.metricBaseline || item.metricTarget) && (
                            <div className="flex items-center justify-between gap-2 font-mono text-[11px] tabular-nums">
                              <span className="text-slate-500 font-sans">Target:</span>
                              <span className="text-slate-700">
                                {item.metricBaseline || '—'} → {item.metricTarget || '—'}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar name={item.ownerName} size="sm" />
                            <div className="text-xs text-slate-600 truncate">
                              <span>{STATUS_LABELS[item.status]}</span>
                              <span className="mx-1 text-slate-300" aria-hidden="true">·</span>
                              <span className="font-mono text-[11px] tabular-nums">{item.timeframe}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] tabular-nums text-slate-500">
                              <MessageSquareText className="w-3 h-3" />
                              {evCount}
                            </span>

                            {isLocked ? (
                              <span
                                title="Shipped initiatives are locked"
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-green-700"
                              >
                                <Lock className="w-3 h-3" />
                                <span>Shipped</span>
                              </span>
                            ) : (
                              <select
                                aria-label={`Move ${item.title} horizon`}
                                value={item.horizon}
                                onChange={(e) =>
                                  onChangeHorizon(item, e.target.value as Horizon)
                                }
                                className="text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:border-blue-600 cursor-pointer"
                              >
                                <option value="now">Move: Now</option>
                                <option value="next">Move: Next</option>
                                <option value="later">Move: Later</option>
                                <option value="not_building">Move: Not Building</option>
                              </select>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* What We're Not Building (and Why) */}
      <section aria-label="Not Building Register" className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Ban className="w-4 h-4 text-red-700 shrink-0" />
            <div>
              <h2 className="font-display text-sm font-semibold text-slate-900">
                What We’re Not Building (and Why)
              </h2>
              <p className="text-xs text-slate-500">
                Saying no publicly prevents repeated requests and protects team focus.
              </p>
            </div>
          </div>
          <span className="font-mono text-xs tabular-nums text-slate-600">
            {notBuilding.length} declined
          </span>
        </div>

        {notBuilding.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No explicitly declined requests yet. Move low-leverage requests to “Not Building” with a clear revisit condition.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                  <th className="py-3 px-5">Declined Request</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Reason for Deferral</th>
                  <th className="py-3 px-4">Revisit Condition</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {notBuilding.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-medium text-slate-900 max-w-xs">
                      {item.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {item.requestSource || 'Stakeholder Request'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-sm leading-relaxed">
                      {item.deferralReason || item.problemStatement}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-sm leading-relaxed">
                      {item.revisitCondition || 'Re-evaluate if quarterly demand signal crosses threshold.'}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectRequest(item)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
