
import React, { useState, useMemo, useRef } from 'react';
import { Coffee, Ticket, ChevronDown, ChevronRight, Clock, Activity, Plus, X, Camera, Scan, Sparkles, Loader2, Image as ImageIcon, Link as LinkIcon, Trash2 } from 'lucide-react';
import { AppData, PrepaidItem, Coupon } from '../types';

interface PrepaidCouponPageProps {
  data: AppData;
  onNavigate: (page: any, id: string) => void;
  onAddPrepaid: (item: PrepaidItem) => void;
  onAddCoupon: (coupon: Coupon) => void;
  onDeletePrepaid: (id: string) => void;
  onDeleteCoupon: (id: string) => void;
}

export const PrepaidCouponPage: React.FC<PrepaidCouponPageProps> = ({ 
  data, onNavigate, onAddPrepaid, onAddCoupon, onDeletePrepaid, onDeleteCoupon 
}) => {
  const [showAddPrepaid, setShowAddPrepaid] = useState(false);
  const [showAddCoupon, setShowAddCoupon] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Form states
  const [newPrepaid, setNewPrepaid] = useState<Partial<PrepaidItem>>({ name: '', count: 1, expiryDate: new Date().toISOString().split('T')[0] });
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({ shop: '', amount: 0, expiryDate: new Date().toISOString().split('T')[0], isUsed: false, imageUrl: '', barcodeUrl: '', linkUrl: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const formatDisplayDate = (dateStr: string) => {
    return dateStr === '2099-12-31' ? '無期限' : `至 ${dateStr}`;
  };

  const getRecommendedFrequency = (item: PrepaidItem) => {
    if (item.expiryDate === '2099-12-31') return Infinity;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(item.expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffDays = Math.max(0, Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    if (item.count <= 0) return Infinity;
    if (diffDays <= 0) return 0;
    return diffDays / item.count;
  };

  const prepaidItemsSorted = useMemo(() => {
    return [...data.prepaidItems].sort((a, b) => {
      const freqA = getRecommendedFrequency(a);
      const freqB = getRecommendedFrequency(b);
      if (freqA !== freqB) return freqA - freqB;
      return a.name.localeCompare(b.name, 'zh-TW');
    });
  }, [data.prepaidItems]);

  const activeCoupons = useMemo(() => {
    return data.coupons
      .filter(c => !c.isUsed && new Date(c.expiryDate) >= new Date())
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [data.coupons]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'coupon' | 'barcode') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      if (type === 'coupon') {
        setNewCoupon(prev => ({ ...prev, imageUrl: base64 }));
        analyzeImage(base64);
      } else {
        setNewCoupon(prev => ({ ...prev, barcodeUrl: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (base64: string) => {
    setIsAnalyzing(true);
    // Demo simulation: wait for 1.5 seconds then show a message
    setTimeout(() => {
      setIsAnalyzing(false);
      alert("AI 掃描功能目前為示意模式。請手動輸入優惠券資訊。");
      // Optionally fill in some dummy data to show how it would look
      setNewCoupon(prev => ({
        ...prev,
        shop: "範例商店 (AI 模擬)",
        amount: 100,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));
    }, 1500);
  };

  const handleCreateCoupon = () => {
    if (!newCoupon.shop || !newCoupon.amount) return;
    const item: Coupon = {
      id: Math.random().toString(36).substr(2, 9),
      shop: newCoupon.shop!,
      amount: newCoupon.amount!,
      expiryDate: newCoupon.expiryDate!,
      isUsed: false,
      barcodeUrl: newCoupon.barcodeUrl,
      imageUrl: newCoupon.imageUrl,
      linkUrl: newCoupon.linkUrl
    };
    onAddCoupon(item);
    setShowAddCoupon(false);
    setNewCoupon({ shop: '', amount: 0, expiryDate: new Date().toISOString().split('T')[0], isUsed: false, imageUrl: '', barcodeUrl: '', linkUrl: '' });
  };

  const confirmDeletePrepaid = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeletePrepaid(id);
  };

  const confirmDeleteCoupon = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteCoupon(id);
  };

  return (
    <div className="p-6 pb-32">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-1 tracking-tight">寄杯與優惠券</h1>
        <p className="text-slate-500 text-xs">掌握每一口生活的小確幸</p>
      </header>

      {/* Prepaid Items Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-base font-bold flex items-center gap-2 text-slate-800">
            <Coffee className="w-4 h-4 text-indigo-600" /> 我的寄杯
          </h2>
          <button onClick={() => setShowAddPrepaid(true)} className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center active:scale-90 transition-transform"><Plus className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {prepaidItemsSorted.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-100 text-slate-300 text-sm italic">尚無寄杯項目</div>
          ) : (
            prepaidItemsSorted.map(item => {
              const freqVal = getRecommendedFrequency(item);
              return (
                <div key={item.id} onClick={() => onNavigate('prepaidDetail', item.id)} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 active:scale-[0.98] transition-all cursor-pointer flex justify-between items-center group">
                  <div className="flex-1 pr-4">
                    <h3 className="font-bold text-slate-800 text-sm mb-1 leading-tight">{item.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                        {freqVal === Infinity ? '無期限' : `建議 ${freqVal.toFixed(1)} 天 / 單位`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-2xl font-black text-indigo-600">{item.count}</span>
                        <span className="text-[10px] font-bold text-slate-400">單位</span>
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium">{formatDisplayDate(item.expiryDate)}</div>
                    </div>
                    <button 
                      onClick={(e) => confirmDeletePrepaid(e, item.id)} 
                      className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Coupons Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-base font-bold flex items-center gap-2 text-slate-800">
            <Ticket className="w-4 h-4 text-indigo-600" /> 優惠券
          </h2>
          <button onClick={() => setShowAddCoupon(true)} className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center active:scale-90 transition-transform"><Plus className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          {activeCoupons.length === 0 ? (
             <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-100 text-slate-300 text-sm italic">尚無有效優惠券</div>
          ) : (
            activeCoupons.map(coupon => (
              <div key={coupon.id} onClick={() => onNavigate('couponDetail', coupon.id)} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex active:scale-[0.98] transition-transform cursor-pointer h-16 group">
                <div className="w-16 bg-indigo-600 flex flex-col items-center justify-center text-white shrink-0">
                  <p className="text-[14px] font-black">${coupon.amount}</p>
                </div>
                <div className="flex-1 px-4 flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-xs truncate">{coupon.shop}</h3>
                    <div className="flex items-center gap-1 text-[9px] text-slate-400"><Clock className="w-2.5 h-2.5" /><span>{coupon.expiryDate === '2099-12-31' ? '無期限' : coupon.expiryDate}</span></div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {coupon.linkUrl && <LinkIcon className="w-3 h-3 text-indigo-300" />}
                    <button 
                      onClick={(e) => confirmDeleteCoupon(e, coupon.id)}
                      className="p-2.5 text-slate-400 hover:text-rose-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-200" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Modals remain the same... */}
      {showAddPrepaid && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">新增寄杯項目</h2>
              <button onClick={() => setShowAddPrepaid(false)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">品名</label>
                <input value={newPrepaid.name} onChange={e => setNewPrepaid({...newPrepaid, name: e.target.value})} placeholder="例如: 萊爾富 茶葉蛋" className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">初始數量</label>
                <input type="number" value={newPrepaid.count} onChange={e => setNewPrepaid({...newPrepaid, count: Number(e.target.value)})} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">截止日期</label>
                <div className="flex gap-2">
                  <input type="date" value={newPrepaid.expiryDate === '2099-12-31' ? '' : newPrepaid.expiryDate} onChange={e => setNewPrepaid({...newPrepaid, expiryDate: e.target.value})} className="flex-1 bg-slate-50 border-none rounded-xl p-3 text-sm font-bold" />
                  <button 
                    onClick={() => setNewPrepaid({...newPrepaid, expiryDate: '2099-12-31'})}
                    className={`px-4 rounded-xl text-xs font-bold transition-colors ${newPrepaid.expiryDate === '2099-12-31' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                  >
                    無
                  </button>
                </div>
              </div>
              <button onClick={() => {
                if (!newPrepaid.name) return;
                onAddPrepaid({
                  id: Math.random().toString(36).substr(2, 9),
                  name: newPrepaid.name!,
                  count: newPrepaid.count || 0,
                  expiryDate: newPrepaid.expiryDate!,
                  history: [{ date: new Date().toISOString(), change: newPrepaid.count || 0 }]
                });
                setShowAddPrepaid(false);
                setNewPrepaid({ name: '', count: 1, expiryDate: new Date().toISOString().split('T')[0] });
              }} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-100 mt-4 active:scale-95 transition-all">建立寄杯</button>
            </div>
          </div>
        </div>
      )}

      {showAddCoupon && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 my-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">新增優惠券</h2>
              <button onClick={() => setShowAddCoupon(false)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-5">
              <div className="flex gap-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group"
                >
                  {newCoupon.imageUrl ? (
                    <>
                      <img src={newCoupon.imageUrl} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Camera className="text-white w-8 h-8" />
                      </div>
                    </>
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-[10px] font-bold text-slate-400">拍券面 (AI 自動填入)</p>
                    </>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'coupon')} />
                </div>

                <div 
                  onClick={() => barcodeInputRef.current?.click()}
                  className="w-32 aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer relative overflow-hidden"
                >
                  {newCoupon.barcodeUrl ? (
                    <img src={newCoupon.barcodeUrl} className="w-full h-full object-contain p-2" />
                  ) : (
                    <>
                      <Scan className="w-6 h-6 text-slate-300 mb-1" />
                      <p className="text-[8px] font-bold text-slate-400">條碼</p>
                    </>
                  )}
                  <input type="file" ref={barcodeInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'barcode')} />
                </div>
              </div>

              {isAnalyzing && (
                <div className="bg-indigo-50 p-3 rounded-xl flex items-center gap-3 animate-pulse">
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                  <p className="text-xs font-bold text-indigo-600 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI 正在解析...</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">通路 / 說明</label>
                  <input value={newCoupon.shop} onChange={e => setNewCoupon({...newCoupon, shop: e.target.value})} placeholder="例如: 7-11 抵用券" className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">面額</label>
                  <input type="number" value={newCoupon.amount} onChange={e => setNewCoupon({...newCoupon, amount: Number(e.target.value)})} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-indigo-600" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">截止日期</label>
                <div className="flex gap-2">
                  <input type="date" value={newCoupon.expiryDate === '2099-12-31' ? '' : newCoupon.expiryDate} onChange={e => setNewCoupon({...newCoupon, expiryDate: e.target.value})} className="flex-1 bg-slate-50 border-none rounded-xl p-3 text-sm font-bold" />
                  <button 
                    onClick={() => setNewCoupon({...newCoupon, expiryDate: '2099-12-31'})}
                    className={`px-4 rounded-xl text-xs font-bold transition-colors ${newCoupon.expiryDate === '2099-12-31' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                  >
                    無
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">連結 (選填)</label>
                <input value={newCoupon.linkUrl} onChange={e => setNewCoupon({...newCoupon, linkUrl: e.target.value})} placeholder="https://..." className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-medium" />
              </div>

              <button onClick={handleCreateCoupon} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-100 mt-4 active:scale-95 transition-all">建立優惠券</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
