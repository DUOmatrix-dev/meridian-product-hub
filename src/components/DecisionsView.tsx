import { useMemo, useState } from 'react';
import { CheckCircle2, Lock, Plus, Scale, Trash2 } from 'lucide-react';
import {
  AlignmentDecision,
  APPROVAL_STATUS_LABELS,
  ApprovalStatus,
  DECISION_TYPE_LABELS,
  DecisionType,
  FeatureRequest,
} from '../types/product';
import { Avatar } from './Avatar';

interface DecisionsViewProps {
  decisions: AlignmentDecision[];
  requests: FeatureRequest[];
  loading: boolean;
  onUpdateStatus: (decisionId: string, status: ApprovalStatus) => void;
  onDeleteDecision: (decisionId: string) => void;
  onNewDecision: () => void;
  onSelectRequest: (request: FeatureRequest) => void;
}

type TypeFilter = 'all' | DecisionType;

function decisionTypeClass(type: DecisionType): string {
  switch (type) {
    case 'build':
      return 'text-green-700 font-medium';
    case 'kill':
    case 'defer':
      return 'text-red-700 font-medium';
    case 'scope_change':
      return 'text-amber-700 font-medium';
    default:
      return 'text-blue-700 font-medium';
  }
}

export function DecisionsView({
  decisions,
  requests,
  loading,
  onUpdateStatus,
  onDeleteDecision,
  onNewDecision,
  onSelectRequest,
}: DecisionsViewProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const requestMap = useMemo(() => {
    const map = new Map<string, FeatureRequest>();
    for (const r of requests) map.set(r.id, r);
    return map;
  }, [requests]);

  const filtered = useMemo(() => {
    return decisions.filter((d) =>
      typeFilter === 'all' ? true : d.decisionType === typeFilter
    );
  }, [decisions, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Filter decisions by type"
          className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg overflow-x-auto"
        >
          {(
            [
              { key: 'all', label: 'All Decisions' },
              { key: 'build', label: 'Build' },
              { key: 'scope_change', label: 'Scope Change' },
              { key: 'explore', label: 'Explore' },
              { key: 'defer', label: 'Defer' },
              { key: 'kill', label: 'Kill' },
            ] as const
          ).map((tab) => {
            const active = typeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTypeFilter(tab.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <span className="text-xs text-slate-500 font-mono tabular-nums">
          {filtered.length} recorded decisions
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-200">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 space-y-2 animate-pulse">
                <div className="h-4 w-72 bg-slate-200 rounded" />
                <div className="h-3 w-full max-w-2xl bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Scale className="w-6 h-6 text-slate-400 mx-auto" />
            <h3 className="font-display text-sm font-semibold text-slate-900">
              No decisions logged yet
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Document the reasoning, confidence level, and explicit trade-offs behind every product bet so alignment stays visible.
            </p>
            <button
              type="button"
              onClick={onNewDecision}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Decision</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filtered.map((dec) => {
              const linkedReq = dec.requestId ? requestMap.get(dec.requestId) : undefined;
              const isLocked = dec.approvalStatus === 'locked';

              return (
                <article key={dec.id} className="p-6 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className={decisionTypeClass(dec.decisionType)}>
                          {DECISION_TYPE_LABELS[dec.decisionType]}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums text-slate-700">
                          {dec.confidencePct}% confidence
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          {isLocked ? (
                            <Lock className="w-3 h-3 text-slate-600" />
                          ) : dec.approvalStatus === 'aligned' ? (
                            <CheckCircle2 className="w-3 h-3 text-green-700" />
                          ) : null}
                          <span>Status: {APPROVAL_STATUS_LABELS[dec.approvalStatus]}</span>
                        </span>
                      </div>

                      <h3 className="font-display text-base font-semibold text-slate-900">
                        {dec.title}
                      </h3>

                      {linkedReq && (
                        <button
                          type="button"
                          onClick={() => onSelectRequest(linkedReq)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                          Initiative: {linkedReq.title} →
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <Avatar name={dec.decidedBy} size="sm" />
                        <span className="text-xs text-slate-700">{dec.decidedBy}</span>
                      </div>

                      {!isLocked && (
                        <div className="flex items-center gap-1.5">
                          {dec.approvalStatus === 'proposed' && (
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(dec.id, 'aligned')}
                              className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              Mark Aligned
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onUpdateStatus(dec.id, 'locked')}
                            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-md hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Lock Decision
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => onDeleteDecision(dec.id)}
                        aria-label={`Delete decision ${dec.title}`}
                        className="p-1.5 text-slate-400 hover:text-red-700 rounded hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100 text-xs leading-relaxed">
                    <div className="space-y-1">
                      <span className="font-medium text-slate-500">Rationale & Evidence</span>
                      <p className="text-slate-700">{dec.rationale}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-medium text-slate-500">Explicit Trade-Offs</span>
                      <p className="text-slate-700">
                        {dec.tradeOffs || 'No explicit trade-offs documented.'}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
