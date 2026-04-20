import { StoreConfig, Product, Order, Debt, Customer, Reminder, Expense, AppNotification } from '../types';
import { localDB } from './db';

export const ImageStorage = {
  async save(userId: string, id: string, base64: string) {
    await localDB.images.put({ id, data: base64 });
  },
  async get(userId: string, id: string): Promise<string | undefined> {
    const img = await localDB.images.get(id);
    return img ? img.data : undefined;
  },
  async delete(userId: string, id: string) {
    await localDB.images.delete(id);
  }
};

export const Storage = {
  // --- SYNC LOGIC (NO-OP) ---
  async syncFromCloud(userId: string) {
    return true;
  },

  // --- CONFIG ---
  async getConfig(userId: string): Promise<StoreConfig | null> {
    const local = await localDB.config.get('main');
    return local ? local.data : null;
  },

  async saveConfig(userId: string, config: StoreConfig) {
    await localDB.config.put({ id: 'main', data: config });
  },

  // --- PRODUCTS ---
  async getProducts(userId: string): Promise<Product[]> {
    return await localDB.products.toArray();
  },

  async saveProducts(userId: string, products: Product[]) {
    await localDB.products.clear();
    await localDB.products.bulkPut(products);
    
    // Also backup images to the images table for fast lookup by ID
    for (const p of products) {
      if (p.image && p.image.startsWith('data:image')) {
        await ImageStorage.save(userId, p.id, p.image);
      }
    }
  },

  // --- ORDERS ---
  async getOrders(userId: string): Promise<Order[]> {
    return await localDB.orders.orderBy('createdAt').reverse().toArray();
  },

  async saveOrders(userId: string, orders: Order[]) {
    await localDB.orders.clear();
    await localDB.orders.bulkPut(orders);
  },

  // --- DEBTS ---
  async getDebts(userId: string): Promise<Debt[]> {
    return await localDB.debts.toArray();
  },

  async saveDebts(userId: string, debts: Debt[]) {
    await localDB.debts.clear();
    await localDB.debts.bulkPut(debts);
  },

  // --- CUSTOMERS ---
  async getCustomers(userId: string): Promise<Customer[]> {
    return await localDB.customers.toArray();
  },

  async saveCustomers(userId: string, customers: Customer[]) {
    await localDB.customers.clear();
    await localDB.customers.bulkPut(customers);
  },

  // --- REMINDERS ---
  async getReminders(userId: string): Promise<Reminder[]> {
    return await localDB.reminders.toArray();
  },

  async saveReminders(userId: string, reminders: Reminder[]) {
    await localDB.reminders.clear();
    await localDB.reminders.bulkPut(reminders);
  },

  // --- EXPENSES ---
  async getExpenses(userId: string): Promise<Expense[]> {
    return await localDB.expenses.orderBy('date').reverse().toArray();
  },

  async saveExpenses(userId: string, expenses: Expense[]) {
    await localDB.expenses.clear();
    await localDB.expenses.bulkPut(expenses);
  },

  // --- NOTIFICATIONS ---
  async getNotifications(userId: string): Promise<AppNotification[]> {
    return await localDB.notifications.toArray();
  },

  async saveNotifications(userId: string, notifications: AppNotification[]) {
    await localDB.notifications.clear();
    await localDB.notifications.bulkPut(notifications);
  },

  // --- OTHER METHODS ---
  async findStoreByName(name: string): Promise<string | null> {
    const config = await this.getConfig('local-user');
    if (config && config.name?.toLowerCase().replace(/\s+/g, '') === name.toLowerCase().replace(/\s+/g, '')) {
      return 'local-user';
    }
    return null;
  },

  async exportData(userId: string) {
    const data = {
      config: await this.getConfig(userId),
      products: await this.getProducts(userId),
      orders: await this.getOrders(userId),
      debts: await this.getDebts(userId),
      customers: await this.getCustomers(userId),
      reminders: await this.getReminders(userId),
      expenses: await this.getExpenses(userId)
    };
    return JSON.stringify(data);
  },
  
  async importData(userId: string, json: string) {
    try {
      const data = JSON.parse(json);
      if (data.config) await this.saveConfig(userId, data.config);
      if (data.products) await this.saveProducts(userId, data.products);
      if (data.orders) await this.saveOrders(userId, data.orders);
      if (data.debts) await this.saveDebts(userId, data.debts);
      if (data.customers) await this.saveCustomers(userId, data.customers);
      if (data.reminders) await this.saveReminders(userId, data.reminders);
      if (data.expenses) await this.saveExpenses(userId, data.expenses);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },

  async clearAll(userId: string) {
    try {
      await localDB.products.clear();
      await localDB.orders.clear();
      await localDB.debts.clear();
      await localDB.customers.clear();
      await localDB.reminders.clear();
      await localDB.expenses.clear();
      await localDB.notifications.clear();
      await localDB.config.clear();
      return true;
    } catch (e) {
      console.error('Clear failed', e);
      return false;
    }
  }
};
