
import React, { useMemo, useState } from 'react';
import { 
  ChevronLeft, 
  TrendingUp, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight, 
  Calendar, 
  Edit2, 
  Trash2, 
  X,
  Save,
  AlertCircle
} from 'lucide-react';
import { CreditCard, RewardPlan, SpendingRecord, Tag } from '../types';

interface PlanDetailPageProps {
  plan: RewardPlan;
  card: CreditCard;
  records: SpendingRecord[];
  allTags: Tag[];
  onBack: () => void;
  onUpdatePlan: (plan: RewardPlan) => void;
  onUpdateRecord: (record: SpendingRecord) => void;
  onDeleteRecord: (id: string) => void;
}

export const PlanDetailPage: React.FC<PlanDetailPageProps> = ({ 
  plan, card, records, allTags, onBack, onUpdatePlan, onUpdateRecord, onDeleteRecord 
}) => {
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [editingPlanData, setEditingPlanData] = useState<RewardPlan>(plan);
  
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editingRecordData, setEditingRecordData] = useState<SpendingRecord | null>(null);

  const planRecords = useMemo(() => 
    records.filter(r => r.planId === plan.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  , [records, plan.id]);

  const currentMonthRecords = useMemo(() => {
    const now = new Date();
    const cycleStart = new Date(now.getFullYear(), now.getMonth() - (now.getDate() < card.billingDay ? 1 : 0), card.billingDay);
    return planRecords.filter(r => new Date(r.date) >= cycleStart);
  }, [planRecords, card.billingDay]);

  const historyRecords = useMemo(() => {
    const currentIds = new Set(currentMonthRecords.map(r => r.id));
    return planRecords.filter(r => !currentIds.has(r.id));
  }, [planRecords, currentMonthRecords]);

  const groupedHistory = useMemo(() => {
    const groups: Record<string, SpendingRecord[]> = {};
    historyRecords.forEach(r => {
      const date = new Date(r.date);
      const key = `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [historyRecords]);

  const totalSpent = currentMonthRecords.reduce((sum, r) => sum + r.amount, 0);
  
  // Refined Logic for Reward Estimation
  const estimatedReward = useMemo(() => {
    const isMinSpendMet = totalSpent >= (plan.minSpend || 0);
    if (!isMinSpendMet) return 0;
    
    const amountToCalculate = plan.cap > 0 ? Math.min(totalSpent, plan.cap) : totalSpent;
    return amountToCalculate * (plan.percentage / 100);
  }, [totalSpent, plan.minSpend, plan.cap, plan.percentage]);

  const remainingBudget = plan.cap > 0 ? Math.max(0, plan.cap - totalSpent) : Infinity;
  const isMinSpendMet = totalSpent >= (plan.minSpend || 0);

  const planTags = useMemo(() => 
    allTags.filter(t => plan.tagIds.includes(t.id))
  , [allTags, plan.tagIds]);

  const isAllTags = useMemo(() => 
    plan.tagIds.length >= allTags.length && allTags.length > 0
  , [plan.tagIds, allTags]);

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => ({ ...prev, [monthKey]: !prev[monthKey] }));
  };

  const handleSavePlan = () => {
    onUpdatePlan(editingPlanData);
    setIsEditingPlan(false);
  };

  const togglePlanTag = (tagId: string) => {
    setEditingPlanData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId) 
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId]
    }));
  };

  const startEditRecord = (record: SpendingRecord) => {
    setEditingRecordId(record.id);
    setEditingRecordData({ ...record });
  };

  const handleSaveRecord = () => {
    if (editingRecordData) {
      onUpdateRecord(editingRecordData);
      setEditingRecordId(null);
      setEditingRecordData(null);
    }
  };

  const handleDeleteRecord = (id: string) => {
    onDeleteRecord(id);
    setEditingRecordId(null);
  };

  const RecordItem = ({ record }: { record: SpendingRecord, key?: React.Key }) => {
    const isEditing = editingRecordId === record.id;

    if (isEditing && editingRecordData) {
      return (
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 space-y-3 shadow-inner">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-indigo-400 uppercase">金額</label>
              <input 
                type="number"
                value={editingRecordData.amount}
                onChange={e => setEditingRecordData({...editingRecordData, amount: Number(e.target.value)})}
                className="w-full bg-white border border-indigo-100 rounded-lg p-2 text-sm font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-indigo-400 uppercase">日期</label>
              <input 
                type="date"
                value={editingRecordData.date}
                onChange={e => setEditingRecordData({...editingRecordData, date: e.target.value})}
                className="w-full bg-white border border-indigo-100 rounded-lg p-2 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-indigo-400 uppercase">備註</label>
            <input 
              type="text"
              value={editingRecordData.note}
              onChange={e => setEditingRecordData({...editingRecordData, note: e.target.value})}
              className="w-full bg-white border border-indigo-100 rounded-lg p-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveRecord} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all">
              <Save className="w-3.5 h-3.5" /> 儲存
            </button>
            <button onClick={() => handleDeleteRecord(record.id)} className="px-3 bg-red-100 text-red-600 py-2.5 rounded-lg text-xs font-bold active:scale-95 transition-all">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setEditingRecordId(null)} className="px-3 bg-slate-200 text-slate-600 py-2.5 rounded-lg text-xs font-bold active:scale-95 transition-all">
              取消
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm transition-all hover:border-indigo-100">
        <div className="flex-1">
          <p className="font-bold text-sm text-slate-700">{record.note || '消費支出'}</p>
          <p className="text-[10px] text-slate-400 font-medium tracking-tighter">{record.date}</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="font-black text-slate-700">-${record.amount.toLocaleString()}</p>
          <button 
            onClick={() => startEditRecord(record)}
            className="p-2.5 bg-slate-50 rounded-lg text-slate-300 hover:text-indigo-600 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center text-slate-400 font-medium">
          <ChevronLeft className="w-5 h-5" /> 返回
        </button>
        <button 
          onClick={() => setIsEditingPlan(true)}
          className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      {/* Edit Plan Modal */}
      {isEditingPlan && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">編輯方案</h2>
              <button onClick={() => setIsEditingPlan(false)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar pb-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">方案回饋 %</label>
                <input 
                  type="number"
                  value={editingPlanData.percentage}
                  onChange={e => setEditingPlanData({...editingPlanData, percentage: Number(e.target.value)})}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-2xl font-black text-indigo-600 focus:ring-2 focus:ring-indigo-600 transition-all"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">最低消費門檻</label>
                  <input 
                    type="number"
                    value={editingPlanData.minSpend}
                    onChange={e => setEditingPlanData({...editingPlanData, minSpend: Number(e.target.value)})}
                    className="w-full bg-slate-50 border-none rounded-xl p-3 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">封頂金額 (0 為無限)</label>
                  <input 
                    type="number"
                    value={editingPlanData.cap}
                    onChange={e => setEditingPlanData({...editingPlanData, cap: Number(e.target.value)})}
                    className="w-full bg-slate-50 border-none rounded-xl p-3 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">通路標籤</label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button 
                      key={tag.id}
                      onClick={() => togglePlanTag(tag.id)}
                      className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${editingPlanData.tagIds.includes(tag.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400'}`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={handleSavePlan}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-100 mt-6 active:scale-95 transition-all"
            >
              更新方案資料
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-8 flex justify-between items-end">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{card.name}</span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {isAllTags ? (
              <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded shadow-sm">
                全部
              </span>
            ) : (
              planTags.map(t => (
                <span key={t.id} className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">
                  {t.name}
                </span>
              ))
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="text-5xl font-black text-indigo-600 leading-none">{plan.percentage}%</span>
        </div>
      </header>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`p-4 rounded-2xl border ${isMinSpendMet ? 'bg-indigo-50 border-indigo-100' : 'bg-amber-50 border-amber-100'} shadow-sm`}>
          <div className="flex items-center gap-2 mb-1">
            {isMinSpendMet ? <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
            <p className="text-[10px] text-slate-400 font-bold uppercase">最低消費門檻</p>
          </div>
          <p className="text-xl font-bold text-slate-700">{plan.minSpend > 0 ? `$${plan.minSpend.toLocaleString()}` : '無門檻'}</p>
          {!isMinSpendMet && plan.minSpend > 0 && <p className="text-[10px] text-amber-600 font-bold mt-1">還差 ${(plan.minSpend - totalSpent).toLocaleString()}</p>}
        </div>
        
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">回饋上限額度</p>
          <p className="text-xl font-bold text-slate-700">{plan.cap > 0 ? `$${plan.cap.toLocaleString()}` : '無上限'}</p>
          {plan.cap > 0 && <p className="text-[10px] text-slate-400 font-bold mt-1">餘額 ${remainingBudget.toLocaleString()}</p>}
        </div>
      </div>

      {/* Reward Estimation Card */}
      <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100 mb-10 overflow-hidden relative">
        <div className="flex justify-between items-center relative z-10">
          <div>
            <p className="text-[10px] font-bold uppercase opacity-80 mb-1">本期預估回饋</p>
            <p className="text-3xl font-black">${estimatedReward.toFixed(1)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase opacity-80 mb-1">本期累計消費</p>
            <p className="text-xl font-bold">${totalSpent.toLocaleString()}</p>
          </div>
        </div>
        <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
      </div>

      <div className="space-y-10">
        <section>
          <div className="flex justify-between items-end mb-4 px-1">
            <h3 className="font-bold text-slate-800">本期明細</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Billing Cycle</span>
          </div>
          <div className="space-y-3">
            {currentMonthRecords.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
                本期尚無消費紀錄
              </div>
            ) : (
              currentMonthRecords.map(record => <RecordItem key={record.id} record={record} />)
            )}
          </div>
        </section>

        <section>
          <div className="flex justify-between items-end mb-4 px-1">
            <h3 className="font-bold text-slate-800">歷史明細</h3>
            <Calendar className="w-4 h-4 text-slate-300" />
          </div>
          <div className="space-y-4">
            {groupedHistory.length === 0 ? (
              <div className="text-center py-10 text-slate-300 italic text-sm">
                尚無歷史明細
              </div>
            ) : (
              groupedHistory.map(([monthKey, monthRecords]) => (
                <div key={monthKey} className="overflow-hidden">
                  <button 
                    onClick={() => toggleMonth(monthKey)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-600 font-bold text-sm transition-colors active:bg-slate-100"
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" /> {monthKey}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">${monthRecords.reduce((s, r) => s + r.amount, 0).toLocaleString()}</span>
                      {expandedMonths[monthKey] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </button>
                  {expandedMonths[monthKey] && (
                    <div className="mt-2 space-y-2 pl-2">
                      {monthRecords.map(record => <RecordItem key={record.id} record={record} />)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
