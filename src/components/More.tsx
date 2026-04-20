import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  BarChart2, 
  Bell, 
  Settings, 
  ChevronRight, 
  LogOut, 
  Download, 
  Upload, 
  ShieldCheck,
  Users,
  MessageCircle,
  Plus,
  LogIn,
  Copy,
  Share2,
  AlertTriangle,
  X
} from 'lucide-react';
import { StoreConfig, Debt, Reminder, Expense, Order, Product, Customer } from '../types';
import { Storage } from '../services/storage';
import { isFirebaseConfigured } from '../firebase';
import ConfirmModal from './ConfirmModal';
import Customers from './Customers';

interface MoreProps {
  userId: string;
  config: StoreConfig;
  debts: Debt[];
  reminders: Reminder[];
  expenses: Expense[];
  orders: Order[];
  products: Product[];
  customers: Customer[];
  onUpdateConfig: (config: StoreConfig) => void;
  onAddExpense: (expense: Expense) => void;
  onAddReminder: (reminder: Reminder) => void;
  onToggleReminder: (id: string) => void;
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onClearData: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  cloudUser: any;
  onOpenAuth: () => void;
  onSync: () => void;
  onPull: () => void;
  onLogout: () => void;
  userRole?: 'admin' | 'kasir';
  storeCode?: string | null;
  initialSubView?: 'menu' | 'debts' | 'reports' | 'reminders' | 'settings' | 'customers';
}

