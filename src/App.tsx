/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Login } from './components/Login';
import { BusMap } from './components/BusMap';
import { DriverPanel } from './components/DriverPanel';
import { ThemeToggle } from './components/ThemeToggle';
import { GlobalBanner } from './components/GlobalBanner';
import { UserRole, BusId } from './types';
import { busData } from './data/buses';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { LogOut, Bus } from 'lucide-react';

export default function App() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [rollNumber, setRollNumber] = useState<string | undefined>();
  const [busId, setBusId] = useState<BusId | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

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
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7] dark:bg-gray-900 text-[#5e3a21] dark:text-gray-100">
        <Bus className="animate-bounce" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative w-full overflow-hidden bg-[#fdfbf7] dark:bg-gray-900 font-sans text-slate-800 dark:text-gray-100 flex flex-col">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-5 dark:opacity-10">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
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
              className="flex-1 flex flex-col relative"
            >
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} className="absolute top-4 right-4 z-[100] shadow-md" />
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
              <GlobalBanner />
              {/* Navigation Header */}
              <nav className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-800 border-b border-[#8b5a2b]/20 dark:border-gray-700 z-50 shadow-sm relative">
                <div className="flex flex-col">
                  <h1 className="text-xl font-bold tracking-tight text-[#5e3a21] dark:text-gray-100 uppercase">CampusLink <span className="text-[#a67c52] dark:text-gray-400 font-light">Tracker</span></h1>
                  <span className="text-[10px] mt-0.5 text-[#8b5a2b] dark:text-gray-400 uppercase tracking-wider font-semibold hidden md:block">
                    Benazir Bhutto Shaheed University of Technology and Skill Development Khairpur Mir's
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded-full">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Live: {busData[busId]?.label || 'Loading...'}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 border-l border-slate-200 dark:border-gray-700 pl-4">
                    <div className="text-right hidden md:block text-[#5e3a21] dark:text-gray-200">
                      <div className="text-sm font-bold">{role === 'admin' ? 'Host Admin' : rollNumber}</div>
                      <div className="text-[10px] uppercase font-semibold">{role === 'admin' ? 'Broadcaster' : 'Student Access'}</div>
                    </div>
                    
                    <ThemeToggle theme={theme} toggleTheme={toggleTheme} className="w-10 h-10 border shadow-sm" />

                    <button 
                      onClick={handleLogout}
                      className="w-10 h-10 rounded-full bg-[#f4ebe1] dark:bg-gray-700 hover:bg-[#ebdcd0] dark:hover:bg-gray-600 text-[#5e3a21] dark:text-gray-200 flex items-center justify-center font-bold transition-colors shadow-sm border border-[#d2bfae] dark:border-gray-600"
                      title="Sign Out"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                </div>
              </nav>

              {/* Content */}
              <main className="flex-1 relative overflow-hidden flex flex-col">
                {role === 'admin' ? (
                  <DriverPanel busId={busId} />
                ) : (
                  <BusMap busId={busId} onSwitchBus={(newBusId) => setBusId(newBusId)} />
                )}
              </main>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

