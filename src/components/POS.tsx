import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, ShoppingCart, Trash2, Plus, Minus, User, CreditCard, CheckCircle, X, Receipt, FileText, Printer, Image as ImageIcon } from 'lucide-react';
import { Product, Order, Customer, OrderItem, Debt } from '../types';
import { WA_TEMPLATES } from '../constants';
import { printInvoice } from '../lib/print';
import { ImageStorage } from '../services/storage';

interface POSProps {
  userId: string;
  products: Product[];
  customers: Customer[];
  onAddOrder: (order: Order) => void;
  onAddDebt?: (debt: Debt) => void;
  onClose: () => void;
  storeName: string;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function POS({ userId, products, customers, onAddOrder, onAddDebt, onClose, storeName, showToast }: POSProps) {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Transfer' | 'QRIS' | 'Tempo/Hutang'>('COD');
  const [expedition, setExpedition] = useState<'JNE' | 'J&T' | 'SiCepat' | 'Anteraja' | 'GoSend' | 'Ambil Sendiri'>('Ambil Sendiri');
  const [isCheckout, setIsCheckout] = useState(false);
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [globalDiscountValue, setGlobalDiscountValue] = useState<number>(0);
  const [globalDiscountType, setGlobalDiscountType] = useState<'percent' | 'nominal'>('percent');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [previewImages, setPreviewImages] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadImages = async () => {
      const images: Record<string, string> = {};
      for (const p of products) {
        if (p.image) {
          if (p.image.startsWith('data:image')) {
            images[p.id] = p.image;
          } else {
            const img = await ImageStorage.get(userId, p.id);
            if (img) images[p.id] = img;
          }
        }
      }
      setPreviewImages(images);
    };
    loadImages();
  }, [products, userId]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'Semua' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id);
    const currentQty = existing ? existing.quantity : 0;
    
    if (currentQty + 1 > product.stock) {
      showToast(`Stok tidak mencukupi! Sisa stok: ${product.stock}`, 'error');
      return;
    }

    if (existing) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: product.salePrice,
        originalPrice: product.salePrice
      }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        if (newQty > product.stock) {
          showToast(`Stok tidak mencukupi! Sisa stok: ${product.stock}`, 'error');
          return item;
        }
        return { ...item, quantity: Math.max(0, newQty) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
  
  const discountAmount = useMemo(() => {
    if (globalDiscountType === 'percent') {
      return (subtotal * globalDiscountValue) / 100;
    }
    return globalDiscountValue;
  }, [subtotal, globalDiscountValue, globalDiscountType]);

  const total = Math.max(0, subtotal - discountAmount);
  const change = cashAmount - total;

  const handleCheckout = () => {
    const customer = customers.find(c => c.id === selectedCustomerId);
    
    if (paymentMethod === 'Tempo/Hutang' && !customer) {
      showToast('Pilih pelanggan terlebih dahulu untuk pembayaran Tempo/Hutang', 'error');
      return;
    }

    const orderId = crypto.randomUUID().split('-')[0].toUpperCase();
    const newOrder: Order = {
      id: orderId,
      customerName: customer?.name || 'Pelanggan Umum',
      customerWhatsapp: customer?.whatsapp || '',
      items: cart,
      totalAmount: total,
      discountAmount: discountAmount,
      shippingCost: 0,
      paymentMethod: paymentMethod,
      expedition: expedition,
      status: expedition === 'Ambil Sendiri' ? 'Selesai' : 'Diproses',
      notes: 'Transaksi Kasir POS',
      createdAt: new Date().toISOString()
    };

    // Create debt if payment method is Tempo/Hutang
    if (paymentMethod === 'Tempo/Hutang' && customer && onAddDebt) {
      onAddDebt({
        id: `debt-${crypto.randomUUID().split('-')[0]}`,
        customerId: customer.id,
        customerName: customer.name,
        orderId: orderId,
        amount: total,
        remainingAmount: total,
        description: `Belanja POS - ${cart.map(i => i.name).join(', ')}`.substring(0, 100),
        date: new Date().toISOString(),
        dueDate: '', // Can be set later
        isInstallment: false,
        payments: []
      });
    }

    onAddOrder(newOrder);
    setSuccessOrder(newOrder);
    setIsCheckout(false);
    setCart([]);
  };

  const sendWhatsapp = (phone: string, message: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-background z-[70] flex flex-col">
      {/* Header */}
      <header className="bg-white p-6 flex items-center justify-between shadow-soft border-b border-black/5">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-3 bg-secondary text-white rounded-2xl active:scale-90 transition-transform shadow-lg">
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center overflow-hidden border border-black/5">
              <img 
                src="/logo.svg" 
                alt="Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="font-serif font-bold text-xl md:text-2xl text-secondary tracking-tight italic">Kasir POS</h1>
          </div>
        </div>
        <div className="relative">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
            <ShoppingCart className="w-[22px] h-[22px] md:w-7 md:h-7 text-primary" />
          </div>
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-secondary text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Product Search & List */}
        <div className="p-4 bg-white border-b border-gray-50 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-[18px] h-[18px] md:w-5 md:h-5" />
            <input
              type="text"
              placeholder="Cari produk atau scan SKU..."
              className="input-field pl-10 py-2 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex overflow-x-auto gap-2 no-scrollbar">
            <button 
              onClick={() => setActiveCategory('Semua')}
              className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                activeCategory === 'Semua' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-400'
              }`}
            >
              Semua
            </button>
            {(products.reduce((acc: string[], p) => p.category && !acc.includes(p.category) ? [...acc, p.category] : acc, [])).map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                  activeCategory === cat ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 md:p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4 pb-40">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden text-left flex flex-col active:scale-95 transition-transform hover:border-primary/50 group h-full min-h-[160px] md:min-h-[200px]"
            >
              <div className="w-full aspect-[4/3] sm:aspect-square bg-gray-50 relative overflow-hidden flex-shrink-0">
                {(product.image?.startsWith('data:image') || previewImages[product.id]) ? (
                  <img 
                    src={product.image?.startsWith('data:image') ? product.image : previewImages[product.id]} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-200">
                    <ImageIcon size={20} />
                  </div>
                )}
              </div>
              <div className="p-2 md:p-4 flex flex-col flex-1 justify-between gap-1">
                <div className="space-y-0.5 md:space-y-1">
                  <h3 className="text-[10px] md:text-sm font-bold text-secondary line-clamp-2 leading-tight">{product.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stok:</span>
                    <span className={`text-[8px] md:text-[10px] font-bold ${product.stock <= 5 ? 'text-danger' : 'text-gray-500'}`}>{product.stock}</span>
                  </div>
                </div>
                <p className="text-[11px] md:text-base font-serif font-bold text-primary">Rp {product.salePrice.toLocaleString('id-ID')}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Cart Summary (Sticky Bottom) */}
        {cart.length > 0 && (
          <div className="bg-secondary p-8 shadow-strong rounded-t-[40px]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Bayar</p>
                <p className="text-3xl font-serif font-bold text-primary">Rp {total.toLocaleString('id-ID')}</p>
              </div>
              <button
                onClick={() => setIsCheckout(true)}
                className="btn-primary px-12"
              >
                Bayar
              </button>
            </div>
            
            {/* Mini Cart Preview */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {cart.map(item => (
                <div key={item.productId} className="flex-shrink-0 bg-white/10 px-4 py-2 rounded-xl flex flex-col gap-1 border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] md:text-xs font-bold text-white uppercase tracking-tight">{item.name} x{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, -1)} className="text-primary hover:scale-110 transition-transform">
                      <Minus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {isCheckout && (
        <div className="fixed inset-0 bg-black/50 z-[80] flex items-end">
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="bg-white w-full rounded-t-[32px] p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg md:text-xl font-bold">Pembayaran</h2>
              <button onClick={() => setIsCheckout(false)} className="p-2 bg-gray-100 rounded-full">
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer Selection */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Pilih Pelanggan (Opsional)</label>
                <div className="flex gap-2">
                  <select
                    className="input-field flex-1 py-2 text-sm"
                    value={selectedCustomerId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setSelectedCustomerId(cid);
                      const customer = customers.find(c => c.id === cid);
                      if (customer?.isVip) {
                        const val = customer.vipDiscountValue || 0;
                        const type = customer.vipDiscountType || 'percent';
                        const displayVal = type === 'percent' ? `${val}%` : `Rp ${val.toLocaleString('id-ID')}`;
                        
                        showToast(`Pelanggan VIP! Diskon ${displayVal} otomatis diterapkan.`, 'success');
                        setGlobalDiscountValue(val);
                        setGlobalDiscountType(type);
                      } else {
                        setGlobalDiscountValue(0);
                      }
                    }}
                  >
                    <option value="">Pelanggan Umum</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.isVip ? '(VIP)' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Manual Global Discount */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Diskon Invoice</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="input-field flex-1 py-2 text-sm"
                    placeholder="0"
                    value={globalDiscountValue || ''}
                    onChange={(e) => setGlobalDiscountValue(Number(e.target.value))}
                  />
                  <select
                    className="input-field w-24 py-2 text-sm"
                    value={globalDiscountType}
                    onChange={(e) => setGlobalDiscountType(e.target.value as any)}
                  >
                    <option value="percent">%</option>
                    <option value="nominal">Rp</option>
                  </select>
                </div>
              </div>

              {/* Shipping Method / Expedition */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Metode Pengiriman</label>
                <select
                  className="input-field py-2 text-sm"
                  value={expedition}
                  onChange={(e) => setExpedition(e.target.value as any)}
                >
                  <option value="Ambil Sendiri">Ambil Sendiri (Takeaway)</option>
                  <option value="JNE">JNE</option>
                  <option value="J&T">J&T Express</option>
                  <option value="SiCepat">SiCepat</option>
                  <option value="Anteraja">Anteraja</option>
                  <option value="GoSend">GoSend / GrabExpress</option>
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['COD', 'Transfer', 'QRIS', 'Tempo/Hutang'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`py-3 rounded-xl border-2 font-bold text-[10px] transition-all ${
                        paymentMethod === m ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-400'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash Input for COD */}
              {paymentMethod === 'COD' && (
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Uang Tunai</label>
                  <input
                    type="number"
                    className="input-field text-lg font-bold"
                    placeholder="Rp 0"
                    value={cashAmount || ''}
                    onChange={(e) => setCashAmount(Number(e.target.value))}
                  />
                  {cashAmount > 0 && (
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-gray-500">Kembalian:</span>
                      <span className={`font-bold ${change >= 0 ? 'text-success' : 'text-danger'}`}>
                        Rp {change.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-gray-400 text-xs">Subtotal</span>
                  <span className="font-bold text-gray-500">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-danger text-xs">Diskon</span>
                    <span className="font-bold text-danger">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-gray-500">Total Tagihan</span>
                  <span className="text-xl font-bold text-primary">Rp {total.toLocaleString('id-ID')}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={paymentMethod === 'COD' && cashAmount < total}
                  className="btn-primary w-full gap-2 disabled:opacity-50 py-4 md:py-5 text-sm md:text-base"
                >
                  <CheckCircle className="w-5 h-5 md:w-6 md:h-6" /> Konfirmasi & Selesai
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {/* Success Modal */}
      {successOrder && (
        <div className="fixed inset-0 bg-secondary z-[90] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-sm rounded-[40px] p-8 text-center shadow-strong"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 md:w-12 md:h-12" />
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-secondary mb-2">Transaksi Berhasil!</h2>
            <p className="text-sm text-gray-400 mb-8">Pesanan #{successOrder.id} telah dicatat.</p>
            
            <div className="space-y-3">
              {successOrder.customerWhatsapp && (
                <button
                  onClick={() => sendWhatsapp(successOrder.customerWhatsapp, WA_TEMPLATES.INVOICE(successOrder, storeName))}
                  className="btn-primary w-full gap-2 py-4 md:py-5"
                >
                  <FileText className="w-4.5 h-4.5 md:w-5 md:h-5" /> Kirim Invoice WA
                </button>
              )}
              <button
                onClick={() => printInvoice(successOrder, storeName)}
                className="w-full py-4 md:py-5 bg-white border border-black/5 text-secondary rounded-2xl text-[10px] md:text-xs font-bold uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Printer className="w-4.5 h-4.5 md:w-5 md:h-5 text-primary" /> Cetak Struk
              </button>
              <button
                onClick={onClose}
                className="w-full py-4 bg-gray-50 text-secondary rounded-2xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all"
              >
                Tutup Kasir
              </button>
              <button
                onClick={() => setSuccessOrder(null)}
                className="w-full py-4 text-primary text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all"
              >
                Transaksi Baru
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
