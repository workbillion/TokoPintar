import Dexie, { type Table } from 'dexie';
import { Product, Order, Customer, Expense, Reminder, AppNotification, StoreConfig, Debt } from '../types';

export class TokoPintarDB extends Dexie {
  products!: Table<Product>;
  orders!: Table<Order>;
  customers!: Table<Customer>;
  expenses!: Table<Expense>;
  reminders!: Table<Reminder>;
  notifications!: Table<AppNotification>;
  debts!: Table<Debt>;
  config!: Table<{ id: string; data: StoreConfig }>;
  images!: Table<{ id: string; data: string }>;

  constructor() {
    super('TokoPintarDB');
    this.version(2).stores({
      products: 'id, name, sku',
      orders: 'id, customerName, createdAt',
      customers: 'id, name, whatsapp',
      expenses: 'id, date',
      reminders: 'id, date',
      notifications: 'id, date',
      debts: 'id, customerName',
      config: 'id',
      images: 'id'
    });
  }
}

export const localDB = new TokoPintarDB();
