// 도메인 데이터 모델 타입 정의

export type UserRole = "OWNER" | "ADMIN" | "STAFF";
export type UserStatus = "PENDING" | "APPROVED" | "REJECTED";
export type OrderStatus = "NEW" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentLogStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
export type OrderItemStatus = "PENDING" | "ALLOCATED" | "SHIPPED" | "CANCELLED";
export type NoticeAudience = "ALL" | "FRANCHISEE" | "STAFF";
export type QualityItemStatus = "PASS" | "FAIL" | "N/A";
export type TrainingMediaType = "PDF" | "VIDEO" | "LINK" | "IMAGE";

export interface Franchise {
  id: string;
  code: string;
  name: string;
  contactName: string;
  contactPhone: string;
  address: string;
  region: string;
  createdAt: Date;
}

export interface Store {
  id: string;
  franchiseId: string;
  name: string;
  code: string;
  phone: string;
  address: string;
  region: string;
  openedAt: Date | null;
  closedAt: Date | null;
  isActive: boolean;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  franchiseId: string | null;
  storeId: string | null;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  categoryId: string;
  price: number;
  currency: string;
  stock: number;
  isActive: boolean;
  imageUrl: string | null;
  uom: string;
  weightGrams: number | null;
  taxRate: number;
  isShippable: boolean;
  leadTimeDays: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  franchiseId: string;
  storeId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  currency: string;
  vatAmount: number;
  discountAmount: number;
  shippingMethod: string;
  shippingAddress: string;
  deliveryDate: Date | null;
  placedAt: Date;
  processedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  status: OrderItemStatus;
  qtyAllocated: number;
  qtyShipped: number;
  qtyCancelled: number;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  authorId: string;
  audience: NoticeAudience;
  publishedAt: Date;
  isPinned: boolean;
}

export interface NoticeRead {
  noticeId: string;
  userId: string;
  readAt: Date;
}

export interface QualityChecklist {
  id: string;
  title: string;
  description: string;
  items: QualityItem[];
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QualityItem {
  id: string;
  checklistId: string;
  label: string;
  order: number;
}

export interface QualityRecord {
  id: string;
  checklistId: string;
  checklistVersion: number;
  franchiseId: string;
  storeId: string | null;
  date: Date;
  completedById: string;
  items: QualityRecordItem[];
  notes: string | null;
  createdAt: Date;
}

export interface QualityRecordItem {
  itemId: string;
  status: QualityItemStatus;
  comment: string | null;
}

export interface TrainingMaterial {
  id: string;
  title: string;
  description: string;
  category: string;
  mediaType: TrainingMediaType;
  mediaUrl: string;
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
}

export interface PaymentLog {
  id: string;
  orderId: string;
  provider: string;
  transactionId: string;
  amount: number;
  status: PaymentLogStatus;
  processedAt: Date | null;
}

// Supabase Database 타입 (생성된 테이블과 매핑)
export interface Database {
  public: {
    Tables: {
      franchises: {
        Row: Franchise;
        Insert: Omit<Franchise, "id" | "createdAt"> & { id?: string; createdAt?: Date };
        Update: Partial<Omit<Franchise, "id" | "createdAt">>;
      };
      stores: {
        Row: Store;
        Insert: Omit<Store, "id"> & { id?: string };
        Update: Partial<Omit<Store, "id">>;
      };
      users: {
        Row: User;
        Insert: Omit<User, "id" | "createdAt" | "lastLoginAt"> & { id?: string; createdAt?: Date; lastLoginAt?: Date | null };
        Update: Partial<Omit<User, "id" | "createdAt">>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, "id" | "createdAt" | "updatedAt"> & { id?: string; createdAt?: Date; updatedAt?: Date };
        Update: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, "id" | "createdAt" | "updatedAt"> & { id?: string; createdAt?: Date; updatedAt?: Date };
        Update: Partial<Omit<Order, "id" | "createdAt" | "updatedAt">>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, "id"> & { id?: string };
        Update: Partial<Omit<OrderItem, "id">>;
      };
      notices: {
        Row: Notice;
        Insert: Omit<Notice, "id" | "publishedAt"> & { id?: string; publishedAt?: Date };
        Update: Partial<Omit<Notice, "id" | "publishedAt">>;
      };
      notice_reads: {
        Row: NoticeRead;
        Insert: Omit<NoticeRead, "readAt"> & { readAt?: Date };
        Update: Partial<NoticeRead>;
      };
      quality_checklists: {
        Row: QualityChecklist;
        Insert: Omit<QualityChecklist, "id" | "createdAt" | "updatedAt"> & { id?: string; createdAt?: Date; updatedAt?: Date };
        Update: Partial<Omit<QualityChecklist, "id" | "createdAt" | "updatedAt">>;
      };
      quality_items: {
        Row: QualityItem;
        Insert: Omit<QualityItem, "id"> & { id?: string };
        Update: Partial<Omit<QualityItem, "id">>;
      };
      quality_records: {
        Row: QualityRecord;
        Insert: Omit<QualityRecord, "id" | "createdAt"> & { id?: string; createdAt?: Date };
        Update: Partial<Omit<QualityRecord, "id" | "createdAt">>;
      };
      training_materials: {
        Row: TrainingMaterial;
        Insert: Omit<TrainingMaterial, "id" | "createdAt" | "updatedAt"> & { id?: string; createdAt?: Date; updatedAt?: Date };
        Update: Partial<Omit<TrainingMaterial, "id" | "createdAt" | "updatedAt">>;
      };
      payment_logs: {
        Row: PaymentLog;
        Insert: Omit<PaymentLog, "id" | "processedAt"> & { id?: string; processedAt?: Date | null };
        Update: Partial<Omit<PaymentLog, "id" | "processedAt">>;
      };
    };
  };
}

