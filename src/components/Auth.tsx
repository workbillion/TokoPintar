import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn, UserPlus, X, Loader2, Eye, EyeOff } from 'lucide-react';
import { auth, db, isFirebaseConfigured } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Chrome, KeyRound } from 'lucide-react';

interface AuthProps {
  onClose: () => void;
  onSuccess: (userId: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function Auth({ onClose, onSuccess, showToast }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'admin' | 'kasir'>('admin');
  const [storeCode, setStoreCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOffline = () => {
    onSuccess('local-user');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Masukkan email Anda terlebih dahulu', 'error');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showToast('Email reset password telah dikirim! Cek inbox/spam Anda.', 'success');
      setIsResetting(false);
    } catch (error: any) {
      console.error('Reset password failed:', error);
      showToast('Gagal mengirim email reset. Pastikan email terdaftar.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured) {
      handleOffline();
      return;
    }
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Use popup for better UX in most cases, but handle potential blocks
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if profile exists
      const profileDoc = await getDoc(doc(db, 'users', user.uid, 'config', 'main'));
      if (!profileDoc.exists()) {
        // Create default profile for new Google user
        const profileData = { 
          id: user.uid, 
          role: 'admin' as const, 
          onboarded: false,
          email: user.email,
          createdAt: new Date().toISOString()
        };
        // Remove undefined values
        const sanitizedProfile = Object.fromEntries(
          Object.entries(profileData).filter(([_, v]) => v !== undefined)
        );
        await setDoc(doc(db, 'users', user.uid, 'config', 'main'), sanitizedProfile);
      }
      
      showToast('Login Google Berhasil!', 'success');
      onSuccess(user.uid);
    } catch (error: any) {
      console.error('Google Auth failed:', error);
      if (error.code === 'auth/popup-blocked') {
        showToast('Popup diblokir browser. Izinkan popup untuk login.', 'error');
      } else if (error.code === 'auth/unauthorized-domain') {
        showToast('Domain ini belum diizinkan di Firebase Console.', 'error');
      } else {
        showToast('Gagal login dengan Google. Coba gunakan Email.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) {
      handleOffline();
      return;
    }
    
    if (!isLogin && role === 'kasir' && !storeCode) {
      showToast('Kode Toko wajib diisi untuk Kasir!', 'error');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // If logging in as cashier, ensure store_code is set or updated
        if (role === 'kasir' && storeCode) {
          const profileDoc = await getDoc(doc(db, 'users', user.uid, 'config', 'main'));
          if (profileDoc.exists()) {
            const profile = profileDoc.data();
            if (profile.role !== 'kasir' || profile.store_code !== storeCode) {
              await setDoc(doc(db, 'users', user.uid, 'config', 'main'), { 
                ...profile,
                role: 'kasir',
                store_code: storeCode,
                onboarded: true,
                updatedAt: new Date().toISOString()
              }, { merge: true });
            }
          } else {
            // Create profile if missing
            await setDoc(doc(db, 'users', user.uid, 'config', 'main'), { 
              id: user.uid,
              role: 'kasir',
              store_code: storeCode,
              onboarded: true,
              email: user.email,
              createdAt: new Date().toISOString()
            });
          }
        }

        showToast('Login berhasil!', 'success');
        setTimeout(() => {
          onSuccess(user.uid);
        }, 500);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const finalStoreCode = role === 'admin' ? user.uid : storeCode;

        try {
          const profileData = { 
            id: user.uid, 
            role, 
            onboarded: role === 'kasir', 
            store_code: finalStoreCode,
            email: user.email,
            createdAt: new Date().toISOString()
          };
          // Remove undefined values
          const sanitizedProfile = Object.fromEntries(
            Object.entries(profileData).filter(([_, v]) => v !== undefined)
          );
          await setDoc(doc(db, 'users', user.uid, 'config', 'main'), sanitizedProfile);
          console.log('Profile created successfully');
        } catch (dbError: any) {
          console.error('Error creating profile doc:', dbError);
          // Even if profile creation fails, the user is created. 
          // But we should probably inform them.
          throw new Error(`Gagal membuat profil: ${dbError.message}`);
        }
        
        showToast('Pendaftaran berhasil!', 'success');
        setTimeout(() => {
          onSuccess(user.uid);
        }, 500);
      }
    } catch (error: any) {
      console.error('Auth process failed:', error);
      let message = 'Terjadi kesalahan saat autentikasi';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            message = 'Email atau password salah';
            break;
          case 'auth/email-already-in-use':
            message = 'Email sudah terdaftar';
            break;
          case 'auth/weak-password':
            message = 'Password terlalu lemah (min. 6 karakter)';
            break;
          case 'auth/invalid-email':
            message = 'Format email tidak valid';
            break;
          case 'auth/operation-not-allowed':
            message = 'Metode login email/password belum diaktifkan di Firebase Console. Silakan gunakan Google Login atau hubungi admin.';
            break;
          case 'auth/network-request-failed':
            message = 'Masalah jaringan. Periksa koneksi internet Anda atau coba gunakan Google Login.';
            break;
          case 'auth/internal-error':
            message = 'Terjadi kesalahan internal pada server. Silakan coba lagi nanti.';
            break;
          default:
            message = `Kesalahan (${error.code}): ${error.message}`;
        }
      } else if (error.message) {
        if (error.message.includes('network')) {
          message = 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
        } else {
          message = error.message;
        }
      }
      
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-background w-full max-w-md rounded-[32px] p-8 shadow-strong relative border border-black/5"
      >
        <button onClick={onClose} className="absolute right-6 top-6 p-2 bg-gray-100 rounded-full">
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img 
              src="/logo.svg" 
              alt="Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-2xl font-serif font-bold text-secondary mb-2">
            {isResetting ? 'Reset Password' : (isLogin ? 'Masuk ke Akun' : 'Daftar Akun Baru')}
          </h2>
          <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">
            {isResetting ? 'Masukkan email untuk reset password' : (isLogin ? 'Akses data toko Anda' : 'Mulai amankan data toko Anda')}
          </p>
        </div>

        {!isResetting && (
          <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 mb-6">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                  role === 'admin' ? 'border-primary bg-white text-primary shadow-sm' : 'border-transparent text-gray-400'
                }`}
              >
                <span className="text-lg">👑</span>
                <span className="font-bold text-[9px] uppercase tracking-widest">Admin</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('kasir')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                  role === 'kasir' ? 'border-primary bg-white text-primary shadow-sm' : 'border-transparent text-gray-400'
                }`}
              >
                <span className="text-lg">🛒</span>
                <span className="font-bold text-[9px] uppercase tracking-widest">Kasir</span>
              </button>
            </div>
          </div>
        )}

        {!isFirebaseConfigured ? (
          <div className="bg-amber-50 p-6 rounded-[24px] border border-amber-100 text-center">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={24} />
            </div>
            <h3 className="text-sm font-bold text-amber-800 mb-2 uppercase tracking-tight">Layanan Cloud Sedang Disiapkan</h3>
            <p className="text-[10px] text-amber-700 leading-relaxed mb-6">
              Sistem Cloud sedang dalam pemeliharaan atau belum dikonfigurasi. Jangan khawatir, Anda tetap bisa menggunakan aplikasi secara offline.
            </p>
            <button 
              onClick={handleOffline}
              className="w-full py-4 bg-amber-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-amber-200"
            >
              Gunakan Mode Offline
            </button>
          </div>
        ) : isResetting ? (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Email Terdaftar</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" 
                  required
                  className="input-field pl-12 py-3" 
                  placeholder="nama@toko.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full py-4 gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <KeyRound size={18} />}
              Kirim Email Reset
            </button>
            <button 
              type="button"
              onClick={() => setIsResetting(false)}
              className="w-full text-xs font-bold text-gray-400 uppercase tracking-widest"
            >
              Kembali ke Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuth} className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 bg-white border-2 border-gray-100 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all mb-2"
            >
              <Chrome size={18} className="text-primary" />
              {loading ? 'Memproses...' : 'Masuk dengan Google'}
            </button>

            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <span className="relative px-4 bg-white text-[9px] font-bold text-gray-300 uppercase tracking-widest">Atau gunakan email</span>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" 
                  required
                  className="input-field pl-12 py-3" 
                  placeholder="nama@toko.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase block">Password</label>
                {isLogin && (
                  <button 
                    type="button"
                    onClick={() => setIsResetting(true)}
                    className="text-[9px] font-bold text-primary uppercase tracking-widest"
                  >
                    Lupa Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  className="input-field pl-12 pr-12 py-3" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {role === 'kasir' && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="space-y-2"
              >
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Kode Toko (Dari Admin)</label>
                <input 
                  type="text" 
                  required
                  className="input-field py-3" 
                  placeholder="Masukkan Kode Toko"
                  value={storeCode}
                  onChange={(e) => setStoreCode(e.target.value)}
                />
                <p className="text-[9px] text-gray-400 italic">Minta kode ini (UID Admin) ke Pemilik Toko Anda agar data tersinkronisasi.</p>
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full py-4 gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : (isLogin ? <LogIn size={18} /> : <UserPlus size={18} />)}
              {isLogin ? 'Masuk Sekarang' : 'Daftar Sekarang'}
            </button>
          </form>
        )}

        {isFirebaseConfigured && (
          <div className="mt-6 text-center space-y-4">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-bold text-primary uppercase tracking-widest"
            >
              {isLogin ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
            </button>
            
            <div className="pt-4 border-t border-gray-100">
              <button 
                onClick={handleOffline}
                className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-secondary transition-colors"
              >
                Gunakan Tanpa Akun (Offline)
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
