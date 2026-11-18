import { useMemo, useState } from 'react';
import { ArrowUpDown, FileText, Lock, MessageSquareText, Plus, Search, SlidersHorizontal } from 'lucide-react';
import {
  AlignmentDecision,
  FeatureRequest,
  FeedbackItem,
  Horizon,
  HORIZON_SHORT_LABELS,
  STATUS_LABELS,
  Workspace,
} from '../types/product';
import { Avatar } from './Avatar';
import { SprintVelocity } from './SprintVelocity';

interface BacklogViewProps {
  workspace: Workspace | null;
  requests: FeatureRequest[];
  feedback: FeedbackItem[];
  decisions: AlignmentDecision[];
  loading: boolean;
  onSelectRequest: (request: FeatureRequest) => void;
  onNewRequest: () => void;
  onEditWorkspace: () => void;
}

type HorizonFilter = 'all' | Horizon;
type SortKey = 'rice' | 'effort' | 'confidence' | 'evidence';

function statusTextClass(status: FeatureRequest['status']): string {
  switch (status) {
    case 'shipped':
      return 'text-green-700';
    case 'in_dev':
    case 'in_design':
      return 'text-blue-700';
    case 'scoped':
      return 'text-amber-700';
    case 'deferred':
      return 'text-red-700';
    default:
      return 'text-slate-600';
  }
}

