import React, { useState } from 'react';
import { Search, Filter, Plus, MessageCircle, Send, CheckCircle, XCircle, ChevronRight, CreditCard, FileText, Printer, ExternalLink } from 'lucide-react';
import { Order, OrderStatus, Product, Customer } from '../types';
import { WA_TEMPLATES } from '../constants';
import InputModal from './InputModal';
import { printInvoice } from '../lib/print';

interface OrdersProps {
  orders: Order[];
  products: Product[];
  customers: Customer[];
  onAddOrder: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus, receipt?: string) => void;
  storeName: string;
  onOpenPOS: () => void;
}

export default function Orders({ orders, products, customers, onAddOrder, onUpdateStatus, storeName, onOpenPOS }: OrdersProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'Semua'>('Semua');
  const [showAddModal, setShowAddModal] = useState(false);
  const [resiModal, setResiModal] = useState<{ isOpen: boolean; order: Order | null }>({
    isOpen: false,
    order: null
  });

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customerName.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search);
    const matchesFilter = filterStatus === 'Semua' || o.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const sendWhatsapp = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="pb-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-secondary tracking-tight italic">Daftar Pesanan</h1>
        <div className="flex gap-3">
          <button onClick={onOpenPOS} className="px-6 h-12 bg-secondary text-white rounded-2xl flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-transform">
            <CreditCard size={18} className="text-primary" /> POS
          </button>
          <button onClick={() => setShowAddModal(true)} className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-transform">
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama atau ID..."
            className="input-field pl-10 py-2 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-white border border-[#E0E0E0] rounded-[10px] px-3 text-xs font-medium focus:outline-none"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
        >
          <option value="Semua">Semua</option>
          <option value="Baru Masuk">Baru</option>
          <option value="Dikonfirmasi">Konfirmasi</option>
          <option value="Diproses">Proses</option>
          <option value="Dikirim">Dikirim</option>
          <option value="Selesai">Selesai</option>
          <option value="Dibatalkan">Batal</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {filteredOrders.length > 0 ? (
          filteredOrders.map(order => (
            <div key={order.id} className="card p-0 overflow-hidden border-none shadow-soft">
              <div className="p-6 border-b border-black/5 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">#{order.id.substring(0, 8)}</span>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                      order.status === 'Selesai' ? 'bg-success/10 text-success' : 
                      order.status === 'Dibatalkan' ? 'bg-danger/10 text-danger' : 
                      'bg-secondary text-white'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-secondary">{order.customerName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{new Date(order.createdAt).toLocaleString('id-ID')}</p>
                    {order.receiptNumber && (
                      <>
                        <span className="text-gray-300">•</span>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{order.expedition}: {order.receiptNumber}</p>
                      </>
                    )}
                  </div>
                </div>
                <p className="font-serif font-bold text-primary text-lg">Rp {order.totalAmount.toLocaleString('id-ID')}</p>
              </div>
              
              <div className="p-6 bg-gray-50/30">
                <div className="space-y-2 mb-6">
                  {order.items.map((item, idx) => (
                    <p key={idx} className="text-[11px] text-gray-500 flex justify-between">
                      <span className="font-medium">{item.name} {item.variantName ? `(${item.variantName})` : ''} x{item.quantity}</span>
                      <span className="font-bold text-secondary">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                    </p>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => sendWhatsapp(order.customerWhatsapp, WA_TEMPLATES.CONFIRMATION(order.customerName, order.items[0].name, order.totalAmount.toLocaleString('id-ID'), storeName, 'BCA 123456789 a/n TokoPintar'))}
                    className="flex-1 min-w-[120px] bg-white border border-black/5 rounded-2xl py-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-secondary shadow-sm active:scale-95 transition-all"
                  >
                    <MessageCircle size={14} className="text-success" />
                    Konfirmasi
                  </button>
                  
                  <button
                    onClick={() => sendWhatsapp(order.customerWhatsapp, WA_TEMPLATES.INVOICE(order, storeName))}
                    className="flex-1 min-w-[120px] bg-secondary text-white rounded-2xl py-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                  >
                    <FileText size={14} className="text-primary" />
                    Kirim Invoice
                  </button>

                  <button
                    onClick={() => printInvoice(order, storeName)}
                    className="flex-1 min-w-[120px] bg-white border border-black/5 rounded-2xl py-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-secondary shadow-sm active:scale-95 transition-all"
                  >
                    <Printer size={14} className="text-primary" />
                    Cetak Struk
                  </button>

                  {order.status === 'Diproses' && (
                    <button
                      onClick={() => setResiModal({ isOpen: true, order })}
                      className="flex-1 bg-primary text-white rounded-2xl py-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/10 active:scale-95 transition-all"
                    >
                      <Send size={14} />
                      Kirim Resi
                    </button>
                  )}
                  {order.status === 'Dikirim' && (
                    <>
                      <button
                        onClick={() => {
                          const url = `https://cekresi.com/?noresi=${order.receiptNumber}`;
                          window.open(url, '_blank');
                        }}
                        className="flex-1 min-w-[120px] bg-primary/10 text-primary border border-primary/20 rounded-2xl py-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all"
                      >
                        <ExternalLink size={14} />
                        Lacak Pesanan
                      </button>
                      <button
                        onClick={() => onUpdateStatus(order.id, 'Selesai')}
                        className="flex-1 min-w-[120px] bg-success text-white rounded-2xl py-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-success/10 active:scale-95 transition-all"
                      >
                        <CheckCircle size={14} />
                        Selesai
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 opacity-50">
            <p className="text-xs">Belum ada pesanan yang sesuai kriteria. 🔍</p>
          </div>
        )}
      </div>
      
      {/* Add Order Modal (Simplified for brevity) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Catat Pesanan Baru</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 bg-gray-100 rounded-full"><XCircle size={20} /></button>
            </div>
            <p className="text-xs text-gray-500 mb-4 italic">Fitur tambah pesanan manual sedang dalam pengembangan. Gunakan Katalog untuk simulasi pesanan pelanggan.</p>
            <button onClick={() => setShowAddModal(false)} className="btn-primary w-full">Tutup</button>
          </div>
        </div>
      )}

      <InputModal 
        isOpen={resiModal.isOpen}
        title="Input Nomor Resi"
        message={`Masukkan nomor resi pengiriman untuk pesanan ${resiModal.order?.customerName}`}
        placeholder="Contoh: JNE123456789"
        onConfirm={(resi) => {
          if (resiModal.order) {
            onUpdateStatus(resiModal.order.id, 'Dikirim', resi);
            sendWhatsapp(resiModal.order.customerWhatsapp, WA_TEMPLATES.RECEIPT(resiModal.order.customerName, resiModal.order.expedition, resi));
          }
          setResiModal({ isOpen: false, order: null });
        }}
        onCancel={() => setResiModal({ isOpen: false, order: null })}
      />
    </div>
  );
}
