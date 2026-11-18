/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  AlertCircle,
  GitBranch,
  LogOut,
  Menu,
  MessageSquareText,
  Plus,
  Scale,
  Settings2,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useWorkspaceData } from './hooks/useWorkspaceData';
import { FeatureRequest, Horizon } from './types/product';
import { SignInScreen } from './components/SignInScreen';
import { BacklogView } from './components/BacklogView';
import { RoadmapView } from './components/RoadmapView';
import { FeedbackView } from './components/FeedbackView';
import { DecisionsView } from './components/DecisionsView';
import { RequestDetailDrawer } from './components/RequestDetailDrawer';
import {
  NewDecisionModal,
  NewFeedbackModal,
  NewRequestModal,
  WorkspaceModal,
} from './components/ActionModals';
import { Avatar } from './components/Avatar';

type ActiveTab = 'backlog' | 'roadmap' | 'feedback' | 'decisions';

const NAV_ITEMS: { key: ActiveTab; label: string; icon: typeof SlidersHorizontal }[] = [
  { key: 'backlog', label: 'Backlog & RICE', icon: SlidersHorizontal },
  { key: 'roadmap', label: 'Roadmap', icon: GitBranch },
  { key: 'feedback', label: 'Feedback Intake', icon: MessageSquareText },
  { key: 'decisions', label: 'Decision Log', icon: Scale },
];

