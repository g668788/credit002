
import React, { useState, useMemo } from 'react';
import { Filter, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { AppData, RewardPlan } from '../types';

interface WalletPageProps {
  data: AppData;
  onNavigate: (page: any, id: string) => void;
}

export const WalletPage: React.FC<WalletPageProps> = ({ data, onNavigate }) => {
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleTag = (id: string) => {
    if (selectedTagIds.includes(id)) {
      setSelectedTagIds(selectedTagIds.filter(t => t !== id));
    } else {
      setSelectedTagIds([...selectedTagIds, id]);
    }
  };

  const getPlanProgress = (plan: RewardPlan) => {
    const card = data.cards.find(c => c.id === plan.cardId);
    if (!card) return { spent: 0, percent: 0, remaining: plan.cap, minSpendMet: true, minSpendLeft: 0, minSpend: 0, minSpendPercent: 0, daysLeft: 0, cap: 0 };
    
    const now = new Date();
    const cycleStart = new Date(now.getFullYear(), now.getMonth() - (now.getDate() < card.billingDay ? 1 : 0), card.billingDay);
    const spent = data.records
      .filter(r => r.planId === plan.id && new Date(r.date) >= cycleStart)
      .reduce((sum, r) => sum + r.amount, 0);

    const maxReference = plan.cap > 0 ? plan.cap : (plan.minSpend > 0 ? Math.max(spent, plan.minSpend * 1.2) : 10000);
    const percent = (spent / maxReference) * 100;
    const remaining = plan.cap > 0 ? Math.max(0, plan.cap - spent) : Infinity;

    const minSpendMet = spent >= plan.minSpend;
    const minSpendLeft = Math.max(0, plan.minSpend - spent);
    const minSpendPercent = (plan.minSpend / maxReference) * 100;

    const nextBilling = new Date(cycleStart);
    nextBilling.setMonth(nextBilling.getMonth() + 1);
    const daysLeft = Math.ceil((nextBilling.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return { spent, percent, remaining, daysLeft, minSpendMet, minSpendLeft, minSpend: plan.minSpend, minSpendPercent, cap: plan.cap };
  };

  const filteredPlans = useMemo(() => {
    let plans = data.cards.flatMap(c => c.plans);
    if (selectedTagIds.length > 0) {
      plans = plans.filter(p => p.tagIds.some(id => selectedTagIds.includes(id)));
    }
    return plans.sort((a, b) => b.percentage - a.percentage);
  }, [data.cards, selectedTagIds]);

  const groupedPlans = useMemo(() => {
    const groups: Record<string, RewardPlan[]> = {};
    filteredPlans.forEach(p => {
      if (!groups[p.cardId]) groups[p.cardId] = [];
      groups[p.cardId].push(p);
    });
    return Object.entries(groups).sort(([, a], [, b]) => b[0].percentage - a[0].percentage);
  }, [filteredPlans]);

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-black mb-1 tracking-tight">我的卡包</h1>
        <p className="text-slate-400 text-xs font-medium">Digital Wallet Intelligence</p>
      </header>

      <div className="flex flex-wrap gap-2 mb-8">
        <button 
          onClick={() => setSelectedTagIds([])}
          className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedTagIds.length === 0 ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-200'}`}
        >
          全部
        </button>
        {data.tags.map(tag => (
          <button 
            key={tag.id}
            onClick={() => toggleTag(tag.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedTagIds.includes(tag.id) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-200'}`}
          >
            {tag.name}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {groupedPlans.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <Filter className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm font-medium">沒有符合標籤的方案</p>
          </div>
        )}
        {groupedPlans.map(([cardId, plans]) => {
          const card = data.cards.find(c => c.id === cardId)!;
          const isExpanded = expandedCards[cardId];
          const primaryPlan = plans[0];
          const otherPlans = plans.slice(1);

          // Fix: Added key to the props type definition to allow passing it when rendering in a list (fixing TS error on line 185)
          const PlanCard = ({ plan, isPrimary }: { plan: RewardPlan, isPrimary: boolean, key?: React.Key }) => {
            const prog = getPlanProgress(plan);
            const planTags = data.tags.filter(t => plan.tagIds.includes(t.id));

            return (
              <div 
                className={`p-5 ${isPrimary ? '' : 'border-t border-slate-100'} cursor-pointer active:bg-slate-50/50 transition-colors`} 
                onClick={() => onNavigate('planDetail', plan.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-3xl font-black text-indigo-600">{plan.percentage}%</span>
                      {isPrimary && (
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md">{card.name}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {planTags.length === 0 ? (
                        <span className="text-[10px] font-bold text-slate-400">一般消費</span>
                      ) : (
                        planTags.map(t => (
                          <span key={t.id} className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">
                            {t.name}
                          </span>
                        ))
                      )}
                    </div>
                    {plan.note && (
                      <p className="text-[10px] text-slate-400 font-medium mt-1.5 italic">※ {plan.note}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`absolute left-0 top-0 h-full transition-all duration-1000 ${prog.minSpendMet ? 'bg-indigo-600' : 'bg-amber-500'}`} 
                      style={{ width: `${Math.min(100, prog.percent)}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] font-black">
                    <div className="flex items-center gap-2">
                      {prog.minSpend > 0 && (
                        <span className={prog.minSpendMet ? 'text-indigo-500' : 'text-amber-500'}>
                          {prog.minSpendMet ? '✓ 已達低消' : `差 $${prog.minSpendLeft.toLocaleString()}`}
                        </span>
                      )}
                      <span className="text-slate-400">
                        {prog.cap > 0 ? `剩 $${prog.remaining.toLocaleString()}` : '無上限'}
                      </span>
                    </div>
                    <span className="text-slate-300">剩 {prog.daysLeft} 天</span>
                  </div>
                </div>
              </div>
            );
          };

          return (
            <div key={cardId} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden active:scale-[0.99] transition-transform">
              <PlanCard plan={primaryPlan} isPrimary={true} />

              {otherPlans.length > 0 && (
                <>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
                    }}
                    className="w-full py-3 px-4 flex items-center justify-center gap-1 text-[10px] font-black text-slate-300 border-t border-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    {isExpanded ? (
                      <>收起其他方案 <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>查看其他 {otherPlans.length} 個方案 <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>
                  {isExpanded && (
                    <div className="bg-slate-50/30 animate-in slide-in-from-top duration-200">
                      {otherPlans.map(plan => (
                        <PlanCard key={plan.id} plan={plan} isPrimary={false} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
