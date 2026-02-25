
import React, { useState } from 'react';
import { AppData, Tag, CreditCard, RewardPlan } from '../types';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Save, 
  PlusCircle,
  Settings2,
  Calendar,
  CreditCard as CardIcon,
  Tag as TagIcon,
  Check,
  StickyNote,
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react';

interface SettingsPageProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ data, setData }) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'tags'>('cards');
  
  // Card Modal State
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  // Tag Editor State
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [tagEditValue, setTagEditValue] = useState('');
  const [newTagValue, setNewTagValue] = useState('');

  // Quick Add Tag State (Inside Plan Editor)
  const [quickAddTagPlanId, setQuickAddTagPlanId] = useState<string | null>(null);
  const [quickAddTagName, setQuickAddTagName] = useState('');

  const deleteCard = (id: string) => {
    setData(prev => ({ 
      ...prev, 
      cards: prev.cards.filter(c => c.id !== id),
      records: prev.records.filter(r => r.cardId !== id)
    }));
  };

  const openAddCard = () => {
    setEditingCard({
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      billingDay: 1,
      plans: []
    });
    setShowCardModal(true);
  };

  const openEditCard = (card: CreditCard) => {
    setEditingCard(JSON.parse(JSON.stringify(card))); 
    setShowCardModal(true);
  };

  const handleSaveCard = () => {
    if (!editingCard || !editingCard.name) return;
    setData(prev => {
      const exists = prev.cards.some(c => c.id === editingCard.id);
      if (exists) {
        return {
          ...prev,
          cards: prev.cards.map(c => c.id === editingCard.id ? editingCard : c)
        };
      } else {
        return {
          ...prev,
          cards: [...prev.cards, editingCard]
        };
      }
    });
    setShowCardModal(false);
    setEditingCard(null);
  };

  const addPlanToEditingCard = () => {
    if (!editingCard) return;
    const newPlan: RewardPlan = {
      id: Math.random().toString(36).substr(2, 9),
      cardId: editingCard.id,
      note: '',
      percentage: 1,
      cap: 0,
      minSpend: 0,
      tagIds: []
    };
    setEditingCard({
      ...editingCard,
      plans: [...editingCard.plans, newPlan]
    });
  };

  const updatePlanInEditingCard = (planId: string, updates: Partial<RewardPlan>) => {
    if (!editingCard) return;
    setEditingCard({
      ...editingCard,
      plans: editingCard.plans.map(p => p.id === planId ? { ...p, ...updates } : p)
    });
  };

  const deletePlanFromEditingCard = (planId: string) => {
    if (!editingCard) return;
    setEditingCard({
      ...editingCard,
      plans: editingCard.plans.filter(p => p.id !== planId)
    });
  };

  const handleQuickAddTag = (planId: string) => {
    if (!quickAddTagName.trim()) {
      setQuickAddTagPlanId(null);
      return;
    }

    const newTagId = Math.random().toString(36).substr(2, 9);
    const newTag: Tag = { id: newTagId, name: quickAddTagName.trim() };

    // 1. Add to global tags
    setData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));

    // 2. Add to the current editing plan
    if (editingCard) {
      setEditingCard({
        ...editingCard,
        plans: editingCard.plans.map(p => 
          p.id === planId ? { ...p, tagIds: [...p.tagIds, newTagId] } : p
        )
      });
    }

    setQuickAddTagName('');
    setQuickAddTagPlanId(null);
  };

  // Date Quick Set Handlers
  const setDateJanStart = () => {
    if (editingCard) {
      const year = new Date().getFullYear();
      setEditingCard({ ...editingCard, validFrom: `${year}-01-01` });
    }
  };

  const setDateJulyStart = () => {
    if (editingCard) {
      const year = new Date().getFullYear();
      setEditingCard({ ...editingCard, validFrom: `${year}-07-01` });
    }
  };

  const setDateJuneEnd = () => {
    if (editingCard) {
      const now = new Date();
      let year = now.getFullYear();
      // If today is past June 30th, set to next year
      if (now.getMonth() > 5 || (now.getMonth() === 5 && now.getDate() > 30)) {
        year += 1;
      }
      setEditingCard({ ...editingCard, validUntil: `${year}-06-30` });
    }
  };

  const setDateDecEnd = () => {
    if (editingCard) {
      const now = new Date();
      let year = now.getFullYear();
      setEditingCard({ ...editingCard, validUntil: `${year}-12-31` });
    }
  };

  // Tag Management Tab
  const handleAddTag = () => {
    if (!newTagValue.trim()) return;
    const newTag: Tag = { id: Math.random().toString(36).substr(2, 9), name: newTagValue.trim() };
    setData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
    setNewTagValue('');
  };

  const handleUpdateTag = (id: string) => {
    if (!tagEditValue.trim()) return;
    setData(prev => ({
      ...prev,
      tags: prev.tags.map(t => t.id === id ? { ...t, name: tagEditValue.trim() } : t)
    }));
    setEditingTagId(null);
  };

  const deleteTag = (id: string) => {
    setData(prev => ({ 
      ...prev, 
      tags: prev.tags.filter(t => t.id !== id),
      // Also remove tag from all plans
      cards: prev.cards.map(card => ({
        ...card,
        plans: card.plans.map(plan => ({
          ...plan,
          tagIds: plan.tagIds.filter(tid => tid !== id)
        }))
      }))
    }));
  };

  return (
    <div className="p-6 pb-32 max-w-lg mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-800">管理中心</h1>
        <p className="text-slate-400 text-xs font-medium italic">Settings & Customization</p>
      </header>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
        <button onClick={() => setActiveTab('cards')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'cards' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>卡片與方案</button>
        <button onClick={() => setActiveTab('tags')} className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'tags' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>標籤管理</button>
      </div>

      {activeTab === 'cards' ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-left duration-300">
          {data.cards.map(card => (
            <div key={card.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0"><CardIcon className="w-5 h-5" /></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-700 truncate">{card.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                      {card.validFrom} ~ {card.validUntil}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEditCard(card)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => deleteCard(card.id)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="space-y-2">
                {card.plans.length === 0 ? (
                  <p className="text-[10px] text-slate-300 italic px-2">尚未建立任何回饋方案</p>
                ) : (
                  card.plans.map(plan => {
                    const planTags = data.tags.filter(t => plan.tagIds.includes(t.id));
                    return (
                      <div key={plan.id} className="bg-slate-50/70 p-3 rounded-2xl text-[11px] flex justify-between items-center border border-slate-100/50">
                        <div className="flex flex-wrap gap-1 max-w-[75%]">
                          {planTags.length === 0 ? (
                            <span className="text-slate-400 font-bold px-1.5">一般消費</span>
                          ) : (
                            planTags.map(t => (
                              <span key={t.id} className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md font-black text-[9px] border border-indigo-100/50">
                                {t.name}
                              </span>
                            ))
                          )}
                        </div>
                        <span className="font-black text-indigo-600 shrink-0 text-sm">{plan.percentage}%</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
          <button onClick={openAddCard} className="w-full py-6 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-black flex flex-col items-center justify-center gap-2 hover:border-indigo-300 hover:text-indigo-400 active:scale-[0.98] transition-all bg-white/50"><PlusCircle className="w-8 h-8" /><span className="text-xs uppercase tracking-widest">新增信用卡</span></button>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
          <div className="flex gap-2">
            <input 
              value={newTagValue} 
              onChange={e => setNewTagValue(e.target.value)} 
              placeholder="輸入標籤名稱..." 
              className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-600 transition-all outline-none"
            />
            <button onClick={handleAddTag} className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-100 active:scale-90 transition-all"><Plus className="w-5 h-5" /></button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {data.tags.map(tag => (
              <div key={tag.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm transition-all hover:border-indigo-100">
                {editingTagId === tag.id ? (
                  <div className="flex-1 flex gap-2">
                    <input 
                      autoFocus 
                      value={tagEditValue} 
                      onChange={e => setTagEditValue(e.target.value)} 
                      onBlur={() => handleUpdateTag(tag.id)}
                      onKeyDown={e => e.key === 'Enter' && handleUpdateTag(tag.id)}
                      className="flex-1 bg-slate-50 border-none rounded-lg p-2 text-sm font-black"
                    />
                    <button onClick={() => handleUpdateTag(tag.id)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Check className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <TagIcon className="w-4 h-4 text-indigo-500" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{tag.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => { setEditingTagId(tag.id); setTagEditValue(tag.name); }} 
                        className="p-2 text-slate-300 hover:text-indigo-600 active:scale-90 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteTag(tag.id)} 
                        className="p-2 text-slate-300 hover:text-rose-600 active:scale-90 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card & Plan Editor Modal */}
      {showCardModal && editingCard && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 my-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Settings2 className="w-5 h-5 text-indigo-600" />編輯卡片資訊</h2>
              <button onClick={() => setShowCardModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar pb-4 pr-1">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">卡片名稱</label>
                  <input value={editingCard.name} onChange={e => setEditingCard({...editingCard, name: e.target.value})} placeholder="例如: 永豐大戶卡" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black focus:ring-2 focus:ring-indigo-600" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">權益開始日</label>
                    <input type="date" value={editingCard.validFrom} onChange={e => setEditingCard({...editingCard, validFrom: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black focus:ring-2 focus:ring-indigo-600 mb-1" />
                    <div className="flex gap-1 px-1">
                      <button onClick={setDateJanStart} className="bg-slate-100 text-slate-500 px-2 py-1 rounded-lg text-[9px] font-black hover:bg-slate-200 transition-colors uppercase">1月初</button>
                      <button onClick={setDateJulyStart} className="bg-slate-100 text-slate-500 px-2 py-1 rounded-lg text-[9px] font-black hover:bg-slate-200 transition-colors uppercase">7月初</button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">權益結束日</label>
                    <input type="date" value={editingCard.validUntil} onChange={e => setEditingCard({...editingCard, validUntil: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black focus:ring-2 focus:ring-indigo-600 mb-1" />
                    <div className="flex gap-1 px-1">
                      <button onClick={setDateJuneEnd} className="bg-slate-100 text-slate-500 px-2 py-1 rounded-lg text-[9px] font-black hover:bg-slate-200 transition-colors uppercase">6月底</button>
                      <button onClick={setDateDecEnd} className="bg-slate-100 text-slate-500 px-2 py-1 rounded-lg text-[9px] font-black hover:bg-slate-200 transition-colors uppercase">12月底</button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">每月結帳日</label>
                  <input type="number" min="1" max="31" value={editingCard.billingDay} onChange={e => setEditingCard({...editingCard, billingDay: Number(e.target.value)})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-black focus:ring-2 focus:ring-indigo-600" />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-black text-slate-700 uppercase tracking-tighter">方案內容 (回饋與門檻)</h3>
                  <button onClick={addPlanToEditingCard} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-indigo-100 transition-colors flex items-center gap-1"><Plus className="w-3 h-3" /> 新增方案</button>
                </div>
                <div className="space-y-5">
                  {editingCard.plans.map(plan => {
                    const planTags = data.tags.filter(t => plan.tagIds.includes(t.id));
                    const isQuickAdding = quickAddTagPlanId === plan.id;

                    return (
                      <div key={plan.id} className="bg-white p-5 rounded-[2rem] border border-slate-200 relative group/plan shadow-sm hover:border-indigo-200 transition-colors">
                        <button onClick={() => deletePlanFromEditingCard(plan.id)} className="absolute -top-2 -right-2 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform z-10"><X className="w-4 h-4" /></button>
                        
                        {/* Tags Display as chip layout */}
                        <div className="flex flex-wrap gap-1.5 mb-4 p-2.5 bg-slate-50 rounded-2xl min-h-[40px] border border-slate-100">
                          {planTags.length === 0 ? (
                            <span className="text-[10px] font-bold text-slate-300 px-1 py-1 italic">未選取特定通路 (一般消費)</span>
                          ) : (
                            planTags.map(t => (
                              <span key={t.id} className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg text-[9px] font-black shadow-sm">
                                {t.name}
                              </span>
                            ))
                          )}
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="bg-slate-50/80 rounded-2xl px-4 py-3 flex items-center gap-3 border border-slate-100">
                            <span className="text-[10px] font-black text-indigo-600 w-10 uppercase tracking-tighter">回饋%</span>
                            <input 
                              type="number" 
                              value={plan.percentage} 
                              onChange={e => updatePlanInEditingCard(plan.id, { percentage: Number(e.target.value) })} 
                              className="w-full bg-transparent border-none p-0 text-lg font-black text-indigo-600 focus:ring-0" 
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 rounded-2xl px-4 py-3 flex items-center gap-3 border border-slate-100">
                              <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                                <ArrowDownCircle className="w-4 h-4 text-amber-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <label className="text-[8px] font-black text-slate-400 block uppercase leading-none mb-1 tracking-widest">低消</label>
                                <input 
                                  type="number" 
                                  value={plan.minSpend} 
                                  onChange={e => updatePlanInEditingCard(plan.id, { minSpend: Number(e.target.value) })} 
                                  placeholder="0"
                                  className="w-full bg-transparent border-none p-0 text-sm font-black text-slate-700 focus:ring-0" 
                                />
                              </div>
                            </div>
                            <div className="bg-slate-50 rounded-2xl px-4 py-3 flex items-center gap-3 border border-slate-100">
                              <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                                <ArrowUpCircle className="w-4 h-4 text-indigo-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <label className="text-[8px] font-black text-slate-400 block uppercase leading-none mb-1 tracking-widest">封頂</label>
                                <input 
                                  type="number" 
                                  value={plan.cap} 
                                  onChange={e => updatePlanInEditingCard(plan.id, { cap: Number(e.target.value) })} 
                                  placeholder="0"
                                  className="w-full bg-transparent border-none p-0 text-sm font-black text-slate-700 focus:ring-0" 
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-1.5 px-1">
                            <StickyNote className="w-3.5 h-3.5 text-slate-300" />
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">方案備註 (選填)</label>
                          </div>
                          <input 
                            value={plan.note || ''} 
                            onChange={e => updatePlanInEditingCard(plan.id, { note: e.target.value })} 
                            placeholder="如: 週五加碼 2%..." 
                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 text-[11px] font-bold focus:ring-1 focus:ring-indigo-300 placeholder:text-slate-300" 
                          />
                        </div>

                        <div className="space-y-2 pt-3 border-t border-slate-50">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 block mb-2">快速選取通路</label>
                          <div className="flex flex-wrap gap-1.5">
                            {data.tags.map(tag => {
                              const active = plan.tagIds.includes(tag.id);
                              return (
                                <button key={tag.id} onClick={() => {
                                  const newTags = active ? plan.tagIds.filter(tid => tid !== tag.id) : [...plan.tagIds, tag.id];
                                  updatePlanInEditingCard(plan.id, { tagIds: newTags });
                                }} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border-2 ${active ? 'bg-slate-800 border-slate-800 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                                  {tag.name}
                                </button>
                              );
                            })}
                            
                            {/* Inline Tag Creator */}
                            {isQuickAdding ? (
                              <div className="flex items-center gap-1 bg-white border-2 border-indigo-600 rounded-xl px-1 py-0.5 animate-in zoom-in duration-200">
                                <input 
                                  autoFocus
                                  value={quickAddTagName}
                                  onChange={e => setQuickAddTagName(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleQuickAddTag(plan.id)}
                                  placeholder="標籤名"
                                  className="w-16 bg-transparent border-none p-0 text-[10px] font-bold focus:ring-0"
                                />
                                <button onClick={() => handleQuickAddTag(plan.id)} className="p-1 bg-indigo-600 text-white rounded-lg"><Check className="w-2.5 h-2.5" /></button>
                                <button onClick={() => setQuickAddTagPlanId(null)} className="p-1 text-slate-300"><X className="w-2.5 h-2.5" /></button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setQuickAddTagPlanId(plan.id)}
                                className="w-7 h-7 bg-slate-800 text-white rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-transform"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-slate-100">
              <button onClick={() => setShowCardModal(false)} className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-500 font-black text-sm active:scale-95 transition-all">取消</button>
              <button onClick={handleSaveCard} disabled={!editingCard.name} className={`flex-[2] py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all ${!editingCard.name ? 'bg-slate-200 text-slate-400' : 'bg-indigo-600 text-white shadow-indigo-100'}`}><Save className="w-4 h-4 inline-block mr-2" />儲存卡片與方案</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
