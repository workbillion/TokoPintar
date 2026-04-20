import { Order } from '../types';

export const printInvoice = (order: Order, storeName: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice #${order.id}</title>
      <style>
        body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #333; line-height: 1.4; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; }
        .store-name { font-size: 20px; font-weight: bold; text-transform: uppercase; }
        .info { margin-bottom: 20px; font-size: 12px; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table th { text-align: left; border-bottom: 1px solid #eee; padding: 5px 0; font-size: 12px; }
        .table td { padding: 5px 0; font-size: 12px; }
        .total-section { border-top: 1px dashed #ccc; padding-top: 10px; text-align: right; }
        .total-row { display: flex; justify-content: flex-end; gap: 20px; font-weight: bold; }
        .footer { text-align: center; margin-top: 40px; font-size: 10px; color: #888; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="store-name">${storeName}</div>
        <div>Struk Pembelian Resmi</div>
      </div>

      <div class="info">
        <div>ID Pesanan: #${order.id}</div>
        <div>Tanggal: ${new Date(order.createdAt).toLocaleString('id-ID')}</div>
        <div>Pelanggan: ${order.customerName}</div>
        <div>Pembayaran: ${order.paymentMethod}</div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Produk</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Harga</th>
            <th style="text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td>${item.name} ${item.variantName ? `(${item.variantName})` : ''}</td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right;">Rp ${item.price.toLocaleString('id-ID')}</td>
              <td style="text-align: right;">Rp ${(item.price * item.quantity).toLocaleString('id-ID')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-section">
        <div class="total-row" style="font-weight: normal; font-size: 10px; margin-bottom: 5px;">
          <span>Subtotal:</span>
          <span>Rp ${(order.totalAmount + (order.discountAmount || 0)).toLocaleString('id-ID')}</span>
        </div>
        ${order.discountAmount ? `
          <div class="total-row" style="font-weight: normal; font-size: 10px; color: #d32f2f; margin-bottom: 5px;">
            <span>Diskon:</span>
            <span>- Rp ${order.discountAmount.toLocaleString('id-ID')}</span>
          </div>
        ` : ''}
        <div class="total-row">
          <span>TOTAL BAYAR:</span>
          <span>Rp ${order.totalAmount.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div class="footer">
        <p>Terima kasih telah berbelanja di ${storeName}!</p>
        <p>Simpan struk ini sebagai bukti pembayaran yang sah.</p>
      </div>

      <script>
        window.onload = () => {
          window.print();
          // window.close(); // Optional: close after print
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
