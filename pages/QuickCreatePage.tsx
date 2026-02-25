
import React, { useState, useMemo, useEffect } from 'react';
import { AppData, SpendingRecord, PrepaidItem, RewardPlan, Tag } from '../types';
import { RotateCcw, CreditCard as CardIcon, Tag as TagIcon, Coffee, Calendar, FileText, Check, Hash, ChevronRight, StickyNote, MinusCircle, PlusCircle as PlusIcon } from 'lucide-react';

interface QuickCreatePageProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  onSuccess: () => void;
}

export const QuickCreatePage: React.FC<QuickCreatePageProps> = ({ data, setData, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'spending' | 'prepaid'>('spending');
  
  // Spending Form States
  const [amount, setAmount] = useState<number>(0);
  const [selectedCardId, setSelectedCardId] = useState(data.cards[0]?.id || '');
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Prepaid Form States
  const [prepaidChange, setPrepaidChange] = useState<number>(-1);
  const [selectedPrepaidId, setSelectedPrepaidId] = useState(data.prepaidItems[0]?.id || '');
  const [prepaidDate, setPrepaidDate] = useState(new Date().toISOString().split('T')[0]);

  // Current Selections
  const selectedCard = useMemo(() => data.cards.find(c => c.id === selectedCardId), [selectedCardId, data.cards]);
  const generalTag = useMemo(() => data.tags.find(t => t.name.includes('一般')), [data.tags]);

  // Logic: Should show "All" (全部) tag button?
  const showAllButton = useMemo(() => {
    if (!selectedCard) return false;
    return selectedCard.plans.some(plan => 
      plan.tagIds.length >= data.tags.length || 
      (generalTag && plan.tagIds.includes(generalTag.id)) ||
      plan.tagIds.length === 0
    );
  }, [selectedCard, data.tags, generalTag]);

  // 1. Filter Tags for selected card
  const availableTags = useMemo(() => {
    if (!selectedCard) return [];
    const tagIdsOnCard = new Set<string>();
    selectedCard.plans.forEach(plan => {
      plan.tagIds.forEach(tid => tagIdsOnCard.add(tid));
    });
    return data.tags.filter(t => tagIdsOnCard.has(t.id));
  }, [selectedCard, data.tags]);

  // 2. Filter Plans based on selected card and tag
  const availablePlans = useMemo(() => {
    if (!selectedCard) return [];
    let plans = selectedCard.plans;
    if (selectedTagId) {
      plans = plans.filter(p => p.tagIds.includes(selectedTagId));
    }
    return plans.sort((a, b) => b.percentage - a.percentage);
  }, [selectedCard, selectedTagId]);

  // Effects for logic sync
  useEffect(() => {
    const isTagValid = selectedTagId === '' ? showAllButton : availableTags.some(t => t.id === selectedTagId);
    if (!isTagValid) {
      if (showAllButton) setSelectedTagId('');
      else if (availableTags.length > 0) setSelectedTagId(availableTags[0].id);
    }
  }, [availableTags, showAllButton, selectedTagId]);

  useEffect(() => {
    if (availablePlans.length > 0) {
      if (!availablePlans.find(p => p.id === selectedPlanId)) {
        setSelectedPlanId(availablePlans[0].id);
      }
    } else {
      setSelectedPlanId('');
    }
  }, [availablePlans, selectedPlanId]);

  const handleAddSpending = () => {
    if (!amount || !selectedPlanId) return;
    const newRecord: SpendingRecord = {
      id: Math.random().toString(36).substr(2, 9),
      cardId: selectedCardId,
      planId: selectedPlanId,
      date,
      amount,
      note
    };
    setData(prev => ({ ...prev, records: [newRecord, ...prev.records] }));
    onSuccess();
  };

  const handleUpdatePrepaid = () => {
    const item = data.prepaidItems.find(i => i.id === selectedPrepaidId);
    if (!item || prepaidChange === 0) return;
    // Don't allow consuming more than available
    if (prepaidChange < 0 && item.count < Math.abs(prepaidChange)) {
      alert('庫存不足以兌換');
      return;
    }

    setData(prev => ({
      ...prev,
      prepaidItems: prev.prepaidItems.map(i => {
        if (i.id === selectedPrepaidId) {
          return {
            ...i,
            count: i.count + prepaidChange,
            history: [{ date: prepaidDate, change: prepaidChange }, ...i.history]
          };
        }
        return i;
      })
    }));
    onSuccess();
  };

  const adjustAmount = (val: number) => setAmount(prev => Math.max(0, prev + val));
  const adjustPrepaidChange = (val: number) => setPrepaidChange(prev => prev + val);

  return (
    <div className="p-6 pb-32 max-w-lg mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-800">快速建立</h1>
        <p className="text-slate-400 text-xs font-medium italic">Instant Transaction</p>
      </header>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
        <button onClick={() => setActiveTab('spending')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'spending' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>快速記帳</button>
        <button onClick={() => setActiveTab('prepaid')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'prepaid' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>寄杯異動</button>
      </div>

      {activeTab === 'spending' ? (
        <div className="space-y-6 animate-in slide-in-from-left duration-300">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50">
            <div className="flex justify-between items-center mb-4 px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">消費金額</label>
              <button onClick={() => setAmount(0)} className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-50 px-2.5 py-1 rounded-full active:scale-95 transition-all"><RotateCcw className="w-3 h-3" /> 歸零</button>
            </div>
            <div className="relative mb-6 text-center">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-300">$</span>
              <input type="number" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} placeholder="0" className="w-full bg-transparent border-none p-0 px-12 text-6xl font-black text-slate-800 focus:ring-0 placeholder-slate-100 text-center" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[-500, -100, 100, 500].map(v => (
                <button key={v} onClick={() => adjustAmount(v)} className="bg-slate-50 py-3 rounded-xl text-xs font-black text-slate-500 transition-colors active:bg-indigo-50 active:text-indigo-600">{v > 0 ? `+${v}` : v}</button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <CardIcon className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black text-slate-600">選擇卡片</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.cards.map(card => (
                <button key={card.id} onClick={() => setSelectedCardId(card.id)} className={`px-5 py-3.5 rounded-2xl text-xs font-bold border-2 transition-all flex-1 min-w-[120px] text-center ${selectedCardId === card.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>{card.name}</button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <TagIcon className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black text-slate-600">通路標籤</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {showAllButton && <button onClick={() => setSelectedTagId('')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedTagId === '' ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>全部</button>}
              {availableTags.map(tag => (
                <button key={tag.id} onClick={() => setSelectedTagId(tag.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedTagId === tag.id ? 'bg-indigo-100 text-indigo-600 border border-indigo-200 shadow-sm' : 'bg-slate-100 text-slate-400'}`}>{tag.name}</button>
              ))}
            </div>
          </div>

          {/* Simplified Reward Plan Selector: Showing only percentages */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Check className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black text-slate-600">確認回饋方案 (趴數)</label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {availablePlans.length === 0 ? (
                <div className="col-span-3 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                  <p className="text-xs text-slate-300 font-medium italic">無方案</p>
                </div>
              ) : (
                availablePlans.map(plan => (
                  <button 
                    key={plan.id} 
                    onClick={() => setSelectedPlanId(plan.id)} 
                    className={`p-4 rounded-2xl text-center border-2 transition-all flex flex-col items-center justify-center ${selectedPlanId === plan.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}
                  >
                    <span className={`text-2xl font-black ${selectedPlanId === plan.id ? 'text-white' : 'text-indigo-600'}`}>{plan.percentage}%</span>
                    {plan.note && <span className={`text-[8px] font-bold mt-1 truncate max-w-full ${selectedPlanId === plan.id ? 'text-indigo-200' : 'text-slate-300'}`}>{plan.note}</span>}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase px-1">消費日期</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm font-bold focus:ring-2 focus:ring-indigo-600" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase px-1">備註說明</label>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="選填..." className="w-full bg-slate-50 border-none rounded-xl p-3.5 text-sm font-bold focus:ring-2 focus:ring-indigo-600" />
            </div>
          </div>

          <button onClick={handleAddSpending} disabled={!amount || !selectedPlanId} className={`w-full py-5 rounded-[2.5rem] font-black text-lg shadow-xl transition-all active:scale-95 mt-4 ${(!amount || !selectedPlanId) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white shadow-indigo-100'}`}>記錄消費</button>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50">
            <div className="flex justify-between items-center mb-4 px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">異動數量 (正加負減)</label>
              <button onClick={() => setPrepaidChange(0)} className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full active:scale-95 transition-all"><RotateCcw className="w-3 h-3" /> 重設</button>
            </div>
            <div className="relative mb-6 text-center">
              <input type="number" value={prepaidChange || ''} onChange={(e) => setPrepaidChange(Number(e.target.value))} placeholder="0" className="w-full bg-transparent border-none p-0 text-7xl font-black text-slate-800 focus:ring-0 placeholder-slate-100 text-center" />
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">Units to Adjust</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[-2, -1, 1, 2].map(v => (
                <button key={v} onClick={() => adjustPrepaidChange(v)} className={`py-3 rounded-xl text-xs font-black transition-all active:scale-95 ${v < 0 ? 'bg-rose-50 text-rose-500 active:bg-rose-100' : 'bg-indigo-50 text-indigo-600 active:bg-indigo-100'}`}>{v > 0 ? `+${v}` : v}</button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Coffee className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black text-slate-600">選擇寄杯通路</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {data.prepaidItems.length === 0 ? (
                <p className="col-span-2 text-center text-xs text-slate-300 py-10">尚無寄杯項目，請先至寄杯分頁新增</p>
              ) : (
                data.prepaidItems.map(item => (
                  <button key={item.id} onClick={() => setSelectedPrepaidId(item.id)} className={`p-4 rounded-2xl text-left border-2 transition-all ${selectedPrepaidId === item.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-50 text-slate-400'}`}>
                    <p className="text-xs font-black truncate">{item.name}</p>
                    <p className={`text-[10px] font-bold mt-1 ${selectedPrepaidId === item.id ? 'text-indigo-200' : 'text-slate-300'}`}>庫存: {item.count}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black text-slate-600">異動日期</label>
            </div>
            <input type="date" value={prepaidDate} onChange={(e) => setPrepaidDate(e.target.value)} className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 shadow-sm transition-all" />
          </div>

          <button onClick={handleUpdatePrepaid} disabled={!selectedPrepaidId || prepaidChange === 0} className={`w-full py-5 rounded-[2.5rem] font-black text-lg shadow-xl transition-all active:scale-95 mt-4 ${(!selectedPrepaidId || prepaidChange === 0) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white shadow-indigo-100'}`}>確認異動</button>
        </div>
      )}
    </div>
  );
};
