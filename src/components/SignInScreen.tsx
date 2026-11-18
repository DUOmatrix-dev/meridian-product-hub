import { ArrowRight, CheckSquare, GitBranch, MessageSquareText, SlidersHorizontal } from 'lucide-react';
import { TEAM_LEADS } from '../types/product';
import { Avatar } from './Avatar';

interface SignInScreenProps {
  onSignIn: () => void;
  loading: boolean;
  errorMessage: string | null;
}

export function SignInScreen({ onSignIn, loading, errorMessage }: SignInScreenProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="h-16 px-6 md:px-10 border-b border-slate-200 bg-white flex items-center justify-between gap-8">
        <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          Meridian
        </span>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#workflow" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
            Workflow
          </a>
          <a href="#principles" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
            Principles
          </a>
        </nav>
        <button
          type="button"
          onClick={onSignIn}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 md:px-10 py-12 md:py-16 flex flex-col gap-12">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <p className="text-xs font-medium text-slate-500">
                Product Alignment · Discovery to Delivery
              </p>
              <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-slate-900 text-balance leading-[1.12]">
                Ship the right thing, with evidence and explicit trade-offs.
              </h1>
              <p className="text-base text-slate-600 max-w-xl leading-relaxed">
                Meridian gives product, engineering, and design teams one structured workspace to
                capture user evidence, score backlog items with RICE, commit to a Now / Next / Later
                roadmap, and document every “not building” decision.
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
              >
                {errorMessage}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onSignIn}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>{loading ? 'Connecting workspace...' : 'Continue with Google Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-500">
                Persists to your private team Firestore workspace
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="font-display text-sm font-semibold text-slate-900">
                  Sample Alignment Snapshot
                </span>
                <span className="font-mono text-xs tabular-nums text-slate-500">Q4 2026</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Guided CSV Import Schema Validator
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Now · In Design · Activation 42% → 68%
                    </p>
                  </div>
                  <span className="font-mono text-sm font-semibold tabular-nums text-slate-900">
                    1760.0
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Self-Serve SSO & SAML Role Mapping
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Now · In Dev · 11 Enterprise Interviews
                    </p>
                  </div>
                  <span className="font-mono text-sm font-semibold tabular-nums text-slate-900">
                    714.0
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      White-Label Native Mobile SDK
                    </p>
                    <p className="text-xs text-red-700 mt-0.5">
                      Not Building · &lt;6% mobile share
                    </p>
                  </div>
                  <span className="font-mono text-sm font-semibold tabular-nums text-slate-500">
                    9.0
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {TEAM_LEADS.map((lead) => (
                  <Avatar key={lead.name} name={lead.name} size="md" />
                ))}
              </div>
              <span className="text-xs text-slate-500">
                Product · Engineering · Design aligned
              </span>
            </div>
          </div>
        </section>

        <section id="workflow" className="grid grid-cols-1 md:grid-cols-4 border border-slate-200 rounded-lg bg-white divide-y md:divide-y-0 md:divide-x divide-slate-200">
          <div className="p-5 space-y-2">
            <MessageSquareText className="w-4 h-4 text-blue-600" />
            <h2 className="font-display text-sm font-semibold text-slate-900">
              01. Discovery Evidence
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Capture interview quotes, support signals, and funnel drop-offs and link them directly to backlog hypotheses.
            </p>
          </div>
          <div className="p-5 space-y-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <h2 className="font-display text-sm font-semibold text-slate-900">
              02. RICE Prioritization
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Score Reach, Impact, Confidence, and Effort in real time to replace opinion battles with transparent math.
            </p>
          </div>
          <div className="p-5 space-y-2">
            <GitBranch className="w-4 h-4 text-blue-600" />
            <h2 className="font-display text-sm font-semibold text-slate-900">
              03. Now / Next / Later
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Commit every roadmap item with an owner, success metric, and explicit Not Building deferral rationale.
            </p>
          </div>
          <div className="p-5 space-y-2">
            <CheckSquare className="w-4 h-4 text-blue-600" />
            <h2 className="font-display text-sm font-semibold text-slate-900">
              04. Decision Ledger
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Document trade-offs, confidence percentages, and stakeholder sign-offs before engineering starts.
            </p>
          </div>
        </section>

        <section id="principles" className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="space-y-1.5">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Lead with the problem
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every initiative requires a clear user pain statement, baseline metric, and non-goals before solutioning.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Make “No” explicit
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The Not Building register documents why requests were declined and exact conditions to revisit them.
            </p>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Outcomes over outputs
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Track target movement against baseline rather than counting deployed tickets without user impact.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
