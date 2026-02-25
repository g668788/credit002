
import React, { useState, useMemo } from 'react';
import { AppData, RewardPlan, Tag } from '../types';
import { Calculator, Zap, Layers, ChevronDown, RotateCcw, ArrowRightLeft, AlertCircle } from 'lucide-react';

interface SimulationPageProps {
  data: AppData;
}

export const SimulationPage: React.FC<SimulationPageProps> = ({ data }) => {
  const [amount, setAmount] = useState<number>(1000);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [resultTab, setResultTab] = useState<'single' | 'multi'>('single');

  const toggleTag = (id: string) => {
    if (selectedTagIds.includes(id)) {
      setSelectedTagIds(selectedTagIds.filter(t => t !== id));
    } else {
      setSelectedTagIds([...selectedTagIds, id]);
    }
  };

  const adjustAmount = (val: number) => setAmount(prev => Math.max(0, prev + val));

  const simulationResults = useMemo(() => {
    let plans = data.cards.flatMap(c => c.plans);
    if (selectedTagIds.length > 0) {
      plans = plans.filter(p => p.tagIds.some(id => selectedTagIds.includes(id)));
    }

    const now = new Date();
    const withDetails = plans.map(plan => {
      const card = data.cards.find(c => c.id === plan.cardId)!;
      const cycleStart = new Date(now.getFullYear(), now.getMonth() - (now.getDate() < card.billingDay ? 1 : 0), card.billingDay);
      const spent = data.records
        .filter(r => r.planId === plan.id && new Date(r.date) >= cycleStart)
        .reduce((sum, r) => sum + r.amount, 0);

      const totalProjected = spent + amount;
      const isMinSpendMet = totalProjected >= (plan.minSpend || 0);
      
      const remainingCap = plan.cap > 0 ? Math.max(0, plan.cap - spent) : Infinity;
      const amountEligible = Math.min(amount, remainingCap);
      
      // If min spend not met, actual reward for THIS transaction is 0
      const reward = isMinSpendMet ? (amountEligible * (plan.percentage / 100)) : 0;

      return { plan, card, reward, amountEligible, isMinSpendMet, currentSpent: spent };
    }).sort((a, b) => b.reward - a.reward);

    return withDetails;
  }, [data, amount, selectedTagIds]);

  const multiSwipeResults = useMemo(() => {
    let remainingAmount = amount;
    const selection: { plan: RewardPlan, amount: number, reward: number, cardName: string, isMinSpendMet: boolean }[] = [];
    
    let pool = data.cards.flatMap(c => c.plans);
    if (selectedTagIds.length > 0) {
      pool = pool.filter(p => p.tagIds.some(id => selectedTagIds.includes(id)));
    }
    pool.sort((a, b) => b.percentage - a.percentage);

    const now = new Date();
    for (const plan of pool) {
      if (remainingAmount <= 0) break;
      const card = data.cards.find(c => c.id === plan.cardId)!;
      const cycleStart = new Date(now.getFullYear(), now.getMonth() - (now.getDate() < card.billingDay ? 1 : 0), card.billingDay);
      const spent = data.records
        .filter(r => r.planId === plan.id && new Date(r.date) >= cycleStart)
        .reduce((sum, r) => sum + r.amount, 0);

      const cap = plan.cap > 0 ? Math.max(0, plan.cap - spent) : Infinity;
      const useAmount = Math.min(remainingAmount, cap);
      
      if (useAmount > 0) {
        const isMinSpendMet = (spent + useAmount) >= (plan.minSpend || 0);
        selection.push({
          plan,
          cardName: card.name,
          amount: useAmount,
          reward: isMinSpendMet ? (useAmount * (plan.percentage / 100)) : 0,
          isMinSpendMet
        });
        remainingAmount -= useAmount;
      }
    }
    return selection;
  }, [data, amount, selectedTagIds]);

  const PlanTagsDisplay = ({ tagIds }: { tagIds: string[] }) => {
    const tags = data.tags.filter(t => tagIds.includes(t.id));
    if (tags.length === 0) return <span className="text-[10px] font-bold text-slate-400">一般刷卡</span>;
    if (tags.length >= data.tags.length) return <span className="text-[10px] font-bold text-indigo-600">全通路支援</span>;
    
    return (
      <div className="flex flex-wrap gap-1">
        {tags.map(t => (
          <span key={t.id} className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">
            {t.name}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-lg mx-auto pb-32">
      <header className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-800">消費試算</h1>
        <p className="text-slate-400 text-xs font-medium italic">Reward Optimizer</p>
      </header>

      {/* Input Card */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 mb-8">
        <div className="flex justify-between items-center mb-4 px-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">預計消費金額</label>
          <button 
            onClick={() => setAmount(0)}
            className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-50 px-2.5 py-1 rounded-full active:scale-95 transition-all"
          >
            <RotateCcw className="w-3 h-3" /> 歸零
          </button>
        </div>
        
        <div className="relative mb-6 text-center">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-300">$</span>
          <input 
            type="number"
            value={amount || ''}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="0"
            className="w-full bg-transparent border-none p-0 px-12 text-6xl font-black text-slate-800 focus:ring-0 placeholder-slate-100 text-center"
          />
        </div>

        <div className="grid grid-cols-4 gap-2 mb-6">
          {[-500, -100, 100, 500].map(v => (
            <button 
              key={v}
              onClick={() => adjustAmount(v)}
              className="bg-slate-50 py-3 rounded-xl text-xs font-black text-slate-500 transition-colors active:bg-indigo-50 active:text-indigo-600"
            >
              {v > 0 ? `+${v}` : v}
            </button>
          ))}
        </div>

        <div className="pt-6 border-t border-slate-50">
          <label className="text-[10px] font-black text-slate-400 block mb-3 uppercase tracking-widest px-1">目前的消費方式/通路</label>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setSelectedTagIds([])}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${selectedTagIds.length === 0 ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}
            >
              全部
            </button>
            {data.tags.map(tag => (
              <button 
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${selectedTagIds.includes(tag.id) ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-400'}`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Tab Switcher */}
      <div className="flex justify-between items-center mb-6 px-1">
        <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-indigo-600" /> 推薦結果
        </h2>
        <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200 shadow-inner">
          <button 
            onClick={() => setResultTab('single')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${resultTab === 'single' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}
          >
            單筆支付
          </button>
          <button 
            onClick={() => setResultTab('multi')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${resultTab === 'multi' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}
          >
            多筆拆刷
          </button>
        </div>
      </div>

      {/* Conditional Result View */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {resultTab === 'single' ? (
          <div className="space-y-3">
            {simulationResults.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
                <p className="text-sm font-medium italic">此條件下無適合方案</p>
              </div>
            ) : (
              simulationResults.slice(0, 5).map((res, i) => (
                <div 
                  key={res.plan.id} 
                  className={`bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center transition-all hover:border-indigo-100 group ${i === 0 ? 'ring-2 ring-indigo-500/20' : ''}`}
                >
                  <div className="flex items-center gap-4 flex-1 pr-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${i === 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-300'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{res.card.name}</p>
                        {!res.isMinSpendMet && (
                          <span className="flex items-center gap-0.5 bg-amber-50 text-amber-600 text-[8px] font-black px-1.5 py-0.5 rounded-md border border-amber-100">
                            <AlertCircle className="w-2 h-2" /> 未達低消 ${res.plan.minSpend}
                          </span>
                        )}
                      </div>
                      <PlanTagsDisplay tagIds={res.plan.tagIds} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xl font-black ${res.reward > 0 ? (i === 0 ? 'text-indigo-600' : 'text-slate-600') : 'text-slate-300'}`}>
                      +${res.reward.toFixed(1)}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold">{res.plan.percentage}% 回饋</p>
                  </div>
                </div>
              ))
            )}
            {simulationResults.length > 5 && (
              <p className="text-center text-[10px] text-slate-300 font-bold uppercase py-2">僅顯示前五名推薦</p>
            )}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
            
            {multiSwipeResults.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-slate-400 font-medium italic">尚無合適拆刷方案</p>
              </div>
            ) : (
              <>
                <div className="space-y-6 mb-10">
                  {multiSwipeResults.slice(0, 3).map((res, i) => (
                    <div key={res.plan.id} className="relative pl-6">
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-100 rounded-full" />
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">{res.cardName}</p>
                            {!res.isMinSpendMet && (
                              <span className="bg-amber-50 text-amber-600 text-[8px] font-black px-1.5 py-0.5 rounded-md border border-amber-100 flex items-center gap-0.5">
                                <AlertCircle className="w-2 h-2" /> 未達低消
                              </span>
                            )}
                          </div>
                          <PlanTagsDisplay tagIds={res.plan.tagIds} />
                          <p className="text-xs font-bold text-slate-400 mt-2">
                            刷 <span className="text-indigo-600 font-black">${res.amount.toLocaleString()}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-black ${res.reward > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>+${res.reward.toFixed(1)}</p>
                          <p className="text-[10px] font-bold text-slate-300">{res.plan.percentage}% 回饋</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {multiSwipeResults.length > 3 && (
                    <div className="p-4 bg-slate-50 rounded-2xl text-center">
                      <p className="text-[10px] font-bold text-slate-400">其餘方案僅能少量分散，建議參考最佳單筆</p>
                    </div>
                  )}
                </div>
                
                <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">預估組合總回饋</span>
                    <p className="text-sm font-bold text-slate-300 italic">Total Optimization</p>
                  </div>
                  <span className="text-4xl font-black text-indigo-600 tracking-tighter">
                    ${multiSwipeResults.slice(0, 3).reduce((s, r) => s + r.reward, 0).toFixed(1)}
                  </span>
                </div>
              </>
            )}
            
            <Layers className="absolute -right-6 -bottom-6 w-32 h-32 text-indigo-500 opacity-[0.03] pointer-events-none" />
          </div>
        )}
      </div>
    </div>
  );
};
