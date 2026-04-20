import React, { useState, useEffect } from 'react';
import { ShoppingCart, MessageCircle, Search, ChevronLeft, Plus, Minus, Trash2, X } from 'lucide-react';
import { Product, StoreConfig } from '../types';
import { ImageStorage } from '../services/storage';

interface MiniStoreProps {
  userId: string;
  storeName: string;
  products: Product[];
  config: StoreConfig;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function MiniStore({ userId, storeName, products, config }: MiniStoreProps) {
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [previewImages, setPreviewImages] = useState<Record<string, string>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Semua');

  useEffect(() => {
    const loadImages = async () => {
      const images: Record<string, string> = {};
      for (const p of products) {
        if (p.image) {
          const img = await ImageStorage.get(userId, p.id);
          if (img) images[p.id] = img;
        }
      }
      setPreviewImages(images);
    };
    loadImages();
  }, [products, userId]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'Semua' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.salePrice * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const orderViaWA = () => {
    if (cart.length === 0) return;

    let message = `*PESANAN BARU - ${config.name}*\n`;
    message += `----------------------------\n`;
    cart.forEach((item, index) => {
      message += `${index + 1}. ${item.product.name} x${item.quantity}\n`;
      message += `   Harga: Rp ${(item.product.salePrice * item.quantity).toLocaleString('id-ID')}\n`;
    });
    message += `----------------------------\n`;
    message += `*TOTAL BAYAR: Rp ${cartTotal.toLocaleString('id-ID')}*\n\n`;
    
    if (config.bankAccount) {
      message += `*PEMBAYARAN KE:*\n${config.bankAccount}\n\n`;
    }
    
    message += `Mohon segera diproses ya, terima kasih! 🙏`;

    const cleanPhone = config.whatsapp.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-primary p-8 text-white text-center rounded-b-[40px] shadow-strong mb-6 relative overflow-hidden">
        <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center overflow-hidden">
          <img 
            src={config.logo || "/logo.svg"} 
            alt="Logo" 
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <h1 className="text-2xl font-bold mb-1">{storeName}</h1>
        <p className="text-sm opacity-80 italic">{config.miniStoreGreeting || "Selamat berbelanja! ✨"}</p>
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      </header>

      <div className="px-4">
        {/* Search */}
        <div className="relative mb-6">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari produk impianmu..."
            className="input-field pl-10 py-3 shadow-soft border-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div className="flex overflow-x-auto gap-2 mb-8 pb-1 no-scrollbar">
          <button 
            onClick={() => setActiveCategory('Semua')}
            className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
              activeCategory === 'Semua' ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-400 border border-black/5'
            }`}
          >
            Semua
          </button>
          {(config.categories || ['Umum']).map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                activeCategory === cat ? 'bg-primary text-white shadow-lg' : 'bg-white text-gray-400 border border-black/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map(product => (
            <div key={product.id} onClick={() => setSelectedProduct(product)} className="card p-0 overflow-hidden active:scale-95 transition-transform">
              <div className="aspect-square bg-gray-100">
                {(product.image?.startsWith('data:image') || previewImages[product.id]) ? (
                  <img 
                    src={product.image?.startsWith('data:image') ? product.image : previewImages[product.id]} 
                    alt={product.name} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ShoppingCart size={32} />
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-xs font-bold line-clamp-2 mb-1">{product.name}</h3>
                <p className="text-sm font-bold text-primary">Rp {product.salePrice.toLocaleString('id-ID')}</p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                  }}
                  className="w-full mt-2 bg-primary text-white py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 shadow-soft"
                >
                  <Plus size={12} /> Tambah
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-primary text-white rounded-full shadow-strong flex items-center justify-center z-50 animate-bounce"
        >
          <div className="relative">
            <ShoppingCart size={28} />
            <span className="absolute -top-2 -right-2 bg-danger text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
              {cartCount}
            </span>
          </div>
        </button>
      )}

      {/* Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-end">
          <div className="bg-white w-full rounded-t-[32px] max-h-[80vh] flex flex-col p-6 shadow-strong">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart className="text-primary" /> Keranjang Belanja
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl">
                  <div className="w-16 h-16 bg-white rounded-xl overflow-hidden flex-shrink-0">
                    {(item.product.image?.startsWith('data:image') || previewImages[item.product.id]) ? (
                      <img 
                        src={item.product.image?.startsWith('data:image') ? item.product.image : previewImages[item.product.id]} 
                        alt={item.product.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <ShoppingCart size={20} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold line-clamp-1">{item.product.name}</h4>
                    <p className="text-xs text-primary font-bold">Rp {item.product.salePrice.toLocaleString('id-ID')}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button onClick={() => updateQuantity(item.product.id, -1)} className="w-6 h-6 bg-white border border-gray-200 rounded-md flex items-center justify-center">
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} className="w-6 h-6 bg-white border border-gray-200 rounded-md flex items-center justify-center">
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.product.id)} className="text-danger p-2">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-gray-500">Total Pembayaran</span>
                <span className="text-xl font-bold text-primary">Rp {cartTotal.toLocaleString('id-ID')}</span>
              </div>
              <button onClick={orderViaWA} className="btn-primary w-full gap-3 py-4">
                <MessageCircle size={20} /> Pesan via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end">
          <div className="bg-white w-full rounded-t-[32px] overflow-hidden max-h-[90vh] flex flex-col">
            <div className="relative aspect-square bg-gray-100">
              <button onClick={() => setSelectedProduct(null)} className="absolute top-4 left-4 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-md z-10">
                <ChevronLeft size={24} />
              </button>
              {(selectedProduct.image?.startsWith('data:image') || previewImages[selectedProduct.id]) ? (
                <img 
                  src={selectedProduct.image?.startsWith('data:image') ? selectedProduct.image : previewImages[selectedProduct.id]} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <ShoppingCart size={48} />
                </div>
              )}
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <h2 className="text-xl font-bold mb-2">{selectedProduct.name}</h2>
              <p className="text-2xl font-bold text-primary mb-4">Rp {selectedProduct.salePrice.toLocaleString('id-ID')}</p>
              <div className="bg-gray-50 p-4 rounded-2xl mb-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Deskripsi Produk</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {selectedProduct.description || 'Produk berkualitas tinggi untuk menunjang gaya hidupmu. Stok terbatas, yuk diorder sekarang!'}
                </p>
              </div>
              <button 
                onClick={() => {
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                  setIsCartOpen(true);
                }} 
                className="btn-primary w-full gap-3"
              >
                <Plus size={20} /> Tambah ke Keranjang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
