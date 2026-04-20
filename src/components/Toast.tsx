import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

export default function Toast({ message, type, isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const icons = {
    success: <CheckCircle size={18} className="text-success" />,
    error: <AlertCircle size={18} className="text-danger" />,
    info: <Info size={18} className="text-primary" />
  };

  const bgColors = {
    success: 'bg-white border-success',
    error: 'bg-white border-danger',
    info: 'bg-black border-primary'
  };

  const textColors = {
    success: 'text-black',
    error: 'text-black',
    info: 'text-primary'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-6 left-4 right-4 z-[300] flex justify-center pointer-events-none"
        >
          <div className={`max-w-md w-full ${bgColors[type]} border-2 rounded-2xl p-4 shadow-2xl flex items-center justify-between pointer-events-auto`}>
            <div className="flex items-center gap-3">
              {icons[type]}
              <p className={`text-xs font-black uppercase tracking-tight ${textColors[type]}`}>{message}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