export default function More({ 
  userId,
  config, 
  debts, 
  reminders, 
  expenses, 
  orders, 
  products, 
  customers,
  onUpdateConfig, 
  onAddExpense,
  onAddReminder,
  onToggleReminder,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onClearData,
  showToast,
  cloudUser,
  onOpenAuth,
  onSync,
  onPull,
  onLogout,
  userRole = 'admin',
  storeCode,
  initialSubView = 'menu'
}: MoreProps) {
  const [activeSubView, setActiveSubView] = useState<'menu' | 'debts' | 'reports' | 'reminders' | 'settings' | 'customers'>(initialSubView);
  const [isClearDataConfirmOpen, setIsClearDataConfirmOpen] = useState(false);

  React.useEffect(() => {
    if (initialSubView) {
      setActiveSubView(initialSubView);
    }
  }, [initialSubView]);
  const [generatedKey, setGeneratedKey] = useState('');

  const totalDebt = debts.reduce((sum, d) => sum + d.remainingAmount, 0);

  const reportStats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const dailyOrders = orders.filter(o => o.status === 'Selesai' && o.createdAt.startsWith(todayStr));
    const weeklyOrders = orders.filter(o => o.status === 'Selesai' && new Date(o.createdAt) >= startOfWeek);
    const monthlyOrders = orders.filter(o => o.status === 'Selesai' && new Date(o.createdAt) >= startOfMonth);

    const dailyExpenses = expenses.filter(e => e.date.startsWith(todayStr));
    const weeklyExpenses = expenses.filter(e => new Date(e.date) >= startOfWeek);
    const monthlyExpenses = expenses.filter(e => new Date(e.date) >= startOfMonth);

    const calculateHPP = (ordersList: Order[]) => ordersList.reduce((sum, o) => sum + o.items.reduce((is, item) => {
      const p = products.find(prod => prod.id === item.productId);
      return is + (p ? p.costPrice * item.quantity : 0);
    }, 0), 0);

    const dOmset = dailyOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const wOmset = weeklyOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const mOmset = monthlyOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      daily: dOmset,
      weekly: wOmset,
      monthly: mOmset,
      dailyProfit: dOmset - calculateHPP(dailyOrders) - dailyExpenses.reduce((s, e) => s + e.amount, 0),
      weeklyProfit: wOmset - calculateHPP(weeklyOrders) - weeklyExpenses.reduce((s, e) => s + e.amount, 0),
      monthlyProfit: mOmset - calculateHPP(monthlyOrders) - monthlyExpenses.reduce((s, e) => s + e.amount, 0),
      dailyCount: dailyOrders.length,
      weeklyCount: weeklyOrders.length,
      monthlyCount: monthlyOrders.length
    };
  }, [orders, expenses, products]);

  const handleShareCatalog = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?store=${userId}`;
    navigator.clipboard.writeText(shareUrl);
    showToast('Link katalog berhasil disalin! 🔗', 'success');
  };



  const menuItems = userRole === 'kasir' ? [] : [
    { id: 'debts', label: 'Hutang Piutang', icon: CreditCard, color: 'text-danger', bg: 'bg-danger/10', badge: totalDebt > 0 ? `Rp ${totalDebt.toLocaleString('id-ID')}` : null },
    { id: 'customers', label: 'Daftar Pelanggan', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', badge: customers.length > 0 ? `${customers.length} Orang` : null },
    { id: 'reports', label: 'Laporan Keuangan', icon: BarChart2, color: 'text-black', bg: 'bg-primary', badge: null },
    { id: 'reminders', label: 'Pengingat & Jadwal', icon: Bell, color: 'text-white', bg: 'bg-black', badge: reminders.filter(r => !r.completed).length || null },
    { id: 'settings', label: 'Pengaturan & Lisensi', icon: Settings, color: 'text-gray-600', bg: 'bg-gray-100' },
  ];



  if (activeSubView === 'menu') {
    return (
      <div className="pb-24">
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 bg-white rounded-[32px] shadow-strong flex items-center justify-center mb-4 overflow-hidden border border-black/5">
            <img 
              src="/logo.svg" 
              alt="Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-3xl font-serif font-bold text-secondary tracking-tight italic">Menu Lainnya</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Kelola Toko & Pengaturan</p>
        </div>
        
        <div className="space-y-4">
          {userRole === 'admin' && cloudUser && (
            <button
              onClick={handleShareCatalog}
              className="card w-full flex items-center justify-between p-5 bg-primary/5 border-primary/20 shadow-soft group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Share2 size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-base text-secondary">Bagikan Katalog</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Link Toko Online Anda</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          {userRole === 'kasir' && (
            <div className="card bg-primary/5 border-primary/20 p-6 text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={32} />
              </div>
              <h3 className="font-bold text-secondary mb-1">Akses Terbatas</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">Anda masuk sebagai Kasir. Fitur administrasi dan laporan hanya dapat diakses oleh Pemilik Toko.</p>
            </div>
          )}
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSubView(item.id as any)}
              className="card w-full flex items-center justify-between p-5 active:bg-gray-50 transition-all border-none shadow-soft group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                  <item.icon size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-base text-secondary">{item.label}</p>
                  {item.badge && <p className={`text-[10px] font-bold uppercase tracking-widest ${item.color}`}>{item.badge}</p>}
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
            </button>
          ))}
        </div>



        <div className="flex flex-col items-center mt-12 opacity-50">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mb-2 overflow-hidden border border-black/5 shadow-sm">
            <img 
              src="/logo.svg" 
              alt="Logo Small" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TokoPintar v1.1.0 • Edisi Profesional UMKM</p>
        </div>
        
        {cloudUser ? (
          <button 
            onClick={onLogout}
            className="w-full mt-6 py-4 flex items-center justify-center gap-2 text-danger font-bold text-xs uppercase tracking-widest active:scale-95 transition-all"
          >
            <LogOut size={16} /> Keluar Akun
          </button>
        ) : (
          <button 
            onClick={onOpenAuth}
            className="w-full mt-6 py-4 flex items-center justify-center gap-2 text-primary font-bold text-xs uppercase tracking-widest active:scale-95 transition-all"
          >
            <LogIn size={16} /> Masuk Akun Cloud
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setActiveSubView('menu')} className="p-3 bg-secondary text-white rounded-2xl shadow-lg active:scale-90 transition-transform">
          <ChevronRight size={20} className="rotate-180" />
        </button>
        <h1 className="text-2xl font-serif font-bold text-secondary tracking-tight italic">
          {activeSubView === 'debts' ? 'Hutang Piutang' : 
           activeSubView === 'reports' ? 'Laporan Keuangan' : 
           activeSubView === 'reminders' ? 'Pengingat' : 
           activeSubView === 'customers' ? 'Daftar Pelanggan' : 'Pengaturan'}
        </h1>
      </div>

      {activeSubView === 'customers' && (
        <Customers 
          customers={customers}
          onAddCustomer={onAddCustomer}
          onUpdateCustomer={onUpdateCustomer}
          onDeleteCustomer={onDeleteCustomer}
        />
      )}

      {activeSubView === 'settings' && (
        <div className="space-y-6">
          {/* Cloud Backup Section */}
          <div className="card bg-primary/5 border-primary/20">
            <h3 className="text-xs font-bold text-primary uppercase mb-3">Sinkronisasi Data</h3>
            {!isFirebaseConfigured ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-gray-100 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck size={24} />
                </div>
                <h4 className="text-sm font-bold text-secondary mb-1">Mode Lokal Aktif</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed px-4">Data tersimpan aman di HP/Laptop ini. <br/> Cloud non-aktif (Tanpa API Key).</p>
              </div>
            ) : cloudUser ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Terhubung sebagai:</p>
                    <p className="text-sm font-bold text-secondary">{cloudUser.email}</p>
                  </div>
                  <div className="w-10 h-10 bg-success/10 text-success rounded-full flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={onSync}
                    className="btn-primary h-12 text-[10px] gap-2"
                  >
                    <Upload size={16} /> Cadangkan
                  </button>
                  <button 
                    onClick={onPull}
                    className="btn-secondary h-12 text-[10px] gap-2 bg-white border border-secondary/20 !text-secondary"
                  >
                    <Download size={16} /> Pulihkan
                  </button>
                </div>
                {userRole === 'admin' && storeCode && (
                  <div className="bg-white p-3 rounded-xl border border-primary/20">
                    <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Kode Toko (Untuk Kasir):</p>
                    <div className="flex items-center justify-between">
                      <code className="text-xs font-mono font-bold text-primary">{storeCode}</code>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(storeCode);
                          showToast('Kode Toko disalin!', 'success');
                        }}
                        className="p-1 text-primary hover:bg-primary/5 rounded-md"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                )}
                <p className="text-[8px] text-gray-400 uppercase font-bold text-center">Data lokal Anda akan disinkronkan dengan aman di Cloud.</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-gray-500 mb-4">Aktifkan backup otomatis agar data toko Anda tidak hilang jika HP rusak.</p>
                <button 
                  onClick={onOpenAuth}
                  className="btn-primary w-full h-12 text-xs gap-2"
                >
                  <LogIn size={16} /> Login untuk Backup
                </button>
              </div>
            )}
          </div>

          <div className="card space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase">Profil Toko</h3>
            <div>
              <label className="text-[10px] font-bold text-gray-500 mb-1 block">Nama Toko</label>
              <input type="text" className="input-field py-2 text-sm" value={config.name} onChange={(e) => onUpdateConfig({...config, name: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 mb-1 block">WhatsApp Bisnis</label>
              <input type="text" className="input-field py-2 text-sm" value={config.whatsapp} onChange={(e) => onUpdateConfig({...config, whatsapp: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 mb-1 block">Rekening Bank (untuk konfirmasi)</label>
              <input type="text" className="input-field py-2 text-sm" placeholder="Contoh: BCA 123456789 a/n Nama" value={config.bankAccount} onChange={(e) => onUpdateConfig({...config, bankAccount: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 mb-1 block">Pesan Salam (Katalog Online)</label>
              <input type="text" className="input-field py-2 text-sm" placeholder="Contoh: Selamat berbelanja! ✨" value={config.miniStoreGreeting || ''} onChange={(e) => onUpdateConfig({...config, miniStoreGreeting: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 mb-1 block">Pesan Promo (Share WhatsApp)</label>
              <input type="text" className="input-field py-2 text-sm" placeholder="Contoh: Fast respon, kualitas terjamin! 🚀" value={config.shareMessage || ''} onChange={(e) => onUpdateConfig({...config, shareMessage: e.target.value})} />
              <p className="text-[8px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Pesan ini akan muncul saat Anda membagikan katalog ke WhatsApp.</p>
            </div>
            <div>
              {userRole === 'admin' && storeCode && (
                <div className="bg-primary/5 p-3 rounded-xl border border-primary/20 mb-4">
                  <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Kode Toko (Berikan ke Kasir):</p>
                  <div className="flex items-center justify-between">
                    <code className="text-xs font-mono font-bold text-primary">{storeCode}</code>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(storeCode);
                        showToast('Kode Toko disalin!', 'success');
                      }}
                      className="p-1 text-primary hover:bg-primary/5 rounded-md"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              )}
              <label className="text-[10px] font-bold text-primary mb-1 block">PIN Kasir (untuk Login Staff)</label>
              <input type="text" className="input-field py-2 text-sm border-primary/30" placeholder="Contoh: 1234" value={config.cashierPin || ''} onChange={(e) => onUpdateConfig({...config, cashierPin: e.target.value})} />
              <p className="text-[8px] text-gray-400 mt-1 uppercase font-bold tracking-widest">Berikan PIN ini ke kasir Anda untuk masuk ke sistem.</p>
            </div>
          </div>

          <div className="card space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase">Kategori Produk</h3>
            <div className="flex flex-wrap gap-2">
              {(config.categories || ['Umum']).map((cat, idx) => (
                <div key={idx} className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
                  {cat}
                  <button onClick={() => {
                    const newCats = (config.categories || ['Umum']).filter((_, i) => i !== idx);
                    onUpdateConfig({...config, categories: newCats.length > 0 ? newCats : ['Umum']});
                  }} className="hover:text-danger">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                id="new-category"
                className="input-field py-2 text-sm" 
                placeholder="Tambah kategori..." 
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const el = e.target as HTMLInputElement;
                    const val = el.value.trim();
                    if (val && !(config.categories || []).includes(val)) {
                      onUpdateConfig({...config, categories: [...(config.categories || []), val]});
                      el.value = '';
                    }
                  }
                }}
              />
              <button 
                onClick={() => {
                  const input = document.getElementById('new-category') as HTMLInputElement;
                  const val = input.value.trim();
                  if (val && !(config.categories || []).includes(val)) {
                    onUpdateConfig({...config, categories: [...(config.categories || []), val]});
                    input.value = '';
                  }
                }}
                className="bg-primary text-white p-2 rounded-xl active:scale-95 transition-transform"
              >
                <Plus size={20} />
              </button>
            </div>
            <p className="text-[8px] text-gray-400 uppercase font-bold tracking-widest leading-relaxed">Kelola kategori produk sesuai jenis bisnis kamu (Makanan, Fashion, dll).</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={async () => {
              const data = await Storage.exportData(userId);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `backup_${config.name.replace(/\s/g, '_')}.json`;
              a.click();
            }} className="btn-secondary h-12 text-xs gap-2">
              <Download size={16} /> Backup
            </button>
            <button onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = async (re) => {
                    const content = re.target?.result as string;
                    if (await Storage.importData(userId, content)) {
                      showToast('Data berhasil di-restore! Aplikasi akan dimuat ulang.', 'success');
                      setTimeout(() => window.location.reload(), 1500);
                    } else {
                      showToast('Gagal mengimpor data. Pastikan file benar.', 'error');
                    }
                  };
                  reader.readAsText(file);
                }
              };
              input.click();
            }} className="btn-secondary h-12 text-xs gap-2">
              <Upload size={16} /> Restore
            </button>
          </div>

          <button onClick={() => setIsClearDataConfirmOpen(true)} className="w-full text-danger text-xs font-bold py-4">Hapus Semua Data</button>
          
          <ConfirmModal 
            isOpen={isClearDataConfirmOpen}
            title="Hapus Semua Data?"
            message="Semua data toko, produk, dan pesanan akan dihapus permanen. Tindakan ini tidak bisa dibatalkan."
            confirmText="Ya, Hapus Semua"
            onConfirm={onClearData}
            onCancel={() => setIsClearDataConfirmOpen(false)}
          />
        </div>
      )}

      {activeSubView === 'debts' && (
        <div className="space-y-4">
          <div className="bg-danger/10 p-4 rounded-2xl border border-danger/20 text-center">
            <p className="text-[10px] text-danger font-bold uppercase mb-1">Total Piutang Belum Lunas</p>
            <p className="text-2xl font-bold text-danger">Rp {totalDebt.toLocaleString('id-ID')}</p>
          </div>
          
          {debts.length > 0 ? (
            debts.map(debt => (
              <div key={debt.id} className="card flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">{debt.customerName}</h3>
                  <p className="text-[10px] text-gray-500">Jatuh Tempo: {new Date(debt.dueDate).toLocaleDateString('id-ID')}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-danger">Rp {debt.remainingAmount.toLocaleString('id-ID')}</p>
                  <button className="text-[10px] font-bold text-primary uppercase">Bayar</button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 opacity-50">
              <p className="text-xs">Tidak ada hutang pelanggan. Arus kas aman! ✅</p>
            </div>
          )}
        </div>
      )}

      {activeSubView === 'reports' && (
        <div className="space-y-6">
          {/* Omset Periode */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Omset Periode</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-4 bg-white border-none shadow-soft flex flex-col justify-between min-h-[120px]">
                <div>
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mb-1">Hari Ini</p>
                  <p className="text-xs font-bold text-secondary">Rp {reportStats.daily.toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-[7px] text-success font-bold uppercase tracking-widest mt-2">Profit</p>
                  <p className="text-[10px] font-bold text-success">Rp {reportStats.dailyProfit.toLocaleString('id-ID')}</p>
                  <p className="text-[7px] text-gray-300 font-medium mt-1">{reportStats.dailyCount} Pesanan</p>
                </div>
              </div>
              <div className="card p-4 bg-white border-none shadow-soft flex flex-col justify-between min-h-[120px]">
                <div>
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mb-1">Minggu Ini</p>
                  <p className="text-xs font-bold text-secondary">Rp {reportStats.weekly.toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-[7px] text-success font-bold uppercase tracking-widest mt-2">Profit</p>
                  <p className="text-[10px] font-bold text-success">Rp {reportStats.weeklyProfit.toLocaleString('id-ID')}</p>
                  <p className="text-[7px] text-gray-300 font-medium mt-1">{reportStats.weeklyCount} Pesanan</p>
                </div>
              </div>
              <div className="card p-4 bg-white border-none shadow-soft flex flex-col justify-between min-h-[120px]">
                <div>
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mb-1">Bulan Ini</p>
                  <p className="text-xs font-bold text-secondary">Rp {reportStats.monthly.toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-[7px] text-success font-bold uppercase tracking-widest mt-2">Profit</p>
                  <p className="text-[10px] font-bold text-success">Rp {reportStats.monthlyProfit.toLocaleString('id-ID')}</p>
                  <p className="text-[7px] text-gray-300 font-medium mt-1">{reportStats.monthlyCount} Pesanan</p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card bg-success/5 border-none shadow-soft p-6">
              <p className="text-[10px] text-success font-bold uppercase tracking-widest mb-1">Total Omzet</p>
              <p className="text-xl font-serif font-bold text-success">Rp {orders.reduce((s, o) => s + (o.status === 'Selesai' ? o.totalAmount : 0), 0).toLocaleString('id-ID')}</p>
              <p className="text-[8px] text-gray-400 mt-2 font-medium uppercase tracking-widest">{orders.filter(o => o.status === 'Selesai').length} Pesanan Sukses</p>
            </div>
            <div className="card bg-danger/5 border-none shadow-soft p-6">
              <p className="text-[10px] text-danger font-bold uppercase tracking-widest mb-1">Total Beban</p>
              <p className="text-xl font-serif font-bold text-danger">Rp {(
                expenses.reduce((s, e) => s + e.amount, 0) + 
                orders.reduce((s, o) => s + (o.status === 'Selesai' ? o.items.reduce((is, item) => {
                  const p = products.find(prod => prod.id === item.productId);
                  return is + (p ? p.costPrice * item.quantity : 0);
                }, 0) : 0), 0)
              ).toLocaleString('id-ID')}</p>
              <p className="text-[8px] text-gray-400 mt-2 font-medium uppercase tracking-widest">Modal + Operasional</p>
            </div>
          </div>

          {/* Profit Card */}
          <div className="bg-secondary text-white p-10 rounded-[40px] overflow-hidden relative shadow-strong border border-primary/20">
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Laba Bersih (Profit)</p>
              <p className="text-4xl font-serif font-bold text-primary tracking-tight">
                Rp {(
                  orders.reduce((s, o) => s + (o.status === 'Selesai' ? o.totalAmount : 0), 0) - 
                  (
                    expenses.reduce((s, e) => s + e.amount, 0) + 
                    orders.reduce((s, o) => s + (o.status === 'Selesai' ? o.items.reduce((is, item) => {
                      const p = products.find(prod => prod.id === item.productId);
                      return is + (p ? p.costPrice * item.quantity : 0);
                    }, 0) : 0), 0)
                  )
                ).toLocaleString('id-ID')}
              </p>
              <div className="mt-8 flex gap-4">
                <div className="bg-white/10 px-5 py-2 rounded-xl border border-white/5">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Margin Laba</p>
                  <p className="text-sm font-bold text-primary">
                    {orders.reduce((s, o) => s + (o.status === 'Selesai' ? o.totalAmount : 0), 0) > 0 
                      ? Math.round(((orders.reduce((s, o) => s + (o.status === 'Selesai' ? o.totalAmount : 0), 0) - (expenses.reduce((s, e) => s + e.amount, 0) + orders.reduce((s, o) => s + (o.status === 'Selesai' ? o.items.reduce((is, item) => { const p = products.find(prod => prod.id === item.productId); return is + (p ? p.costPrice * item.quantity : 0); }, 0) : 0), 0))) / orders.reduce((s, o) => s + (o.status === 'Selesai' ? o.totalAmount : 0), 0)) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
          </div>
          
          {/* Detailed Breakdown */}
          <div className="card">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">Rincian Keuangan</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Penjualan Kotor</span>
                <span className="font-medium">Rp {orders.reduce((s, o) => s + (o.status === 'Selesai' ? o.totalAmount : 0), 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Harga Pokok Penjualan (HPP)</span>
                <span className="font-medium text-danger">- Rp {orders.reduce((s, o) => s + (o.status === 'Selesai' ? o.items.reduce((is, item) => {
                  const p = products.find(prod => prod.id === item.productId);
                  return is + (p ? p.costPrice * item.quantity : 0);
                }, 0) : 0), 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-50">
                <span className="font-bold">Laba Kotor</span>
                <span className="font-bold text-success">Rp {(orders.reduce((s, o) => s + (o.status === 'Selesai' ? o.totalAmount : 0), 0) - orders.reduce((s, o) => s + (o.status === 'Selesai' ? o.items.reduce((is, item) => { const p = products.find(prod => prod.id === item.productId); return is + (p ? p.costPrice * item.quantity : 0); }, 0) : 0), 0)).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Beban Operasional</span>
                <span className="font-medium text-danger">- Rp {expenses.reduce((s, e) => s + e.amount, 0).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Top Products Ranking */}
          <div className="card">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">Produk Terlaris</h3>
            <div className="space-y-4">
              {products
                .map(p => ({
                  name: p.name,
                  sold: orders.filter(o => o.status === 'Selesai').reduce((s, o) => s + o.items.filter(i => i.productId === p.id).reduce((is, item) => is + item.quantity, 0), 0)
                }))
                .filter(p => p.sold > 0)
                .sort((a, b) => b.sold - a.sold)
                .slice(0, 3)
                .map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-300">0{i+1}</span>
                      <span className="text-xs font-medium line-clamp-1">{p.name}</span>
                    </div>
                    <span className="badge bg-primary/10 text-primary">{p.sold} pcs</span>
                  </div>
                ))
              }
              {products.filter(p => orders.filter(o => o.status === 'Selesai').some(o => o.items.some(i => i.productId === p.id))).length === 0 && (
                <p className="text-center text-[10px] text-gray-400 py-2">Belum ada data penjualan produk.</p>
              )}
            </div>
          </div>

          {/* Expense Input */}
          <div className="card border-dashed border-2 border-gray-200 bg-transparent">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Catat Pengeluaran Baru</h3>
            <div className="flex gap-2">
              <input type="text" id="exp-desc" className="input-field py-2 text-xs flex-1" placeholder="Misal: Beli Plastik Packing" />
              <input type="number" id="exp-amt" className="input-field py-2 text-xs w-24" placeholder="Rp 0" />
              <button 
                onClick={() => {
                  const desc = (document.getElementById('exp-desc') as HTMLInputElement).value;
                  const amt = Number((document.getElementById('exp-amt') as HTMLInputElement).value);
                  if (!desc || !amt) return showToast('Isi deskripsi dan nominal!', 'error');
                  
                  const newExpense: Expense = {
                    id: `exp-${crypto.randomUUID().split('-')[0]}`,
                    description: desc,
                    amount: amt,
                    category: 'Operasional',
                    date: new Date().toISOString()
                  };
                  
                  onAddExpense(newExpense);
                  
                  (document.getElementById('exp-desc') as HTMLInputElement).value = '';
                  (document.getElementById('exp-amt') as HTMLInputElement).value = '';
                }}
                className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Expense History */}
          <div className="card">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">Riwayat Pengeluaran</h3>
            <div className="space-y-3">
              {expenses.length > 0 ? (
                expenses.slice(0, 10).map(exp => (
                  <div key={exp.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-bold text-secondary">{exp.description}</p>
                      <p className="text-[10px] text-gray-400">{new Date(exp.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <p className="text-sm font-bold text-danger">- Rp {exp.amount.toLocaleString('id-ID')}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-[10px] text-gray-400 py-4">Belum ada riwayat pengeluaran.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubView === 'reminders' && (
        <div className="space-y-4">
          <div className="card space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase">Tambah Pengingat</h3>
            <div className="space-y-2">
              <input 
                id="rem-title"
                type="text" 
                placeholder="Judul (misal: Restock Hijab)" 
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <div className="grid grid-cols-2 gap-2">
                <input 
                  id="rem-date"
                  type="date" 
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input 
                  id="rem-time"
                  type="time" 
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button 
                onClick={() => {
                  const title = (document.getElementById('rem-title') as HTMLInputElement).value;
                  const date = (document.getElementById('rem-date') as HTMLInputElement).value;
                  const time = (document.getElementById('rem-time') as HTMLInputElement).value;
                  
                  if (!title || !date || !time) return showToast('Lengkapi data pengingat!', 'error');
                  
                  const newReminder: Reminder = {
                    id: `rem-${crypto.randomUUID().split('-')[0]}`,
                    title,
                    date,
                    time,
                    category: 'Lain-lain',
                    repeat: 'Sekali',
                    notes: '',
                    completed: false
                  };
                  
                  onAddReminder(newReminder);
                  
                  (document.getElementById('rem-title') as HTMLInputElement).value = '';
                  (document.getElementById('rem-date') as HTMLInputElement).value = '';
                  (document.getElementById('rem-time') as HTMLInputElement).value = '';
                }}
                className="btn-primary w-full gap-2 text-xs"
              >
                <Plus size={16} /> Simpan Pengingat
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase px-1">Daftar Pengingat</h3>
            {reminders.length > 0 ? (
              reminders.map(rem => (
                <div key={rem.id} className={`card flex items-center justify-between transition-opacity ${rem.completed ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rem.completed ? 'bg-gray-100 text-gray-400' : 'bg-secondary/10 text-secondary'}`}>
                      <Bell size={18} />
                    </div>
                    <div>
                      <h3 className={`font-bold text-sm ${rem.completed ? 'line-through' : ''}`}>{rem.title}</h3>
                      <p className="text-[10px] text-gray-500">{rem.date} • {rem.time}</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={rem.completed} 
                    onChange={() => onToggleReminder(rem.id)}
                    className="w-5 h-5 rounded-lg border-gray-300 text-primary focus:ring-primary" 
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-12 opacity-50">
                <p className="text-xs">Belum ada pengingat. Yuk atur jadwal jualanmu! ⏰</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
