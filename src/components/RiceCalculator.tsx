import { useMemo } from 'react';
import { Calculator, Check, RotateCcw } from 'lucide-react';
import { calcRiceScore, FeatureRequest, IMPACT_TIERS } from '../types/product';

interface RiceCalculatorProps {
  request: FeatureRequest;
  allRequests: FeatureRequest[];
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  isLocked: boolean;
  applying: boolean;
  applied: boolean;
  onChange: (next: {
    reach: number;
    impact: number;
    confidence: number;
    effort: number;
  }) => void;
  onApply: () => void;
  onReset: () => void;
}

export function RiceCalculator({
  request,
  allRequests,
  reach,
  impact,
  confidence,
  effort,
  isLocked,
  applying,
  applied,
  onChange,
  onApply,
  onReset,
}: RiceCalculatorProps) {
  const liveRice = calcRiceScore(reach, impact, confidence, effort);
  const riceDelta = Math.round((liveRice - request.riceScore) * 10) / 10;
  const hasChanged =
    reach !== request.reach ||
    impact !== request.impact ||
    confidence !== request.confidence ||
    effort !== request.effort;

  const impactIndex = Math.max(
    0,
    IMPACT_TIERS.findIndex((tier) => tier.value === impact)
  );
  const currentImpactTier = IMPACT_TIERS[impactIndex] || IMPACT_TIERS[2];

  const confidenceBand =
    confidence >= 80
      ? { label: 'High', cls: 'text-green-700' }
      : confidence >= 50
      ? { label: 'Medium', cls: 'text-amber-700' }
      : { label: 'Low', cls: 'text-red-700' };

  const rankPreview = useMemo(() => {
    if (allRequests.length === 0) return null;
    const sortedSaved = [...allRequests].sort((a, b) => b.riceScore - a.riceScore);
    const currentRank = sortedSaved.findIndex((r) => r.id === request.id) + 1;

    const simulated = allRequests
      .map((r) => (r.id === request.id ? { ...r, riceScore: liveRice } : r))
      .sort((a, b) => b.riceScore - a.riceScore);
    const projectedRank = simulated.findIndex((r) => r.id === request.id) + 1;

    return {
      currentRank: currentRank > 0 ? currentRank : allRequests.length,
      projectedRank: projectedRank > 0 ? projectedRank : allRequests.length,
      total: allRequests.length,
    };
  }, [allRequests, request.id, liveRice]);

  return (
    <section
      aria-label="Dedicated RICE Score Calculator"
      className="border border-slate-200 rounded-lg p-5 bg-slate-50/70 space-y-5"
    >
      {/* Calculator Header & Real-Time Score Readout */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-600 shrink-0" />
            <h3 className="font-display text-sm font-semibold text-slate-900">
              RICE Score Calculator
            </h3>
          </div>
          <p className="text-xs font-mono tabular-nums text-slate-600">
            ({reach.toLocaleString()} × {impact} × {confidence}%) ÷ {effort}m ={' '}
            <span className="font-semibold text-slate-900">{liveRice.toFixed(1)}</span>
          </p>
          {rankPreview && (
            <p className="text-xs font-mono tabular-nums text-slate-500">
              Backlog Rank: #{rankPreview.currentRank} of {rankPreview.total}
              {rankPreview.projectedRank !== rankPreview.currentRank && (
                <span
                  className={`ml-1.5 font-medium ${
                    rankPreview.projectedRank < rankPreview.currentRank
                      ? 'text-green-700'
                      : 'text-amber-700'
                  }`}
                >
                  → Projected #{rankPreview.projectedRank}
                </span>
              )}
            </p>
          )}
        </div>

        <div className="sm:text-right shrink-0">
          <span className="text-[11px] font-medium text-slate-500 block">
            Real-Time RICE Score
          </span>
          <div className="flex items-baseline sm:justify-end gap-2">
            <span className="font-mono text-3xl font-bold tabular-nums text-blue-600">
              {liveRice.toFixed(1)}
            </span>
            {hasChanged && (
              <span
                className={`font-mono text-xs font-medium tabular-nums ${
                  riceDelta >= 0 ? 'text-green-700' : 'text-amber-700'
                }`}
              >
                {riceDelta >= 0 ? `+${riceDelta.toFixed(1)}` : riceDelta.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4 Interactive Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Reach Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="rice-reach-slider" className="text-xs font-medium text-slate-700">
              Reach (users / quarter)
            </label>
            <input
              type="number"
              aria-label="Reach numeric value"
              min={0}
              max={10000000}
              step={10}
              value={reach}
              onChange={(e) =>
                onChange({
                  reach: Math.max(0, Math.min(10_000_000, Number(e.target.value) || 0)),
                  impact,
                  confidence,
                  effort,
                })
              }
              className="w-24 px-2 py-1 text-right text-xs font-mono tabular-nums bg-white border border-slate-200 rounded focus:outline-none focus:border-blue-600"
            />
          </div>
          <input
            id="rice-reach-slider"
            type="range"
            min={0}
            max={5000}
            step={50}
            value={Math.min(5000, reach)}
            onChange={(e) =>
              onChange({
                reach: Number(e.target.value),
                impact,
                confidence,
                effort,
              })
            }
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-400">
            <span>0</span>
            <span>2,500</span>
            <span>5,000+</span>
          </div>
        </div>

        {/* Impact Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="rice-impact-slider" className="text-xs font-medium text-slate-700">
              Impact Multiplier
            </label>
            <span className="font-mono text-xs font-semibold tabular-nums text-slate-900">
              {currentImpactTier.value}× · {currentImpactTier.label}
            </span>
          </div>
          <input
            id="rice-impact-slider"
            type="range"
            min={0}
            max={IMPACT_TIERS.length - 1}
            step={1}
            value={impactIndex}
            onChange={(e) => {
              const tier = IMPACT_TIERS[Number(e.target.value)] || IMPACT_TIERS[2];
              onChange({
                reach,
                impact: tier.value,
                confidence,
                effort,
              });
            }}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between gap-1">
            {IMPACT_TIERS.map((tier) => (
              <button
                key={tier.value}
                type="button"
                onClick={() =>
                  onChange({
                    reach,
                    impact: tier.value,
                    confidence,
                    effort,
                  })
                }
                className={`text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  impact === tier.value
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                {tier.value}×
              </button>
            ))}
          </div>
        </div>

        {/* Confidence Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="rice-confidence-slider" className="text-xs font-medium text-slate-700">
              Confidence ({confidenceBand.label})
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                aria-label="Confidence percentage"
                min={1}
                max={100}
                value={confidence}
                onChange={(e) =>
                  onChange({
                    reach,
                    impact,
                    confidence: Math.max(1, Math.min(100, Number(e.target.value) || 1)),
                    effort,
                  })
                }
                className={`w-16 px-2 py-1 text-right text-xs font-mono tabular-nums bg-white border border-slate-200 rounded focus:outline-none focus:border-blue-600 ${confidenceBand.cls}`}
              />
              <span className="text-xs font-mono text-slate-500">%</span>
            </div>
          </div>
          <input
            id="rice-confidence-slider"
            type="range"
            min={5}
            max={100}
            step={5}
            value={confidence}
            onChange={(e) =>
              onChange({
                reach,
                impact,
                confidence: Number(e.target.value),
                effort,
              })
            }
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-400">
            <span>5% Low</span>
            <span>50% Med</span>
            <span>100% High</span>
          </div>
        </div>

        {/* Effort Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="rice-effort-slider" className="text-xs font-medium text-slate-700">
              Effort (person-months)
            </label>
            <input
              type="number"
              aria-label="Effort in person-months"
              min={0.25}
              max={100}
              step={0.25}
              value={effort}
              onChange={(e) =>
                onChange({
                  reach,
                  impact,
                  confidence,
                  effort: Math.max(0.25, Math.min(100, Number(e.target.value) || 0.25)),
                })
              }
              className="w-20 px-2 py-1 text-right text-xs font-mono tabular-nums bg-white border border-slate-200 rounded focus:outline-none focus:border-blue-600"
            />
          </div>
          <input
            id="rice-effort-slider"
            type="range"
            min={0.25}
            max={12}
            step={0.25}
            value={Math.min(12, effort)}
            onChange={(e) =>
              onChange({
                reach,
                impact,
                confidence,
                effort: Number(e.target.value),
              })
            }
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-400">
            <span>0.25m</span>
            <span>6m</span>
            <span>12m+</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
        <span className="text-[11px] font-mono tabular-nums text-slate-500">
          Saved baseline: {request.riceScore.toFixed(1)}
          {isLocked ? ' · Simulation only (Shipped)' : ''}
        </span>
        <div className="flex items-center gap-2">
          {hasChanged && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-200/70 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
          {!isLocked && (
            <button
              type="button"
              disabled={!hasChanged || applying}
              onClick={onApply}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              {applied ? <Check className="w-3.5 h-3.5" /> : null}
              <span>
                {applying ? 'Applying...' : applied ? 'RICE Saved' : 'Apply RICE Score'}
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
