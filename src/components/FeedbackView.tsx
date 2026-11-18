import { useMemo, useState } from 'react';
import { Link2, MessageSquareText, Plus, Search, Trash2 } from 'lucide-react';
import {
  CHANNEL_LABELS,
  FeatureRequest,
  FeedbackChannel,
  FeedbackItem,
  Urgency,
} from '../types/product';

interface FeedbackViewProps {
  feedback: FeedbackItem[];
  requests: FeatureRequest[];
  loading: boolean;
  onLinkFeedback: (feedbackId: string, linkedRequestId: string, urgency: Urgency) => void;
  onDeleteFeedback: (feedbackId: string) => void;
  onNewFeedback: () => void;
  onSelectRequest: (request: FeatureRequest) => void;
}

type ChannelFilter = 'all' | FeedbackChannel;
type LinkFilter = 'all' | 'unlinked' | 'linked';

function urgencyTextClass(urgency: Urgency): string {
  if (urgency === 'high') return 'text-red-700 font-medium';
  if (urgency === 'medium') return 'text-amber-700 font-medium';
  return 'text-slate-600';
}

export function FeedbackView({
  feedback,
  requests,
  loading,
  onLinkFeedback,
  onDeleteFeedback,
  onNewFeedback,
  onSelectRequest,
}: FeedbackViewProps) {
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [linkFilter, setLinkFilter] = useState<LinkFilter>('all');
  const [search, setSearch] = useState('');

  const requestMap = useMemo(() => {
    const map = new Map<string, FeatureRequest>();
    for (const r of requests) map.set(r.id, r);
    return map;
  }, [requests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return feedback.filter((item) => {
      if (channelFilter !== 'all' && item.channel !== channelFilter) return false;
      if (linkFilter === 'unlinked' && item.linkedRequestId) return false;
      if (linkFilter === 'linked' && !item.linkedRequestId) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.quote.toLowerCase().includes(q) ||
        item.customerSegment.toLowerCase().includes(q) ||
        item.reporterName.toLowerCase().includes(q)
      );
    });
  }, [feedback, channelFilter, linkFilter, search]);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="tablist"
            aria-label="Filter by evidence channel"
            className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg overflow-x-auto"
          >
            {(
              [
                { key: 'all', label: 'All Channels' },
                { key: 'interview', label: 'Interviews' },
                { key: 'support', label: 'Support' },
                { key: 'analytics', label: 'Behavioral' },
                { key: 'sales', label: 'Sales' },
                { key: 'competitive', label: 'Competitive' },
              ] as const
            ).map((tab) => {
              const active = channelFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setChannelFilter(tab.key)}
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

          <div
            role="tablist"
            aria-label="Filter by request link status"
            className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg"
          >
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'unlinked', label: 'Unlinked' },
                { key: 'linked', label: 'Linked' },
              ] as const
            ).map((tab) => {
              const active = linkFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setLinkFilter(tab.key)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
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
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quotes, customers, segments..."
            aria-label="Search feedback evidence"
            className="w-full sm:w-72 pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* Feedback Feed */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="divide-y divide-slate-200">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 space-y-2 animate-pulse">
                <div className="h-4 w-56 bg-slate-200 rounded" />
                <div className="h-3 w-full max-w-xl bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <MessageSquareText className="w-6 h-6 text-slate-400 mx-auto" />
            <h3 className="font-display text-sm font-semibold text-slate-900">
              No discovery evidence found
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Capture user interviews, support signals, and behavioral drop-offs here to ground every roadmap bet in evidence.
            </p>
            <button
              type="button"
              onClick={onNewFeedback}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Feedback Signal</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filtered.map((item) => {
              const linkedReq = item.linkedRequestId ? requestMap.get(item.linkedRequestId) : undefined;
              return (
                <article
                  key={item.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-5 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-800">
                        {CHANNEL_LABELS[item.channel]}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.customerSegment || 'General'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.reporterName || 'Team Member'}</span>
                      {item.arrImpact && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums text-slate-700">
                            {item.arrImpact}
                          </span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span className={urgencyTextClass(item.urgency)}>
                        Urgency: {item.urgency.charAt(0).toUpperCase() + item.urgency.slice(1)}
                      </span>
                    </div>

                    <h3 className="font-display text-sm font-semibold text-slate-900">
                      {item.title}
                    </h3>

                    <blockquote className="text-sm text-slate-700 leading-relaxed max-w-3xl">
                      “{item.quote}”
                    </blockquote>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 shrink-0 lg:w-72">
                    <div className="w-full">
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Linked Backlog Hypothesis
                      </label>
                      <div className="flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <select
                          aria-label={`Link ${item.title} to feature request`}
                          value={item.linkedRequestId}
                          onChange={(e) =>
                            onLinkFeedback(item.id, e.target.value, item.urgency)
                          }
                          className="w-full text-xs bg-white border border-slate-200 rounded-md px-2 py-1.5 text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
                        >
                          <option value="">Unlinked (Triage needed)</option>
                          {requests.map((req) => (
                            <option key={req.id} value={req.id}>
                              {req.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full gap-3 pt-1">
                      {linkedReq ? (
                        <button
                          type="button"
                          onClick={() => onSelectRequest(linkedReq)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 truncate cursor-pointer"
                        >
                          Open PRD →
                        </button>
                      ) : (
                        <span className="text-[11px] text-amber-700 font-medium">
                          Needs backlog link
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => onDeleteFeedback(item.id)}
                        aria-label={`Delete feedback ${item.title}`}
                        className="p-1.5 text-slate-400 hover:text-red-700 rounded hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
