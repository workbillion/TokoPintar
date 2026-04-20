import React, { useState, useEffect } from 'react';
import { Plus, Search, Share2, Copy, ExternalLink, QrCode, Trash2, Edit2, Image as ImageIcon, FileText, Download, AlertCircle } from 'lucide-react';
import { Product, StoreConfig } from '../types';
import { ImageStorage } from '../services/storage';
import { WA_TEMPLATES } from '../constants';
import ConfirmModal from './ConfirmModal';

interface CatalogProps {
  userId: string;
  products: Product[];
  config: StoreConfig;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function Catalog({ userId, products, config, onAddProduct, onUpdateProduct, onDeleteProduct, showToast }: CatalogProps) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [previewImages, setPreviewImages] = useState<Record<string, string>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    costPrice: 0,
    salePrice: 0,
    stock: 0,
    minStock: 5,
    description: '',
    badge: '' as any
  });
  const [activeCategory, setActiveCategory] = useState('Semua');

  useEffect(() => {
    const loadImages = async () => {
      const images: Record<string, string> = {};
      for (const p of products) {
        if (p.image) {
          // If already base64, use it
          if (p.image.startsWith('data:image')) {
            images[p.id] = p.image;
          } else {
            // Try to recover from local storage
            const cached = await ImageStorage.get(userId, p.id);
            if (cached) images[p.id] = cached;
          }
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

  const openAddModal = () => {
    setEditingProduct(null);
    setError(null);
    setFormData({
      name: '',
      category: config.categories?.[0] || 'Umum',
      costPrice: 0,
      salePrice: 0,
      stock: 0,
      minStock: 5,
      description: '',
      badge: ''
    });
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setError(null);
    setFormData({
      name: product.name,
      category: product.category || config.categories?.[0] || 'Umum',
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      stock: product.stock,
      minStock: product.minStock,
      description: product.description || '',
      badge: product.badge || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.salePrice) {
      setError('Nama dan Harga Jual wajib diisi!');
      return;
    }
    setError(null);

    const imgFile = (document.getElementById('p-image') as HTMLInputElement).files?.[0];
    const productId = editingProduct?.id || crypto.randomUUID().split('-')[0];
    let imageId = editingProduct?.image;

    if (imgFile) {
      // Compress image
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const max = 800;
            if (width > height && width > max) {
              height *= max / width;
              width = max;
            } else if (height > max) {
              width *= max / height;
              height = max;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(imgFile);
      });

      await ImageStorage.save(userId, productId, base64);
      imageId = base64;
    } else if (editingProduct && !imageId?.startsWith('data:image')) {
      // Recover image if current state is just a marker
      const recovered = previewImages[editingProduct.id] || await ImageStorage.get(userId, editingProduct.id);
      if (recovered) imageId = recovered;
    }

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        ...formData,
        image: imageId
      });
    } else {
      onAddProduct({
        id: productId,
        sku: `SKU-${productId.toUpperCase()}`,
        ...formData,
        weight: 0,
        image: imageId,
        variants: []
      });
    }
    setShowModal(false);
  };

  const shareCatalog = () => {
    const link = `${window.location.origin}/?store=${userId}`;
    const message = WA_TEMPLATES.CATALOG_SHARE(config.name, link, config.shareMessage);
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const copyLink = () => {
    const link = `${window.location.origin}/?store=${userId}`;
    navigator.clipboard.writeText(link);
    showToast('Link toko berhasil disalin! 🔗', 'success');
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        // Simple CSV Parser (assuming: name,costPrice,salePrice,stock,minStock,description)
        const lines = content.split('\n');
        const newProducts: Product[] = [];
        
        // Skip header if it exists
        const startIdx = lines[0].toLowerCase().includes('nama') ? 1 : 0;

        for (let i = startIdx; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const parts = line.split(',').map(p => p.trim());
          if (parts.length < 3) continue;

          const id = crypto.randomUUID().split('-')[0];
          newProducts.push({
            id,
            sku: `SKU-${id.toUpperCase()}`,
            name: parts[0],
            costPrice: Number(parts[1]) || 0,
            salePrice: Number(parts[2]) || 0,
            stock: Number(parts[3]) || 0,
            minStock: Number(parts[4]) || 5,
            description: parts[5] || '',
            category: 'Umum',
            weight: 0,
            variants: []
          });
        }

        if (newProducts.length > 0) {
          newProducts.forEach(p => onAddProduct(p));
          showToast(`Berhasil mengimpor ${newProducts.length} produk! 🎉`, 'success');
        } else {
          setError('Tidak ada data produk yang valid ditemukan.');
        }
      } catch (err) {
        setError('Gagal membaca file. Pastikan format CSV benar.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const downloadTemplate = () => {
    const header = 'Nama Produk, Harga Modal, Harga Jual, Stok, Min Stok, Deskripsi\n';
    const example = 'Gamis Syari, 100000, 150000, 20, 5, Bahan adem dan nyaman\n';
    const blob = new Blob([header + example], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_produk_tokokita.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pb-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-secondary tracking-tight italic">Katalog Produk</h1>
        <div className="flex gap-3">
          <div className="relative">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleImportCSV}
              className="absolute inset-0 opacity-0 cursor-pointer"
              title="Import CSV"
            />
            <button className="w-12 h-12 bg-white text-secondary rounded-2xl flex items-center justify-center shadow-soft border border-black/5 active:scale-90 transition-transform">
              <FileText size={20} />
            </button>
          </div>
          <button onClick={openAddModal} className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-transform">
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Import Info */}
      <div className="mb-6 flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-400">
            <Download size={16} />
          </div>
          <p className="text-[10px] text-gray-500 font-medium">Punya banyak produk? Import via CSV.</p>
        </div>
        <button onClick={downloadTemplate} className="text-[10px] font-bold text-primary hover:underline">Download Template</button>
      </div>

      {/* Share Section */}
      <div className="bg-secondary text-white mb-8 p-8 rounded-[32px] flex items-center justify-between shadow-strong relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-lg font-serif font-bold text-primary mb-1">Toko Online Kamu</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bagikan katalog ke pelanggan</p>
        </div>
        <div className="flex gap-3 relative z-10">
          <button onClick={copyLink} className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center active:scale-90 transition-transform border border-white/5">
            <Copy size={18} className="text-primary" />
          </button>
          <button onClick={shareCatalog} className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center active:scale-90 transition-transform border border-white/5">
            <Share2 size={18} className="text-primary" />
          </button>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari produk..."
            className="input-field pl-10 py-2 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Filter */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar">
        <button 
          onClick={() => setActiveCategory('Semua')}
          className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
            activeCategory === 'Semua' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-400'
          }`}
        >
          Semua
        </button>
        {(config.categories || ['Umum']).map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
              activeCategory === cat ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredProducts.map(product => (
          <div key={product.id} className="card p-0 overflow-hidden flex flex-col group">
            <div className="aspect-square bg-gray-50 relative overflow-hidden">
              {(product.image?.startsWith('data:image') || previewImages[product.id]) ? (
                <img 
                  src={product.image?.startsWith('data:image') ? product.image : previewImages[product.id]} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-200">
                  <ImageIcon size={32} />
                </div>
              )}
              {product.badge && (
                <span className="absolute top-3 left-3 bg-primary text-white text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                  {product.badge}
                </span>
              )}
              <div className="absolute top-3 right-3 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(product);
                  }}
                  className="w-8 h-8 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center text-secondary shadow-lg active:scale-90"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmId(product.id);
                  }}
                  className="w-8 h-8 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center text-danger shadow-lg active:scale-90"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-secondary line-clamp-2 mb-1">{product.name}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stok: {product.stock} pcs</p>
              </div>
              <p className="text-base font-serif font-bold text-primary mt-3">Rp {product.salePrice.toLocaleString('id-ID')}</p>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 opacity-50">
          <p className="text-xs">Belum ada produk. Yuk tambah produk pertama kamu! 🛍️</p>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmModal 
        isOpen={!!deleteConfirmId}
        title="Hapus Produk?"
        message="Produk ini akan dihapus permanen dari katalog Anda."
        onConfirm={() => {
          if (deleteConfirmId) onDeleteProduct(deleteConfirmId);
          setDeleteConfirmId(null);
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 bg-gray-100 rounded-full"><Plus size={20} className="rotate-45" /></button>
            </div>
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-danger/10 text-danger text-[10px] font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Nama Produk</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Contoh: Gamis Syari Premium"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Kategori Produk</label>
                <select 
                  className="input-field"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {(config.categories || ['Umum']).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Harga Modal</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder="Rp 0"
                    value={formData.costPrice || ''}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Harga Jual</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder="Rp 0"
                    value={formData.salePrice || ''}
                    onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Stok</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder="0"
                    value={formData.stock || ''}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Min. Stok</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder="5"
                    value={formData.minStock || ''}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Badge (Opsional)</label>
                <select 
                  className="input-field"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value as any })}
                >
                  <option value="">Tanpa Badge</option>
                  <option value="Best Seller">Best Seller</option>
                  <option value="New Arrival">New Arrival</option>
                  <option value="Ready">Ready</option>
                  <option value="Indent">Indent</option>
                  <option value="Habis">Habis</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Deskripsi</label>
                <textarea 
                  className="input-field min-h-[80px]" 
                  placeholder="Detail produk..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Foto Produk {editingProduct && '(Biarkan kosong jika tidak ingin ganti)'}</label>
                <input type="file" id="p-image" accept="image/*" className="text-xs" />
              </div>
              <button 
                onClick={handleSave}
                className="btn-primary w-full"
              >
                {editingProduct ? 'Simpan Perubahan' : 'Simpan Produk'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
