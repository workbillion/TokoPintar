import React, { useMemo } from 'react';
import { Bell, TrendingUp, ShoppingCart, CreditCard, AlertTriangle, Plus, Share2, BookOpen, BarChart2 } from 'lucide-react';
import { StoreConfig, Order, Product, Debt, AppNotification } from '../types';
import { TIPS_JUALAN } from '../constants';

interface DashboardProps {
  config: StoreConfig;
  orders: Order[];
  products: Product[];
  debts: Debt[];
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  onAction: (action: string) => void;
  userRole?: 'admin' | 'kasir';
}

export default function Dashboard({ 
  config, 
  orders, 
  products, 
  debts, 
  notifications, 
  onOpenNotifications, 
  onAction,
  userRole = 'admin'
}: DashboardProps) {
  const unreadNotifs = notifications.filter(n => !n.read).length;
  const today = new Date().toISOString().split('T')[0];
  
  const stats = useMemo(() => {
    const todayOrders = orders.filter(o => o.createdAt.startsWith(today));
    const omzetToday = todayOrders.reduce((sum, o) => sum + (o.status !== 'Dibatalkan' ? o.totalAmount : 0), 0);
    const totalDebt = debts.reduce((sum, d) => sum + d.remainingAmount, 0);
    const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
    
    return {
      omzetToday,
      orderCountToday: todayOrders.length,
      totalDebt,
      lowStockCount
    };
  }, [orders, products, debts, today]);

  const randomTip = useMemo(() => {
    const hash = crypto.randomUUID().split('-')[0];
    const index = parseInt(hash, 16) % TIPS_JUALAN.length;
    return TIPS_JUALAN[index];
  }, []);

  return (
    <div className="pb-24">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
            <img 
              src="/logo.svg" 
              alt="Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-secondary tracking-tight italic">{config.name}</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
        <button 
          onClick={onOpenNotifications}
          className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-2xl shadow-soft flex items-center justify-center relative active:scale-90 transition-transform border border-black/5"
        >
          <Bell className="w-5 h-5 md:w-6 md:h-6 text-secondary" />
          {unreadNotifs > 0 && (
            <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              {unreadNotifs}
            </span>
          )}
        </button>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {userRole === 'admin' && (
          <div className="card bg-secondary text-white border-none flex flex-col justify-between p-6 shadow-strong">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-[18px] h-[18px] md:w-6 md:h-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Omzet Hari Ini</p>
              <p className="text-xl md:text-2xl font-serif font-bold text-primary">Rp {stats.omzetToday.toLocaleString('id-ID')}</p>
            </div>
          </div>
        )}
        <div className="card flex flex-col justify-between p-6">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <ShoppingCart className="w-[18px] h-[18px] md:w-6 md:h-6 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Pesanan Baru</p>
            <p className="text-xl md:text-2xl font-serif font-bold text-secondary">{stats.orderCountToday} Pesanan</p>
          </div>
        </div>
        {userRole === 'admin' && (
          <div className="card flex flex-col justify-between p-6">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-danger/10 rounded-xl flex items-center justify-center mb-4">
              <CreditCard className="w-[18px] h-[18px] md:w-6 md:h-6 text-danger" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Total Piutang</p>
              <p className="text-xl md:text-2xl font-serif font-bold text-secondary">Rp {stats.totalDebt.toLocaleString('id-ID')}</p>
            </div>
          </div>
        )}
        <div className="card flex flex-col justify-between p-6">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <AlertTriangle className="w-[18px] h-[18px] md:w-6 md:h-6 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Stok Menipis</p>
            <p className="text-xl md:text-2xl font-serif font-bold text-secondary">{stats.lowStockCount} Produk</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-serif font-bold text-secondary mb-4">Akses Cepat</h2>
        <div className={`grid ${userRole === 'kasir' ? 'grid-cols-1' : 'grid-cols-4'} gap-3`}>
          <button onClick={() => onAction('open_pos')} className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 text-primary rounded-[24px] shadow-soft flex items-center justify-center active:scale-90 transition-transform">
              <CreditCard className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Kasir POS</span>
          </button>
          {userRole === 'admin' && (
            <>
              <button onClick={() => onAction('view_debts')} className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-secondary/5 text-secondary rounded-[24px] shadow-soft flex items-center justify-center active:scale-90 transition-transform">
                  <BookOpen className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Hutang</span>
              </button>
              <button onClick={() => onAction('view_reports')} className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-secondary/5 text-secondary rounded-[24px] shadow-soft flex items-center justify-center active:scale-90 transition-transform">
                  <BarChart2 className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Laporan</span>
              </button>
              <button onClick={() => onAction('share_catalog')} className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-secondary/5 text-secondary rounded-[24px] shadow-soft flex items-center justify-center active:scale-90 transition-transform">
                  <Share2 className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Katalog</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Smart Alerts */}
      {(stats.lowStockCount > 0 || stats.totalDebt > 0) && (
        <div className="space-y-2 mb-6">
          {stats.lowStockCount > 0 && (
            <div className="bg-secondary/10 p-3 rounded-xl flex items-center gap-3 border border-secondary/20">
              <AlertTriangle size={18} className="text-secondary" />
              <p className="text-xs font-medium text-secondary-dark">⚠️ {stats.lowStockCount} produk stok tinggal sedikit — segera restock!</p>
            </div>
          )}
          {stats.totalDebt > 0 && (
            <div className="bg-danger/10 p-3 rounded-xl flex items-center gap-3 border border-danger/20">
              <CreditCard size={18} className="text-danger" />
              <p className="text-xs font-medium text-danger">💰 Ada piutang pelanggan Rp {stats.totalDebt.toLocaleString('id-ID')} belum lunas.</p>
            </div>
          )}
        </div>
      )}

      {/* Tips Section */}
      <div className="card bg-white border-none shadow-soft p-6 mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Tips Jualan Hari Ini</p>
          <p className="text-sm font-medium text-secondary leading-relaxed italic">"{randomTip}"</p>
        </div>
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl"></div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-serif font-bold text-secondary">Aktivitas Terbaru</h2>
          <button onClick={() => onAction('view_orders')} className="text-[10px] font-bold text-primary uppercase tracking-widest">Lihat Semua</button>
        </div>
        <div className="space-y-4">
          {orders.slice(0, 5).map(order => (
            <div key={order.id} className="card flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-xl shadow-sm">
                  📦
                </div>
                <div>
                  <p className="text-sm font-bold text-secondary">{order.customerName}</p>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{order.items.length} Produk • Rp {order.totalAmount.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                order.status === 'Selesai' ? 'bg-success/10 text-success' : 
                order.status === 'Dibatalkan' ? 'bg-danger/10 text-danger' : 
                'bg-secondary text-white'
              }`}>
                {order.status}
              </span>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="text-center py-8 opacity-50">
              <p className="text-xs">Belum ada pesanan hari ini. Yuk mulai jualan! 💪</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
