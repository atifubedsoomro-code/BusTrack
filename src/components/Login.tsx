import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Shield, ArrowRight, Loader2, BusFront } from 'lucide-react';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserRole, BusId } from '../types';
import { busData } from '../data/buses';

interface LoginProps {
  onLogin: (role: UserRole, busId: BusId, rollNumber?: string) => void;
}

const BUSES = Object.values(busData);

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<UserRole>('student');
  const [rollNumber, setRollNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedBus, setSelectedBus] = useState<BusId>('bus_1');
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

      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

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

      onLogin(activeTab, selectedBus, activeTab === 'student' ? rollNumber.toUpperCase() : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full flex items-center justify-center p-4 font-sans bg-[#fdfbf7] min-h-screen">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white border border-[#8b5a2b]/20 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-8 text-center border-b border-gray-100 bg-[#fefdfb]">
          <div className="flex justify-center mb-6">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/BBSTUSD_Logo.png/800px-BBSTUSD_Logo.png" 
              alt="University Logo" 
              className="h-20 object-contain drop-shadow-md"
              onError={(e) => {
                // Fallback icon if image fails
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden bg-[#a67c52]/10 p-3 rounded-full text-[#8b5a2b]">
              <BusFront size={40} />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#4a2e15]">CampusLink <span className="font-light text-[#a67c52]">Tracker</span></h1>
          <p className="text-[#8b5a2b] mt-1 text-xs uppercase tracking-widest font-bold">Live Bus Location</p>
          <p className="text-gray-500 mt-2 text-[10px] uppercase font-semibold mx-auto w-full leading-relaxed">
            Benazir Bhutto Shaheed University of Technology and Skill Development Khairpur Mir's
          </p>
        </div>

        <div className="p-8">
          <div className="flex bg-gray-50 p-1 rounded-xl mb-6 border border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('student')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'student' ? 'bg-white text-[#8b5a2b] shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User size={18} /> Student
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'admin' ? 'bg-[#8b5a2b] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Shield size={18} /> Driver
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Select Point (Bus)</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {BUSES.map((bus) => (
                  <button
                    key={bus.id}
                    type="button"
                    onClick={() => setSelectedBus(bus.id)}
                    className={`p-3 rounded-xl text-left transition-all border outline-none ${
                        selectedBus === bus.id 
                        ? 'bg-[#8b5a2b] text-white border-[#8b5a2b] shadow-md ring-2 ring-[#8b5a2b]/20 offset-2' 
                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#8b5a2b]/50 hover:bg-[#8b5a2b]/5'
                    }`}
                  >
                    <p className="font-bold text-sm mb-0.5">{bus.label.split(' (')[0]}</p>
                    <p className={`text-[10px] font-semibold truncate ${selectedBus === bus.id ? 'text-white/80' : 'text-gray-400'}`}>
                        {bus.routeTitle}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-gray-100" />

            <AnimatePresence mode="wait">
              {activeTab === 'student' ? (
                <motion.div
                  key="student"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Your Roll Number</label>
                  <input
                    type="text"
                    placeholder="e.g., 25-CS-18"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:ring-2 focus:ring-[#8b5a2b]/30 focus:border-[#8b5a2b] text-gray-900 placeholder-gray-400 outline-none transition-all uppercase shadow-sm"
                    required
                  />
                  <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wide">Format: YY-DEPT-ROLL</p>
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
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Driver Username</label>
                    <input
                      type="text"
                      placeholder="Admin username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:ring-2 focus:ring-[#8b5a2b]/30 focus:border-[#8b5a2b] text-gray-900 placeholder-gray-400 outline-none transition-all shadow-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:ring-2 focus:ring-[#8b5a2b]/30 focus:border-[#8b5a2b] text-gray-900 placeholder-gray-400 outline-none transition-all shadow-sm"
                      required
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                className="text-red-600 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-200"
              >
                {error}
              </motion.div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-white transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed ${
                  activeTab === 'student' 
                    ? 'bg-[#8b5a2b] hover:bg-[#7a4b3a] shadow-[#8b5a2b]/20' 
                    : 'bg-gray-900 hover:bg-black shadow-gray-900/20'
                }`}
              >
                {loading ? <Loader2 className="animate-spin" /> : (
                  <>{activeTab === 'student' ? 'Track Location' : 'Start Broadcasting'} <ArrowRight size={18} /></>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
