/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Login } from './components/Login';
import { BusMap } from './components/BusMap';
import { DriverPanel } from './components/DriverPanel';
import { UserRole } from './types';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { LogOut, Bus } from 'lucide-react';

export default function App() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [rollNumber, setRollNumber] = useState<string | undefined>();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setRole(null);
        setRollNumber(undefined);
      }
      setInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = (userRole: UserRole, userRollNumber?: string) => {
    setRole(userRole);
    setRollNumber(userRollNumber);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setRole(null);
    setRollNumber(undefined);
  };

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-slate-100">
        <Bus className="text-blue-500 animate-bounce" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative w-full overflow-hidden bg-[#0f172a] font-sans text-slate-100 flex flex-col">
      {/* Mesh Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/30 blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-emerald-500/20 blur-[100px]"></div>
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full bg-indigo-600/20 blur-[80px]"></div>
      </div>

      {/* Main UI Layer */}
      <div className="relative z-20 flex flex-col h-full flex-1">
        <AnimatePresence mode="wait">
          {!role ? (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              <Login onLogin={handleLogin} />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col h-screen"
            >
              {/* Navigation Header */}
              <nav className="flex items-center justify-between px-8 py-4 backdrop-blur-md bg-white/10 border-b border-white/20 z-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Bus size={24} className="text-white" />
                  </div>
                  <h1 className="text-xl font-bold tracking-tight uppercase">CampusLink <span className="text-blue-400 font-light">Tracker</span></h1>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-emerald-300 uppercase">Firebase Realtime Live</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-semibold">{role === 'admin' ? 'Host Admin' : rollNumber}</div>
                      <div className="text-[10px] text-slate-400 uppercase">{role === 'admin' ? 'Broadcaster' : 'Student Access'}</div>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 border border-white/20 hover:border-red-400 hover:text-red-400 flex items-center justify-center font-bold transition-colors"
                      title="Sign Out"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                </div>
              </nav>

              {/* Content */}
              <main className="flex-1 relative overflow-hidden flex flex-col">
                {role === 'admin' ? <DriverPanel /> : <BusMap />}
              </main>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

