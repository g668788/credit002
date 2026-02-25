
import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Trash2, CheckCircle2, QrCode, Edit2, X, Maximize2, Camera, Scan, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { Coupon } from '../types';
import { GoogleGenAI } from "@google/genai";

interface CouponDetailPageProps {
  coupon: Coupon;
  onBack: () => void;
  onUpdate: (coupon: Coupon) => void;
  onDelete: () => void;
}

export const CouponDetailPage: React.FC<CouponDetailPageProps> = ({ coupon, onBack, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editData, setEditData] = useState<Partial<Coupon>>({ ...coupon });
  const [fullscreenImg, setFullscreenImg] = useState<string | null>(null);

  const editFileInputRef = useRef<HTMLInputElement>(null);
  const editBarcodeInputRef = useRef<HTMLInputElement>(null);

  const handleRedeem = () => {
    onUpdate({ ...coupon, isUsed: !coupon.isUsed });
  };

  const handleSave = () => {
    onUpdate({ ...coupon, ...editData } as Coupon);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'coupon' | 'barcode') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      if (type === 'coupon') {
        setEditData(prev => ({ ...prev, imageUrl: base64 }));
        analyzeImage(base64);
      } else {
        setEditData(prev => ({ ...prev, barcodeUrl: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (base64: string) => {
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = base64.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { text: "Extract coupon details in Traditional Chinese: Shop name (or description), Discount amount (number only), Expiry date (YYYY-MM-DD). Format as JSON with keys: shop, amount, expiryDate." }
          ]
        },
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || '{}');
      setEditData(prev => ({
        ...prev,
        shop: result.shop || prev.shop,
        amount: Number(result.amount) || prev.amount,
        expiryDate: result.expiryDate || prev.expiryDate
      }));
    } catch (error) {
      console.error("AI Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 animate-in slide-in-from-right duration-300">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center text-slate-400 font-medium transition-colors hover:text-indigo-600">
          <ChevronLeft className="w-5 h-5" /> 返回列表
        </button>
        <div className="flex gap-2">
          <button onClick={() => setIsEditing(true)} className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors">
            <Edit2 className="w-5 h-5" />
          </button>
          <button onClick={handleDelete} className="p-2 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-100 transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden mb-8">
        {coupon.imageUrl ? (
          <div className="relative group cursor-pointer" onClick={() => setFullscreenImg(coupon.imageUrl!)}>
            <img src={coupon.imageUrl} className="w-full aspect-video object-cover" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur p-2 rounded-full text-indigo-600 shadow-lg">
              <Maximize2 className="w-4 h-4" />
            </div>
            <div className={`absolute top-4 left-4 p-4 ${coupon.isUsed ? 'bg-slate-500/80' : 'bg-indigo-600/80'} text-white rounded-2xl backdrop-blur-sm shadow-xl`}>
              <p className="text-[10px] font-bold opacity-80 uppercase">面額</p>
              <p className="text-2xl font-black">${coupon.amount}</p>
            </div>
          </div>
        ) : (
          <div className={`p-8 text-center ${coupon.isUsed ? 'bg-slate-50' : 'bg-indigo-600'} ${coupon.isUsed ? 'text-slate-400' : 'text-white'} transition-colors relative`}>
            <p className="text-xs font-bold opacity-80 uppercase mb-2">優惠面額</p>
            <p className="text-5xl font-black mb-2">${coupon.amount}</p>
            <p className="text-lg font-bold">{coupon.shop}</p>
          </div>
        )}

        <div className="p-8 space-y-6">
          <div className="flex justify-between text-sm">
            <div className="space-y-1">
              <p className="text-slate-400 font-bold uppercase text-[10px]">通路 / 名稱</p>
              <p className="font-bold text-slate-700">{coupon.shop}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-slate-400 font-bold uppercase text-[10px]">截止日期</p>
              <p className="font-bold text-slate-700">{coupon.expiryDate === '2099-12-31' ? '無期限' : coupon.expiryDate}</p>
            </div>
          </div>

          {coupon.linkUrl && (
            <a href={coupon.linkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 hover:bg-indigo-100 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold">開啟優惠連結</span>
              </div>
              <ChevronRight className="w-4 h-4 text-indigo-300 group-hover:translate-x-1 transition-transform" />
            </a>
          )}

          <div className="py-8 border-y border-slate-100 flex flex-col items-center">
            {coupon.barcodeUrl ? (
              <div className="relative group cursor-pointer" onClick={() => setFullscreenImg(coupon.barcodeUrl!)}>
                <img src={coupon.barcodeUrl} alt="Barcode" className="max-h-32 w-auto mb-4 p-2 bg-white rounded-lg shadow-sm" />
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/40 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                  <Maximize2 className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            ) : (
              <div className="w-full h-32 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-slate-300">
                <QrCode className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-[10px] font-medium">尚無條碼圖片</p>
              </div>
            )}
            <p className="text-[10px] text-slate-400 font-mono tracking-widest mt-2">SCAN TO REDEEM</p>
          </div>

          <button onClick={handleRedeem} className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${coupon.isUsed ? 'bg-slate-200 text-slate-500' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'}`}>
            {coupon.isUsed ? <><CheckCircle2 className="w-5 h-5" /> 已兌換</> : '標記為已兌換'}
          </button>
        </div>
      </div>

      {fullscreenImg && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col p-4 animate-in fade-in duration-300" onClick={() => setFullscreenImg(null)}>
          <button className="self-end p-4 text-white"><X className="w-8 h-8" /></button>
          <div className="flex-1 flex items-center justify-center p-4">
            <img src={fullscreenImg} className="max-w-full max-h-[80vh] object-contain shadow-2xl" />
          </div>
        </div>
      )}
      
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 my-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">編輯優惠券</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-5">
              <div className="flex gap-4">
                <div onClick={() => editFileInputRef.current?.click()} className="flex-1 aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group">
                  {editData.imageUrl ? <img src={editData.imageUrl} className="w-full h-full object-cover" /> : <Camera className="w-8 h-8 text-slate-300" />}
                  <input type="file" ref={editFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'coupon')} />
                </div>
                <div onClick={() => editBarcodeInputRef.current?.click()} className="w-32 aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer relative overflow-hidden">
                  {editData.barcodeUrl ? <img src={editData.barcodeUrl} className="w-full h-full object-contain p-2" /> : <Scan className="w-6 h-6 text-slate-300" />}
                  <input type="file" ref={editBarcodeInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'barcode')} />
                </div>
              </div>

              {isAnalyzing && (
                <div className="bg-indigo-50 p-3 rounded-xl flex items-center gap-3 animate-pulse">
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                  <p className="text-xs font-bold text-indigo-600 flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI 正在更新資訊...</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">通路 / 說明</label>
                  <input value={editData.shop} onChange={e => setEditData({...editData, shop: e.target.value})} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">面額</label>
                  <input type="number" value={editData.amount} onChange={e => setEditData({...editData, amount: Number(e.target.value)})} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold text-indigo-600" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">截止日期</label>
                <div className="flex gap-2">
                  <input type="date" value={editData.expiryDate === '2099-12-31' ? '' : editData.expiryDate} onChange={e => setEditData({...editData, expiryDate: e.target.value})} className="flex-1 bg-slate-50 border-none rounded-xl p-3 text-sm font-bold" />
                  <button onClick={() => setEditData({...editData, expiryDate: '2099-12-31'})} className={`px-4 rounded-xl text-xs font-bold transition-colors ${editData.expiryDate === '2099-12-31' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>無</button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">連結 (選填)</label>
                <input value={editData.linkUrl} onChange={e => setEditData({...editData, linkUrl: e.target.value})} placeholder="https://..." className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-medium" />
              </div>

              <button onClick={handleSave} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-100 mt-4 active:scale-95 transition-all">儲存所有變更</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
