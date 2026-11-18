export type Horizon = 'now' | 'next' | 'later' | 'not_building';
export type RequestStatus = 'discovery' | 'scoped' | 'in_design' | 'in_dev' | 'shipped' | 'deferred';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type FeedbackChannel = 'interview' | 'support' | 'analytics' | 'sales' | 'competitive';
export type Urgency = 'high' | 'medium' | 'low';
export type DecisionType = 'build' | 'explore' | 'defer' | 'kill' | 'scope_change';
export type ApprovalStatus = 'proposed' | 'aligned' | 'locked';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  activeWorkspaceId: string;
  updatedAt?: unknown;
}

export interface Workspace {
  id: string;
  name: string;
  productArea: string;
  quarter: string;
  northStarMetric: string;
  northStarCurrent: string;
  northStarTarget: string;
  ownerId: string;
  memberUids: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FeatureRequest {
  id: string;
  workspaceId: string;
  ownerId: string;
  memberUids: string[];
  title: string;
  problemStatement: string;
  persona: string;
  horizon: Horizon;
  status: RequestStatus;
  ownerName: string;
  timeframe: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  riceScore: number;
  successMetric: string;
  metricBaseline: string;
  metricTarget: string;
  nonGoals: string;
  solutionOverview: string;
  acceptanceCriteria: string;
  rollbackCriteria: string;
  deferralReason: string;
  revisitCondition: string;
  requestSource: string;
  confidenceLevel: ConfidenceLevel;
  storyPoints?: number;
  sprint?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FeedbackItem {
  id: string;
  workspaceId: string;
  ownerId: string;
  memberUids: string[];
  title: string;
  quote: string;
  channel: FeedbackChannel;
  customerSegment: string;
  reporterName: string;
  urgency: Urgency;
  linkedRequestId: string;
  arrImpact: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AlignmentDecision {
  id: string;
  workspaceId: string;
  ownerId: string;
  memberUids: string[];
  requestId: string;
  title: string;
  decisionType: DecisionType;
  rationale: string;
  tradeOffs: string;
  confidencePct: number;
  decidedBy: string;
  approvalStatus: ApprovalStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const FIELD_LIMITS = {
  ID_PATTERN: /^[a-zA-Z0-9_\-]+$/,
  ID_MAX: 128,
  TITLE_MIN: 3,
  TITLE_MAX: 140,
  PROBLEM_MIN: 5,
  PROBLEM_MAX: 2000,
  PERSONA_MAX: 100,
  OWNER_NAME_MIN: 2,
  OWNER_NAME_MAX: 80,
  TIMEFRAME_MIN: 2,
  TIMEFRAME_MAX: 40,
  METRIC_MIN: 3,
  METRIC_MAX: 140,
  SHORT_VALUE_MAX: 40,
  NON_GOALS_MAX: 1500,
  SOLUTION_MAX: 3000,
  ACCEPTANCE_MAX: 2000,
  ROLLBACK_MAX: 500,
  DEFERRAL_MAX: 800,
  REVISIT_MAX: 500,
  SOURCE_MAX: 80,
  QUOTE_MIN: 5,
  QUOTE_MAX: 1500,
  SEGMENT_MAX: 80,
  RATIONALE_MIN: 5,
  RATIONALE_MAX: 2000,
  TRADEOFFS_MAX: 1000,
  WORKSPACE_NAME_MAX: 80,
  QUARTER_MAX: 32,
  SPRINT_MAX: 40,
  MEMBER_UIDS_MAX: 20,
} as const;

export const IMPACT_TIERS: { value: number; label: string }[] = [
  { value: 0.25, label: 'Minimal' },
  { value: 0.5, label: 'Low' },
  { value: 1, label: 'Medium' },
  { value: 2, label: 'High' },
  { value: 3, label: 'Massive' },
];

export function deriveStoryPoints(req: Pick<FeatureRequest, 'storyPoints' | 'effort'>): number {
  if (typeof req.storyPoints === 'number' && !Number.isNaN(req.storyPoints) && req.storyPoints >= 0) {
    return req.storyPoints;
  }
  const effort = Number(req.effort) || 1;
  if (effort <= 0.5) return 2;
  if (effort <= 1) return 3;
  if (effort <= 1.5) return 5;
  if (effort <= 2.5) return 8;
  if (effort <= 4) return 13;
  return 21;
}

export function sanitizeString(value: string, maxLen: number): string {
  return value.trim().slice(0, maxLen);
}

export function calcRiceScore(reach: number, impact: number, confidencePct: number, effort: number): number {
  const safeReach = Math.max(0, Math.min(10_000_000, Number(reach) || 0));
  const safeImpact = Math.max(0.25, Math.min(3, Number(impact) || 0.25));
  const safeConfidence = Math.max(1, Math.min(100, Number(confidencePct) || 1));
  const safeEffort = Math.max(0.25, Math.min(100, Number(effort) || 0.25));
  const score = (safeReach * safeImpact * (safeConfidence / 100)) / safeEffort;
  return Math.round(score * 10) / 10;
}

export function generateSafeId(prefix: string): string {
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 16) || 'item';
  const rand = Math.random().toString(36).slice(2, 8);
  const ts = Date.now().toString(36);
  return `${cleanPrefix}_${ts}_${rand}`;
}

export interface TeamLead {
  name: string;
  role: string;
  avatarUrl: string;
  initials: string;
}

export const TEAM_LEADS: TeamLead[] = [
  {
    name: 'Alex Rivera',
    role: 'Product Lead',
    avatarUrl: '/src/assets/images/avatar_pm_alex_1794837924196.jpg',
    initials: 'AR',
  },
  {
    name: 'Maya Lin',
    role: 'Engineering Lead',
    avatarUrl: '/src/assets/images/avatar_eng_maya_1794837924596.jpg',
    initials: 'ML',
  },
  {
    name: 'Jordan Patel',
    role: 'Design Lead',
    avatarUrl: '/src/assets/images/avatar_design_jordan_1794837925114.jpg',
    initials: 'JP',
  },
];

export const HORIZON_LABELS: Record<Horizon, string> = {
  now: 'Now (This Quarter)',
  next: 'Next (1–2 Quarters)',
  later: 'Later (3–6 Months)',
  not_building: 'Not Building',
};

export const HORIZON_SHORT_LABELS: Record<Horizon, string> = {
  now: 'Now',
  next: 'Next',
  later: 'Later',
  not_building: 'Not Building',
};

export const STATUS_LABELS: Record<RequestStatus, string> = {
  discovery: 'Discovery',
  scoped: 'Scoped',
  in_design: 'In Design',
  in_dev: 'In Dev',
  shipped: 'Shipped',
  deferred: 'Deferred',
};

export const CHANNEL_LABELS: Record<FeedbackChannel, string> = {
  interview: 'User Interview',
  support: 'Support Ticket',
  analytics: 'Behavioral Data',
  sales: 'Sales Signal',
  competitive: 'Competitive',
};

export const DECISION_TYPE_LABELS: Record<DecisionType, string> = {
  build: 'Build',
  explore: 'Explore Further',
  defer: 'Defer',
  kill: 'Kill',
  scope_change: 'Scope Change',
};

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  proposed: 'Proposed',
  aligned: 'Aligned',
  locked: 'Locked',
};
