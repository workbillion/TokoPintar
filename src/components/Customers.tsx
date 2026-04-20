import React, { useState } from 'react';
import { Search, UserPlus, Phone, Star, ShoppingBag, MessageCircle, X, Save, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Customer } from '../types';
import ConfirmModal from './ConfirmModal';

interface CustomersProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  autoOpenModal?: boolean;
}

export default function Customers({ customers, onAddCustomer, onUpdateCustomer, onDeleteCustomer, autoOpenModal = false }: CustomersProps) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(autoOpenModal);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    address: '',
    notes: '',
    isVip: false,
    vipDiscountValue: 0,
    vipDiscountType: 'percent' as 'percent' | 'nominal'
  });

  React.useEffect(() => {
    if (autoOpenModal) {
      setShowModal(true);
    }
  }, [autoOpenModal]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.whatsapp.includes(search)
  );

  const openWhatsapp = (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setError(null);
    setFormData({ name: '', whatsapp: '', address: '', notes: '', isVip: false });
    setShowModal(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setError(null);
    setFormData({
      name: customer.name,
      whatsapp: customer.whatsapp,
      address: customer.address,
      notes: customer.notes,
      isVip: customer.isVip,
      vipDiscountValue: customer.vipDiscountValue || 0,
      vipDiscountType: customer.vipDiscountType || 'percent'
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.whatsapp) {
      setError('Nama dan WhatsApp wajib diisi!');
      return;
    }
    setError(null);

    if (editingCustomer) {
      onUpdateCustomer({
        ...editingCustomer,
        ...formData
      });
    } else {
      const customer: Customer = {
        id: crypto.randomUUID().split('-')[0],
        ...formData,
        totalSpent: 0,
        orderCount: 0
      };
      onAddCustomer(customer);
    }
    
    setShowModal(false);
  };

  return (
    <div className="pb-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-secondary tracking-tight italic">Database Pelanggan</h1>
        <button 
          onClick={openAddModal}
          className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-transform"
        >
          <UserPlus size={24} />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cari nama atau nomor WA..."
          className="input-field pl-10 py-2 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Customer List */}
      <div className="space-y-4">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map(customer => (
            <div key={customer.id} className="card p-5 border-none shadow-soft group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-secondary text-primary rounded-2xl flex items-center justify-center font-serif font-bold text-xl shadow-lg">
                    {customer.name.substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-secondary">{customer.name}</h3>
                      {customer.isVip && (
                        <span className="bg-primary/10 text-primary text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-primary/20">
                          <Star size={8} fill="currentColor" /> VIP
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{customer.whatsapp}</p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openEditModal(customer)}
                    className="w-9 h-9 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center hover:text-secondary transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => setDeleteConfirmId(customer.id)}
                    className="w-9 h-9 bg-danger/5 text-danger rounded-xl flex items-center justify-center hover:bg-danger hover:text-white transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-black/5">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                  {customer.orderCount} Order • Rp {customer.totalSpent.toLocaleString('id-ID')}
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => openWhatsapp(customer.whatsapp)}
                    className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-success hover:text-white transition-all"
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 opacity-50">
            <p className="text-xs">Belum ada pelanggan. Data akan otomatis bertambah saat ada pesanan baru! 👥</p>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {customers.length > 0 && (
        <div className="mt-12 grid grid-cols-2 gap-4">
          <div className="card p-6 border-none shadow-soft bg-secondary text-white">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Pelanggan</p>
            <p className="text-2xl font-serif font-bold text-primary">{customers.length}</p>
          </div>
          <div className="card p-6 border-none shadow-soft">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pelanggan VIP</p>
            <p className="text-2xl font-serif font-bold text-secondary">{customers.filter(c => c.isVip).length}</p>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmModal 
        isOpen={!!deleteConfirmId}
        title="Hapus Pelanggan?"
        message="Data pelanggan dan riwayat belanjanya akan terhapus permanen."
        onConfirm={() => {
          if (deleteConfirmId) onDeleteCustomer(deleteConfirmId);
          setDeleteConfirmId(null);
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />

      {/* Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[80] flex items-end">
          <div className="bg-white w-full rounded-t-[32px] p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">{editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-danger/10 text-danger text-[10px] font-bold rounded-xl flex items-center gap-2 animate-shake">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Nama Lengkap</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Contoh: Budi Santoso"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Nomor WhatsApp</label>
                <input 
                  type="tel" 
                  className="input-field" 
                  placeholder="08123456789"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Alamat (Opsional)</label>
                <textarea 
                  className="input-field min-h-[80px]" 
                  placeholder="Alamat lengkap pengiriman"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Catatan (Opsional)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Contoh: Ukuran baju L, suka warna biru"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                <input 
                  type="checkbox" 
                  id="is-vip"
                  checked={formData.isVip}
                  onChange={(e) => setFormData({ ...formData, isVip: e.target.checked })}
                  className="w-5 h-5 rounded-lg border-gray-300 text-secondary focus:ring-secondary"
                />
                <label htmlFor="is-vip" className="text-sm font-bold text-gray-700">Tandai sebagai Pelanggan VIP</label>
              </div>

              {formData.isVip && (
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-3">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Pengaturan Diskon VIP</p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-gray-400 mb-1 block">Jumlah Diskon</label>
                      <input 
                        type="number" 
                        className="input-field py-2" 
                        value={formData.vipDiscountValue || ''}
                        onChange={(e) => setFormData({ ...formData, vipDiscountValue: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-[10px] font-bold text-gray-400 mb-1 block">Tipe</label>
                      <select 
                        className="input-field py-2"
                        value={formData.vipDiscountType}
                        onChange={(e) => setFormData({ ...formData, vipDiscountType: e.target.value as any })}
                      >
                        <option value="percent">%</option>
                        <option value="nominal">Rp</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 italic">Diskon ini akan otomatis muncul saat transaksi di Kasir.</p>
                </div>
              )}
              <button 
                onClick={handleSave}
                className="btn-primary w-full gap-2 mt-4"
              >
                <Save size={18} /> {editingCustomer ? 'Simpan Perubahan' : 'Simpan Pelanggan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
