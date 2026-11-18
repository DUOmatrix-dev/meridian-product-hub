import { useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import {
  ApprovalStatus,
  calcRiceScore,
  DecisionType,
  FeatureRequest,
  FeedbackChannel,
  FIELD_LIMITS,
  Horizon,
  Urgency,
  Workspace,
} from '../types/product';
import {
  CreateDecisionInput,
  CreateFeedbackInput,
  CreateRequestInput,
} from '../hooks/useWorkspaceData';

// ---------------------------------------------------------------------------
// 1. New Feature Request Modal (Problem-First Intake)
// ---------------------------------------------------------------------------
interface NewRequestModalProps {
  open: boolean;
  defaultOwner: string;
  onClose: () => void;
  onCreate: (input: CreateRequestInput) => Promise<unknown>;
}

export function NewRequestModal({ open, defaultOwner, onClose, onCreate }: NewRequestModalProps) {
  const [title, setTitle] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [persona, setPersona] = useState('');
  const [requestSource, setRequestSource] = useState('');
  const [horizon, setHorizon] = useState<Horizon>('next');
  const [ownerName, setOwnerName] = useState(defaultOwner || 'Alex Rivera');
  const [timeframe, setTimeframe] = useState('Q1 2027');
  const [reach, setReach] = useState(500);
  const [impact, setImpact] = useState(2);
  const [confidence, setConfidence] = useState(70);
  const [effort, setEffort] = useState(2);
  const [successMetric, setSuccessMetric] = useState('');
  const [metricBaseline, setMetricBaseline] = useState('');
  const [metricTarget, setMetricTarget] = useState('');
  const [nonGoals, setNonGoals] = useState('');
  const [sprint, setSprint] = useState('Sprint 15');
  const [storyPoints, setStoryPoints] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const liveRice = calcRiceScore(reach, impact, confidence, effort);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onCreate({
        title,
        problemStatement,
        persona,
        horizon,
        status: horizon === 'not_building' ? 'deferred' : 'discovery',
        ownerName,
        timeframe,
        reach,
        impact,
        confidence,
        effort,
        successMetric,
        metricBaseline,
        metricTarget,
        nonGoals,
        solutionOverview: '',
        acceptanceCriteria: '',
        rollbackCriteria: '',
        deferralReason: horizon === 'not_building' ? problemStatement : '',
        revisitCondition: '',
        requestSource,
        confidenceLevel: confidence >= 80 ? 'high' : confidence >= 50 ? 'medium' : 'low',
        sprint,
        storyPoints,
      });
      setTitle('');
      setProblemStatement('');
      setPersona('');
      setRequestSource('');
      setSuccessMetric('');
      setMetricBaseline('');
      setMetricTarget('');
      setNonGoals('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="New Feature Request"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40"
    >
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-lg shadow-xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              New Feature Request
            </h2>
            <p className="text-xs text-slate-500">
              Lead with the user problem, evidence source, and target outcome.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <label className="space-y-1 block">
            <span className="text-xs font-medium text-slate-700">Initiative Title</span>
            <input
              type="text"
              required
              minLength={FIELD_LIMITS.TITLE_MIN}
              maxLength={FIELD_LIMITS.TITLE_MAX}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Automated Billing Webhook Dead-Letter Replay"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
            />
          </label>

          <label className="space-y-1 block">
            <span className="text-xs font-medium text-slate-700">
              Problem Statement (Who experiences this pain & what is the cost?)
            </span>
            <textarea
              rows={3}
              required
              minLength={FIELD_LIMITS.PROBLEM_MIN}
              maxLength={FIELD_LIMITS.PROBLEM_MAX}
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder="Describe the observed user friction and behavioral evidence before proposing a UI."
              className="w-full px-3 py-2 text-xs leading-relaxed border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">Primary Persona</span>
              <input
                type="text"
                maxLength={FIELD_LIMITS.PERSONA_MAX}
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                placeholder="e.g., Mid-Market Ops Manager"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
              />
            </label>

            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">Evidence Source</span>
              <input
                type="text"
                maxLength={FIELD_LIMITS.SOURCE_MAX}
                value={requestSource}
                onChange={(e) => setRequestSource(e.target.value)}
                placeholder="e.g., 8 Interviews + 42 Tickets"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
              />
            </label>

            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">Success Metric</span>
              <input
                type="text"
                required
                minLength={FIELD_LIMITS.METRIC_MIN}
                maxLength={FIELD_LIMITS.METRIC_MAX}
                value={successMetric}
                onChange={(e) => setSuccessMetric(e.target.value)}
                placeholder="e.g., 30-day setup completion"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1 block">
                <span className="text-xs font-medium text-slate-700">Baseline</span>
                <input
                  type="text"
                  maxLength={FIELD_LIMITS.SHORT_VALUE_MAX}
                  value={metricBaseline}
                  onChange={(e) => setMetricBaseline(e.target.value)}
                  placeholder="42%"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                />
              </label>
              <label className="space-y-1 block">
                <span className="text-xs font-medium text-slate-700">Target</span>
                <input
                  type="text"
                  maxLength={FIELD_LIMITS.SHORT_VALUE_MAX}
                  value={metricTarget}
                  onChange={(e) => setMetricTarget(e.target.value)}
                  placeholder="65%"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                />
              </label>
            </div>
          </div>

          {/* RICE Input Row */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900">Initial RICE Estimate</span>
              <span className="font-mono text-sm font-bold tabular-nums text-blue-600">
                Score: {liveRice.toFixed(1)}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className="space-y-1 block">
                <span className="text-[11px] font-medium text-slate-600">Reach</span>
                <input
                  type="number"
                  min={0}
                  max={10000000}
                  value={reach}
                  onChange={(e) => setReach(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded"
                />
              </label>
              <label className="space-y-1 block">
                <span className="text-[11px] font-medium text-slate-600">Impact</span>
                <select
                  value={impact}
                  onChange={(e) => setImpact(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded"
                >
                  <option value={3}>3.0×</option>
                  <option value={2}>2.0×</option>
                  <option value={1}>1.0×</option>
                  <option value={0.5}>0.5×</option>
                  <option value={0.25}>0.25×</option>
                </select>
              </label>
              <label className="space-y-1 block">
                <span className="text-[11px] font-medium text-slate-600">Confidence %</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={confidence}
                  onChange={(e) => setConfidence(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded"
                />
              </label>
              <label className="space-y-1 block">
                <span className="text-[11px] font-medium text-slate-600">Effort (mo)</span>
                <input
                  type="number"
                  min={0.25}
                  max={100}
                  step={0.25}
                  value={effort}
                  onChange={(e) => setEffort(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">Horizon</span>
              <select
                value={horizon}
                onChange={(e) => setHorizon(e.target.value as Horizon)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md"
              >
                <option value="now">Now</option>
                <option value="next">Next</option>
                <option value="later">Later</option>
                <option value="not_building">Not Building</option>
              </select>
            </label>
            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">DRI / Owner</span>
              <input
                type="text"
                required
                minLength={FIELD_LIMITS.OWNER_NAME_MIN}
                maxLength={FIELD_LIMITS.OWNER_NAME_MAX}
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">Timeframe</span>
              <input
                type="text"
                required
                minLength={FIELD_LIMITS.TIMEFRAME_MIN}
                maxLength={FIELD_LIMITS.TIMEFRAME_MAX}
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">Sprint</span>
              <input
                type="text"
                maxLength={FIELD_LIMITS.SPRINT_MAX}
                value={sprint}
                onChange={(e) => setSprint(e.target.value)}
                placeholder="e.g., Sprint 15"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">Story Points</span>
              <input
                type="number"
                min={0}
                max={100}
                value={storyPoints}
                onChange={(e) => setStoryPoints(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                className="w-full px-3 py-2 text-xs font-mono tabular-nums border border-slate-200 rounded-md"
              />
            </label>
          </div>

          <label className="space-y-1 block">
            <span className="text-xs font-medium text-slate-700">Non-Goals (Optional)</span>
            <input
              type="text"
              maxLength={FIELD_LIMITS.NON_GOALS_MAX}
              value={nonGoals}
              onChange={(e) => setNonGoals(e.target.value)}
              placeholder="What are we explicitly NOT addressing in v1?"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
            />
          </label>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Creating...' : 'Create Feature Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. New Feedback Modal
// ---------------------------------------------------------------------------
interface NewFeedbackModalProps {
  open: boolean;
  requests: FeatureRequest[];
  defaultReporter: string;
  onClose: () => void;
  onCreate: (input: CreateFeedbackInput) => Promise<unknown>;
}

export function NewFeedbackModal({
  open,
  requests,
  defaultReporter,
  onClose,
  onCreate,
}: NewFeedbackModalProps) {
  const [title, setTitle] = useState('');
  const [quote, setQuote] = useState('');
  const [channel, setChannel] = useState<FeedbackChannel>('interview');
  const [customerSegment, setCustomerSegment] = useState('');
  const [reporterName, setReporterName] = useState(defaultReporter || 'Alex Rivera');
  const [urgency, setUrgency] = useState<Urgency>('medium');
  const [linkedRequestId, setLinkedRequestId] = useState('');
  const [arrImpact, setArrImpact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onCreate({
        title,
        quote,
        channel,
        customerSegment,
        reporterName,
        urgency,
        linkedRequestId,
        arrImpact,
      });
      setTitle('');
      setQuote('');
      setCustomerSegment('');
      setLinkedRequestId('');
      setArrImpact('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Log Feedback Signal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40"
    >
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-lg shadow-xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Log Discovery Evidence
            </h2>
            <p className="text-xs text-slate-500">
              Capture verbatim user pain, support signal, or behavioral drop-off.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <label className="space-y-1 block">
            <span className="text-xs font-medium text-slate-700">Signal Headline</span>
            <input
              type="text"
              required
              minLength={FIELD_LIMITS.TITLE_MIN}
              maxLength={FIELD_LIMITS.TITLE_MAX}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Mid-market admins struggle with bulk role permissions"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
            />
          </label>

          <label className="space-y-1 block">
            <span className="text-xs font-medium text-slate-700">Verbatim Quote or Metric Observation</span>
            <textarea
              rows={3}
              required
              minLength={FIELD_LIMITS.QUOTE_MIN}
              maxLength={FIELD_LIMITS.QUOTE_MAX}
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="Paste the customer verbatim or exact funnel metric..."
              className="w-full px-3 py-2 text-xs leading-relaxed border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">Evidence Channel</span>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as FeedbackChannel)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md"
              >
                <option value="interview">User Interview</option>
                <option value="support">Support Ticket</option>
                <option value="analytics">Behavioral Data</option>
                <option value="sales">Sales Signal</option>
                <option value="competitive">Competitive</option>
              </select>
            </label>

            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">Urgency</span>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as Urgency)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>

            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">Customer Segment</span>
              <input
                type="text"
                maxLength={FIELD_LIMITS.SEGMENT_MAX}
                value={customerSegment}
                onChange={(e) => setCustomerSegment(e.target.value)}
                placeholder="e.g., Enterprise · 200+ seats"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
              />
            </label>

            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">ARR / Impact Note</span>
              <input
                type="text"
                maxLength={FIELD_LIMITS.SHORT_VALUE_MAX}
                value={arrImpact}
                onChange={(e) => setArrImpact(e.target.value)}
                placeholder="e.g., $48k ARR"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-md"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">Source / Reporter</span>
              <input
                type="text"
                maxLength={FIELD_LIMITS.OWNER_NAME_MAX}
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
              />
            </label>

            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">Link to Backlog Item</span>
              <select
                value={linkedRequestId}
                onChange={(e) => setLinkedRequestId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md"
              >
                <option value="">Leave unlinked for triage</option>
                {requests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Capture Evidence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. New Decision Modal
// ---------------------------------------------------------------------------
interface NewDecisionModalProps {
  open: boolean;
  requests: FeatureRequest[];
  defaultRequestId?: string;
  defaultDecider: string;
  onClose: () => void;
  onCreate: (input: CreateDecisionInput) => Promise<unknown>;
}

export function NewDecisionModal({
  open,
  requests,
  defaultRequestId = '',
  defaultDecider,
  onClose,
  onCreate,
}: NewDecisionModalProps) {
  const [requestId, setRequestId] = useState(defaultRequestId);
  const [title, setTitle] = useState('');
  const [decisionType, setDecisionType] = useState<DecisionType>('build');
  const [rationale, setRationale] = useState('');
  const [tradeOffs, setTradeOffs] = useState('');
  const [confidencePct, setConfidencePct] = useState(75);
  const [decidedBy, setDecidedBy] = useState(defaultDecider || 'Alex Rivera');
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('proposed');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onCreate({
        requestId: requestId || defaultRequestId,
        title,
        decisionType,
        rationale,
        tradeOffs,
        confidencePct,
        decidedBy,
        approvalStatus,
      });
      setTitle('');
      setRationale('');
      setTradeOffs('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Record Alignment Decision"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40"
    >
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-lg shadow-xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Record Product Decision
            </h2>
            <p className="text-xs text-slate-500">
              Make trade-offs, confidence levels, and rationale explicit for all stakeholders.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <label className="space-y-1 block">
            <span className="text-xs font-medium text-slate-700">Decision Summary</span>
            <input
              type="text"
              required
              minLength={FIELD_LIMITS.TITLE_MIN}
              maxLength={FIELD_LIMITS.TITLE_MAX}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Ship v1 without custom export filters"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">Decision Type</span>
              <select
                value={decisionType}
                onChange={(e) => setDecisionType(e.target.value as DecisionType)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md"
              >
                <option value="build">Build</option>
                <option value="scope_change">Scope Change</option>
                <option value="explore">Explore Further</option>
                <option value="defer">Defer</option>
                <option value="kill">Kill</option>
              </select>
            </label>

            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">Related Initiative</span>
              <select
                value={requestId || defaultRequestId}
                onChange={(e) => setRequestId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md"
              >
                <option value="">General Workspace Decision</option>
                {requests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="space-y-1 block">
            <span className="text-xs font-medium text-slate-700">
              Evidence-Backed Rationale
            </span>
            <textarea
              rows={3}
              required
              minLength={FIELD_LIMITS.RATIONALE_MIN}
              maxLength={FIELD_LIMITS.RATIONALE_MAX}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="What data, user interviews, or constraints drove this call?"
              className="w-full px-3 py-2 text-xs leading-relaxed border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
            />
          </label>

          <label className="space-y-1 block">
            <span className="text-xs font-medium text-slate-700">Explicit Trade-Offs</span>
            <textarea
              rows={2}
              maxLength={FIELD_LIMITS.TRADEOFFS_MAX}
              value={tradeOffs}
              onChange={(e) => setTradeOffs(e.target.value)}
              placeholder="What are we giving up or deferring by making this choice?"
              className="w-full px-3 py-2 text-xs leading-relaxed border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">Confidence (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                value={confidencePct}
                onChange={(e) => setConfidencePct(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-md"
              />
            </label>

            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">Decided By</span>
              <input
                type="text"
                required
                minLength={2}
                maxLength={FIELD_LIMITS.OWNER_NAME_MAX}
                value={decidedBy}
                onChange={(e) => setDecidedBy(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
              />
            </label>

            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">Alignment State</span>
              <select
                value={approvalStatus}
                onChange={(e) => setApprovalStatus(e.target.value as ApprovalStatus)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md"
              >
                <option value="proposed">Proposed</option>
                <option value="aligned">Aligned</option>
                <option value="locked">Locked</option>
              </select>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Logging...' : 'Record Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Workspace Settings & Collaborator Modal
// ---------------------------------------------------------------------------
interface WorkspaceModalProps {
  open: boolean;
  workspace: Workspace | null;
  currentUid: string;
  onClose: () => void;
  onUpdateWorkspace: (input: {
    name: string;
    productArea: string;
    quarter: string;
    northStarMetric: string;
    northStarCurrent: string;
    northStarTarget: string;
  }) => Promise<void>;
  onCreateWorkspace: (input: {
    name: string;
    productArea: string;
    quarter: string;
    northStarMetric: string;
    northStarCurrent: string;
    northStarTarget: string;
  }) => Promise<void>;
  onAddCollaborator: (uid: string) => Promise<void>;
}

export function WorkspaceModal({
  open,
  workspace,
  currentUid,
  onClose,
  onUpdateWorkspace,
  onCreateWorkspace,
  onAddCollaborator,
}: WorkspaceModalProps) {
  const [mode, setMode] = useState<'edit' | 'create'>('edit');
  const [name, setName] = useState(workspace?.name || '');
  const [productArea, setProductArea] = useState(workspace?.productArea || '');
  const [quarter, setQuarter] = useState(workspace?.quarter || 'Q4 2026');
  const [northStarMetric, setNorthStarMetric] = useState(workspace?.northStarMetric || '');
  const [northStarCurrent, setNorthStarCurrent] = useState(workspace?.northStarCurrent || '');
  const [northStarTarget, setNorthStarTarget] = useState(workspace?.northStarTarget || '');
  const [collabUid, setCollabUid] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const switchMode = (next: 'edit' | 'create') => {
    setMode(next);
    if (next === 'create') {
      setName('');
      setProductArea('');
      setQuarter('Q1 2027');
      setNorthStarMetric('');
      setNorthStarCurrent('');
      setNorthStarTarget('');
    } else if (workspace) {
      setName(workspace.name);
      setProductArea(workspace.productArea);
      setQuarter(workspace.quarter);
      setNorthStarMetric(workspace.northStarMetric);
      setNorthStarCurrent(workspace.northStarCurrent);
      setNorthStarTarget(workspace.northStarTarget);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        name,
        productArea,
        quarter,
        northStarMetric,
        northStarCurrent,
        northStarTarget,
      };
      if (mode === 'create') {
        await onCreateWorkspace(payload);
      } else {
        await onUpdateWorkspace(payload);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Workspace Settings"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-lg shadow-xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 p-1 bg-slate-100 border border-slate-200 rounded-lg">
            <button
              type="button"
              onClick={() => switchMode('edit')}
              className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${
                mode === 'edit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Workspace Goal
            </button>
            <button
              type="button"
              onClick={() => switchMode('create')}
              className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${
                mode === 'create' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              New Workspace
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">Workspace Name</span>
              <input
                type="text"
                required
                minLength={2}
                maxLength={FIELD_LIMITS.WORKSPACE_NAME_MAX}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Core Platform"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">Active Quarter</span>
              <input
                type="text"
                required
                minLength={2}
                maxLength={FIELD_LIMITS.QUARTER_MAX}
                value={quarter}
                onChange={(e) => setQuarter(e.target.value)}
                placeholder="Q4 2026"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-md"
              />
            </label>
          </div>

          <label className="space-y-1 block">
            <span className="text-xs font-medium text-slate-700">Product Area</span>
            <input
              type="text"
              required
              minLength={2}
              maxLength={FIELD_LIMITS.WORKSPACE_NAME_MAX}
              value={productArea}
              onChange={(e) => setProductArea(e.target.value)}
              placeholder="B2B Workflow & Governance"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
            />
          </label>

          <label className="space-y-1 block">
            <span className="text-xs font-medium text-slate-700">North Star Metric</span>
            <input
              type="text"
              required
              minLength={3}
              maxLength={FIELD_LIMITS.METRIC_MAX}
              value={northStarMetric}
              onChange={(e) => setNorthStarMetric(e.target.value)}
              placeholder="Weekly Active Teams Completing Core Workflow"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">Current Baseline</span>
              <input
                type="text"
                maxLength={FIELD_LIMITS.SHORT_VALUE_MAX}
                value={northStarCurrent}
                onChange={(e) => setNorthStarCurrent(e.target.value)}
                placeholder="4,280 teams"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-md"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">EOY Target</span>
              <input
                type="text"
                maxLength={FIELD_LIMITS.SHORT_VALUE_MAX}
                value={northStarTarget}
                onChange={(e) => setNorthStarTarget(e.target.value)}
                placeholder="6,000 teams"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-md"
              />
            </label>
          </div>

          {mode === 'edit' && workspace && (
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-900">
                  Team Collaborators ({workspace.memberUids.length}/20)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(currentUid);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1800);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'UID Copied' : 'Copy My UID'}</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={collabUid}
                  onChange={(e) => setCollabUid(e.target.value)}
                  placeholder="Paste teammate Firebase UID to grant access..."
                  className="flex-1 px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-md"
                />
                <button
                  type="button"
                  disabled={!collabUid.trim()}
                  onClick={async () => {
                    await onAddCollaborator(collabUid);
                    setCollabUid('');
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-md hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
            >
              {saving ? 'Saving...' : mode === 'create' ? 'Create Workspace' : 'Save Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
