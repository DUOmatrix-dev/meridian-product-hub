import { useEffect, useState } from 'react';
import { Lock, MessageSquareText, Plus, Scale, Trash2, X } from 'lucide-react';
import {
  AlignmentDecision,
  APPROVAL_STATUS_LABELS,
  CHANNEL_LABELS,
  ConfidenceLevel,
  DECISION_TYPE_LABELS,
  deriveStoryPoints,
  FeatureRequest,
  FeedbackItem,
  FIELD_LIMITS,
  Horizon,
  RequestStatus,
  Urgency,
} from '../types/product';
import { CreateRequestInput } from '../hooks/useWorkspaceData';
import { Avatar } from './Avatar';
import { RiceCalculator } from './RiceCalculator';

interface RequestDetailDrawerProps {
  request: FeatureRequest | null;
  allRequests: FeatureRequest[];
  feedback: FeedbackItem[];
  decisions: AlignmentDecision[];
  onClose: () => void;
  onSaveRice: (
    requestId: string,
    rice: { reach: number; impact: number; confidence: number; effort: number }
  ) => Promise<void>;
  onSaveFull: (requestId: string, input: CreateRequestInput) => Promise<void>;
  onDelete: (requestId: string) => Promise<void>;
  onLinkFeedback: (feedbackId: string, requestId: string, urgency: Urgency) => Promise<void>;
  onOpenNewDecision: (requestId: string) => void;
}

