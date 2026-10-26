export interface User {
  id: string;
  name: string;
  phone_number: string;
  created_at?: string;
  updated_at?: string;
}

export type ClubStatus = 'active' | 'completed';

export interface Club {
  id: string;
  title: string;
  description: string;
  created_by: string;
  status: ClubStatus;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export type MemberRole = 'admin' | 'collector' | 'viewer';

export interface Member {
  id: string; // user ID
  name: string;
  role: MemberRole;
}

export type PaymentMode = 'cash' | 'online';

export interface CollectionItem {
  id: string;
  club_id?: string;
  collector_id?: string;
  collector_name?: string;
  donor_name: string;
  phone_number?: string | null;
  amount: number | string;
  payment_mode?: PaymentMode;
  collected_at?: string;
}

export interface ExpenseItem {
  id: string;
  club_id?: string;
  added_by?: string;
  added_by_name?: string;
  product_name: string;
  quantity: string;
  amount: number | string;
  created_at?: string;
  updated_at?: string;
}

export interface CollectionTotalResponse {
  club_id: string;
  total_collections: string;
}

export interface ExpenseTotalResponse {
  club_id: string;
  total_expenses: string;
}

export interface CreateClubPayload {
  title: string;
  description?: string;
  status?: ClubStatus;
  start_date?: string;
  end_date?: string | null;
}

export interface CreateCollectionPayload {
  donor_name: string;
  phone_number?: string;
  amount: number;
  payment_mode: PaymentMode;
}

export interface CreateExpensePayload {
  product_name: string;
  quantity: string;
  amount: number;
}
