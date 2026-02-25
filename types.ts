
export interface Tag {
  id: string;
  name: string;
}

export interface RewardPlan {
  id: string;
  cardId: string;
  note?: string; // Optional remark
  percentage: number;
  cap: number; // 0 for unlimited
  minSpend: number; // 0 for none
  tagIds: string[];
}

export interface CreditCard {
  id: string;
  name: string;
  validFrom: string; // ISO Date
  validUntil: string; // ISO Date
  billingDay: number; // 1-31
  plans: RewardPlan[];
}

export interface SpendingRecord {
  id: string;
  cardId: string;
  planId: string;
  date: string;
  amount: number;
  note: string;
}

export interface PrepaidItem {
  id: string;
  name: string;
  expiryDate: string;
  count: number;
  history: { date: string; change: number }[];
}

export interface Coupon {
  id: string;
  shop: string;
  expiryDate: string;
  amount: number;
  barcodeUrl?: string;
  imageUrl?: string;
  linkUrl?: string;
  isUsed: boolean;
}

export interface AppData {
  cards: CreditCard[];
  records: SpendingRecord[];
  prepaidItems: PrepaidItem[];
  coupons: Coupon[];
  tags: Tag[];
}