export function BacklogView({
  workspace,
  requests,
  feedback,
  decisions,
  loading,
  onSelectRequest,
  onNewRequest,
  onEditWorkspace,
}: BacklogViewProps) {
  const [search, setSearch] = useState('');
  const [horizonFilter, setHorizonFilter] = useState<HorizonFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('rice');

  const evidenceCountByReq = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of feedback) {
      if (item.linkedRequestId) {
        map.set(item.linkedRequestId, (map.get(item.linkedRequestId) || 0) + 1);
      }
    }
    return map;
  }, [feedback]);

  const metrics = useMemo(() => {
    const nowItems = requests.filter((r) => r.horizon === 'now');
    const backedByEvidence = requests.filter((r) => (evidenceCountByReq.get(r.id) || 0) > 0).length;
    const unlinkedFeedback = feedback.filter((f) => !f.linkedRequestId).length;
    const alignedDecisions = decisions.filter(
      (d) => d.approvalStatus === 'aligned' || d.approvalStatus === 'locked'
    ).length;

    return {
      nowCount: nowItems.length,
      totalActive: requests.filter((r) => r.horizon !== 'not_building').length,
      backedPct: requests.length > 0 ? Math.round((backedByEvidence / requests.length) * 100) : 0,
      unlinkedFeedback,
      alignedDecisions,
      totalDecisions: decisions.length,
    };
  }, [requests, feedback, decisions, evidenceCountByReq]);

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = requests.filter((r) => {
      if (horizonFilter !== 'all' && r.horizon !== horizonFilter) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.problemStatement.toLowerCase().includes(q) ||
        r.ownerName.toLowerCase().includes(q) ||
        r.successMetric.toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'rice') return b.riceScore - a.riceScore;
      if (sortBy === 'effort') return a.effort - b.effort;
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      return (evidenceCountByReq.get(b.id) || 0) - (evidenceCountByReq.get(a.id) || 0);
    });
  }, [requests, search, horizonFilter, sortBy, evidenceCountByReq]);

  return (
    <div className="space-y-6">
      {/* North Star & Alignment Strip */}
      <section
        aria-label="Workspace North Star Metrics"
        className="bg-white border border-slate-200 rounded-lg grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200"
      >
        <div className="p-5 flex flex-col justify-between gap-2 md:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-medium text-slate-500">
              North Star Metric · {workspace?.quarter || 'Q4 2026'}
            </span>
            <button
              type="button"
              onClick={onEditWorkspace}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer whitespace-nowrap"
            >
              Edit Goal
            </button>
          </div>
          <p className="font-display text-sm font-semibold text-slate-900">
            {workspace?.northStarMetric || 'Weekly Active Teams Completing Core Workflow'}
          </p>
          <div className="flex items-center gap-3 text-xs font-mono tabular-nums text-slate-600">
            <span>Current: {workspace?.northStarCurrent || '—'}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-900 font-medium">
              Target: {workspace?.northStarTarget || '—'}
            </span>
          </div>
        </div>

        <div className="p-5 flex flex-col justify-between gap-1.5">
          <span className="text-xs font-medium text-slate-500">Roadmap & Evidence</span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold tabular-nums text-slate-900">
              {metrics.nowCount}
            </span>
            <span className="text-xs text-slate-600">committed Now</span>
          </div>
          <p className="text-xs font-mono tabular-nums text-slate-500">
            {metrics.backedPct}% requests linked to evidence
          </p>
        </div>

        <div className="p-5 flex flex-col justify-between gap-1.5">
          <span className="text-xs font-medium text-slate-500">Alignment & Triage</span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold tabular-nums text-slate-900">
              {metrics.alignedDecisions}/{metrics.totalDecisions}
            </span>
            <span className="text-xs text-slate-600">decisions aligned</span>
          </div>
          <p className="text-xs font-mono tabular-nums text-slate-500">
            {metrics.unlinkedFeedback} unlinked feedback signals
          </p>
        </div>
      </section>

      {/* Sprint Velocity (Last 3 Sprints Rolling Average) */}
      <SprintVelocity requests={requests} />

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Filter by roadmap horizon"
          className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg overflow-x-auto"
        >
          {(
            [
              { key: 'all', label: 'All Backlog' },
              { key: 'now', label: 'Now' },
              { key: 'next', label: 'Next' },
              { key: 'later', label: 'Later' },
              { key: 'not_building', label: 'Not Building' },
            ] as const
          ).map((tab) => {
            const active = horizonFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setHorizonFilter(tab.key)}
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

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problem, title, owner..."
              aria-label="Search feature requests"
              className="w-full sm:w-64 pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="whitespace-nowrap">Sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="rice">RICE Score</option>
              <option value="evidence">Evidence Count</option>
              <option value="confidence">Confidence %</option>
              <option value="effort">Lowest Effort</option>
            </select>
          </label>
        </div>
      </div>

      {/* High-Density RICE Backlog Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-200">
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="px-5 py-4 flex items-center justify-between gap-4 animate-pulse">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-64 bg-slate-200 rounded" />
                  <div className="h-3 w-96 bg-slate-100 rounded" />
                </div>
                <div className="h-4 w-20 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <SlidersHorizontal className="w-6 h-6 text-slate-400 mx-auto" />
            <h3 className="font-display text-sm font-semibold text-slate-900">
              No matching feature requests
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              {requests.length === 0
                ? 'Start by framing a user problem, target success metric, and initial RICE estimate.'
                : 'Try adjusting your horizon filter or search query to inspect other backlog items.'}
            </p>
            <button
              type="button"
              onClick={onNewRequest}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Feature Request</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 px-5">Initiative & Problem</th>
                  <th className="py-3 px-4 whitespace-nowrap">Horizon · Status</th>
                  <th className="py-3 px-4 whitespace-nowrap">Owner</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Evidence</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Reach</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Impact</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Conf.</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Effort</th>
                  <th className="py-3 px-5 text-right whitespace-nowrap">RICE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredRequests.map((req) => {
                  const evCount = evidenceCountByReq.get(req.id) || 0;
                  return (
                    <tr
                      key={req.id}
                      onClick={() => onSelectRequest(req)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectRequest(req);
                        }
                      }}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer focus-visible:outline-none focus-visible:bg-blue-50/60"
                    >
                      <td className="py-3.5 px-5 max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 truncate">
                            {req.title}
                          </span>
                          {req.status === 'shipped' && (
                            <Lock
                              className="w-3.5 h-3.5 text-green-700 shrink-0"
                              aria-label="Shipped and locked"
                            />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {req.problemStatement}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            Metric: {req.successMetric}
                            {req.metricBaseline || req.metricTarget
                              ? ` (${req.metricBaseline || '—'} → ${req.metricTarget || '—'})`
                              : ''}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                        <span className="font-medium text-slate-800">
                          {HORIZON_SHORT_LABELS[req.horizon]}
                        </span>
                        <span className="mx-1.5 text-slate-300" aria-hidden="true">
                          ·
                        </span>
                        <span className={`font-medium ${statusTextClass(req.status)}`}>
                          {STATUS_LABELS[req.status]}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
                          {req.timeframe}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Avatar name={req.ownerName} size="sm" />
                          <span className="text-xs text-slate-700">{req.ownerName}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <span className="inline-flex items-center justify-end gap-1 font-mono text-xs tabular-nums text-slate-700">
                          <MessageSquareText className="w-3 h-3 text-slate-400" />
                          <span>{evCount}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono text-xs tabular-nums text-slate-700">
                        {req.reach.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-xs tabular-nums text-slate-700">
                        {req.impact}×
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-xs tabular-nums text-slate-700">
                        {req.confidence}%
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-xs tabular-nums text-slate-700">
                        {req.effort}m
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono text-sm font-semibold tabular-nums text-slate-900">
                        {req.riceScore.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
