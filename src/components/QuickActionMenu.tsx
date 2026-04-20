import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ShoppingBag, Package, Users, CreditCard, X } from 'lucide-react';

interface QuickActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}

export default function QuickActionMenu({ isOpen, onClose, onAction }: QuickActionMenuProps) {
  const actions = [
    { id: 'new_order', label: 'Pesanan Baru', icon: ShoppingBag, color: 'bg-primary', text: 'text-white' },
    { id: 'new_product', label: 'Tambah Produk', icon: Package, color: 'bg-secondary', text: 'text-white' },
    { id: 'new_customer', label: 'Pelanggan Baru', icon: Users, color: 'bg-success', text: 'text-white' },
    { id: 'new_expense', label: 'Catat Pengeluaran', icon: CreditCard, color: 'bg-danger', text: 'text-white' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center px-4 pb-24">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            className="relative bg-white w-full max-w-xs rounded-[32px] p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-800">Menu Cepat</h3>
              <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-400">
                <X className="w-4.5 h-4.5 md:w-5 md:h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    onAction(action.id);
                    onClose();
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 active:scale-95 transition-all"
                >
                  <div className={`w-12 h-12 md:w-14 md:h-14 ${action.color} ${action.text} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <action.icon className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-gray-600">{action.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
