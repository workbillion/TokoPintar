/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, CreditCard, Lock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StoreConfig, Product, Order, Debt, Customer, Reminder, Expense, OrderStatus, AppNotification, UserRole } from './types';
import { Storage } from './services/storage';
import Navigation from './components/Navigation';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import Catalog from './components/Catalog';
import Customers from './components/Customers';
import Debts from './components/Debts';
import More from './components/More';
import MiniStore from './components/MiniStore';
import POS from './components/POS';
import NotificationCenter from './components/NotificationCenter';
import QuickActionMenu from './components/QuickActionMenu';
import Toast, { ToastType } from './components/Toast';
import Auth from './components/Auth';
import { auth, db, isFirebaseConfigured } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { FirebaseService } from './services/firebaseService';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [moreSubView, setMoreSubView] = useState<'menu' | 'debts' | 'reports' | 'reminders' | 'settings' | 'customers'>('menu');
  const [autoOpenCustomerModal, setAutoOpenCustomerModal] = useState(false);
  const [isMiniStore, setIsMiniStore] = useState(false);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isPOSOpen, setIsPOSOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [cloudUser, setCloudUser] = useState<any>(null);
  const [miniStoreName, setMiniStoreName] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [storeCode, setStoreCode] = useState<string | null>(null);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, isVisible: true });
  };

  useEffect(() => {
    if (isFirebaseConfigured) {
      FirebaseService.testConnection();
    }

    const params = new URLSearchParams(window.location.search);
    const publicStoreId = params.get('store');

    if (publicStoreId && isFirebaseConfigured) {
      const loadPublicStore = async () => {
        setIsLoaded(false);
        const data = await FirebaseService.pullPublicStore(publicStoreId);
        if (data) {
          setProducts(data.products || []);
          setConfig(data.config as StoreConfig);
          setMiniStoreName(data.config?.name || 'TokoPintar');
          setActiveStoreId(publicStoreId);
          setIsMiniStore(true);
        }
        setIsLoaded(true);
      };
      loadPublicStore();
      return;
    }

    if (!isFirebaseConfigured || !auth) {
      setCloudUser(null);
      setActiveStoreId('local-user');
      setUserRole('admin');
      setStoreCode(null);
      setOnboardingStep(1);
      setIsLoaded(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCloudUser(user);
        
        // Fetch profile for role and onboarding status
        try {
          const profileDoc = await getDoc(doc(db, 'users', user.uid, 'config', 'main'));
          if (profileDoc.exists()) {
            const profile = profileDoc.data();
            const role = profile.role as UserRole || 'admin';
            const sCode = profile.store_code || null;
            
            setUserRole(role);
            setStoreCode(sCode);
            
            const targetStoreId = (role === 'kasir' && sCode) ? sCode : user.uid;
            setActiveStoreId(targetStoreId);
            
            // Ensure we pull data immediately and wait for it
            try {
              const cloudData = await FirebaseService.pullFromCloud(targetStoreId);
              if (cloudData && cloudData.products && cloudData.products.length > 0) {
                if (cloudData.config) setConfig(cloudData.config as StoreConfig);
                setProducts(cloudData.products as Product[]);
                if (cloudData.orders) setOrders(cloudData.orders as Order[]);
                if (cloudData.customers) setCustomers(cloudData.customers as Customer[]);
                if (cloudData.expenses) setExpenses(cloudData.expenses as Expense[]);
                if (cloudData.reminders) setReminders(cloudData.reminders as Reminder[]);
                if (cloudData.notifications) setNotifications(cloudData.notifications as AppNotification[]);
                if (cloudData.debts) setDebts(cloudData.debts as Debt[]);
                
                // Save EVERYTHING to local storage for persistence on refresh
                await Promise.all([
                  Storage.saveConfig(targetStoreId, cloudData.config as StoreConfig),
                  Storage.saveProducts(targetStoreId, cloudData.products as Product[]),
                  Storage.saveOrders(targetStoreId, (cloudData.orders || []) as Order[]),
                  Storage.saveCustomers(targetStoreId, (cloudData.customers || []) as Customer[]),
                  Storage.saveExpenses(targetStoreId, (cloudData.expenses || []) as Expense[]),
                  Storage.saveReminders(targetStoreId, (cloudData.reminders || []) as Reminder[]),
                  Storage.saveNotifications(targetStoreId, (cloudData.notifications || []) as AppNotification[]),
                  Storage.saveDebts(targetStoreId, (cloudData.debts || []) as Debt[])
                ]);
              } else if (role === 'kasir') {
                showToast('Gagal mengambil data toko. Pastikan Kode Toko benar.', 'error');
              }
            } catch (pullErr) {
              console.error('Initial pull failed', pullErr);
            }
            
            if (profile.onboarded) {
              setOnboardingStep(0);
            } else {
              setOnboardingStep(3);
            }
          } else {
            // New user, no profile yet
            setActiveStoreId(user.uid);
            setOnboardingStep(3);
          }
        } catch (e) {
          setActiveStoreId(user.uid);
          setOnboardingStep(3);
        } finally {
          setIsLoaded(true);
        }
      } else {
        setCloudUser(null);
        setActiveStoreId('local-user');
        setUserRole('admin');
        setStoreCode(null);
        setOnboardingStep(1);
        setIsLoaded(true);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!activeStoreId) return;

    const loadData = async () => {
      try {
        const localConfig = await Storage.getConfig(activeStoreId);
        if (localConfig) {
          setConfig(localConfig);
          
          const [p, o, d, c, r, e, n] = await Promise.all([
            Storage.getProducts(activeStoreId),
            Storage.getOrders(activeStoreId),
            Storage.getDebts(activeStoreId),
            Storage.getCustomers(activeStoreId),
            Storage.getReminders(activeStoreId),
            Storage.getExpenses(activeStoreId),
            Storage.getNotifications(activeStoreId)
          ]);
          setProducts(p);
          setOrders(o);
          setDebts(d);
          setCustomers(c);
          setReminders(r);
          setExpenses(e);
          setNotifications(n);
        }
        
        // Only set isLoaded here if we are not in a cloud sync process
        // or if it's a local user
        if (activeStoreId === 'local-user' || !cloudUser) {
          setIsLoaded(true);
        }
      } catch (e) {
        console.error('Local load failed', e);
        if (activeStoreId === 'local-user' || !cloudUser) {
          setIsLoaded(true);
        }
      }
    };

    loadData();
  }, [activeStoreId]);

  // Handle Notifications Logic
  useEffect(() => {
    if (!isLoaded) return;

    const checkNotifications = async () => {
      if (!activeStoreId) return;
      const newNotifs: AppNotification[] = [];
      const currentNotifs = await Storage.getNotifications(activeStoreId);

      // Check Low Stock
      products.forEach(p => {
        if (p.stock <= p.minStock) {
          const exists = currentNotifs.some(n => n.title === 'Stok Menipis!' && n.message.includes(p.name) && !n.read);
          if (!exists) {
            newNotifs.push({
              id: `stock-${p.id}-${Date.now()}`,
              title: 'Stok Menipis!',
              message: `Produk "${p.name}" sisa ${p.stock} pcs. Segera restock ya!`,
              type: 'warning',
              date: new Date().toISOString(),
              read: false
            });
          }
        }
      });

      // Check Reminders
      const today = new Date().toISOString().split('T')[0];
      reminders.forEach(r => {
        if (r.date === today && !r.completed) {
          const exists = currentNotifs.some(n => n.title === 'Pengingat Hari Ini' && n.message.includes(r.title) && !n.read);
          if (!exists) {
            newNotifs.push({
              id: `rem-${r.id}-${Date.now()}`,
              title: 'Pengingat Hari Ini',
              message: `${r.title} dijadwalkan pukul ${r.time}`,
              type: 'info',
              date: new Date().toISOString(),
              read: false
            });
          }
        }
      });

      if (newNotifs.length > 0 && activeStoreId) {
        const updated = [...newNotifs, ...currentNotifs].slice(0, 50);
        setNotifications(updated);
        await Storage.saveNotifications(activeStoreId, updated);
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 1000 * 60 * 30); // Check every 30 mins
    return () => clearInterval(interval);
  }, [isLoaded, products, reminders]);

  const handleAddProduct = async (product: Product) => {
    if (!activeStoreId) return;
    const newProducts = [product, ...products];
    setProducts(newProducts);
    await Storage.saveProducts(activeStoreId, newProducts);
    showToast('Produk berhasil ditambahkan', 'success');
    if (cloudUser) handleSync({ products: newProducts });
  };

  const handleUpdateProduct = async (product: Product) => {
    if (!activeStoreId) return;
    const newProducts = products.map(p => p.id === product.id ? product : p);
    setProducts(newProducts);
    await Storage.saveProducts(activeStoreId, newProducts);
    showToast('Produk berhasil diperbarui', 'success');
    if (cloudUser) handleSync({ products: newProducts });
  };

  const handleDeleteProduct = async (id: string) => {
    if (!activeStoreId) return;
    const newProducts = products.filter(p => p.id !== id);
    setProducts(newProducts);
    await Storage.saveProducts(activeStoreId, newProducts);
    showToast('Produk berhasil dihapus', 'success');
    if (cloudUser) handleSync({ products: newProducts, deleted: { path: 'products', id } });
  };

  const handleAddOrder = async (order: Order) => {
    if (!activeStoreId) return;
    
    // Update product stock
    const updatedProducts = products.map(p => {
      const orderItem = order.items.find(item => item.productId === p.id);
      if (orderItem) {
        return { ...p, stock: p.stock - orderItem.quantity };
      }
      return p;
    });
    
    setProducts(updatedProducts);
    await Storage.saveProducts(activeStoreId, updatedProducts);

    const newOrders = [order, ...orders];
    setOrders(newOrders);
    await Storage.saveOrders(activeStoreId, newOrders);
    
    // Auto-collect customer
    const existingCustomer = customers.find(c => c.whatsapp === order.customerWhatsapp);
    if (existingCustomer) {
      const updatedCustomers = customers.map(c => 
        c.id === existingCustomer.id 
          ? { ...c, totalSpent: c.totalSpent + order.totalAmount, orderCount: c.orderCount + 1, lastOrderDate: order.createdAt }
          : c
      );
      setCustomers(updatedCustomers);
      await Storage.saveCustomers(activeStoreId, updatedCustomers);
    } else {
      const newCustomer: Customer = {
        id: crypto.randomUUID().split('-')[0],
        name: order.customerName,
        whatsapp: order.customerWhatsapp,
        address: order.notes,
        totalSpent: order.totalAmount,
        orderCount: 1,
        lastOrderDate: order.createdAt,
        notes: '',
        isVip: false
      };
      const newCustomers = [newCustomer, ...customers];
      setCustomers(newCustomers);
      await Storage.saveCustomers(activeStoreId, newCustomers);
    }
    showToast('Pesanan berhasil dicatat', 'success');
    if (cloudUser) handleSync({ 
      products: updatedProducts, 
      orders: newOrders,
      customers: customers // customers might have changed above, let's just send the whole state
    });
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus, receipt?: string) => {
    if (!activeStoreId) return;
    const updatedOrders = orders.map(o => 
      o.id === orderId ? { ...o, status, receiptNumber: receipt || o.receiptNumber } : o
    );
    setOrders(updatedOrders);
    await Storage.saveOrders(activeStoreId, updatedOrders);
    showToast(`Status pesanan diperbarui: ${status}`, 'info');
  };

  const handleUpdateConfig = async (newConfig: StoreConfig) => {
    if (!activeStoreId) return;
    setConfig(newConfig);
    await Storage.saveConfig(activeStoreId, newConfig);
    showToast('Pengaturan disimpan', 'success');
  };

  const handleAddExpense = async (expense: Expense) => {
    if (!activeStoreId) return;
    const newExpenses = [expense, ...expenses];
    setExpenses(newExpenses);
    await Storage.saveExpenses(activeStoreId, newExpenses);
    showToast('Pengeluaran dicatat', 'success');
    if (cloudUser) handleSync({ expenses: newExpenses });
  };

  const handleAddReminder = async (reminder: Reminder) => {
    if (!activeStoreId) return;
    const newReminders = [reminder, ...reminders];
    setReminders(newReminders);
    await Storage.saveReminders(activeStoreId, newReminders);
    showToast('Pengingat ditambahkan', 'success');
    if (cloudUser) handleSync({ reminders: newReminders });
  };

  const handleToggleReminder = async (id: string) => {
    if (!activeStoreId) return;
    const updated = reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r);
    setReminders(updated);
    await Storage.saveReminders(activeStoreId, updated);
  };

  const handleMarkNotificationRead = async (id: string) => {
    if (!activeStoreId) return;
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    await Storage.saveNotifications(activeStoreId, updated);
  };

  const handleClearNotifications = async () => {
    if (!activeStoreId) return;
    setNotifications([]);
    await Storage.saveNotifications(activeStoreId, []);
  };

  const handleAddCustomer = async (customer: Customer) => {
    if (!activeStoreId) return;
    const newCustomers = [customer, ...customers];
    setCustomers(newCustomers);
    await Storage.saveCustomers(activeStoreId, newCustomers);
    showToast('Pelanggan ditambahkan', 'success');
  };

  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    if (!activeStoreId) return;
    const newCustomers = customers.map(c => 
      c.id === updatedCustomer.id ? updatedCustomer : c
    );
    setCustomers(newCustomers);
    await Storage.saveCustomers(activeStoreId, newCustomers);
    showToast('Data pelanggan diperbarui', 'success');
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!activeStoreId) return;
    const newCustomers = customers.filter(c => c.id !== id);
    setCustomers(newCustomers);
    await Storage.saveCustomers(activeStoreId, newCustomers);
    showToast('Pelanggan dihapus', 'success');
    if (cloudUser) handleSync({ customers: newCustomers, deleted: { path: 'customers', id } });
  };

  const handleAddDebt = async (debt: Debt) => {
    if (!activeStoreId) return;
    const newDebts = [debt, ...debts];
    setDebts(newDebts);
    await Storage.saveDebts(activeStoreId, newDebts);
    showToast('Hutang dicatat', 'success');
    if (cloudUser) handleSync({ debts: newDebts });
  };

  const handleUpdateDebt = async (updatedDebt: Debt) => {
    if (!activeStoreId) return;
    const newDebts = debts.map(d => d.id === updatedDebt.id ? updatedDebt : d);
    setDebts(newDebts);
    await Storage.saveDebts(activeStoreId, newDebts);
    if (updatedDebt.remainingAmount <= 0) {
      showToast('Hutang telah lunas! 🎉', 'success');
    } else {
      showToast('Pembayaran hutang dicatat', 'success');
    }
    if (cloudUser) handleSync({ debts: newDebts });
  };

  const handleDeleteDebt = async (id: string) => {
    if (!activeStoreId) return;
    const newDebts = debts.filter(d => d.id !== id);
    setDebts(newDebts);
    await Storage.saveDebts(activeStoreId, newDebts);
    showToast('Catatan hutang dihapus', 'info');
    if (cloudUser) handleSync({ debts: newDebts, deleted: { path: 'debts', id } });
  };

  const handleOnboardingComplete = async (newConfig: StoreConfig) => {
    if (!activeStoreId) return;
    setConfig(newConfig);
    await Storage.saveConfig(activeStoreId, newConfig);
    showToast('Profil toko berhasil dibuat! 🎉', 'success');
  };

  const handleClearAllData = async () => {
    if (!activeStoreId) return;
    showToast('Menghapus semua data...', 'info');
    if (cloudUser) {
      await FirebaseService.clearCloud(activeStoreId);
    }
    await Storage.clearAll(activeStoreId);
    showToast('Data berhasil dihapus! Memuat ulang...', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handleLogout = async () => {
    try {
      showToast('Sedang keluar...', 'info');
      
      // Sync one last time before logout if cloud user
      if (cloudUser && activeStoreId) {
        try {
          await FirebaseService.syncToCloud(storeCode || cloudUser.uid, {
            products,
            orders,
            customers,
            expenses,
            reminders,
            notifications,
            debts,
            config
          });
        } catch (syncError) {
          // Final sync failed, proceeding with logout
        }
      }

      await signOut(auth);
      
      // Clear local state first
      setCloudUser(null);
      setActiveStoreId('local-user');
      setUserRole('admin');
      setStoreCode(null);
      setConfig(null);
      setProducts([]);
      setOrders([]);
      setCustomers([]);
      setExpenses([]);
      setReminders([]);
      setNotifications([]);
      setDebts([]);
      
      showToast('Berhasil keluar!', 'success');
      setTimeout(() => {
        window.location.href = window.location.origin + window.location.pathname;
      }, 1000);
    } catch (error) {
      showToast('Gagal keluar dengan bersih, memuat ulang...', 'error');
      setTimeout(() => window.location.reload(), 2000);
    }
  };

  const handleSync = async (overrides: any = {}) => {
    if (!cloudUser || !activeStoreId) return;
    
    // Use storeCode if available (for kasir), otherwise use own ID (for admin)
    const targetId = storeCode || cloudUser.uid;

    showToast('Sedang mencadangkan data...', 'info');
    const success = await FirebaseService.syncToCloud(targetId, {
      products: overrides.products || products,
      orders: overrides.orders || orders,
      customers: overrides.customers || customers,
      expenses: overrides.expenses || expenses,
      reminders: overrides.reminders || reminders,
      notifications: overrides.notifications || notifications,
      debts: overrides.debts || debts,
      config: overrides.config || config
    });

    if (success) {
      showToast('Data berhasil dicadangkan ke Cloud!', 'success');
    } else {
      showToast('Gagal mencadangkan data. Cek koneksi Anda.', 'error');
    }
  };

  const handlePullData = async (targetId?: string, isAuto = false) => {
    const idToPull = targetId || storeCode || cloudUser?.uid;
    if (!idToPull || !activeStoreId) return;

    if (!isAuto) showToast('Mengambil data dari Cloud...', 'info');
    const cloudData = await FirebaseService.pullFromCloud(idToPull);
    
    if (cloudData && cloudData.config) {
      // Update local storage
      await Promise.all([
        Storage.saveConfig(activeStoreId, cloudData.config as StoreConfig),
        Storage.saveProducts(activeStoreId, cloudData.products as any[]),
        Storage.saveOrders(activeStoreId, cloudData.orders as any[]),
        Storage.saveCustomers(activeStoreId, cloudData.customers as any[]),
        Storage.saveExpenses(activeStoreId, cloudData.expenses as any[]),
        Storage.saveReminders(activeStoreId, cloudData.reminders as any[]),
        Storage.saveNotifications(activeStoreId, cloudData.notifications as any[]),
        Storage.saveDebts(activeStoreId, cloudData.debts as any[])
      ]);
      
      if (isAuto) {
        // Update state directly for smooth transition
        setConfig(cloudData.config as StoreConfig);
        setProducts(cloudData.products as Product[]);
        setOrders(cloudData.orders as Order[]);
        setCustomers(cloudData.customers as Customer[]);
        setExpenses(cloudData.expenses as Expense[]);
        setReminders(cloudData.reminders as Reminder[]);
        setNotifications(cloudData.notifications as AppNotification[]);
        setDebts(cloudData.debts as Debt[]);
      } else {
        // Reload page to apply all changes for manual pull
        showToast('Data berhasil dipulihkan! Memuat ulang...', 'success');
        setTimeout(() => window.location.reload(), 1500);
      }
    } else if (!isAuto) {
      showToast('Tidak ada data di Cloud untuk dipulihkan.', 'info');
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ 
            scale: [0.7, 0.8, 0.7],
            opacity: 1 
          }}
          transition={{ 
            scale: {
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut"
            },
            opacity: { duration: 0.5 }
          }}
          className="w-32 h-32 mb-8 flex items-center justify-center"
        >
          <img 
            src="/logo.svg" 
            alt="Logo Loading" 
            className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(156,175,136,0.3)]"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        <div className="space-y-3">
          <p className="text-[10px] text-primary font-bold uppercase tracking-[0.3em] animate-pulse">Menyiapkan Toko Anda</p>
          <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mx-auto">
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="w-full h-full bg-primary"
            />
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    // MiniStore check must come first and be robust
    if (isMiniStore && config) {
      return <MiniStore userId={activeStoreId || ''} storeName={miniStoreName} products={products} config={config} />;
    }

    if (isMiniStore && !config && isLoaded) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-danger/10 text-danger rounded-2xl flex items-center justify-center mb-4">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-lg font-bold text-secondary mb-2">Toko Tidak Ditemukan</h1>
          <p className="text-xs text-gray-500 mb-8">Maaf, link katalog ini mungkin sudah tidak berlaku atau salah.</p>
          <button onClick={() => window.location.href = window.location.origin} className="btn-primary px-8">Ke Halaman Utama</button>
        </div>
      );
    }

    // If Kasir, force PIN verification first
    if (userRole === 'kasir' && config?.onboarded && !isPinVerified) {
      return (
        <div className="max-w-md mx-auto min-h-screen bg-background p-6 flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-secondary text-white rounded-[24px] flex items-center justify-center mb-6 shadow-strong">
            <Lock size={32} />
          </div>
          <h1 className="text-xl font-serif font-bold text-secondary mb-2">Verifikasi PIN Kasir</h1>
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-8">Masukkan PIN dari Administrator</p>
          
          <div className="w-full space-y-4">
            <input 
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••"
              className="input-field text-center text-2xl tracking-[1em] py-5"
              value={pinInput}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setPinInput(val);
                if (val === config.cashierPin || (val === '1234' && !config.cashierPin)) {
                  setIsPinVerified(true);
                  setIsPOSOpen(true); // Open POS immediately
                  showToast('PIN Berhasil diverifikasi!', 'success');
                }
              }}
            />
            <p className="text-[9px] text-gray-400 text-center italic">
              {config.cashierPin ? 'PIN sudah diatur oleh Admin.' : 'Gunakan PIN default: 1234'}
            </p>
          </div>

          <button 
            onClick={handleLogout}
            className="mt-12 text-danger font-bold text-xs uppercase tracking-widest"
          >
            Keluar Akun
          </button>
        </div>
      );
    }

    // If Kasir, use Admin's UID as activeStoreId
    if (userRole === 'kasir' && config?.onboarded) {
      // If PIN is verified, we can either show the "Mode Kasir" screen or go straight to POS
      // The user wants it to be "connected" to POS, so let's make sure it's ready.
      return (
        <div className="max-w-md mx-auto min-h-screen bg-background p-6 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-primary/10 text-primary rounded-[32px] flex items-center justify-center mb-6 shadow-soft">
            <CreditCard size={48} />
          </div>
          <h1 className="text-2xl font-serif font-bold text-secondary mb-2">Mode Kasir Aktif</h1>
          <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-8">
            {products.length > 0 ? 'Katalog produk berhasil dimuat.' : 'Sedang memuat katalog produk...'}
          </p>
          
          <button 
            onClick={() => setIsPOSOpen(true)}
            disabled={products.length === 0}
            className="btn-primary w-full py-4 gap-3 text-sm disabled:opacity-50"
          >
            <CreditCard size={20} /> {products.length > 0 ? 'Buka Kasir POS' : 'Menyiapkan POS...'}
          </button>

          <button 
            onClick={handleLogout}
            className="mt-8 text-danger font-bold text-xs uppercase tracking-widest"
          >
            Keluar Akun
          </button>
        </div>
      );
    }

    if (!config || !config.onboarded) {
      if (userRole === 'kasir' && cloudUser) {
        return (
          <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-8 text-center">
            <motion.div
              animate={{ 
                scale: [0.7, 0.8, 0.7],
              }}
              transition={{ 
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut"
              }}
              className="w-32 h-32 mb-8 flex items-center justify-center"
            >
              <img 
                src="/logo.svg" 
                alt="Logo Loading" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <p className="text-[10px] text-primary font-bold uppercase tracking-[0.3em] animate-pulse mb-8">Menghubungkan ke Toko...</p>
            <div className="space-y-4 w-full max-w-xs">
              <p className="text-[10px] text-gray-500 italic">Sekejap lagi... Kami sedang menyiapkan dashboard kasir Anda.</p>
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] text-gray-400 font-bold uppercase tracking-widest"
              >
                Muat Ulang Halaman
              </button>
              <button 
                onClick={handleLogout}
                className="w-full py-3 text-danger/70 text-[10px] font-bold uppercase tracking-widest"
              >
                Keluar & Coba Akun Lain
              </button>
            </div>
          </div>
        );
      }
      return (
        <div key={onboardingStep} className="w-full h-full">
          <Onboarding 
            initialStep={onboardingStep}
            onComplete={handleOnboardingComplete} 
            onOpenAuth={() => setIsAuthModalOpen(true)} 
          />
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto min-h-screen bg-background pb-24 px-4 pt-6">
        <main>
          {activeTab === 'home' && (
            <Dashboard 
              config={config} 
              orders={orders} 
              products={products} 
              debts={debts} 
              notifications={notifications}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              onAction={(action) => {
                if (action === 'new_order') setActiveTab('orders');
                if (action === 'new_product') setActiveTab('catalog');
                if (action === 'view_debts') setActiveTab('debts');
                if (action === 'share_catalog') setActiveTab('catalog');
                if (action === 'view_reports') {
                  setActiveTab('more');
                  setMoreSubView('reports');
                }
                if (action === 'view_orders') setActiveTab('orders');
                if (action === 'open_pos') setIsPOSOpen(true);
              }}
              userRole={userRole}
            />
          )}
          {activeTab === 'orders' && (
            <Orders 
              orders={orders} 
              products={products} 
              customers={customers}
              onAddOrder={handleAddOrder} 
              onUpdateStatus={handleUpdateOrderStatus}
              storeName={config.name}
              onOpenPOS={() => setIsPOSOpen(true)}
            />
          )}
          {activeTab === 'catalog' && (
            <Catalog 
              userId={activeStoreId || ''}
              products={products} 
              config={config}
              onAddProduct={handleAddProduct} 
              onUpdateProduct={handleUpdateProduct} 
              onDeleteProduct={handleDeleteProduct}
              showToast={showToast}
            />
          )}
          {activeTab === 'customers' && (
            <Customers 
              customers={customers}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              autoOpenModal={autoOpenCustomerModal}
            />
          )}
          {activeTab === 'debts' && (
            <Debts 
              debts={debts}
              customers={customers}
              onAddDebt={handleAddDebt}
              onUpdateDebt={handleUpdateDebt}
              onDeleteDebt={handleDeleteDebt}
            />
          )}
          {activeTab === 'more' && (
            <More 
              userId={activeStoreId || ''}
              config={config}
              debts={debts}
              reminders={reminders}
              expenses={expenses}
              orders={orders}
              products={products}
              customers={customers}
              onUpdateConfig={handleUpdateConfig}
              onAddExpense={handleAddExpense}
              onAddReminder={handleAddReminder}
              onToggleReminder={handleToggleReminder}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              showToast={showToast}
              onClearData={handleClearAllData}
              cloudUser={cloudUser}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onSync={handleSync}
              onPull={handlePullData}
              onLogout={handleLogout}
              userRole={userRole}
              storeCode={storeCode || (userRole === 'admin' ? cloudUser?.uid : null)}
              initialSubView={moreSubView}
            />
          )}
        </main>

        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} />
        
        {/* Floating Action Button for Home */}
        {activeTab === 'home' && (
          <button onClick={() => setIsQuickMenuOpen(true)} className="fab w-14 h-14 md:w-16 md:h-16">
            <Plus className="w-7 h-7 md:w-8 md:h-8" />
          </button>
        )}

        {/* Quick Action Menu */}
        <QuickActionMenu 
          isOpen={isQuickMenuOpen}
          onClose={() => setIsQuickMenuOpen(false)}
          onAction={(action) => {
            if (action === 'new_order') setActiveTab('orders');
            if (action === 'new_product') setActiveTab('catalog');
            if (action === 'new_customer') {
              setAutoOpenCustomerModal(true);
              setActiveTab('customers');
              // Reset after a short delay so it can be triggered again
              setTimeout(() => setAutoOpenCustomerModal(false), 500);
            }
            if (action === 'new_expense') {
              setMoreSubView('reports');
              setActiveTab('more');
            }
            if (action === 'view_debts') setActiveTab('debts');
            if (action === 'open_pos') setIsPOSOpen(true);
            setIsQuickMenuOpen(false);
          }}
        />
      </div>
    );
  };

  return (
    <>
      {renderContent()}

      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={() => setToast({ ...toast, isVisible: false })} 
      />
      
      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <Auth 
            onClose={() => setIsAuthModalOpen(false)}
            onSuccess={async (uid) => {
              console.log('Auth onSuccess triggered with UID:', uid);
              setIsAuthModalOpen(false);
              
              if (uid !== 'local-user') {
                // Check role before pulling
                try {
                  const profileDoc = await getDoc(doc(db, 'users', uid, 'config', 'main'));
                  if (profileDoc.exists()) {
                    const profile = profileDoc.data();
                    const role = profile.role || 'admin';
                    const sCode = profile.store_code;
                    
                    if (role === 'kasir' && sCode) {
                      setActiveStoreId(sCode);
                      await handlePullData(sCode);
                    } else {
                      setActiveStoreId(uid);
                      await handlePullData(uid);
                    }
                  } else {
                    setActiveStoreId(uid);
                    await handlePullData(uid);
                  }
                } catch (err) {
                  console.error('Error checking role after login:', err);
                  setActiveStoreId(uid);
                  handlePullData(uid);
                }
                setOnboardingStep(3);
              } else {
                setActiveStoreId('local-user');
                console.log('Continuing in local mode');
              }
            }}
            showToast={showToast}
          />
        )}
      </AnimatePresence>
      
      {/* Notification Center */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <NotificationCenter 
            notifications={notifications}
            onClose={() => setIsNotificationsOpen(false)}
            onMarkAsRead={handleMarkNotificationRead}
            onClearAll={handleClearNotifications}
          />
        )}
      </AnimatePresence>

      {/* POS View */}
      {isPOSOpen && (
        <POS 
          userId={activeStoreId || 'local-user'}
          products={products} 
          customers={customers} 
          onAddOrder={handleAddOrder} 
          onAddDebt={handleAddDebt}
          onClose={() => setIsPOSOpen(false)} 
          storeName={config?.name || 'TokoPintar'}
          showToast={showToast}
        />
      )}
    </>
  );
}
