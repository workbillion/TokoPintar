export type StoreType = 'Fashion' | 'Kosmetik' | 'Makanan' | 'Aksesoris' | 'Elektronik' | 'Lain-lain';

export type UserRole = 'admin' | 'kasir';

export interface StoreConfig {
  name: string;
  owner: string;
  whatsapp: string;
  type: StoreType;
  address: string;
  bankAccount: string;
  logo?: string;
  onboarded: boolean;
  categories: string[];
  cashierPin?: string;
  miniStoreGreeting?: string;
  shareMessage?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  weight: number;
  description: string;
  image?: string; // Base64 or IDB key
  variants: ProductVariant[];
  badge?: 'Best Seller' | 'New Arrival' | 'Ready' | 'Indent' | 'Habis';
  minStock: number;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g., "S", "M", "L" or "Merah", "Biru"
  stock: number;
}

export type OrderStatus = 'Baru Masuk' | 'Dikonfirmasi' | 'Diproses' | 'Dikirim' | 'Selesai' | 'Dibatalkan';

export interface Order {
  id: string;
  customerName: string;
  customerWhatsapp: string;
  items: OrderItem[];
  totalAmount: number;
  discountAmount: number;
  shippingCost: number;
  paymentMethod: 'COD' | 'Transfer' | 'QRIS' | 'Tempo/Hutang';
  expedition: 'JNE' | 'J&T' | 'SiCepat' | 'Anteraja' | 'GoSend' | 'Ambil Sendiri';
  receiptNumber?: string;
  status: OrderStatus;
  notes: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  quantity: number;
  price: number;
  originalPrice: number;
}

export interface Debt {
  id: string;
  customerId: string;
  customerName: string;
  orderId?: string;
  amount: number;
  remainingAmount: number;
  description: string;
  date: string;
  dueDate: string;
  isInstallment: boolean;
  payments: DebtPayment[];
}

export interface DebtPayment {
  id: string;
  amount: number;
  date: string;
}

export interface Customer {
  id: string;
  name: string;
  whatsapp: string;
  address: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate?: string;
  notes: string;
  isVip: boolean;
  vipDiscountValue?: number;
  vipDiscountType?: 'percent' | 'nominal';
}

export interface Reminder {
  id: string;
  title: string;
  date: string;
  time: string;
  category: 'Restock' | 'Tagihan' | 'Konten' | 'Pengiriman' | 'Hutang' | 'Laporan' | 'Lain-lain';
  repeat: 'Sekali' | 'Harian' | 'Mingguan' | 'Bulanan';
  notes: string;
  completed: boolean;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  date: string;
  read: boolean;
}
