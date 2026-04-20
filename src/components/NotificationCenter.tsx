import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Info, AlertTriangle, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

export default function NotificationCenter({ notifications, onClose, onMarkAsRead, onClearAll }: NotificationCenterProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'info': return <Info size={18} className="text-primary" />;
      case 'warning': return <AlertTriangle size={18} className="text-secondary" />;
      case 'success': return <CheckCircle size={18} className="text-success" />;
      case 'danger': return <AlertCircle size={18} className="text-danger" />;
    }
  };

  const getBg = (type: AppNotification['type']) => {
    switch (type) {
      case 'info': return 'bg-primary/10';
      case 'warning': return 'bg-secondary/10';
      case 'success': return 'bg-success/10';
      case 'danger': return 'bg-danger/10';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-sm bg-background h-full shadow-2xl flex flex-col"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold">Notifikasi</h2>
            {unreadCount > 0 && (
              <span className="bg-danger text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount} Baru
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onClearAll}
              className="p-2 text-gray-400 hover:text-danger transition-colors"
              title="Hapus Semua"
            >
              <Trash2 size={18} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence initial={false}>
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => onMarkAsRead(notif.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    notif.read ? 'bg-white border-gray-100 opacity-70' : 'bg-white border-primary/20 shadow-sm'
                  }`}
                >
                  {!notif.read && <div className="absolute top-0 left-0 w-1 h-full bg-primary" />}
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getBg(notif.type)}`}>
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-sm font-bold mb-1 ${notif.read ? 'text-gray-600' : 'text-gray-900'}`}>
                        {notif.title}
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-2">
                        {new Date(notif.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30 py-20">
                <Bell size={48} className="mb-4" />
                <p className="text-sm font-medium">Belum ada notifikasi</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
