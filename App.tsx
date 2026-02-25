
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, 
  Coffee, 
  PlusCircle, 
  Calculator, 
  Settings, 
  ChevronRight, 
  Search,
  Filter,
  Calendar,
  CreditCard as CardIcon,
  Tag as TagIcon,
  Clock,
  ChevronDown,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { loadData, saveData } from './storage';
import { AppData, CreditCard, RewardPlan, Tag, SpendingRecord, PrepaidItem, Coupon } from './types';
import { WalletPage } from './pages/WalletPage';
import { PrepaidCouponPage } from './pages/PrepaidCouponPage';
import { QuickCreatePage } from './pages/QuickCreatePage';
import { SimulationPage } from './pages/SimulationPage';
import { SettingsPage } from './pages/SettingsPage';
import { PlanDetailPage } from './pages/PlanDetailPage';
import { PrepaidDetailPage } from './pages/PrepaidDetailPage';
import { CouponDetailPage } from './pages/CouponDetailPage';

export default function App() {
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState<'wallet' | 'items' | 'add' | 'sim' | 'settings'>('wallet');
  const [viewState, setViewState] = useState<{
    page: 'main' | 'planDetail' | 'prepaidDetail' | 'couponDetail';
    id?: string;
  }>({ page: 'main' });

  useEffect(() => {
    saveData(data);
  }, [data]);

  const navigateTo = (page: typeof viewState.page, id?: string) => {
    setViewState({ page, id });
  };

  const handleBack = () => {
    setViewState({ page: 'main' });
  };

  // Cards & Plans
  const updatePlan = (updatedPlan: RewardPlan) => {
    setData(prev => ({
      ...prev,
      cards: prev.cards.map(card => ({
        ...card,
        plans: card.plans.map(p => p.id === updatedPlan.id ? updatedPlan : p)
      }))
    }));
  };

  // Spending Records
  const updateRecord = (updatedRecord: SpendingRecord) => {
    setData(prev => ({
      ...prev,
      records: prev.records.map(r => r.id === updatedRecord.id ? updatedRecord : r)
    }));
  };

  const deleteRecord = (recordId: string) => {
    setData(prev => ({
      ...prev,
      records: prev.records.filter(r => r.id !== recordId)
    }));
  };

  // Prepaid Items
  const addPrepaidItem = (item: PrepaidItem) => {
    setData(prev => ({ ...prev, prepaidItems: [item, ...prev.prepaidItems] }));
  };

  const updatePrepaidItem = (updated: PrepaidItem) => {
    setData(prev => ({
      ...prev,
      prepaidItems: prev.prepaidItems.map(i => i.id === updated.id ? updated : i)
    }));
  };

  const deletePrepaidItem = (id: string) => {
    setData(prev => ({
      ...prev,
      prepaidItems: prev.prepaidItems.filter(i => i.id !== id)
    }));
    if (viewState.id === id) {
      setViewState({ page: 'main' });
    }
  };

  // Coupons
  const addCoupon = (coupon: Coupon) => {
    setData(prev => ({ ...prev, coupons: [coupon, ...prev.coupons] }));
  };

  const updateCoupon = (updated: Coupon) => {
    setData(prev => ({
      ...prev,
      coupons: prev.coupons.map(c => c.id === updated.id ? updated : c)
    }));
  };

  const deleteCoupon = (id: string) => {
    setData(prev => ({
      ...prev,
      coupons: prev.coupons.filter(c => c.id !== id)
    }));
    if (viewState.id === id) {
      setViewState({ page: 'main' });
    }
  };

  const renderContent = () => {
    if (viewState.page === 'planDetail' && viewState.id) {
      const plan = data.cards.flatMap(c => c.plans).find(p => p.id === viewState.id);
      const card = data.cards.find(c => c.id === plan?.cardId);
      if (plan && card) {
        return (
          <PlanDetailPage 
            plan={plan} 
            card={card} 
            records={data.records} 
            allTags={data.tags} 
            onBack={handleBack} 
            onUpdatePlan={updatePlan}
            onUpdateRecord={updateRecord}
            onDeleteRecord={deleteRecord}
          />
        );
      } else {
        handleBack();
        return null;
      }
    }

    if (viewState.page === 'prepaidDetail' && viewState.id) {
      const item = data.prepaidItems.find(i => i.id === viewState.id);
      if (item) {
        return (
          <PrepaidDetailPage 
            item={item} 
            onBack={handleBack} 
            onUpdate={updatePrepaidItem}
            onDelete={() => deletePrepaidItem(viewState.id!)}
          />
        );
      } else {
        handleBack();
        return null;
      }
    }

    if (viewState.page === 'couponDetail' && viewState.id) {
      const coupon = data.coupons.find(c => c.id === viewState.id);
      if (coupon) {
        return (
          <CouponDetailPage 
            coupon={coupon} 
            onBack={handleBack} 
            onUpdate={updateCoupon} 
            onDelete={() => deleteCoupon(viewState.id!)} 
          />
        );
      } else {
        handleBack();
        return null;
      }
    }

    switch (activeTab) {
      case 'wallet': return <WalletPage data={data} onNavigate={navigateTo} />;
      case 'items': return (
        <PrepaidCouponPage 
          data={data} 
          onNavigate={navigateTo} 
          onAddPrepaid={addPrepaidItem}
          onAddCoupon={addCoupon}
          onDeletePrepaid={deletePrepaidItem}
          onDeleteCoupon={deleteCoupon}
        />
      );
      case 'add': return <QuickCreatePage data={data} setData={setData} onSuccess={() => setActiveTab('wallet')} />;
      case 'sim': return <SimulationPage data={data} />;
      case 'settings': return <SettingsPage data={data} setData={setData} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden text-slate-800">
      {/* Main View Area */}
      <main className="flex-1 overflow-y-auto pb-24">
        {renderContent()}
      </main>

      {/* Persistent Navigation */}
      {viewState.page === 'main' && (
        <nav className="fixed bottom-0 left-0 right-0 glass-morphism border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 safe-bottom">
          <NavItem icon={<Wallet className="w-6 h-6" />} label="卡包" active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} />
          <NavItem icon={<Coffee className="w-6 h-6" />} label="寄杯" active={activeTab === 'items'} onClick={() => setActiveTab('items')} />
          <NavItem icon={<PlusCircle className="w-8 h-8 text-indigo-600" />} label="記帳" active={activeTab === 'add'} onClick={() => setActiveTab('add')} />
          <NavItem icon={<Calculator className="w-6 h-6" />} label="試算" active={activeTab === 'sim'} onClick={() => setActiveTab('sim')} />
          <NavItem icon={<Settings className="w-6 h-6" />} label="設定" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>
      )}
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center space-y-1 transition-all ${active ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}>
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
