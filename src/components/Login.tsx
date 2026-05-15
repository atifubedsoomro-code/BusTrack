import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bus, User, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (role: UserRole, rollNumber?: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<UserRole>('student');
  const [rollNumber, setRollNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rollNumberRegex = /^\d{2}-[A-Z]{2,3}-\d{2,3}$/;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === 'student') {
        if (!rollNumberRegex.test(rollNumber.toUpperCase())) {
          throw new Error('Invalid Roll Number format. Use e.g. 25-CS-18');
        }
      } else {
        if (username !== 'admin' || password !== 'admin') {
          throw new Error('Incorrect Driver Username or Password');
        }
      }

      // Firebase Anonymous Auth
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      // Check if user document exists, if not create it
      const userRef = doc(db, 'users', user.uid);
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      }

      if (userSnap && !userSnap.exists()) {
        await setDoc(userRef, {
          role: activeTab,
          rollNumber: activeTab === 'student' ? rollNumber.toUpperCase() : null,
          createdAt: new Date().toISOString()
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`));
      }

      onLogin(activeTab, activeTab === 'student' ? rollNumber.toUpperCase() : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-8 text-center border-b border-white/10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl mb-4 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Bus size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">CampusLink <span className="font-light text-blue-400">Tracker</span></h1>
          <p className="text-slate-400 mt-2 text-sm uppercase tracking-widest font-bold">Authentication</p>
        </div>

        <div className="p-8">
          <div className="flex bg-black/20 p-1 rounded-xl mb-8 border border-white/5">
            <button
              onClick={() => setActiveTab('student')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'student' ? 'backdrop-blur-md bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User size={18} /> Student
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'admin' ? 'backdrop-blur-md bg-red-500/20 text-red-400 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield size={18} /> Driver
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <AnimatePresence mode="wait">
              {activeTab === 'student' ? (
                <motion.div
                  key="student"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Roll Number</label>
                  <input
                    type="text"
                    placeholder="e.g., 25-CS-18"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-slate-500 outline-none transition-all uppercase"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wide">Format: YY-DEPT-ROLL</p>
                </motion.div>
              ) : (
                <motion.div
                  key="driver"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Username</label>
                    <input
                      type="text"
                      placeholder="Driver Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 text-white placeholder-slate-500 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 text-white placeholder-slate-500 outline-none transition-all"
                      required
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-xs font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20"
              >
                {error}
              </motion.div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-white transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                  activeTab === 'student' ? 'bg-gradient-to-tr from-blue-500 to-indigo-600 border border-white/30 shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-indigo-500' : 'bg-gradient-to-tr from-red-500 to-rose-600 border border-white/30 shadow-lg shadow-red-500/20 hover:from-red-400 hover:to-rose-500'
                }`}
              >
                {loading ? <Loader2 className="animate-spin" /> : (
                  <>Sign In <ArrowRight size={18} /></>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
