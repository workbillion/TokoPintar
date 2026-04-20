import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  ChevronRight, 
  Calendar, 
  User, 
  DollarSign, 
  AlertCircle,
  CheckCircle2,
  History,
  ArrowLeft,
  Trash2,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Debt, Customer, DebtPayment } from '../types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface DebtsProps {
  debts: Debt[];
  customers: Customer[];
  onAddDebt: (debt: Debt) => void;
  onUpdateDebt: (debt: Debt) => void;
  onDeleteDebt: (id: string) => void;
}

export default function Debts({ debts, customers, onAddDebt, onUpdateDebt, onDeleteDebt }: DebtsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [isAddingDebt, setIsAddingDebt] = useState(false);
  const [isPayingDebt, setIsPayingDebt] = useState<Debt | null>(null);

  // Group debts by customer
  const customerDebts = useMemo(() => {
    const groups: Record<string, { 
      customerName: string; 
      totalDebt: number; 
      debtCount: number; 
      lastDebtDate: string;
      items: Debt[];
    }> = {};

    debts.forEach(debt => {
      if (!groups[debt.customerName]) {
        groups[debt.customerName] = {
          customerName: debt.customerName,
          totalDebt: 0,
          debtCount: 0,
          lastDebtDate: debt.date,
          items: []
        };
      }
      groups[debt.customerName].totalDebt += debt.remainingAmount;
      groups[debt.customerName].debtCount += 1;
      groups[debt.customerName].items.push(debt);
      if (new Date(debt.date) > new Date(groups[debt.customerName].lastDebtDate)) {
        groups[debt.customerName].lastDebtDate = debt.date;
      }
    });

    return Object.values(groups)
      .filter(g => g.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.totalDebt - a.totalDebt);
  }, [debts, searchTerm]);

  const totalAllDebt = useMemo(() => {
    return debts.reduce((sum, d) => sum + d.remainingAmount, 0);
  }, [debts]);

  const handleAddDebt = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newDebt: Debt = {
      id: `debt-${Date.now()}`,
      customerId: '', // Manual entry might not have ID
      customerName: formData.get('customerName') as string,
      amount: Number(formData.get('amount')),
      remainingAmount: Number(formData.get('amount')),
      description: formData.get('description') as string,
      date: new Date().toISOString(),
      dueDate: formData.get('dueDate') as string,
      isInstallment: false,
      payments: []
    };

    onAddDebt(newDebt);
    setIsAddingDebt(false);
  };

  const handlePayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isPayingDebt) return;

    const formData = new FormData(e.currentTarget);
    const payAmount = Number(formData.get('payAmount'));

    const payment: DebtPayment = {
      id: `pay-${Date.now()}`,
      amount: payAmount,
      date: new Date().toISOString()
    };

    const updatedDebt: Debt = {
      ...isPayingDebt,
      remainingAmount: isPayingDebt.remainingAmount - payAmount,
      payments: [...isPayingDebt.payments, payment]
    };

    onUpdateDebt(updatedDebt);
    setIsPayingDebt(null);
  };

  return (
    <div className="space-y-6">
      {selectedCustomer ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-xl font-serif font-bold text-secondary">{selectedCustomer}</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Detail Hutang Piutang</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-[24px] border border-black/5 shadow-sm">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Hutang</p>
              <p className="text-lg font-bold text-danger">Rp {customerDebts.find(g => g.customerName === selectedCustomer)?.totalDebt.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-[24px] border border-black/5 shadow-sm">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Jumlah Bon</p>
              <p className="text-lg font-bold text-secondary">{customerDebts.find(g => g.customerName === selectedCustomer)?.debtCount} Kali</p>
            </div>
          </div>

          <div className="space-y-4">
            {customerDebts.find(g => g.customerName === selectedCustomer)?.items.map((debt) => (
              <motion.div 
                key={debt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-5 rounded-[28px] border border-black/5 shadow-sm relative overflow-hidden group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {format(new Date(debt.date), 'dd MMMM yyyy', { locale: id })}
                      </span>
                    </div>
                    <h3 className="font-bold text-secondary">{debt.description || 'Tanpa Keterangan'}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Sisa Tagihan</p>
                    <p className="text-lg font-bold text-danger">Rp {debt.remainingAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-black/5">
                  <button 
                    onClick={() => setIsPayingDebt(debt)}
                    className="flex-1 py-3 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <DollarSign className="w-3 h-3" />
                    Bayar Cicilan
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm('Hapus catatan hutang ini?')) onDeleteDebt(debt.id);
                    }}
                    className="p-3 bg-danger/10 text-danger rounded-xl active:scale-95 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {debt.payments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-dashed border-black/10">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                      <History className="w-3 h-3" /> Riwayat Pembayaran
                    </p>
                    <div className="space-y-2">
                      {debt.payments.map(p => (
                        <div key={p.id} className="flex justify-between text-[11px]">
                          <span className="text-gray-500">{format(new Date(p.date), 'dd/MM/yy HH:mm')}</span>
                          <span className="font-bold text-success">Rp {p.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-serif font-bold text-secondary">Hutang Piutang</h1>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Kelola Bon & Tagihan Pelanggan</p>
            </div>
            <button 
              onClick={() => setIsAddingDebt(true)}
              className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-all"
            >
              <Plus size={24} />
            </button>
          </div>

          <div className="bg-secondary p-6 rounded-[32px] text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-2">Total Piutang Warung</p>
              <h2 className="text-4xl font-serif font-bold">Rp {totalAllDebt.toLocaleString()}</h2>
              <div className="mt-6 flex items-center gap-2 bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-md">
                <AlertCircle size={14} className="text-warning" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{customerDebts.length} Orang Belum Lunas</span>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari nama pelanggan..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-black/5 rounded-[24px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            />
          </div>

          <div className="space-y-4">
            {customerDebts.map((group) => (
              <motion.button
                key={group.customerName}
                onClick={() => setSelectedCustomer(group.customerName)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-white p-5 rounded-[28px] border border-black/5 shadow-sm flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center text-secondary group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <User size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-secondary text-lg">{group.customerName}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {group.debtCount} Bon • Terakhir {format(new Date(group.lastDebtDate), 'dd MMM', { locale: id })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-bold text-danger">Rp {group.totalDebt.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Belum Lunas</p>
                  </div>
                  <ChevronRight className="text-gray-300 w-5 h-5" />
                </div>
              </motion.button>
            ))}

            {customerDebts.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="text-gray-300 w-10 h-10" />
                </div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Semua Hutang Lunas!</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Debt Modal */}
      <AnimatePresence>
        {isAddingDebt && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingDebt(false)}
              className="absolute inset-0 bg-secondary/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-white rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-black/5 rounded-full mx-auto mb-8 sm:hidden" />
              <h2 className="text-2xl font-serif font-bold text-secondary mb-2">Tambah Hutang Baru</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8">Catat bon pelanggan secara manual</p>

              <form onSubmit={handleAddDebt} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Nama Pelanggan</label>
                  <input 
                    name="customerName"
                    required
                    list="customer-list"
                    placeholder="Contoh: Pak Budi"
                    className="w-full px-6 py-4 bg-black/5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <datalist id="customer-list">
                    {customers.map(c => <option key={c.id} value={c.name} />)}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Jumlah Hutang (Rp)</label>
                  <input 
                    name="amount"
                    type="number"
                    required
                    placeholder="0"
                    className="w-full px-6 py-4 bg-black/5 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Keterangan / Catatan</label>
                  <input 
                    name="description"
                    placeholder="Contoh: Nasi Ayam + Es Teh"
                    className="w-full px-6 py-4 bg-black/5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Jatuh Tempo (Opsional)</label>
                  <input 
                    name="dueDate"
                    type="date"
                    className="w-full px-6 py-4 bg-black/5 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAddingDebt(false)}
                    className="flex-1 py-4 bg-black/5 text-secondary rounded-2xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary/20"
                  >
                    Simpan Hutang
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pay Debt Modal */}
      <AnimatePresence>
        {isPayingDebt && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPayingDebt(null)}
              className="absolute inset-0 bg-secondary/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-white rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-black/5 rounded-full mx-auto mb-8 sm:hidden" />
              <h2 className="text-2xl font-serif font-bold text-secondary mb-2">Bayar Hutang</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8">
                {isPayingDebt.customerName} • Sisa Rp {isPayingDebt.remainingAmount.toLocaleString()}
              </p>

              <form onSubmit={handlePayment} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-4">Jumlah Pembayaran (Rp)</label>
                  <input 
                    name="payAmount"
                    type="number"
                    required
                    max={isPayingDebt.remainingAmount}
                    defaultValue={isPayingDebt.remainingAmount}
                    className="w-full px-6 py-4 bg-black/5 rounded-2xl text-xl font-bold text-success focus:outline-none focus:ring-2 focus:ring-success/20 transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsPayingDebt(null)}
                    className="flex-1 py-4 bg-black/5 text-secondary rounded-2xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-success text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-success/20 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    Konfirmasi Bayar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
