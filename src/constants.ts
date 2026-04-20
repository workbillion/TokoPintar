import { StoreType } from './types';

export const TIPS_JUALAN = [
  "Selalu respon chat pelanggan kurang dari 5 menit untuk tingkatkan closing rate! ⚡",
  "Gunakan foto produk dengan background polos agar terlihat lebih profesional. 📸",
  "Update status WA minimal 3x sehari: pagi, siang, dan malam. 📱",
  "Berikan diskon khusus untuk pelanggan yang repeat order (beli lagi). 🎁",
  "Pastikan packing rapi dan aman agar pelanggan merasa dihargai. 📦",
  "Tawarkan produk pelengkap (cross-selling) saat pelanggan sedang order. 🤝",
  "Simpan nomor WA pelanggan dan sapa mereka secara personal sesekali. 😊",
  "Gunakan fitur Katalog TokoPintar untuk memudahkan pelanggan memilih produk. 🛍️",
  "Catat semua hutang pelanggan agar arus kas toko tetap sehat. 💰",
  "Jangan lupa restock produk best seller sebelum stok benar-benar habis! ⚠️"
];

export const WA_TEMPLATES = {
  CONFIRMATION: (name: string, product: string, nominal: string, storeName: string, bank: string) => 
    `Halo ${name}, pesanan ${product} sudah kami terima ya! Total: Rp ${nominal}. Mohon transfer ke ${bank}. Terima kasih sudah belanja di ${storeName} 🙏`,
  
  RECEIPT: (name: string, expedition: string, receipt: string) => 
    `Halo ${name}, pesanan kamu sudah dikirim! Ekspedisi: ${expedition}, Resi: ${receipt}. Cek di: https://cekresi.com/?noresi=${receipt}`,
  
  DEBT_REMINDER_SOFT: (name: string, product: string, nominal: string, date: string) => 
    `Halo ${name} 😊 Maaf mengganggu ya. Mau mengingatkan pembayaran untuk ${product} sebesar Rp ${nominal} yang jatuh tempo ${date}. Terima kasih banyak 🙏`,
  
  DEBT_REMINDER_DUE: (name: string, product: string, nominal: string, date: string) => 
    `Halo ${name}, maaf ya mengganggu 🙏 Pembayaran untuk ${product} Rp ${nominal} sudah jatuh tempo ${date}. Kalau ada kendala bisa hubungi kami dulu ya, kita cari solusi bersama 😊`,
  
  DEBT_REMINDER_FINAL: (name: string, product: string, nominal: string) => 
    `Halo ${name} 🙏 Ini pengingat terakhir untuk pembayaran ${product} Rp ${nominal}. Mohon segera dikonfirmasi agar kami bisa terus melayani dengan baik. Terima kasih.`,
  
  CATALOG_SHARE: (storeName: string, link: string, customMessage?: string) => 
    `Halo! Lihat produk lengkap kami di ${storeName} di sini 👇\n${link}\n${customMessage || 'Fast respon, kualitas terjamin! 🚀'}`,

  INVOICE: (order: any, storeName: string) => {
    const itemsList = order.items.map((item: any) => 
      `- ${item.name}${item.variantName ? ` (${item.variantName})` : ''} x${item.quantity}: Rp ${(item.price * item.quantity).toLocaleString('id-ID')}`
    ).join('\n');

    const discountText = order.discountAmount > 0 
      ? `\nSubtotal: Rp ${(order.totalAmount + order.discountAmount).toLocaleString('id-ID')}\n` +
        `Diskon: - Rp ${order.discountAmount.toLocaleString('id-ID')}\n`
      : '';

    return `*INVOICE / FAKTUR PENJUALAN*\n` +
           `----------------------------------------\n` +
           `No. Faktur: #${order.id}\n` +
           `Tanggal: ${new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n` +
           `Toko: ${storeName}\n\n` +
           `*Kepada:* ${order.customerName}\n\n` +
           `*Detail Pesanan:*\n${itemsList}\n${discountText}\n` +
           `*Total Bayar: Rp ${order.totalAmount.toLocaleString('id-ID')}*\n` +
           `Metode: ${order.paymentMethod}\n` +
           `----------------------------------------\n` +
           `Terima kasih telah berbelanja di ${storeName}! 🙏`;
  }
};

export const DEFAULT_CATEGORIES: Record<StoreType, string[]> = {
  'Fashion': ['Atasan', 'Bawahan', 'Hijab', 'Aksesoris', 'Sepatu'],
  'Kosmetik': ['Skincare', 'Makeup', 'Bodycare', 'Parfum'],
  'Makanan': ['Makanan Berat', 'Camilan', 'Minuman', 'Frozen Food'],
  'Aksesoris': ['Perhiasan', 'Tas', 'Jam Tangan', 'Kacamata'],
  'Elektronik': ['Handphone', 'Laptop', 'Aksesoris gadget', 'Rumah Tangga'],
  'Lain-lain': ['Umum']
};
