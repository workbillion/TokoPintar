import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InputModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function InputModal({
  isOpen,
  title,
  message,
  placeholder = 'Masukkan nilai...',
  confirmText = 'Simpan',
  cancelText = 'Batal',
  onConfirm,
  onCancel
}: InputModalProps) {
  const [value, setValue] = useState('');

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value);
      setValue('');
    }
  };

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
            className="relative bg-white w-full max-w-xs rounded-[32px] p-6 shadow-2xl"
          >
            <h3 className="text-lg font-bold mb-2">{title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              {message}
            </p>
            
            <input
              type="text"
              className="input-field mb-6"
              placeholder={placeholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
            
            <div className="flex flex-col gap-2">
              <button
                onClick={handleConfirm}
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-primary shadow-primary/20 shadow-lg transition-transform active:scale-95"
              >
                {confirmText}
              </button>
              <button
                onClick={onCancel}
                className="w-full py-3 rounded-xl text-sm font-bold text-gray-400 hover:bg-gray-50 transition-colors"
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
