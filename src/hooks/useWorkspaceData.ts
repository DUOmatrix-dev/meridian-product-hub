import { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { seedInitialWorkspace } from '../lib/seedData';
import {
  AlignmentDecision,
  ApprovalStatus,
  calcRiceScore,
  ConfidenceLevel,
  DecisionType,
  FeatureRequest,
  FeedbackChannel,
  FeedbackItem,
  FIELD_LIMITS,
  generateSafeId,
  Horizon,
  RequestStatus,
  sanitizeString,
  Urgency,
  Workspace,
} from '../types/product';

export interface CreateRequestInput {
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
}

export interface CreateFeedbackInput {
  title: string;
  quote: string;
  channel: FeedbackChannel;
  customerSegment: string;
  reporterName: string;
  urgency: Urgency;
  linkedRequestId: string;
  arrImpact: string;
}

export interface CreateDecisionInput {
  requestId: string;
  title: string;
  decisionType: DecisionType;
  rationale: string;
  tradeOffs: string;
  confidencePct: number;
  decidedBy: string;
  approvalStatus: ApprovalStatus;
}

export function useWorkspaceData() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [decisions, setDecisions] = useState<AlignmentDecision[]>([]);

  const seedingRef = useRef<boolean>(false);

  const clearError = useCallback(() => setErrorMessage(null), []);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (!currentUser) {
        setWorkspaces([]);
        setActiveWorkspaceId(null);
        setRequests([]);
        setFeedback([]);
        setDecisions([]);
        seedingRef.current = false;
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Workspaces Listener & Auto-Seed
  useEffect(() => {
    if (!authReady || !user) return;

    setDataLoading(true);
    const wsQuery = query(
      collection(db, 'workspaces'),
      where('memberUids', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(
      wsQuery,
      async (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as Workspace);
        setWorkspaces(list);

        if (list.length === 0 && !seedingRef.current) {
          seedingRef.current = true;
          try {
            const newWsId = await seedInitialWorkspace(
              user.uid,
              user.displayName || 'Alex Rivera'
            );
            // Save private profile with active workspace
            const profileRef = doc(db, 'users', user.uid, 'private', 'profile');
            await setDoc(profileRef, {
              uid: user.uid,
              displayName: sanitizeString(user.displayName || 'Product Lead', 120),
              email: sanitizeString(user.email || 'user@example.com', 200),
              role: 'Product Manager',
              activeWorkspaceId: newWsId,
              updatedAt: serverTimestamp(),
            });
            setActiveWorkspaceId(newWsId);
          } catch (err) {
            setErrorMessage(
              err instanceof Error ? err.message : 'Unable to initialize workspace.'
            );
          } finally {
            setDataLoading(false);
          }
          return;
        }

        if (list.length > 0) {
          // Restore saved activeWorkspaceId if available
          try {
            const profileSnap = await getDoc(doc(db, 'users', user.uid, 'private', 'profile'));
            const savedId = profileSnap.exists()
              ? (profileSnap.data().activeWorkspaceId as string)
              : null;
            setActiveWorkspaceId((prev) => {
              if (prev && list.some((w) => w.id === prev)) return prev;
              if (savedId && list.some((w) => w.id === savedId)) return savedId;
              return list[0].id;
            });
          } catch {
            setActiveWorkspaceId((prev) =>
              prev && list.some((w) => w.id === prev) ? prev : list[0].id
            );
          }
        }
        setDataLoading(false);
      },
      (err) => {
        setDataLoading(false);
        setErrorMessage('Failed to load workspaces.');
        handleFirestoreError(err, OperationType.LIST, 'workspaces');
      }
    );

    return () => unsubscribe();
  }, [authReady, user]);

  // 3. Subcollections Listeners (Requests, Feedback, Decisions)
  useEffect(() => {
    if (!authReady || !user || !activeWorkspaceId) {
      setRequests([]);
      setFeedback([]);
      setDecisions([]);
      return;
    }

    const reqPath = `workspaces/${activeWorkspaceId}/requests`;
    const fbPath = `workspaces/${activeWorkspaceId}/feedback`;
    const decPath = `workspaces/${activeWorkspaceId}/decisions`;

    const reqQuery = query(
      collection(db, 'workspaces', activeWorkspaceId, 'requests'),
      where('memberUids', 'array-contains', user.uid)
    );
    const fbQuery = query(
      collection(db, 'workspaces', activeWorkspaceId, 'feedback'),
      where('memberUids', 'array-contains', user.uid)
    );
    const decQuery = query(
      collection(db, 'workspaces', activeWorkspaceId, 'decisions'),
      where('memberUids', 'array-contains', user.uid)
    );

    const unsubReq = onSnapshot(
      reqQuery,
      (snap) => {
        const items = snap.docs.map((d) => d.data() as FeatureRequest);
        items.sort((a, b) => b.riceScore - a.riceScore);
        setRequests(items);
      },
      (err) => {
        setErrorMessage('Failed to sync feature requests.');
        handleFirestoreError(err, OperationType.LIST, reqPath);
      }
    );

    const unsubFb = onSnapshot(
      fbQuery,
      (snap) => {
        const items = snap.docs.map((d) => d.data() as FeedbackItem);
        setFeedback(items);
      },
      (err) => {
        setErrorMessage('Failed to sync feedback evidence.');
        handleFirestoreError(err, OperationType.LIST, fbPath);
      }
    );

    const unsubDec = onSnapshot(
      decQuery,
      (snap) => {
        const items = snap.docs.map((d) => d.data() as AlignmentDecision);
        setDecisions(items);
      },
      (err) => {
        setErrorMessage('Failed to sync alignment decisions.');
        handleFirestoreError(err, OperationType.LIST, decPath);
      }
    );

    return () => {
      unsubReq();
      unsubFb();
      unsubDec();
    };
  }, [authReady, user, activeWorkspaceId]);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || null;

  // --- Auth Actions ---
  const signInWithGoogle = useCallback(async () => {
    setAuthLoading(true);
    setErrorMessage(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setErrorMessage(null);
    try {
      await signOut(auth);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Sign-out failed.');
    }
  }, []);

  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      setActiveWorkspaceId(workspaceId);
      if (!user) return;
      const profilePath = `users/${user.uid}/private/profile`;
      try {
        await setDoc(
          doc(db, 'users', user.uid, 'private', 'profile'),
          {
            uid: user.uid,
            displayName: sanitizeString(user.displayName || 'Product Lead', 120),
            email: sanitizeString(user.email || 'user@example.com', 200),
            role: 'Product Manager',
            activeWorkspaceId: workspaceId,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, profilePath);
      }
    },
    [user]
  );

  // --- Workspace Mutations ---
  const createWorkspace = useCallback(
    async (input: {
      name: string;
      productArea: string;
      quarter: string;
      northStarMetric: string;
      northStarCurrent: string;
      northStarTarget: string;
    }) => {
      if (!user) return;
      const wsId = generateSafeId('ws');
      const path = `workspaces/${wsId}`;
      try {
        await setDoc(doc(db, 'workspaces', wsId), {
          id: wsId,
          name: sanitizeString(input.name, FIELD_LIMITS.WORKSPACE_NAME_MAX) || 'New Workspace',
          productArea: sanitizeString(input.productArea, FIELD_LIMITS.WORKSPACE_NAME_MAX) || 'Product Core',
          quarter: sanitizeString(input.quarter, FIELD_LIMITS.QUARTER_MAX) || 'Q4 2026',
          northStarMetric:
            sanitizeString(input.northStarMetric, FIELD_LIMITS.METRIC_MAX) ||
            'Weekly Active Teams',
          northStarCurrent: sanitizeString(input.northStarCurrent, FIELD_LIMITS.SHORT_VALUE_MAX),
          northStarTarget: sanitizeString(input.northStarTarget, FIELD_LIMITS.SHORT_VALUE_MAX),
          ownerId: user.uid,
          memberUids: [user.uid],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await switchWorkspace(wsId);
      } catch (err) {
        setErrorMessage('Unable to create workspace.');
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [user, switchWorkspace]
  );

  const updateWorkspaceMeta = useCallback(
    async (input: {
      name: string;
      productArea: string;
      quarter: string;
      northStarMetric: string;
      northStarCurrent: string;
      northStarTarget: string;
    }) => {
      if (!user || !activeWorkspace) return;
      const path = `workspaces/${activeWorkspace.id}`;
      try {
        await updateDoc(doc(db, 'workspaces', activeWorkspace.id), {
          name: sanitizeString(input.name, FIELD_LIMITS.WORKSPACE_NAME_MAX),
          productArea: sanitizeString(input.productArea, FIELD_LIMITS.WORKSPACE_NAME_MAX),
          quarter: sanitizeString(input.quarter, FIELD_LIMITS.QUARTER_MAX),
          northStarMetric: sanitizeString(input.northStarMetric, FIELD_LIMITS.METRIC_MAX),
          northStarCurrent: sanitizeString(input.northStarCurrent, FIELD_LIMITS.SHORT_VALUE_MAX),
          northStarTarget: sanitizeString(input.northStarTarget, FIELD_LIMITS.SHORT_VALUE_MAX),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        setErrorMessage('Unable to update workspace settings.');
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user, activeWorkspace]
  );

  const addCollaboratorUid = useCallback(
    async (collaboratorUid: string) => {
      if (!user || !activeWorkspace) return;
      const cleanUid = collaboratorUid.trim();
      if (!FIELD_LIMITS.ID_PATTERN.test(cleanUid) || cleanUid.length > FIELD_LIMITS.ID_MAX) {
        setErrorMessage('Invalid collaborator UID format.');
        return;
      }
      if (activeWorkspace.memberUids.includes(cleanUid)) return;
      if (activeWorkspace.memberUids.length >= FIELD_LIMITS.MEMBER_UIDS_MAX) {
        setErrorMessage('Workspace member limit (20) reached.');
        return;
      }

      const nextMembers = [...activeWorkspace.memberUids, cleanUid];
      const batch = writeBatch(db);
      batch.update(doc(db, 'workspaces', activeWorkspace.id), {
        memberUids: nextMembers,
        updatedAt: serverTimestamp(),
      });

      for (const r of requests) {
        if (r.status !== 'shipped') {
          batch.update(doc(db, 'workspaces', activeWorkspace.id, 'requests', r.id), {
            memberUids: nextMembers,
            updatedAt: serverTimestamp(),
          });
        }
      }
      for (const f of feedback) {
        batch.update(doc(db, 'workspaces', activeWorkspace.id, 'feedback', f.id), {
          memberUids: nextMembers,
          updatedAt: serverTimestamp(),
        });
      }
      for (const d of decisions) {
        if (d.approvalStatus !== 'locked') {
          batch.update(doc(db, 'workspaces', activeWorkspace.id, 'decisions', d.id), {
            memberUids: nextMembers,
            updatedAt: serverTimestamp(),
          });
        }
      }

      try {
        await batch.commit();
      } catch (err) {
        setErrorMessage('Unable to add collaborator.');
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspace.id}`);
      }
    },
    [user, activeWorkspace, requests, feedback, decisions]
  );

  // --- Feature Request Mutations ---
  const createRequest = useCallback(
    async (input: CreateRequestInput) => {
      if (!user || !activeWorkspace) return null;
      const reqId = generateSafeId('req');
      const path = `workspaces/${activeWorkspace.id}/requests/${reqId}`;

      const reach = Math.max(0, Math.min(10_000_000, Number(input.reach) || 0));
      const impact = Math.max(0.25, Math.min(3, Number(input.impact) || 1));
      const confidence = Math.max(1, Math.min(100, Number(input.confidence) || 50));
      const effort = Math.max(0.25, Math.min(100, Number(input.effort) || 1));
      const riceScore = calcRiceScore(reach, impact, confidence, effort);

      try {
        await setDoc(doc(db, 'workspaces', activeWorkspace.id, 'requests', reqId), {
          id: reqId,
          workspaceId: activeWorkspace.id,
          ownerId: user.uid,
          memberUids: activeWorkspace.memberUids,
          title: sanitizeString(input.title, FIELD_LIMITS.TITLE_MAX),
          problemStatement: sanitizeString(input.problemStatement, FIELD_LIMITS.PROBLEM_MAX),
          persona: sanitizeString(input.persona, FIELD_LIMITS.PERSONA_MAX),
          horizon: input.horizon,
          status: input.status,
          ownerName: sanitizeString(input.ownerName, FIELD_LIMITS.OWNER_NAME_MAX) || 'Alex Rivera',
          timeframe: sanitizeString(input.timeframe, FIELD_LIMITS.TIMEFRAME_MAX) || 'Q4 2026',
          reach,
          impact,
          confidence,
          effort,
          riceScore,
          successMetric: sanitizeString(input.successMetric, FIELD_LIMITS.METRIC_MAX) || 'Adoption rate',
          metricBaseline: sanitizeString(input.metricBaseline, FIELD_LIMITS.SHORT_VALUE_MAX),
          metricTarget: sanitizeString(input.metricTarget, FIELD_LIMITS.SHORT_VALUE_MAX),
          nonGoals: sanitizeString(input.nonGoals, FIELD_LIMITS.NON_GOALS_MAX),
          solutionOverview: sanitizeString(input.solutionOverview, FIELD_LIMITS.SOLUTION_MAX),
          acceptanceCriteria: sanitizeString(input.acceptanceCriteria, FIELD_LIMITS.ACCEPTANCE_MAX),
          rollbackCriteria: sanitizeString(input.rollbackCriteria, FIELD_LIMITS.ROLLBACK_MAX),
          deferralReason: sanitizeString(input.deferralReason, FIELD_LIMITS.DEFERRAL_MAX),
          revisitCondition: sanitizeString(input.revisitCondition, FIELD_LIMITS.REVISIT_MAX),
          requestSource: sanitizeString(input.requestSource, FIELD_LIMITS.SOURCE_MAX),
          confidenceLevel: input.confidenceLevel,
          storyPoints: Math.max(0, Math.min(100, Number(input.storyPoints) || 0)),
          sprint: sanitizeString(input.sprint || '', FIELD_LIMITS.SPRINT_MAX),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return reqId;
      } catch (err) {
        setErrorMessage('Failed to create feature request.');
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [user, activeWorkspace]
  );

  const updateRequestRice = useCallback(
    async (
      requestId: string,
      rice: { reach: number; impact: number; confidence: number; effort: number }
    ) => {
      if (!user || !activeWorkspace) return;
      const path = `workspaces/${activeWorkspace.id}/requests/${requestId}`;
      const reach = Math.max(0, Math.min(10_000_000, Number(rice.reach) || 0));
      const impact = Math.max(0.25, Math.min(3, Number(rice.impact) || 1));
      const confidence = Math.max(1, Math.min(100, Number(rice.confidence) || 50));
      const effort = Math.max(0.25, Math.min(100, Number(rice.effort) || 1));
      const riceScore = calcRiceScore(reach, impact, confidence, effort);
      const confidenceLevel: ConfidenceLevel =
        confidence >= 80 ? 'high' : confidence >= 50 ? 'medium' : 'low';

      try {
        await updateDoc(doc(db, 'workspaces', activeWorkspace.id, 'requests', requestId), {
          reach,
          impact,
          confidence,
          effort,
          riceScore,
          confidenceLevel,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        setErrorMessage('Failed to update RICE prioritization.');
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user, activeWorkspace]
  );

  const updateRequestHorizon = useCallback(
    async (
      requestId: string,
      updates: {
        horizon: Horizon;
        status: RequestStatus;
        timeframe: string;
        deferralReason?: string;
        revisitCondition?: string;
      }
    ) => {
      if (!user || !activeWorkspace) return;
      const path = `workspaces/${activeWorkspace.id}/requests/${requestId}`;
      try {
        await updateDoc(doc(db, 'workspaces', activeWorkspace.id, 'requests', requestId), {
          horizon: updates.horizon,
          status: updates.status,
          timeframe: sanitizeString(updates.timeframe, FIELD_LIMITS.TIMEFRAME_MAX) || 'TBD',
          deferralReason: sanitizeString(updates.deferralReason || '', FIELD_LIMITS.DEFERRAL_MAX),
          revisitCondition: sanitizeString(updates.revisitCondition || '', FIELD_LIMITS.REVISIT_MAX),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        setErrorMessage('Failed to update roadmap horizon.');
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user, activeWorkspace]
  );

  const updateRequestFull = useCallback(
    async (requestId: string, input: CreateRequestInput) => {
      if (!user || !activeWorkspace) return;
      const path = `workspaces/${activeWorkspace.id}/requests/${requestId}`;
      const reach = Math.max(0, Math.min(10_000_000, Number(input.reach) || 0));
      const impact = Math.max(0.25, Math.min(3, Number(input.impact) || 1));
      const confidence = Math.max(1, Math.min(100, Number(input.confidence) || 50));
      const effort = Math.max(0.25, Math.min(100, Number(input.effort) || 1));
      const riceScore = calcRiceScore(reach, impact, confidence, effort);

      try {
        await updateDoc(doc(db, 'workspaces', activeWorkspace.id, 'requests', requestId), {
          title: sanitizeString(input.title, FIELD_LIMITS.TITLE_MAX),
          problemStatement: sanitizeString(input.problemStatement, FIELD_LIMITS.PROBLEM_MAX),
          persona: sanitizeString(input.persona, FIELD_LIMITS.PERSONA_MAX),
          ownerName: sanitizeString(input.ownerName, FIELD_LIMITS.OWNER_NAME_MAX) || 'Alex Rivera',
          timeframe: sanitizeString(input.timeframe, FIELD_LIMITS.TIMEFRAME_MAX) || 'Q4 2026',
          horizon: input.horizon,
          status: input.status,
          reach,
          impact,
          confidence,
          effort,
          riceScore,
          successMetric: sanitizeString(input.successMetric, FIELD_LIMITS.METRIC_MAX) || 'Adoption rate',
          metricBaseline: sanitizeString(input.metricBaseline, FIELD_LIMITS.SHORT_VALUE_MAX),
          metricTarget: sanitizeString(input.metricTarget, FIELD_LIMITS.SHORT_VALUE_MAX),
          nonGoals: sanitizeString(input.nonGoals, FIELD_LIMITS.NON_GOALS_MAX),
          solutionOverview: sanitizeString(input.solutionOverview, FIELD_LIMITS.SOLUTION_MAX),
          acceptanceCriteria: sanitizeString(input.acceptanceCriteria, FIELD_LIMITS.ACCEPTANCE_MAX),
          rollbackCriteria: sanitizeString(input.rollbackCriteria, FIELD_LIMITS.ROLLBACK_MAX),
          deferralReason: sanitizeString(input.deferralReason, FIELD_LIMITS.DEFERRAL_MAX),
          revisitCondition: sanitizeString(input.revisitCondition, FIELD_LIMITS.REVISIT_MAX),
          requestSource: sanitizeString(input.requestSource, FIELD_LIMITS.SOURCE_MAX),
          confidenceLevel: input.confidenceLevel,
          storyPoints: Math.max(0, Math.min(100, Number(input.storyPoints) || 0)),
          sprint: sanitizeString(input.sprint || '', FIELD_LIMITS.SPRINT_MAX),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        setErrorMessage('Failed to save PRD updates.');
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user, activeWorkspace]
  );

  const deleteRequest = useCallback(
    async (requestId: string) => {
      if (!user || !activeWorkspace) return;
      const path = `workspaces/${activeWorkspace.id}/requests/${requestId}`;
      try {
        await deleteDoc(doc(db, 'workspaces', activeWorkspace.id, 'requests', requestId));
      } catch (err) {
        setErrorMessage('Failed to delete feature request.');
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user, activeWorkspace]
  );

  // --- Feedback Mutations ---
  const createFeedback = useCallback(
    async (input: CreateFeedbackInput) => {
      if (!user || !activeWorkspace) return null;
      const fbId = generateSafeId('fb');
      const path = `workspaces/${activeWorkspace.id}/feedback/${fbId}`;
      try {
        await setDoc(doc(db, 'workspaces', activeWorkspace.id, 'feedback', fbId), {
          id: fbId,
          workspaceId: activeWorkspace.id,
          ownerId: user.uid,
          memberUids: activeWorkspace.memberUids,
          title: sanitizeString(input.title, FIELD_LIMITS.TITLE_MAX),
          quote: sanitizeString(input.quote, FIELD_LIMITS.QUOTE_MAX),
          channel: input.channel,
          customerSegment: sanitizeString(input.customerSegment, FIELD_LIMITS.SEGMENT_MAX),
          reporterName: sanitizeString(input.reporterName, FIELD_LIMITS.OWNER_NAME_MAX),
          urgency: input.urgency,
          linkedRequestId: sanitizeString(input.linkedRequestId, FIELD_LIMITS.ID_MAX),
          arrImpact: sanitizeString(input.arrImpact, FIELD_LIMITS.SHORT_VALUE_MAX),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return fbId;
      } catch (err) {
        setErrorMessage('Failed to capture feedback evidence.');
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [user, activeWorkspace]
  );

  const linkFeedbackToRequest = useCallback(
    async (feedbackId: string, linkedRequestId: string, urgency: Urgency) => {
      if (!user || !activeWorkspace) return;
      const path = `workspaces/${activeWorkspace.id}/feedback/${feedbackId}`;
      try {
        await updateDoc(doc(db, 'workspaces', activeWorkspace.id, 'feedback', feedbackId), {
          linkedRequestId: sanitizeString(linkedRequestId, FIELD_LIMITS.ID_MAX),
          urgency,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        setErrorMessage('Failed to link feedback item.');
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user, activeWorkspace]
  );

  const deleteFeedback = useCallback(
    async (feedbackId: string) => {
      if (!user || !activeWorkspace) return;
      const path = `workspaces/${activeWorkspace.id}/feedback/${feedbackId}`;
      try {
        await deleteDoc(doc(db, 'workspaces', activeWorkspace.id, 'feedback', feedbackId));
      } catch (err) {
        setErrorMessage('Failed to delete feedback item.');
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user, activeWorkspace]
  );

  // --- Decision Mutations ---
  const createDecision = useCallback(
    async (input: CreateDecisionInput) => {
      if (!user || !activeWorkspace) return null;
      const decId = generateSafeId('dec');
      const path = `workspaces/${activeWorkspace.id}/decisions/${decId}`;
      const confidencePct = Math.max(0, Math.min(100, Number(input.confidencePct) || 50));
      try {
        await setDoc(doc(db, 'workspaces', activeWorkspace.id, 'decisions', decId), {
          id: decId,
          workspaceId: activeWorkspace.id,
          ownerId: user.uid,
          memberUids: activeWorkspace.memberUids,
          requestId: sanitizeString(input.requestId, FIELD_LIMITS.ID_MAX),
          title: sanitizeString(input.title, FIELD_LIMITS.TITLE_MAX),
          decisionType: input.decisionType,
          rationale: sanitizeString(input.rationale, FIELD_LIMITS.RATIONALE_MAX),
          tradeOffs: sanitizeString(input.tradeOffs, FIELD_LIMITS.TRADEOFFS_MAX),
          confidencePct,
          decidedBy:
            sanitizeString(input.decidedBy, FIELD_LIMITS.OWNER_NAME_MAX) ||
            user.displayName ||
            'Alex Rivera',
          approvalStatus: input.approvalStatus,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return decId;
      } catch (err) {
        setErrorMessage('Failed to record decision.');
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    },
    [user, activeWorkspace]
  );

  const updateDecisionStatus = useCallback(
    async (decisionId: string, approvalStatus: ApprovalStatus) => {
      if (!user || !activeWorkspace) return;
      const path = `workspaces/${activeWorkspace.id}/decisions/${decisionId}`;
      try {
        await updateDoc(doc(db, 'workspaces', activeWorkspace.id, 'decisions', decisionId), {
          approvalStatus,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        setErrorMessage('Failed to update decision alignment status.');
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    },
    [user, activeWorkspace]
  );

  const deleteDecision = useCallback(
    async (decisionId: string) => {
      if (!user || !activeWorkspace) return;
      const path = `workspaces/${activeWorkspace.id}/decisions/${decisionId}`;
      try {
        await deleteDoc(doc(db, 'workspaces', activeWorkspace.id, 'decisions', decisionId));
      } catch (err) {
        setErrorMessage('Failed to delete decision record.');
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    },
    [user, activeWorkspace]
  );

  return {
    user,
    authReady,
    authLoading,
    dataLoading,
    errorMessage,
    clearError,
    workspaces,
    activeWorkspace,
    requests,
    feedback,
    decisions,
    signInWithGoogle,
    signOutUser,
    switchWorkspace,
    createWorkspace,
    updateWorkspaceMeta,
    addCollaboratorUid,
    createRequest,
    updateRequestRice,
    updateRequestHorizon,
    updateRequestFull,
    deleteRequest,
    createFeedback,
    linkFeedbackToRequest,
    deleteFeedback,
    createDecision,
    updateDecisionStatus,
    deleteDecision,
  };
}
