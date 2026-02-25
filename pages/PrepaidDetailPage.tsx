
import React, { useMemo, useState } from 'react';
import { ChevronLeft, Coffee, History, Calendar, AlertCircle, Edit2, Trash2, Save, X } from 'lucide-react';
import { PrepaidItem } from '../types';

interface PrepaidDetailPageProps {
  item: PrepaidItem;
  onBack: () => void;
  onUpdate: (item: PrepaidItem) => void;
  onDelete: () => void;
}

export const PrepaidDetailPage: React.FC<PrepaidDetailPageProps> = ({ item, onBack, onUpdate, onDelete }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editHistoryData, setEditHistoryData] = useState<{ date: string; change: number } | null>(null);
  
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editInfoData, setEditInfoData] = useState<Partial<PrepaidItem>>({ ...item });

  // Calculate recommended frequency logic
  const frequencyInfo = useMemo(() => {
    if (item.expiryDate === '2099-12-31') return { label: '無期限', value: Infinity, color: 'text-indigo-600', urgency: 'none', diffDays: 99999 };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(item.expiryDate);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: '已過期', value: null, color: 'text-red-500', urgency: 'critical', diffDays };
    if (item.count <= 0) return { label: '已全數兌換', value: null, color: 'text-slate-400', urgency: 'none', diffDays };

    const daysPerCup = diffDays / item.count;
    let urgency = 'normal';
    let color = 'text-indigo-600';

    if (daysPerCup <= 1) {
      urgency = 'high';
      color = 'text-rose-600';
    } else if (daysPerCup <= 3) {
      urgency = 'medium';
      color = 'text-amber-500';
    }

    return { 
      label: `平均 ${daysPerCup.toFixed(1)} 天`, 
      value: daysPerCup, 
      color, 
      urgency,
      diffDays 
    };
  }, [item.expiryDate, item.count]);

  const handleEditHistory = (index: number) => {
    setEditingIndex(index);
    setEditHistoryData({ ...item.history[index] });
  };

  const handleSaveHistory = () => {
    if (editingIndex === null || !editHistoryData) return;
    
    const oldChange = item.history[editingIndex].change;
    const newHistory = [...item.history];
    newHistory[editingIndex] = { ...editHistoryData };
    
    const newCount = Math.max(0, item.count - oldChange + editHistoryData.change);
    
    onUpdate({
      ...item,
      count: newCount,
      history: newHistory
    });
    setEditingIndex(null);
    setEditHistoryData(null);
  };

  const handleDeleteHistory = (index: number) => {
    const changeToRemove = item.history[index].change;
    const newHistory = item.history.filter((_, i) => i !== index);
    const newCount = Math.max(0, item.count - changeToRemove);
    onUpdate({ ...item, count: newCount, history: newHistory });
  };

  const handleSaveInfo = () => {
    onUpdate({ ...item, ...editInfoData } as PrepaidItem);
    setIsEditingInfo(false);
  };

  const handleDeleteItem = () => {
    onDelete();
  };

  return (
    <div className="p-6 animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center text-slate-400 font-bold text-sm transition-colors hover:text-indigo-600">
          <ChevronLeft className="w-5 h-5" /> 返回列表
        </button>
        <div className="flex gap-2">
          <button onClick={() => setIsEditingInfo(true)} className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors"><Edit2 className="w-4 h-4" /></button>
          <button onClick={handleDeleteItem} className="p-2 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 shrink-0">
          <Coffee className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-800 leading-tight">
            {item.name}
          </h1>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 text-center mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-2">目前剩餘總數</p>
        <div className="flex justify-center items-end">
          <p className="text-8xl font-black text-slate-800 tracking-tighter">{item.count}</p>
          <span className="text-sm font-bold text-slate-400 ml-2 mb-4">單位</span>
        </div>
      </div>

      <section className="mb-10">
        <div className="bg-indigo-50 rounded-[2rem] p-6 border border-indigo-100/50 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-700 text-sm">到期前建議消耗頻率</h3>
          </div>
          <div className="flex justify-between items-end relative z-10">
            <div>
              <p className={`text-3xl font-black ${frequencyInfo.color} tracking-tight`}>
                {frequencyInfo.label}
              </p>
              <p className="text-[10px] font-bold text-indigo-400 mt-1 uppercase tracking-widest">需消耗一單位</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase">截止日期</p>
              <p className="text-sm font-black text-slate-600">{item.expiryDate === '2099-12-31' ? '無期限' : item.expiryDate}</p>
            </div>
          </div>
          {frequencyInfo.urgency === 'high' && (
            <div className="mt-4 flex items-center gap-2 bg-rose-100/50 p-2.5 rounded-xl border border-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <p className="text-[11px] font-bold text-rose-600">時間緊迫！建議每天都要消耗喔。</p>
            </div>
          )}
        </div>
      </section>

      <section className="pb-10">
        <div className="flex justify-between items-center mb-5 px-1">
          <h3 className="font-bold flex items-center gap-2 text-slate-800">
            <History className="w-4 h-4 text-indigo-600" /> 兌換與購入明細
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">History</span>
        </div>
        
        <div className="space-y-3">
          {item.history.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-100 text-slate-300 text-sm">尚無操作紀錄</div>
          ) : (
            item.history.map((h, i) => {
              const isEditing = editingIndex === i;
              if (isEditing && editHistoryData) {
                return (
                  <div key={i} className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 space-y-3 shadow-inner">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-indigo-400 uppercase">數量 (正購入/負兌換)</label>
                        <input type="number" value={editHistoryData.change} onChange={e => setEditHistoryData({...editHistoryData, change: Number(e.target.value)})} className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 text-sm font-black text-indigo-600" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-indigo-400 uppercase">日期</label>
                        <input type="date" value={editHistoryData.date.split('T')[0]} onChange={e => setEditHistoryData({...editHistoryData, date: e.target.value})} className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 text-sm font-medium" />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={handleSaveHistory} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"><Save className="w-3.5 h-3.5" /> 儲存</button>
                      <button onClick={() => setEditingIndex(null)} className="px-4 bg-slate-200 text-slate-600 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-50 flex justify-between items-center shadow-sm group hover:border-indigo-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${h.change > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                      {h.change > 0 ? <Coffee className="w-5 h-5" /> : <div className="text-xs font-black">-</div>}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{h.change > 0 ? '購入' : '兌換'}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{h.date.split('T')[0]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-lg font-black ${h.change > 0 ? 'text-indigo-600' : 'text-slate-800'}`}>{h.change > 0 ? `+${h.change}` : h.change}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditHistory(i)} className="p-2 bg-slate-50 rounded-lg text-slate-300 hover:text-indigo-500 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteHistory(i)} className="p-2 bg-slate-50 rounded-lg text-slate-300 hover:text-rose-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Edit Info Modal */}
      {isEditingInfo && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">編輯寄杯資訊</h2>
              <button onClick={() => setIsEditingInfo(false)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">品名</label>
                <input value={editInfoData.name} onChange={e => setEditInfoData({...editInfoData, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">截止日期</label>
                <div className="flex gap-2">
                  <input type="date" value={editInfoData.expiryDate === '2099-12-31' ? '' : editInfoData.expiryDate} onChange={e => setEditInfoData({...editInfoData, expiryDate: e.target.value})} className="flex-1 bg-slate-50 border-none rounded-xl p-3 text-sm font-bold" />
                  <button 
                    onClick={() => setEditInfoData({...editInfoData, expiryDate: '2099-12-31'})}
                    className={`px-4 rounded-xl text-xs font-bold transition-colors ${editInfoData.expiryDate === '2099-12-31' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                  >
                    無
                  </button>
                </div>
              </div>
              <button onClick={handleSaveInfo} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-100 mt-4 active:scale-95 transition-all">更新資訊</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
