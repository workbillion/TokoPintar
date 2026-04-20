import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Ya, Hapus', 
  cancelText = 'Batal',
  type = 'danger',
  onConfirm, 
  onCancel 
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white w-full max-w-xs rounded-[32px] p-6 shadow-2xl overflow-hidden"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${
              type === 'danger' ? 'bg-danger text-white' : 
              type === 'warning' ? 'bg-primary text-black' : 
              'bg-black text-primary'
            } shadow-lg`}>
              <AlertTriangle size={28} />
            </div>
            
            <h3 className="text-xl font-black uppercase tracking-tight mb-2">{title}</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-tight mb-8">
              {message}
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={onConfirm}
                className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-transform active:scale-95 ${
                  type === 'danger' ? 'bg-danger text-white' : 
                  type === 'warning' ? 'bg-primary text-black' : 
                  'bg-black text-primary'
                } shadow-xl border-2 border-black/10`}
              >
                {confirmText}
              </button>
              <button 
                onClick={onCancel}
                className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-colors"
              >
                {cancelText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