export function RequestDetailDrawer({
  request,
  allRequests,
  feedback,
  decisions,
  onClose,
  onSaveRice,
  onSaveFull,
  onDelete,
  onLinkFeedback,
  onOpenNewDecision,
}: RequestDetailDrawerProps) {
  const [form, setForm] = useState<CreateRequestInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [applyingRice, setApplyingRice] = useState(false);
  const [riceApplied, setRiceApplied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedUnlinkedFb, setSelectedUnlinkedFb] = useState('');

  useEffect(() => {
    setConfirmDelete(false);
    setRiceApplied(false);
    setSelectedUnlinkedFb('');
  }, [request?.id]);

  useEffect(() => {
    if (!request) {
      setForm(null);
      return;
    }
    setForm({
      title: request.title,
      problemStatement: request.problemStatement,
      persona: request.persona,
      horizon: request.horizon,
      status: request.status,
      ownerName: request.ownerName,
      timeframe: request.timeframe,
      reach: request.reach,
      impact: request.impact,
      confidence: request.confidence,
      effort: request.effort,
      successMetric: request.successMetric,
      metricBaseline: request.metricBaseline,
      metricTarget: request.metricTarget,
      nonGoals: request.nonGoals,
      solutionOverview: request.solutionOverview,
      acceptanceCriteria: request.acceptanceCriteria,
      rollbackCriteria: request.rollbackCriteria,
      deferralReason: request.deferralReason,
      revisitCondition: request.revisitCondition,
      requestSource: request.requestSource,
      confidenceLevel: request.confidenceLevel,
      storyPoints: deriveStoryPoints(request),
      sprint: request.sprint || '',
    });
  }, [request]);

  if (!request || !form) return null;

  const isLocked = request.status === 'shipped';
  const hasRiceChanged =
    form.reach !== request.reach ||
    form.impact !== request.impact ||
    form.confidence !== request.confidence ||
    form.effort !== request.effort;

  const linkedFeedback = feedback.filter((f) => f.linkedRequestId === request.id);
  const unlinkedFeedback = feedback.filter((f) => !f.linkedRequestId);
  const linkedDecisions = decisions.filter((d) => d.requestId === request.id);

  const handleApplyRice = async () => {
    if (isLocked || applyingRice || !hasRiceChanged) return;
    setApplyingRice(true);
    try {
      await onSaveRice(request.id, {
        reach: form.reach,
        impact: form.impact,
        confidence: form.confidence,
        effort: form.effort,
      });
      setRiceApplied(true);
      setTimeout(() => setRiceApplied(false), 2000);
    } finally {
      setApplyingRice(false);
    }
  };

  const handleResetRice = () => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            reach: request.reach,
            impact: request.impact,
            confidence: request.confidence,
            effort: request.effort,
          }
        : prev
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || saving) return;
    setSaving(true);
    try {
      const confidenceLevel: ConfidenceLevel =
        form.confidence >= 80 ? 'high' : form.confidence >= 50 ? 'medium' : 'low';
      await onSaveFull(request.id, { ...form, confidenceLevel });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Inspect ${request.title}`}
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/30"
    >
      <div className="w-full max-w-3xl bg-white h-full border-l border-slate-200 flex flex-col shadow-xl">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={form.ownerName} size="md" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-mono truncate">{request.id}</p>
              <h2 className="font-display text-base font-semibold text-slate-900 truncate">
                {request.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail drawer"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable PRD & Interactive RICE Calculator Body */}
        <form id="prd-edit-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          {isLocked && (
            <div className="p-3.5 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2.5 text-xs text-green-800">
              <Lock className="w-4 h-4 shrink-0" />
              <span>
                This initiative is marked <strong>Shipped</strong> and locked as a historical launch record. Record post-launch learnings in the Decision Log.
              </span>
            </div>
          )}

          {/* Dedicated Interactive RICE Score Calculator Tool */}
          <RiceCalculator
            request={request}
            allRequests={allRequests}
            reach={form.reach}
            impact={form.impact}
            confidence={form.confidence}
            effort={form.effort}
            isLocked={isLocked}
            applying={applyingRice}
            applied={riceApplied}
            onChange={(next) =>
              setForm((prev) => (prev ? { ...prev, ...next } : prev))
            }
            onApply={handleApplyRice}
            onReset={handleResetRice}
          />

          {/* Roadmap Commitments */}
          <section className="space-y-4">
            <h3 className="font-display text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">
              01. Roadmap Commitment, Sprint & Ownership
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1 block sm:col-span-2">
                <span className="text-xs font-medium text-slate-700">Initiative Title</span>
                <input
                  type="text"
                  required
                  minLength={FIELD_LIMITS.TITLE_MIN}
                  maxLength={FIELD_LIMITS.TITLE_MAX}
                  disabled={isLocked}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 disabled:bg-slate-100"
                />
              </label>

              <label className="space-y-1 block">
                <span className="text-xs font-medium text-slate-700">Roadmap Horizon</span>
                <select
                  disabled={isLocked}
                  value={form.horizon}
                  onChange={(e) => setForm({ ...form, horizon: e.target.value as Horizon })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 disabled:bg-slate-100"
                >
                  <option value="now">Now (Active This Quarter)</option>
                  <option value="next">Next (1–2 Quarters)</option>
                  <option value="later">Later (3–6 Months)</option>
                  <option value="not_building">Not Building (Declined)</option>
                </select>
              </label>

              <label className="space-y-1 block">
                <span className="text-xs font-medium text-slate-700">Execution Status</span>
                <select
                  disabled={isLocked}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as RequestStatus })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 disabled:bg-slate-100"
                >
                  <option value="discovery">Discovery</option>
                  <option value="scoped">Scoped</option>
                  <option value="in_design">In Design</option>
                  <option value="in_dev">In Dev</option>
                  <option value="shipped">Shipped (Locks Record)</option>
                  <option value="deferred">Deferred</option>
                </select>
              </label>

              <label className="space-y-1 block">
                <span className="text-xs font-medium text-slate-700">DRI / Owner</span>
                <input
                  type="text"
                  required
                  minLength={FIELD_LIMITS.OWNER_NAME_MIN}
                  maxLength={FIELD_LIMITS.OWNER_NAME_MAX}
                  disabled={isLocked}
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 disabled:bg-slate-100"
                />
              </label>

              <label className="space-y-1 block">
                <span className="text-xs font-medium text-slate-700">Target Timeframe</span>
                <input
                  type="text"
                  required
                  minLength={FIELD_LIMITS.TIMEFRAME_MIN}
                  maxLength={FIELD_LIMITS.TIMEFRAME_MAX}
                  disabled={isLocked}
                  value={form.timeframe}
                  onChange={(e) => setForm({ ...form, timeframe: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 disabled:bg-slate-100"
                />
              </label>

              <label className="space-y-1 block">
                <span className="text-xs font-medium text-slate-700">Sprint</span>
                <input
                  type="text"
                  maxLength={FIELD_LIMITS.SPRINT_MAX}
                  disabled={isLocked}
                  value={form.sprint || ''}
                  onChange={(e) => setForm({ ...form, sprint: e.target.value })}
                  placeholder="e.g., Sprint 15"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 disabled:bg-slate-100"
                />
              </label>

              <label className="space-y-1 block">
                <span className="text-xs font-medium text-slate-700">Story Points</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  disabled={isLocked}
                  value={form.storyPoints ?? 0}
                  onChange={(e) =>
                    setForm({ ...form, storyPoints: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })
                  }
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 disabled:bg-slate-100"
                />
              </label>
            </div>
          </section>

          {/* Problem & Outcome Metrics */}
          <section className="space-y-4">
            <h3 className="font-display text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">
              02. Problem Statement & Success Metrics
            </h3>

            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">
                Problem Statement (User pain & cost of inaction)
              </span>
              <textarea
                rows={3}
                required
                minLength={FIELD_LIMITS.PROBLEM_MIN}
                maxLength={FIELD_LIMITS.PROBLEM_MAX}
                disabled={isLocked}
                value={form.problemStatement}
                onChange={(e) => setForm({ ...form, problemStatement: e.target.value })}
                className="w-full px-3 py-2 text-xs leading-relaxed bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 disabled:bg-slate-100"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1 block">
                <span className="text-xs font-medium text-slate-700">Primary Persona</span>
                <input
                  type="text"
                  maxLength={FIELD_LIMITS.PERSONA_MAX}
                  disabled={isLocked}
                  value={form.persona}
                  onChange={(e) => setForm({ ...form, persona: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 disabled:bg-slate-100"
                />
              </label>

              <label className="space-y-1 block">
                <span className="text-xs font-medium text-slate-700">Discovery Evidence Source</span>
                <input
                  type="text"
                  maxLength={FIELD_LIMITS.SOURCE_MAX}
                  disabled={isLocked}
                  value={form.requestSource}
                  onChange={(e) => setForm({ ...form, requestSource: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 disabled:bg-slate-100"
                />
              </label>

              <label className="space-y-1 block sm:col-span-2">
                <span className="text-xs font-medium text-slate-700">Primary Success Metric</span>
                <input
                  type="text"
                  required
                  minLength={FIELD_LIMITS.METRIC_MIN}
                  maxLength={FIELD_LIMITS.METRIC_MAX}
                  disabled={isLocked}
                  value={form.successMetric}
                  onChange={(e) => setForm({ ...form, successMetric: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 disabled:bg-slate-100"
                />
              </label>

              <label className="space-y-1 block">
                <span className="text-xs font-medium text-slate-700">Current Baseline</span>
                <input
                  type="text"
                  maxLength={FIELD_LIMITS.SHORT_VALUE_MAX}
                  disabled={isLocked}
                  value={form.metricBaseline}
                  onChange={(e) => setForm({ ...form, metricBaseline: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 disabled:bg-slate-100"
                />
              </label>

              <label className="space-y-1 block">
                <span className="text-xs font-medium text-slate-700">Target Outcome</span>
                <input
                  type="text"
                  maxLength={FIELD_LIMITS.SHORT_VALUE_MAX}
                  disabled={isLocked}
                  value={form.metricTarget}
                  onChange={(e) => setForm({ ...form, metricTarget: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 disabled:bg-slate-100"
                />
              </label>
            </div>
          </section>

          {/* PRD Scope, Non-Goals & Rollback */}
          <section className="space-y-4">
            <h3 className="font-display text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">
              03. PRD Scope, Non-Goals & Acceptance Criteria
            </h3>

            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">Non-Goals (Explicitly Out of Scope)</span>
              <textarea
                rows={2}
                maxLength={FIELD_LIMITS.NON_GOALS_MAX}
                disabled={isLocked}
                value={form.nonGoals}
                onChange={(e) => setForm({ ...form, nonGoals: e.target.value })}
                className="w-full px-3 py-2 text-xs leading-relaxed bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 disabled:bg-slate-100"
              />
            </label>

            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">Solution Overview</span>
              <textarea
                rows={3}
                maxLength={FIELD_LIMITS.SOLUTION_MAX}
                disabled={isLocked}
                value={form.solutionOverview}
                onChange={(e) => setForm({ ...form, solutionOverview: e.target.value })}
                className="w-full px-3 py-2 text-xs leading-relaxed bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 disabled:bg-slate-100"
              />
            </label>

            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">Acceptance Criteria</span>
              <textarea
                rows={3}
                maxLength={FIELD_LIMITS.ACCEPTANCE_MAX}
                disabled={isLocked}
                value={form.acceptanceCriteria}
                onChange={(e) => setForm({ ...form, acceptanceCriteria: e.target.value })}
                className="w-full px-3 py-2 text-xs leading-relaxed bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 disabled:bg-slate-100"
              />
            </label>

            <label className="space-y-1 block">
              <span className="text-xs font-medium text-slate-700">Rollback Trigger & Contingency</span>
              <input
                type="text"
                maxLength={FIELD_LIMITS.ROLLBACK_MAX}
                disabled={isLocked}
                value={form.rollbackCriteria}
                onChange={(e) => setForm({ ...form, rollbackCriteria: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600 disabled:bg-slate-100"
              />
            </label>
          </section>

          {/* Deferral / Not Building Rationale */}
          {(form.horizon === 'not_building' || form.status === 'deferred') && (
            <section className="space-y-4 p-4 rounded-lg bg-red-50/50 border border-red-200">
              <h3 className="font-display text-sm font-semibold text-red-900">
                Not Building Rationale & Revisit Trigger
              </h3>
              <label className="space-y-1 block">
                <span className="text-xs font-medium text-slate-700">Reason for Deferral</span>
                <textarea
                  rows={2}
                  maxLength={FIELD_LIMITS.DEFERRAL_MAX}
                  disabled={isLocked}
                  value={form.deferralReason}
                  onChange={(e) => setForm({ ...form, deferralReason: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                />
              </label>
              <label className="space-y-1 block">
                <span className="text-xs font-medium text-slate-700">Revisit Condition</span>
                <input
                  type="text"
                  maxLength={FIELD_LIMITS.REVISIT_MAX}
                  disabled={isLocked}
                  value={form.revisitCondition}
                  onChange={(e) => setForm({ ...form, revisitCondition: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-600"
                />
              </label>
            </section>
          )}

          {/* Linked Evidence */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-display text-sm font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquareText className="w-4 h-4 text-slate-500" />
                <span>Linked Discovery Evidence ({linkedFeedback.length})</span>
              </h3>
            </div>

            {linkedFeedback.length === 0 ? (
              <p className="text-xs text-slate-500">
                No user interviews, support tickets, or behavioral signals linked yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                {linkedFeedback.map((fb) => (
                  <div key={fb.id} className="p-3.5 space-y-1">
                    <div className="text-[11px] text-slate-500">
                      <span className="font-medium text-slate-700">
                        {CHANNEL_LABELS[fb.channel]}
                      </span>
                      <span className="mx-1.5">·</span>
                      <span>{fb.customerSegment}</span>
                      <span className="mx-1.5">·</span>
                      <span>{fb.reporterName}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-900">{fb.title}</p>
                    <p className="text-xs text-slate-600">“{fb.quote}”</p>
                  </div>
                ))}
              </div>
            )}

            {unlinkedFeedback.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <select
                  value={selectedUnlinkedFb}
                  onChange={(e) => setSelectedUnlinkedFb(e.target.value)}
                  className="flex-1 text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5"
                >
                  <option value="">Attach an unlinked feedback signal...</option>
                  {unlinkedFeedback.map((fb) => (
                    <option key={fb.id} value={fb.id}>
                      [{CHANNEL_LABELS[fb.channel]}] {fb.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedUnlinkedFb}
                  onClick={() => {
                    const target = unlinkedFeedback.find((f) => f.id === selectedUnlinkedFb);
                    if (target) {
                      onLinkFeedback(target.id, request.id, target.urgency);
                      setSelectedUnlinkedFb('');
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-md hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
                >
                  Link Evidence
                </button>
              </div>
            )}
          </section>

          {/* Linked Decisions */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-display text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-slate-500" />
                <span>Alignment Decisions ({linkedDecisions.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => onOpenNewDecision(request.id)}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Decision</span>
              </button>
            </div>

            {linkedDecisions.length === 0 ? (
              <p className="text-xs text-slate-500">
                No formal decisions logged for this initiative yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                {linkedDecisions.map((dec) => (
                  <div key={dec.id} className="p-3.5 space-y-1">
                    <div className="text-[11px] text-slate-500">
                      <span className="font-medium text-slate-800">
                        {DECISION_TYPE_LABELS[dec.decisionType]}
                      </span>
                      <span className="mx-1.5">·</span>
                      <span className="font-mono tabular-nums">{dec.confidencePct}% confidence</span>
                      <span className="mx-1.5">·</span>
                      <span>{APPROVAL_STATUS_LABELS[dec.approvalStatus]}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-900">{dec.title}</p>
                    <p className="text-xs text-slate-600">{dec.rationale}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </form>

        {/* Drawer Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-4 shrink-0">
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 hover:text-red-800 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Request</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  await onDelete(request.id);
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 cursor-pointer"
              >
                Confirm Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              Close
            </button>
            {!isLocked && (
              <button
                type="submit"
                form="prd-edit-form"
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save PRD & RICE'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
