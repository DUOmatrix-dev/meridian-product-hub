import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { calcRiceScore, generateSafeId } from '../types/product';

export async function seedInitialWorkspace(uid: string, userName: string): Promise<string> {
  const workspaceId = generateSafeId('ws');
  const memberUids = [uid];
  const ownerDisplay = userName.trim().slice(0, 80) || 'Alex Rivera';

  const batch = writeBatch(db);

  // 1. Create Workspace
  const wsRef = doc(db, 'workspaces', workspaceId);
  batch.set(wsRef, {
    id: workspaceId,
    name: 'Core Platform',
    productArea: 'B2B Workflow & Governance',
    quarter: 'Q4 2026',
    northStarMetric: 'Weekly Active Teams Completing Core Workflow',
    northStarCurrent: '4,280 teams',
    northStarTarget: '6,000 teams',
    ownerId: uid,
    memberUids,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 2. Seed Feature Requests (Now / Next / Later / Not Building + 3-Sprint Delivery History)
  const req1Id = generateSafeId('req');
  const req2Id = generateSafeId('req');
  const req3Id = generateSafeId('req');
  const req4Id = generateSafeId('req');
  const req5Id = generateSafeId('req');
  const req6Id = generateSafeId('req');
  const req7Id = generateSafeId('req');
  const req8Id = generateSafeId('req');

  const requests = [
    {
      id: req1Id,
      title: 'Self-Serve SSO & SAML Role Mapping',
      problemStatement:
        'Enterprise IT admins wait 4–6 business days for manual support provisioning to map Okta/Azure AD groups to workspace roles, stalling new-seat rollouts after contract signature.',
      persona: 'Mid-Market IT & Security Admin (200–1,000 seats)',
      horizon: 'now',
      status: 'in_dev',
      ownerName: 'Maya Lin',
      timeframe: 'Week 6 · Q4',
      sprint: 'Sprint 15',
      storyPoints: 8,
      reach: 840,
      impact: 2,
      confidence: 85,
      effort: 2,
      successMetric: 'Time-to-first-SSO-login',
      metricBaseline: '5.2 days',
      metricTarget: '< 15 mins',
      nonGoals:
        'Custom SCIM directory write-back and multi-IdP federation per single workspace are deferred to v2.',
      solutionOverview:
        'Guided SAML 2.0 metadata upload with live XML claim preview and deterministic role mapping rules before activating enforcement.',
      acceptanceCriteria:
        '1. Admin uploads IdP metadata URL and validates test assertion in < 30s.\n2. Fallback break-glass owner login prevents workspace lockout.\n3. Audit log captures every role mapping mutation.',
      rollbackCriteria: 'Revert SSO enforcement feature flag if auth error rate exceeds 0.5% over 15 minutes.',
      deferralReason: '',
      revisitCondition: '',
      requestSource: 'Enterprise Onboarding Calls (n=11)',
      confidenceLevel: 'high',
    },
    {
      id: req2Id,
      title: 'Guided CSV Import Schema Validator',
      problemStatement:
        '38% of new workspace setups abandon onboarding during bulk CSV import because silent date/encoding failures surface only after submitting 5,000+ rows.',
      persona: 'Operations Manager migrating from spreadsheets',
      horizon: 'now',
      status: 'in_design',
      ownerName: 'Jordan Patel',
      timeframe: 'Week 8 · Q4',
      sprint: 'Sprint 15',
      storyPoints: 5,
      reach: 1650,
      impact: 2,
      confidence: 80,
      effort: 1.5,
      successMetric: 'Onboarding import completion rate',
      metricBaseline: '42%',
      metricTarget: '68%',
      nonGoals: 'Live bi-directional Google Sheets sync and automated ETL scheduling are out of scope for v1.',
      solutionOverview:
        'Client-side pre-flight column mapper that highlights malformed rows inline with one-click ISO date normalization before writing to Firestore.',
      acceptanceCriteria:
        '1. Validates 10,000 rows in < 800ms.\n2. Exports error-only CSV containing failed rows and remediation hints.',
      rollbackCriteria: 'Disable pre-flight modal and restore legacy async uploader if parse crash rate > 1%.',
      deferralReason: '',
      revisitCondition: '',
      requestSource: 'Activation Funnel Drop-off + 120 Tickets/mo',
      confidenceLevel: 'high',
    },
    {
      id: req3Id,
      title: 'Deterministic Webhook Retry Queue',
      problemStatement:
        'Transient downstream 502 errors drop customer billing sync events with zero visibility or dead-letter replay controls.',
      persona: 'Platform Integration Engineer',
      horizon: 'now',
      status: 'shipped',
      ownerName: 'Maya Lin',
      timeframe: 'Shipped Week 3 · Q4',
      sprint: 'Sprint 14',
      storyPoints: 8,
      reach: 620,
      impact: 2,
      confidence: 95,
      effort: 1,
      successMetric: 'Webhook delivery reliability (24h)',
      metricBaseline: '96.4%',
      metricTarget: '99.95%',
      nonGoals: 'Per-event payload transformation scripts.',
      solutionOverview:
        'Exponential backoff queue (1m, 5m, 30m, 4h) with a 7-day dead-letter inspector and single-click manual replay.',
      acceptanceCriteria:
        '1. Retries up to 5 times with jitter.\n2. Surfaces HTTP response headers and latency per attempt.',
      rollbackCriteria: 'Pause retry workers if queue depth exceeds 50k messages.',
      deferralReason: '',
      revisitCondition: '',
      requestSource: 'Support Escalations & SLA Audits',
      confidenceLevel: 'high',
    },
    {
      id: req7Id,
      title: 'Workspace Role Audit Stream Export',
      problemStatement:
        'Security reviewers require a timestamped export of permission changes before approving annual renewals.',
      persona: 'Enterprise Security Reviewer',
      horizon: 'now',
      status: 'shipped',
      ownerName: 'Maya Lin',
      timeframe: 'Shipped Week 1 · Q4',
      sprint: 'Sprint 13',
      storyPoints: 13,
      reach: 410,
      impact: 2,
      confidence: 90,
      effort: 1.5,
      successMetric: 'Security questionnaire turnaround time',
      metricBaseline: '6 days',
      metricTarget: '1 day',
      nonGoals: 'Live SIEM streaming connectors.',
      solutionOverview: 'Signed CSV & JSON audit export covering role grants, revocations, and policy edits.',
      acceptanceCriteria: '1. Exports 90-day window in under 3 seconds.\n2. Includes actor UID and target resource.',
      rollbackCriteria: 'Disable export endpoint if memory exceeds 512MB.',
      deferralReason: '',
      revisitCondition: '',
      requestSource: 'Enterprise Procurement Reviews',
      confidenceLevel: 'high',
    },
    {
      id: req8Id,
      title: 'Keyboard Command Palette for Triage',
      problemStatement:
        'PMs reviewing 40+ incoming customer signals spend excessive time clicking across modals to link feedback.',
      persona: 'Product Manager',
      horizon: 'now',
      status: 'shipped',
      ownerName: 'Jordan Patel',
      timeframe: 'Shipped Late Q3',
      sprint: 'Sprint 12',
      storyPoints: 8,
      reach: 980,
      impact: 1,
      confidence: 85,
      effort: 1,
      successMetric: 'Weekly triage throughput per PM',
      metricBaseline: '18 items/wk',
      metricTarget: '35 items/wk',
      nonGoals: 'Customizable user keybindings in v1.',
      solutionOverview: 'Single-keystroke navigation and feedback linking workflow.',
      acceptanceCriteria: '1. Opens in < 50ms.\n2. Full keyboard accessibility.',
      rollbackCriteria: 'Disable shortcut listener if input conflicts occur.',
      deferralReason: '',
      revisitCondition: '',
      requestSource: 'Internal Dogfooding Retro',
      confidenceLevel: 'high',
    },
    {
      id: req4Id,
      title: 'Async Alignment Digest & Decision Alerts',
      problemStatement:
        'Cross-functional stakeholders miss PRD scope changes until sprint review, triggering late-stage rework and missed dependencies.',
      persona: 'Product & Engineering Leads',
      horizon: 'next',
      status: 'scoped',
      ownerName: ownerDisplay,
      timeframe: 'Q1 2027',
      sprint: 'Sprint 16',
      storyPoints: 5,
      reach: 1200,
      impact: 1,
      confidence: 70,
      effort: 1.5,
      successMetric: 'PRD review sign-off within 48h',
      metricBaseline: '54%',
      metricTarget: '85%',
      nonGoals: 'Real-time Slack two-way thread editing.',
      solutionOverview:
        'Weekly structured summary of locked decisions, RICE rank shifts, and dependency blockers delivered via digest email and webhook.',
      acceptanceCriteria:
        '1. Digest sends only when at least 1 decision or scope change occurred.\n2. Deep-links directly to diffed PRD section.',
      rollbackCriteria: 'Disable scheduled digest job if unsubscribe rate exceeds 5%.',
      deferralReason: '',
      revisitCondition: '',
      requestSource: 'Internal PM Retro + 6 Design Partners',
      confidenceLevel: 'medium',
    },
    {
      id: req5Id,
      title: 'Granular Field-Level RBAC Policy Builder',
      problemStatement:
        'Regulated healthcare and fintech prospects request column-level masking for sensitive customer identifiers inside shared team views.',
      persona: 'Compliance Officer (Enterprise Tier)',
      horizon: 'later',
      status: 'discovery',
      ownerName: ownerDisplay,
      timeframe: 'Q2 2027',
      sprint: 'Backlog',
      storyPoints: 13,
      reach: 310,
      impact: 3,
      confidence: 50,
      effort: 4,
      successMetric: 'Enterprise security review pass rate',
      metricBaseline: '61%',
      metricTarget: '90%',
      nonGoals: 'Custom SQL row-level expression language.',
      solutionOverview:
        'Policy templates restricting PII fields to verified Admin/Compliance roles across list views and CSV exports.',
      acceptanceCriteria: '1. Enforced server-side before query serialization.\n2. Zero impact on read latency < 50ms.',
      rollbackCriteria: 'Gate behind enterprise feature flag per tenant.',
      deferralReason: '',
      revisitCondition: '',
      requestSource: '3 Lost Enterprise Deals ($180k ARR)',
      confidenceLevel: 'low',
    },
    {
      id: req6Id,
      title: 'White-Label Native Mobile SDK',
      problemStatement:
        'Two agency partners asked to embed our workflow dashboard inside their native iOS/Android consumer apps.',
      persona: 'Agency Partner Developer',
      horizon: 'not_building',
      status: 'deferred',
      ownerName: ownerDisplay,
      timeframe: 'Deferred',
      sprint: 'Declined',
      storyPoints: 21,
      reach: 90,
      impact: 1,
      confidence: 60,
      effort: 6,
      successMetric: 'Partner-embedded MAU',
      metricBaseline: '0',
      metricTarget: 'N/A',
      nonGoals: 'Native Swift/Kotlin UI components.',
      solutionOverview: 'Not pursuing native SDK packaging; partners can use responsive web embeds.',
      acceptanceCriteria: 'N/A — formally deferred.',
      rollbackCriteria: 'N/A',
      deferralReason:
        'Mobile telemetry shows < 6% session share across active workspaces, while maintaining dual native SDKs would consume 2 full-time engineers for 2 quarters.',
      revisitCondition:
        'Revisit only if > 25% of enterprise pipeline explicitly requires embedded mobile SDKs or mobile web usage exceeds 20%.',
      requestSource: 'Sales Escalation (2 Agency Accounts)',
      confidenceLevel: 'high',
    },
  ];

  for (const r of requests) {
    const reqRef = doc(db, 'workspaces', workspaceId, 'requests', r.id);
    batch.set(reqRef, {
      ...r,
      workspaceId,
      ownerId: uid,
      memberUids,
      riceScore: calcRiceScore(r.reach, r.impact, r.confidence, r.effort),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // 3. Seed Discovery & Feedback Evidence
  const feedbackItems = [
    {
      id: generateSafeId('fb'),
      title: 'Okta group mapping blocks post-signature launch',
      quote:
        'We signed the annual contract 10 days ago, but our security team cannot launch to 240 ops reps until SAML role mapping works without filing support tickets.',
      channel: 'interview',
      customerSegment: 'Enterprise · 240 seats',
      reporterName: 'Dana K. (VP IT, Northbeam)',
      urgency: 'high',
      linkedRequestId: req1Id,
      arrImpact: '$64k ARR',
    },
    {
      id: generateSafeId('fb'),
      title: '38% drop-off at CSV upload step in onboarding',
      quote:
        'Funnel telemetry across 1,420 signups shows 38% abandon after receiving a generic "Row 412 invalid format" toast without knowing which column failed.',
      channel: 'analytics',
      customerSegment: 'Self-Serve · Growth',
      reporterName: 'Activation Funnel Cohort Q3',
      urgency: 'high',
      linkedRequestId: req2Id,
      arrImpact: '+18% Activation',
    },
    {
      id: generateSafeId('fb'),
      title: '120 support tickets/mo on silent import failures',
      quote:
        'Support tagged 120 tickets last month where European DD/MM/YYYY dates silently flipped month and day during bulk import.',
      channel: 'support',
      customerSegment: 'Mid-Market · EMEA',
      reporterName: 'Support Triage Queue',
      urgency: 'high',
      linkedRequestId: req2Id,
      arrImpact: '-$18k Support Cost',
    },
    {
      id: generateSafeId('fb'),
      title: 'Stakeholders surprised by mid-sprint scope trims',
      quote:
        'Design and CS learned two days before launch that the custom export filter was cut from v1. We need a single decision digest everyone sees.',
      channel: 'interview',
      customerSegment: 'Internal Design Partner',
      reporterName: 'Marcus T. (CS Lead)',
      urgency: 'medium',
      linkedRequestId: req4Id,
      arrImpact: 'Retention Shield',
    },
    {
      id: generateSafeId('fb'),
      title: 'Agency request for native iOS wrapper',
      quote:
        'Asked whether we publish an iOS Swift package to embed the backlog view inside their client-facing portal app.',
      channel: 'sales',
      customerSegment: 'Agency Partner',
      reporterName: 'Enterprise AE',
      urgency: 'low',
      linkedRequestId: req6Id,
      arrImpact: '$22k ARR',
    },
  ];

  for (const f of feedbackItems) {
    const fbRef = doc(db, 'workspaces', workspaceId, 'feedback', f.id);
    batch.set(fbRef, {
      ...f,
      workspaceId,
      ownerId: uid,
      memberUids,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // 4. Seed Alignment Decisions
  const decisions = [
    {
      id: generateSafeId('dec'),
      requestId: req1Id,
      title: 'Ship SAML role mapping without SCIM write-back in v1',
      decisionType: 'scope_change',
      rationale:
        '11 enterprise interviews confirm just-in-time SAML group claims unblock 90% of rollouts immediately. Adding full SCIM write-back doubles engineering effort from 2 to 4.5 person-months.',
      tradeOffs:
        'Admins must remove deprovisioned users via IdP session expiry until SCIM v2 ships in Q1; unblocks $210k ARR waiting in onboarding.',
      confidencePct: 85,
      decidedBy: ownerDisplay,
      approvalStatus: 'aligned',
    },
    {
      id: generateSafeId('dec'),
      requestId: req2Id,
      title: 'Prioritize CSV Schema Validator into Now over Audit Export',
      decisionType: 'build',
      rationale:
        'RICE score of 1,760 vs 640. Fixing the 38% onboarding drop-off compounds every acquisition channel immediately and cuts 120 support tickets/month.',
      tradeOffs: 'Cross-workspace audit export moves to Next (Q1 2027); legal prospects receive manual CSV dumps meanwhile.',
      confidencePct: 80,
      decidedBy: ownerDisplay,
      approvalStatus: 'aligned',
    },
    {
      id: generateSafeId('dec'),
      requestId: req6Id,
      title: 'Formally decline White-Label Native Mobile SDK',
      decisionType: 'kill',
      rationale:
        'Mobile analytics show < 6% active usage and only 2 agency accounts requested native SDKs. Opportunity cost is two full quarters of core platform engineering.',
      tradeOffs: 'Risk losing 1–2 agency deals ($22k ARR) in exchange for protecting Q4 activation and enterprise SSO commitments.',
      confidencePct: 90,
      decidedBy: ownerDisplay,
      approvalStatus: 'locked',
    },
    {
      id: generateSafeId('dec'),
      requestId: req3Id,
      title: 'Webhook Retry Queue launch validated against 99.95% SLA',
      decisionType: 'build',
      rationale:
        'Zero dropped events in the 14-day post-launch window; dead-letter replay eliminated all billing webhook escalations.',
      tradeOffs: 'Added 4 hours/week Redis queue observability overhead, offset by 100% reduction in manual support replays.',
      confidencePct: 95,
      decidedBy: 'Maya Lin',
      approvalStatus: 'locked',
    },
  ];

  for (const d of decisions) {
    const decRef = doc(db, 'workspaces', workspaceId, 'decisions', d.id);
    batch.set(decRef, {
      ...d,
      workspaceId,
      ownerId: uid,
      memberUids,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
    return workspaceId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `workspaces/${workspaceId}`);
  }
}
