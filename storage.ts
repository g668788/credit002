
import { AppData, Tag } from './types';
import { DEFAULT_TAGS } from './constants';

const STORAGE_KEY = 'reward_king_data_v1';

const INITIAL_DATA: AppData = {
  cards: [
    {
      id: 'card-dbs',
      name: '星展ECO永續卡',
      validFrom: '2025-01-01',
      validUntil: '2026-06-15',
      billingDay: 15,
      plans: [
        { id: 'plan-dbs-lp', cardId: 'card-dbs', note: 'Line Pay 專屬回饋', percentage: 10, cap: 10000, minSpend: 0, tagIds: ['1'] }
      ]
    },
    {
      id: 'card-dawho',
      name: '永豐大戶卡',
      validFrom: '2025-01-01',
      validUntil: '2026-06-15',
      billingDay: 9,
      plans: [
        { id: 'plan-dawho-all', cardId: 'card-dawho', note: '大戶等級加碼(全部)', percentage: 3.5, cap: 16000, minSpend: 0, tagIds: ['1', '2', '3', '4', '5', '6', '7'] },
        { id: 'plan-dawho-easy', cardId: 'card-dawho', note: '悠遊卡自動加值', percentage: 3, cap: 3000, minSpend: 0, tagIds: ['4'] }
      ]
    },
    {
      id: 'card-sport',
      name: '永豐SPORT卡',
      validFrom: '2025-01-01',
      validUntil: '2026-06-15',
      billingDay: 9,
      plans: [
        { id: 'plan-sport-ap', cardId: 'card-sport', note: 'Apple Pay 運動加碼', percentage: 5, cap: 5000, minSpend: 0, tagIds: ['2'] }
      ]
    },
    {
      id: 'card-nko',
      name: '將將卡',
      validFrom: '2025-01-01',
      validUntil: '2026-06-15',
      billingDay: 1,
      plans: [
        { id: 'plan-nko-lp', cardId: 'card-nko', note: 'Line Pay 優惠 (需低消)', percentage: 5, cap: 6000, minSpend: 3000, tagIds: ['1'] }
      ]
    }
  ],
  records: [
    { id: 'rec-1', cardId: 'card-dbs', planId: 'plan-dbs-lp', date: '2026-01-07', amount: 500, note: 'Line Pay 消費' },
    { id: 'rec-2', cardId: 'card-dbs', planId: 'plan-dbs-lp', date: '2026-01-05', amount: 500, note: 'Line Pay 消費' },
    { id: 'rec-3', cardId: 'card-dbs', planId: 'plan-dbs-lp', date: '2025-09-10', amount: 200, note: 'Line Pay 消費' },
    { id: 'rec-4', cardId: 'card-dbs', planId: 'plan-dbs-lp', date: '2025-09-07', amount: 1500, note: 'Line Pay 消費' },
    { id: 'rec-5', cardId: 'card-dbs', planId: 'plan-dbs-lp', date: '2025-06-07', amount: 500, note: 'Line Pay 消費' }
  ],
  prepaidItems: [
    { 
      id: 'pp-1', 
      name: '全家咖啡', 
      expiryDate: '2026-07-30', 
      count: 15, 
      history: [{ date: '2025-01-01', change: 15 }] 
    },
    { 
      id: 'pp-2', 
      name: '萊爾富茶葉蛋', 
      expiryDate: '2026-12-30', 
      count: 60, 
      history: [{ date: '2025-01-01', change: 60 }] 
    }
  ],
  coupons: [
    {
      id: 'cp-1',
      shop: '7-11',
      expiryDate: '2099-12-31',
      amount: 50,
      isUsed: false
    },
    {
      id: 'cp-2',
      shop: '全家 冰淇淋兌換券',
      expiryDate: '2026-04-30',
      amount: 49,
      isUsed: false
    }
  ],
  tags: DEFAULT_TAGS,
};

export const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const loadData = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return INITIAL_DATA;
  }
  const parsed = JSON.parse(stored);
  // Ensure default structure
  parsed.cards.forEach((c: any) => {
    c.plans.forEach((p: any) => {
      if (!p.tagIds) p.tagIds = [];
      if (p.minSpend === undefined) p.minSpend = 0;
    });
  });
  return parsed;
};
