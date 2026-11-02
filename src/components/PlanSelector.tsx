import React from 'react';
import { Check, Sparkles, Clock, Gauge } from 'lucide-react';
import type { HotspotPlan } from '../types.ts';

interface PlanSelectorProps {
  plans: HotspotPlan[];
  selectedPlanId: string;
  onSelectPlan: (planId: 'plan_50' | 'plan_100') => void;
}

export const PlanSelector: React.FC<PlanSelectorProps> = ({
  plans,
  selectedPlanId,
  onSelectPlan,
}) => {
  return (
    <div id="packages" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Select Wi-Fi Package</h2>
          <p className="font-bangla text-xs text-slate-500">আপনার প্রয়োজন অনুযায়ী ইন্টারনেট প্যাকেজ বেছে নিন</p>
        </div>
        <span className="text-xs text-slate-500 font-medium">BTRC Compliant Hotspot</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          return (
            <div
              key={plan.id}
              onClick={() => onSelectPlan(plan.id)}
              className={`relative cursor-pointer rounded-xl p-5 border-2 transition-all ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-2.5 right-4 bg-emerald-600 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-3 h-3" />
                  <span>{plan.badge}</span>
                </div>
              )}

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    {plan.name}
                    <span className="font-bangla text-xs font-normal text-slate-500">({plan.nameBn})</span>
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
                      ৳{plan.price}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ {plan.duration}</span>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              {/* Speed & Duration info */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{plan.durationBn}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Gauge className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{plan.speed} Speed</span>
                </div>
              </div>

              {/* Features list */}
              <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};
