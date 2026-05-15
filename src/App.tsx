/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Login } from './components/Login';
import { BusMap } from './components/BusMap';
import { DriverPanel } from './components/DriverPanel';
import { UserRole, BusId } from './types';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { LogOut, Bus } from 'lucide-react';

export default function App() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [rollNumber, setRollNumber] = useState<string | undefined>();
  const [busId, setBusId] = useState<BusId | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setRole(null);
        setRollNumber(undefined);
        setBusId(null);
      }
      setInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = (userRole: UserRole, selectedBusId: BusId, userRollNumber?: string) => {
    setRole(userRole);
    setBusId(selectedBusId);
    setRollNumber(userRollNumber);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setRole(null);
    setRollNumber(undefined);
    setBusId(null);
  };

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7] text-[#5e3a21]">
        <Bus className="animate-bounce" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative w-full overflow-hidden bg-[#fdfbf7] font-sans text-slate-800 flex flex-col">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#8b5a2b 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      </div>

      {/* Main UI Layer */}
      <div className="relative z-20 flex flex-col h-full flex-1">
        <AnimatePresence mode="wait">
          {!role || !busId ? (
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
              <nav className="flex items-center justify-between px-6 py-3 bg-white border-b border-[#8b5a2b]/20 z-50 shadow-sm">
                <div className="flex flex-col">
                  <h1 className="text-xl font-bold tracking-tight text-[#5e3a21] uppercase">CampusLink <span className="text-[#a67c52] font-light">Tracker</span></h1>
                  <span className="text-[10px] mt-0.5 text-[#8b5a2b] uppercase tracking-wider font-semibold hidden md:block">
                    Benazir Bhutto Shaheed University of Technology and Skill Development Khairpur Mir's
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-100 border border-emerald-200 rounded-full">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-semibold text-emerald-700 uppercase">Live: {busId.replace('_', ' ').toUpperCase()}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                    <div className="text-right hidden md:block text-[#5e3a21]">
                      <div className="text-sm font-bold">{role === 'admin' ? 'Host Admin' : rollNumber}</div>
                      <div className="text-[10px] uppercase font-semibold">{role === 'admin' ? 'Broadcaster' : 'Student Access'}</div>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="w-10 h-10 rounded-full bg-[#f4ebe1] hover:bg-[#ebdcd0] text-[#5e3a21] flex items-center justify-center font-bold transition-colors shadow-sm border border-[#d2bfae]"
                      title="Sign Out"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                </div>
              </nav>

              {/* Content */}
              <main className="flex-1 relative overflow-hidden flex flex-col">
                {role === 'admin' ? <DriverPanel busId={busId} /> : <BusMap busId={busId} />}
              </main>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

