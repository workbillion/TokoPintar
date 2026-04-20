import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StoreConfig, StoreType } from '../types';
import { Storage } from '../services/storage';
import { DEFAULT_CATEGORIES } from '../constants';

import { isFirebaseConfigured } from '../firebase';

interface OnboardingProps {
  onComplete: (config: StoreConfig) => void;
  onOpenAuth: () => void;
  initialStep?: number;
}

export default function Onboarding({ onComplete, onOpenAuth, initialStep = 1 }: OnboardingProps) {
  const [step, setStep] = useState(initialStep);
  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    whatsapp: '',
    type: 'Fashion' as StoreType,
  });

  const handleFinish = () => {
    const config: StoreConfig = {
      ...formData,
      address: '',
      bankAccount: '',
      onboarded: true,
      categories: DEFAULT_CATEGORIES[formData.type] || ['Umum'],
    };
    onComplete(config);
  };

  return (
    <div className="fixed inset-0 bg-background z-[100] flex flex-col p-6 overflow-y-auto">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            <div className="w-24 h-24 bg-white rounded-[32px] shadow-strong flex items-center justify-center mb-8 overflow-hidden border border-black/5">
              <img 
                src="/logo.svg" 
                alt="Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-3xl font-black text-black mb-4 uppercase tracking-tighter leading-none">Selamat datang di TokoPintar!</h1>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Satu aplikasi untuk semua urusan jualan online kamu jadi lebih beres.</p>
            <div className="w-full space-y-3 mt-12">
              <button 
                onClick={isFirebaseConfigured ? onOpenAuth : () => setStep(2)} 
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              >
                Mulai Sekarang 🚀
              </button>
            </div>
            <p className="mt-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aman, Cepat, & Bisa Offline</p>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            <div className="w-24 h-24 bg-white rounded-[32px] shadow-strong flex items-center justify-center mb-8 overflow-hidden border border-black/5">
              <img 
                src="/logo.svg" 
                alt="Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-3xl font-black text-black mb-4 uppercase tracking-tighter leading-none">Kelola Pesanan & Stok</h1>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Pantau omzet, stok produk, hingga hutang pelanggan dalam satu genggaman.</p>
            <button onClick={() => setStep(3)} className="btn-primary w-full mt-12 border-2 border-black">Lanjut</button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <h1 className="text-2xl font-black text-black mb-8 uppercase tracking-tight">Siapkan Toko Kamu</h1>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Nama Toko</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: Toko Berkah Jaya"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Nama Pemilik</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Nama lengkap kamu"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Nomor WhatsApp Bisnis</label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="08123456789"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Jenis Produk</label>
                <select
                  className="input-field"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as StoreType })}
                >
                  <option value="Fashion">Fashion</option>
                  <option value="Kosmetik">Kosmetik</option>
                  <option value="Makanan">Makanan</option>
                  <option value="Aksesoris">Aksesoris</option>
                  <option value="Elektronik">Elektronik</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>
            </div>
            <button
              disabled={!formData.name || !formData.owner || !formData.whatsapp}
              onClick={handleFinish}
              className="btn-primary w-full mt-10 disabled:opacity-50 border-2 border-black"
            >
              Mulai Jualan 🚀
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