export default function App() {
  const {
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
  } = useWorkspaceData();

  const [activeTab, setActiveTab] = useState<ActiveTab>('backlog');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [newFeedbackOpen, setNewFeedbackOpen] = useState(false);
  const [newDecisionOpen, setNewDecisionOpen] = useState(false);
  const [decisionDefaultReqId, setDecisionDefaultReqId] = useState('');
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-3 animate-pulse">
          <div className="h-5 w-32 bg-slate-200 rounded mx-auto" />
          <div className="h-3 w-56 bg-slate-200 rounded mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <SignInScreen
        onSignIn={signInWithGoogle}
        loading={authLoading}
        errorMessage={errorMessage}
      />
    );
  }

  const selectedRequest = requests.find((r) => r.id === selectedRequestId) || null;
  const activeNavLabel = NAV_ITEMS.find((n) => n.key === activeTab)?.label || 'Backlog & RICE';

  const handlePrimaryAction = () => {
    if (activeTab === 'feedback') {
      setNewFeedbackOpen(true);
    } else if (activeTab === 'decisions') {
      setDecisionDefaultReqId('');
      setNewDecisionOpen(true);
    } else {
      setNewRequestOpen(true);
    }
  };

  const primaryActionLabel =
    activeTab === 'feedback'
      ? 'Log Feedback'
      : activeTab === 'decisions'
      ? 'Record Decision'
      : 'New Request';

  const handleQuickHorizonChange = async (req: FeatureRequest, nextHorizon: Horizon) => {
    if (req.status === 'shipped') return;
    const nextStatus =
      nextHorizon === 'not_building'
        ? 'deferred'
        : req.status === 'deferred'
        ? 'discovery'
        : req.status;
    await updateRequestHorizon(req.id, {
      horizon: nextHorizon,
      status: nextStatus,
      timeframe:
        nextHorizon === 'not_building'
          ? 'Deferred'
          : req.timeframe === 'Deferred'
          ? 'TBD'
          : req.timeframe,
      deferralReason: req.deferralReason,
      revisitCondition: req.revisitCondition,
    });
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between shrink-0">
        <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          Meridian
        </span>
        <button
          type="button"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close navigation"
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Workspace Selector */}
      <div className="p-4 border-b border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500">Workspace</span>
          <button
            type="button"
            onClick={() => {
              setWorkspaceModalOpen(true);
              setMobileNavOpen(false);
            }}
            aria-label="Workspace settings"
            className="text-xs font-medium text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Configure</span>
          </button>
        </div>

        <select
          aria-label="Switch product workspace"
          value={activeWorkspace?.id || ''}
          onChange={(e) => switchWorkspace(e.target.value)}
          className="w-full px-2.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-blue-600 cursor-pointer"
        >
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name} ({ws.quarter})
            </option>
          ))}
        </select>

        {activeWorkspace && (
          <p className="text-[11px] text-slate-500 truncate">{activeWorkspace.productArea}</p>
        )}
      </div>

      {/* Primary Nav */}
      <nav aria-label="Workspace views" className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          const count =
            item.key === 'backlog'
              ? requests.length
              : item.key === 'roadmap'
              ? requests.filter((r) => r.horizon !== 'not_building').length
              : item.key === 'feedback'
              ? feedback.length
              : decisions.length;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setActiveTab(item.key);
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2.5 whitespace-nowrap">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </span>
              <span className="font-mono text-[11px] tabular-nums text-slate-500">{count}</span>
            </button>
          );
        })}
      </nav>

      {/* Account Footer */}
      <div className="p-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={user.displayName || 'Product Lead'} size="md" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-900 truncate">
              {user.displayName || 'Product Lead'}
            </p>
            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={signOutUser}
          aria-label="Sign out"
          title="Sign out"
          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div className="w-64 h-full bg-white shadow-xl">{sidebarContent}</div>
          <div
            className="flex-1 bg-slate-900/30"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb on Left, Single Primary Action on Right */}
        <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200 bg-white flex items-center justify-between gap-8 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0 truncate">
              <span className="font-medium text-slate-700 truncate">
                {activeWorkspace?.name || 'Workspace'}
              </span>
              <span aria-hidden="true">/</span>
              <span className="font-mono tabular-nums hidden sm:inline whitespace-nowrap">
                {activeWorkspace?.quarter || 'Q4 2026'}
              </span>
              <span aria-hidden="true" className="hidden sm:inline">
                /
              </span>
              <span className="font-display font-semibold text-slate-900 whitespace-nowrap">
                {activeNavLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{primaryActionLabel}</span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] w-full mx-auto space-y-6">
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between gap-4 text-xs text-red-800"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={clearError}
                className="font-medium underline hover:no-underline cursor-pointer shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {activeTab === 'backlog' && (
            <BacklogView
              workspace={activeWorkspace}
              requests={requests}
              feedback={feedback}
              decisions={decisions}
              loading={dataLoading}
              onSelectRequest={(req) => setSelectedRequestId(req.id)}
              onNewRequest={() => setNewRequestOpen(true)}
              onEditWorkspace={() => setWorkspaceModalOpen(true)}
            />
          )}

          {activeTab === 'roadmap' && (
            <RoadmapView
              requests={requests}
              feedback={feedback}
              onSelectRequest={(req) => setSelectedRequestId(req.id)}
              onChangeHorizon={handleQuickHorizonChange}
              onNewRequest={() => setNewRequestOpen(true)}
            />
          )}

          {activeTab === 'feedback' && (
            <FeedbackView
              feedback={feedback}
              requests={requests}
              loading={dataLoading}
              onLinkFeedback={linkFeedbackToRequest}
              onDeleteFeedback={deleteFeedback}
              onNewFeedback={() => setNewFeedbackOpen(true)}
              onSelectRequest={(req) => setSelectedRequestId(req.id)}
            />
          )}

          {activeTab === 'decisions' && (
            <DecisionsView
              decisions={decisions}
              requests={requests}
              loading={dataLoading}
              onUpdateStatus={updateDecisionStatus}
              onDeleteDecision={deleteDecision}
              onNewDecision={() => {
                setDecisionDefaultReqId('');
                setNewDecisionOpen(true);
              }}
              onSelectRequest={(req) => setSelectedRequestId(req.id)}
            />
          )}
        </main>
      </div>

      {/* Interactive PRD & RICE Drawer */}
      <RequestDetailDrawer
        request={selectedRequest}
        allRequests={requests}
        feedback={feedback}
        decisions={decisions}
        onClose={() => setSelectedRequestId(null)}
        onSaveRice={updateRequestRice}
        onSaveFull={updateRequestFull}
        onDelete={deleteRequest}
        onLinkFeedback={linkFeedbackToRequest}
        onOpenNewDecision={(reqId) => {
          setDecisionDefaultReqId(reqId);
          setNewDecisionOpen(true);
        }}
      />

      {/* Modals */}
      <NewRequestModal
        open={newRequestOpen}
        defaultOwner={user.displayName || 'Alex Rivera'}
        onClose={() => setNewRequestOpen(false)}
        onCreate={createRequest}
      />

      <NewFeedbackModal
        open={newFeedbackOpen}
        requests={requests}
        defaultReporter={user.displayName || 'Alex Rivera'}
        onClose={() => setNewFeedbackOpen(false)}
        onCreate={createFeedback}
      />

      <NewDecisionModal
        key={newDecisionOpen ? `dec-${decisionDefaultReqId}` : 'dec-closed'}
        open={newDecisionOpen}
        requests={requests}
        defaultRequestId={decisionDefaultReqId}
        defaultDecider={user.displayName || 'Alex Rivera'}
        onClose={() => setNewDecisionOpen(false)}
        onCreate={createDecision}
      />

      <WorkspaceModal
        key={workspaceModalOpen ? activeWorkspace?.id || 'ws' : 'ws-closed'}
        open={workspaceModalOpen}
        workspace={activeWorkspace}
        currentUid={user.uid}
        onClose={() => setWorkspaceModalOpen(false)}
        onUpdateWorkspace={updateWorkspaceMeta}
        onCreateWorkspace={createWorkspace}
        onAddCollaborator={addCollaboratorUid}
      />
    </div>
  );
}
