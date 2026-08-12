import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Shield, ArrowRight, Loader2, BusFront, Mail, Phone, Info, X } from 'lucide-react';
import { signInAnonymously, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserRole, BusId } from '../types';
import { busData } from '../data/buses';

interface LoginProps {
  onLogin: (role: UserRole, busId: BusId, rollNumber?: string) => void;
}

const BUSES = Object.values(busData);

const RealisticBus = () => {
  const playHorn = () => {
    const audio = new Audio('https://actions.google.com/sounds/v1/transportation/truck_horn.ogg');
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Audio play failed:', e));
  };

  return (
    <motion.div 
      initial={{ x: '-150%' }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 40, delay: 0.2 }}
      whileTap={{ rotateZ: 5, y: 15, transformOrigin: 'bottom left' }}
      onClick={playHorn}
      className="absolute -left-10 lg:-left-20 bottom-10 lg:bottom-1/4 w-[280px] sm:w-[350px] lg:w-[600px] cursor-pointer drop-shadow-2xl z-20"
      title="Click me to honk & dip!"
    >
      <svg viewBox="0 0 500 250" className="w-full h-auto">
        <defs>
          <mask id="wheel-cutout">
            <rect x="-50" y="0" width="600" height="300" fill="white" />
            <circle cx="345" cy="200" r="55" fill="black" />
          </mask>
          <linearGradient id="window-reflection" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        <g mask="url(#wheel-cutout)">
          {/* Bus Body */}
          <path d="M -50 30 L 350 30 C 420 30, 460 60, 470 120 L 480 200 L -50 200 Z" fill="#1a100b" />
          
          {/* Bottom Stripe */}
          <rect x="-50" y="170" width="550" height="30" fill="#e2d5c8" />
          
          {/* Mid Stripe */}
          <rect x="-50" y="145" width="550" height="5" fill="#8b5a2b" />
        </g>

        {/* Windows */}
        <g fill="#fdfbf7">
          <rect x="10" y="50" width="100" height="80" rx="10" />
          <rect x="125" y="50" width="100" height="80" rx="10" />
          <path d="M 240 50 L 340 50 C 375 50, 400 70, 410 110 L 415 130 L 240 130 Z" />
        </g>
        
        {/* Window Reflections */}
        <g fill="url(#window-reflection)">
          <rect x="10" y="50" width="100" height="80" rx="10" />
          <rect x="125" y="50" width="100" height="80" rx="10" />
          <path d="M 240 50 L 340 50 C 375 50, 400 70, 410 110 L 415 130 L 240 130 Z" />
        </g>

        {/* Headlight */}
        <rect x="460" y="140" width="15" height="20" rx="6" fill="#fef08a" />
        <rect x="460" y="140" width="15" height="20" rx="6" fill="#fef08a" className="animate-pulse" style={{ filter: 'drop-shadow(0 0 15px #fef08a)' }} />

        {/* Mirror */}
        <path d="M 420 60 L 470 60 L 470 110 L 460 110 L 460 70 L 420 70 Z" fill="#1a100b" />

        {/* Rotating Wheel */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "345px 200px" }}
        >
          <circle cx="345" cy="200" r="48" fill="#111" />
          <circle cx="345" cy="200" r="33" fill="none" stroke="#333" strokeWidth="4" />
          <circle cx="345" cy="200" r="20" fill="#d4d4d8" />
          <path d="M 345 168 L 345 232 M 313 200 L 377 200 M 322 177 L 368 223 M 368 177 L 322 223" stroke="#a1a1aa" strokeWidth="5" />
          <circle cx="345" cy="200" r="6" fill="#1a100b" />
        </motion.g>
      </svg>
    </motion.div>
  );
};

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<UserRole>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedBus, setSelectedBus] = useState<BusId>('bus_1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeveloper, setShowDeveloper] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email || '';
      
      // Restrict to university domain or developer email
      if (!email.endsWith('@bbsutsd.edu.pk') && email !== 'atifubedsoomro@gmail.com') {
        await auth.signOut();
        setError('You are not Registered. Only @bbsutsd.edu.pk emails are allowed.');
        setLoading(false);
        return;
      }

      const user = result.user;
      const userRef = doc(db, 'users', user.uid);
      
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch (err) {
        console.warn('Could not fetch user document:', err);
      }

      if (!userSnap || !userSnap.exists()) {
        try {
          await setDoc(userRef, {
            role: 'student',
            email: email,
            displayName: user.displayName,
            createdAt: new Date().toISOString()
          });
        } catch (err) {
          console.warn('Could not create user document:', err);
        }
      }
      onLogin('student', selectedBus, email);
    } catch (err) {
      let errorMessage = 'An error occurred during Google Sign-In';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDriverLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (username !== 'admin' || password !== 'admin') {
        throw new Error('Incorrect Driver Username or Password');
      }

      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      const userRef = doc(db, 'users', user.uid);
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch (err) {
        console.warn('Could not fetch user document:', err);
      }

      if (!userSnap || !userSnap.exists()) {
        try {
          await setDoc(userRef, {
            role: 'admin',
            createdAt: new Date().toISOString()
          });
        } catch (err) {
          console.warn('Could not create user document:', err);
        }
      }

      onLogin('admin', selectedBus);
    } catch (err) {
      let errorMessage = 'An error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row flex-1 w-full min-h-screen font-sans bg-[#fdfbf7] dark:bg-[#2c1a0c] overflow-x-hidden">
      
      {/* LEFT/TOP COLUMN: Landing Page & Animations */}
      <div className="flex flex-col lg:flex-1 relative bg-[#8b5a2b] dark:bg-[#4a2e15] overflow-hidden justify-center items-center p-8 lg:p-12 shadow-2xl min-h-[45vh] lg:min-h-screen">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay pointer-events-none"></div>
        
        {/* Animated Bus Graphics */}
        <RealisticBus />

        <div className="relative z-10 text-center max-w-lg mb-8 lg:mb-12 mt-8 lg:mt-0 flex flex-col items-center">
          <img 
            src="/BBSU.png" 
            alt="BBSUTSD Logo" 
            className="h-24 lg:h-32 object-contain drop-shadow-lg mb-4"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/BBSU.jpeg';
              (e.target as HTMLImageElement).onerror = null;
            }}
          />
          <p className="text-[#e2d5c8] text-base lg:text-lg font-medium leading-relaxed drop-shadow-md">
            Real-time fleet tracking and seamless connectivity for students and faculty. Know exactly where your bus is, anytime.
          </p>
        </div>

        {/* Developer Details Card */}
        <div className="relative z-10 mt-auto w-full max-w-sm self-start">
          <AnimatePresence mode="wait">
            {!showDeveloper ? (
              <motion.button
                key="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDeveloper(true)}
                className="flex items-center gap-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full px-5 py-2 border border-white/10 shadow-lg text-[#fdfbf7] transition-all"
              >
                <Info size={18} />
                <span className="font-bold text-sm tracking-wide">Developer</span>
              </motion.button>
            ) : (
              <motion.div
                key="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-black/40 backdrop-blur-md rounded-2xl p-5 lg:p-6 border border-white/10 shadow-xl"
              >
                <div className="flex items-center justify-between mb-3 lg:mb-4 text-[#fdfbf7]">
                  <div className="flex items-center gap-2">
                    <Info size={18} />
                    <h3 className="font-bold text-base lg:text-lg tracking-wide">Developer Support</h3>
                  </div>
                  <button onClick={() => setShowDeveloper(false)} className="opacity-70 hover:opacity-100 p-1">
                     <X size={16} />
                  </button>
                </div>
                <div className="space-y-2 lg:space-y-3 text-sm text-[#e2d5c8]">
                  <p className="flex items-center gap-3">
                    <User size={16} className="text-[#d3b497]" />
                    <span className="font-semibold">Atif Ubed</span>
                  </p>
                  <p className="flex items-center gap-3">
                    <Mail size={16} className="text-[#d3b497]" />
                    <a href="mailto:atifubedsoomro@gmail.com" className="hover:text-white transition-colors">atifubedsoomro@gmail.com</a>
                  </p>
                  <p className="flex items-center gap-3">
                    <Phone size={16} className="text-[#d3b497]" />
                    <a href="tel:+923352662146" className="hover:text-white transition-colors">+92 335 2662146</a>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT/BOTTOM COLUMN: Login Form */}
      <div className="flex-1 w-full flex items-center justify-center p-4 lg:p-12 relative z-10 -mt-6 lg:mt-0">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md bg-white dark:bg-[#3d2616] border border-[#8b5a2b]/20 dark:border-[#5c3a21] rounded-3xl overflow-hidden shadow-2xl relative"
        >
          {/* Floating Error Window */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.9 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                className="absolute top-4 left-4 right-4 z-50 bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3 border border-red-500"
              >
                <Info className="shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <h4 className="font-bold text-sm">Access Denied</h4>
                  <p className="text-xs text-red-100 mt-1">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="opacity-80 hover:opacity-100">×</button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-8 text-center border-b border-gray-100 dark:border-[#5c3a21] bg-[#fefdfb] dark:bg-[#3d2616]/50">
            <div className="flex justify-center mb-6 lg:hidden">
              <img 
                src="/logo.jpeg" 
                alt="University Logo" 
                className="h-24 object-contain drop-shadow-md rounded-2xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden bg-[#a67c52]/10 dark:bg-[#a67c52]/20 p-3 rounded-full text-[#8b5a2b] dark:text-[#d3b497]">
                <BusFront size={40} />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#4a2e15] dark:text-[#fdfbf7]">Welcome to <span className="font-light text-[#8b5a2b] dark:text-[#d3b497]">CampusLink</span></h1>
            <p className="text-gray-500 dark:text-[#c49a6f] mt-2 text-xs uppercase font-semibold mx-auto w-full leading-relaxed">
              Select your point and sign in to continue
            </p>
          </div>

          <div className="p-8">
            <div className="flex bg-gray-50 dark:bg-[#2c1a0c] p-1 rounded-xl mb-6 border border-gray-200 dark:border-[#5c3a21]">
              <button
                type="button"
                onClick={() => setActiveTab('student')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'student' ? 'bg-white dark:bg-[#3d2616] text-[#8b5a2b] dark:text-[#d3b497] shadow-sm border border-gray-200 dark:border-[#5c3a21]' : 'text-gray-500 dark:text-[#c49a6f] hover:text-gray-700 dark:hover:text-[#fdfbf7]'
                }`}
              >
                <User size={18} /> Student
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'admin' ? 'bg-[#8b5a2b] dark:bg-[#a67c52] text-white shadow-sm' : 'text-gray-500 dark:text-[#c49a6f] hover:text-gray-700 dark:hover:text-[#fdfbf7]'
                }`}
              >
                <Shield size={18} /> Driver
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-[#c49a6f] uppercase tracking-widest mb-1.5">Select Point (Bus)</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                  {BUSES.map((bus) => (
                    <button
                      key={bus.id}
                      type="button"
                      onClick={() => setSelectedBus(bus.id)}
                      className={`p-3 rounded-xl text-left transition-all border outline-none ${
                          selectedBus === bus.id 
                          ? 'bg-[#8b5a2b] dark:bg-[#a67c52] text-white border-[#8b5a2b] dark:border-[#a67c52] shadow-md ring-2 ring-[#8b5a2b]/20 offset-2' 
                          : 'bg-white dark:bg-[#3d2616] text-gray-700 dark:text-[#fdfbf7] border-gray-200 dark:border-[#5c3a21] hover:border-[#8b5a2b]/50 dark:hover:border-[#a67c52]/50 hover:bg-[#8b5a2b]/5'
                      }`}
                    >
                      <p className="font-bold text-sm mb-0.5">{bus.label.split(' (')[0]}</p>
                      <p className={`text-[10px] font-semibold truncate ${selectedBus === bus.id ? 'text-white/80' : 'text-gray-400 dark:text-[#c49a6f]'}`}>
                          {bus.routeTitle}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-gray-100 dark:border-[#5c3a21]" />

              <AnimatePresence mode="wait">
                {activeTab === 'student' ? (
                  <motion.div
                    key="student"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="pt-2"
                  >
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[#4285F4] hover:bg-[#357abd] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4285F4] transition-all overflow-hidden shadow-[0_0_15px_rgba(66,133,244,0.5)] hover:shadow-[0_0_25px_rgba(66,133,244,0.8)] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {/* Neon glow effect container */}
                      <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                        <div className="bg-white p-1 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                        </div>
                      </span>
                      {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Sign in with University Google Account'}
                    </button>
                    <p className="text-center text-[10px] text-gray-400 dark:text-[#c49a6f] mt-3 font-semibold">
                      Requires @bbsutsd.edu.pk email
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="driver"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <form onSubmit={handleDriverLogin} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-[#c49a6f] uppercase tracking-widest mb-1.5">Driver Username</label>
                        <input
                          type="text"
                          placeholder="Admin username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#1a100b] border border-gray-300 dark:border-[#5c3a21] focus:ring-2 focus:ring-[#8b5a2b]/30 focus:border-[#8b5a2b] dark:focus:border-[#a67c52] text-gray-900 dark:text-[#fdfbf7] placeholder-gray-400 dark:placeholder-[#8b5a2b] outline-none transition-all shadow-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-[#c49a6f] uppercase tracking-widest mb-1.5">Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#1a100b] border border-gray-300 dark:border-[#5c3a21] focus:ring-2 focus:ring-[#8b5a2b]/30 focus:border-[#8b5a2b] dark:focus:border-[#a67c52] text-gray-900 dark:text-[#fdfbf7] placeholder-gray-400 dark:placeholder-[#8b5a2b] outline-none transition-all shadow-sm"
                          required
                        />
                      </div>
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-white transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed bg-gray-900 dark:bg-[#2c1a0c] hover:bg-black dark:hover:bg-[#1a100b] shadow-[#1a100b]/40"
                        >
                          {loading ? <Loader2 className="animate-spin" /> : (
                            <>Start Broadcasting <ArrowRight size={18} /></>
                          )}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
