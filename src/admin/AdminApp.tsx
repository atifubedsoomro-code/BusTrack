import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, MonitorPlay, Car, Search, Menu, X, ArrowLeft, Settings2, BellElectric, UserCircle, Save, CheckCircle2, AlertTriangle, AlertCircle, Activity, MapPin } from 'lucide-react';
import { busData, BusId, BusData } from '../data/buses';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { BusLocation } from '../types';
import { AdminMap } from './AdminMap';

// --- AUTHENTICATION COMPONENT ---
const AdminLogin = ({ onLogin }: { onLogin: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'samiullahpathan' && password === 'samiullah-campuslink') {
      try {
        const cred = await signInAnonymously(auth);
        const userDocRef = doc(db, 'users', cred.user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          await setDoc(userDocRef, { role: 'admin' });
        }
        onLogin();
      } catch (err) {
        setError('Failed to securely connect to database.');
      }
    } else {
      setError('Invalid credentials. Please attempt again or contact superadmin.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-200 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#161921] border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
        
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#1e222d] border border-gray-700 rounded-2xl flex items-center justify-center shadow-inner">
            <Shield size={32} className="text-emerald-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white text-center tracking-tight mb-2">Transit Control</h1>
        <p className="text-center text-gray-500 text-xs font-semibold mb-8 uppercase tracking-widest">Restricted Access Module</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1.5 font-bold">Officer ID</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-[#1e222d] border border-gray-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none transition-all shadow-inner"
              placeholder="samiullahpathan"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1.5 font-bold">Security Key</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#1e222d] border border-gray-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none transition-all shadow-inner"
              placeholder="••••••••••••"
              required
            />
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2 text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-lg text-xs font-semibold">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all active:scale-[0.98] mt-4"
          >
            Authorize Access
          </button>
        </form>
      </motion.div>
      <a href="/" className="mt-8 text-xs font-semibold text-gray-500 hover:text-white flex items-center gap-2 transition-colors">
        <ArrowLeft size={14} /> Return to Public Portal
      </a>
    </div>
  );
};

// --- DASHBOARD COMPONENT ---

const AdminDashboard = () => {
  const [locations, setLocations] = useState<Record<string, BusLocation>>({});
  const [fleet, setFleet] = useState<Record<BusId, BusData>>(busData);
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [editingBus, setEditingBus] = useState<BusId | null>(null);
  const [mapTheme, setMapTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'busLocations'), (snapshot) => {
      const locs: Record<string, BusLocation> = {};
      snapshot.forEach(doc => {
        locs[doc.id] = doc.data() as BusLocation;
      });
      setLocations(locs);
    });
    return () => unsubscribe();
  }, []);

  // Stats
  const now = Date.now();
  const activeBuses = Object.keys(locations).filter(id => {
    const timeDiff = now - new Date(locations[id].updatedAt).getTime();
    return timeDiff < 5 * 60 * 1000; // active if updated within 5 minutes
  });
  
  const activeCount = activeBuses.length;
  const delayedCount = 0; // We're removing the manual delayed status 

  const updateFirebaseEmergency = async (msg: string, hours: number = 1) => {
    try {
      if (!msg) {
        // Clear message
        await setDoc(doc(db, "system_alerts", "global"), { active: false });
        alert('Alert removed successfully.');
        setEmergencyMessage('');
        return;
      }
      const expiresAt = Date.now() + (hours * 60 * 60 * 1000);
      await setDoc(doc(db, "system_alerts", "global"), { 
        message: msg, 
        active: true, 
        timestamp: Date.now(),
        expiresAt
      });
      alert(`Emergency Broadcast deployed for ${hours} hour(s).`);
    } catch (err) {
      console.error(err);
      alert('Failed to deploy broadcast.');
    }
  };

  const saveDriverAndVehicle = async (id: BusId, driver: string, vehicle: string, stops: any[]) => {
    try {
      await setDoc(doc(db, "busConfig", id), { driverName: driver, name: vehicle, stops }, { merge: true });
      console.log(`[FIREBASE PUT] Updating ${id} config`);
      setFleet(prev => ({
        ...prev,
        [id]: { ...prev[id], driverName: driver, name: vehicle, stops }
      }));
      setEditingBus(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update bus config');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-300 font-sans flex flex-col h-screen overflow-hidden selection:bg-emerald-500/30">
      
      {/* Top Navbar */}
      <header className="h-16 bg-[#161921] border-b border-gray-800 flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <MonitorPlay size={18} className="text-emerald-500" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-tight">Transit Control Room</h1>
            <p className="text-[10px] text-emerald-500 font-mono uppercase tracking-widest">Network Secure Connection</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4 border-r border-gray-800 pr-4">
            <div className="text-right">
              <p className="text-xs font-bold text-white leading-tight">Samiullah Pathan</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Transportation Officer</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0">
              <UserCircle size={20} className="text-gray-400" />
            </div>
          </div>
          <button onClick={() => window.location.href = '/'} className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md transition-colors border border-gray-700">
            Exit Panel
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar - Stats & Controls */}
        <aside className="w-72 bg-[#12141a] border-r border-gray-800 flex-shrink-0 flex flex-col overflow-y-auto hidden lg:flex relative z-10 p-5">
           
           {/* Fleet Summary Card */}
           <div className="bg-[#161921] border border-gray-800 rounded-2xl p-5 mb-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
              <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-4 flex items-center gap-2">
                <Activity size={14} className="text-emerald-500" /> Fleet Overview
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1b1f28] p-3 rounded-xl border border-gray-800/60">
                  <p className="text-[10px] text-gray-500 font-semibold uppercase">Active</p>
                  <p className="text-2xl font-bold text-white mt-0.5">{activeCount}</p>
                </div>
                <div className="bg-[#1b1f28] p-3 rounded-xl border border-gray-800/60">
                  <p className="text-[10px] text-gray-500 font-semibold uppercase">Delayed</p>
                  <p className="text-2xl font-bold text-amber-500 mt-0.5">{delayedCount}</p>
                </div>
                <div className="bg-[#1b1f28] p-3 rounded-xl border border-gray-800/60">
                  <p className="text-[10px] text-gray-500 font-semibold uppercase">Offline</p>
                  <p className="text-2xl font-bold text-gray-400 mt-0.5">{Object.keys(fleet).length - (activeCount + delayedCount)}</p>
                </div>
                <div className="bg-[#1b1f28] p-3 rounded-xl border border-gray-800/60">
                  <p className="text-[10px] text-gray-500 font-semibold uppercase">Total</p>
                  <p className="text-2xl font-bold text-white mt-0.5">{Object.keys(fleet).length}</p>
                </div>
              </div>
           </div>

           {/* Emergency Broadcast */}
           <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 mb-6">
              <h3 className="text-xs uppercase tracking-widest text-red-400 font-bold mb-3 flex items-center gap-2">
                <BellElectric size={14} /> Global Broadcast
              </h3>
              <p className="text-[10px] text-red-400/70 leading-relaxed mb-3">Deploying a broadcast will override all student app banners instantly.</p>
              <textarea 
                value={emergencyMessage}
                onChange={e => setEmergencyMessage(e.target.value)}
                placeholder="e.g. All routes delayed due to heavy rain..."
                className="w-full bg-[#1b1f28] border border-red-500/20 rounded-xl p-3 text-xs text-gray-200 placeholder-gray-600 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none h-20 mb-3"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => updateFirebaseEmergency(emergencyMessage, 1)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle size={14} /> 1Hr Alert
                </button>
                <button 
                  onClick={() => updateFirebaseEmergency('', 0)}
                  className="px-3 bg-[#1b1f28] border border-red-500/20 hover:bg-red-500/10 text-red-400 text-[11px] font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  title="Turn off alert"
                >
                  <X size={14} /> Clear
                </button>
              </div>
           </div>
           
           {/* Activity Log ledger */}
           <div className="flex-1 min-h-0 flex flex-col pt-2 opacity-50 pointer-events-none filter grayscale sepia-[0.3]">
              <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">Activity Ledger</h3>
              <div className="flex-1 border-l border-gray-800 ml-2 space-y-3 pl-3">
                 <div className="relative">
                   <div className="absolute w-2 h-2 rounded-full bg-gray-600 -left-[17px] top-1" />
                   <p className="text-[10px] text-gray-400">Authenticated via Root Access</p>
                   <p className="text-[9px] text-gray-600 font-mono mt-0.5">Today, 08:30 AM</p>
                 </div>
                 <div className="relative">
                   <div className="absolute w-1.5 h-1.5 rounded-full bg-gray-700 -left-[16px] top-1" />
                   <p className="text-[10px] text-gray-500">System baseline check complete</p>
                   <p className="text-[9px] text-gray-600 font-mono mt-0.5">Today, 08:31 AM</p>
                 </div>
              </div>
           </div>
        </aside>

        {/* Right Area - Grid */}
        <div className="flex-1 flex flex-col bg-[#0f1115] relative overflow-y-auto">
          
          <div className="p-6 pb-2">
            <h2 className="text-xl font-medium tracking-tight text-white flex items-center gap-2 mb-4">
              Live Fleet View
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
              <button 
                onClick={() => setMapTheme(mapTheme === 'dark' ? 'light' : 'dark')}
                className="ml-auto px-3 py-1.5 text-[10px] font-bold text-gray-400 hover:text-white bg-[#1b1f28] hover:bg-gray-800 rounded-md transition-colors border border-gray-700 uppercase tracking-widest"
              >
                {mapTheme === 'dark' ? 'Light Map' : 'Dark Map'}
              </button>
            </h2>
            <div className={`w-full h-[450px] rounded-xl overflow-hidden border ${mapTheme === 'light' ? 'border-gray-600 shadow-sm' : 'border-gray-800'}`}>
              <AdminMap mapTheme={mapTheme} />
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium tracking-tight text-gray-300 flex items-center gap-2">
                Bus Properties
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-20">
              {Object.values(fleet).map(bus => {
                const isBusActive = activeBuses.includes(bus.id);
                return (
                <div key={bus.id} className="bg-[#161921] border border-gray-800 hover:border-gray-700 rounded-2xl flex flex-col overflow-hidden transition-colors shadow-lg">
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-800 flex justify-between items-start bg-[#1b1f28]/50">
                    <div>
                      <h3 className="text-base font-bold text-white">{bus.label.split(' (')[0]}</h3>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5 truncate max-w-[180px]">{bus.routeTitle}</p>
                    </div>
                    
                    {/* Status Badge */}
                    <div className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-sm border ${
                      isBusActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-800/50 text-gray-400 border-gray-700'
                    }`}>
                      {isBusActive ? 'Active' : 'Offline'}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1">
                    {editingBus === bus.id ? (
                      // Edit Mode
                      <AdminBusEditor bus={bus} onSave={(d, v, s) => saveDriverAndVehicle(bus.id, d, v, s)} onCancel={() => setEditingBus(null)} />
                    ) : (
                      // View Mode
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 border border-gray-700 shrink-0">
                            <UserCircle size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Driver Assigned</p>
                            <p className="text-sm text-gray-200 font-semibold truncate">{bus.driverName}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 border border-gray-700 shrink-0">
                            <Car size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Vehicle Reg</p>
                            <p className="text-sm text-gray-200 font-semibold truncate">{bus.name}</p>
                          </div>
                        </div>
                        
                        {bus.phone && (
                          <div className="pt-2 border-t border-gray-800 flex justify-between items-center">
                             <span className="text-xs text-gray-500">Contact</span>
                             <span className="text-xs text-gray-300 font-mono tracking-wide">{bus.phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  {!editingBus && (
                    <div className="flex border-t border-gray-800 bg-[#161921]">
                      <button 
                        onClick={() => setEditingBus(bus.id)}
                        className="flex-1 py-3 text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 border-r border-gray-800"
                      >
                        <Settings2 size={14} /> Configure
                      </button>
                      <button 
                         className="flex-1 py-3 text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
                         title="Schedule Editor (Locked in DB Mode)"
                      >
                         <MapPin size={14} /> Schedule
                      </button>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Setup a sub-component for inline editing
const AdminBusEditor = ({ bus, onSave, onCancel }: { bus: BusData, onSave: (driver: string, vehicle: string, stops: any[]) => void, onCancel: () => void }) => {
  const [driver, setDriver] = useState(bus.driverName);
  const [vehicle, setVehicle] = useState(bus.name);
  const [stops, setStops] = useState(bus.stops || []);
  const [activeTab, setActiveTab] = useState<'info' | 'schedule'>('info');

  const handleTimeChange = (index: number, newTime: string) => {
    const newStops = [...stops];
    newStops[index] = { ...newStops[index], time: newTime };
    setStops(newStops);
  };

  return (
    <div className="space-y-3 animate-in fade-in flex flex-col h-full">
      <div className="flex border-b border-gray-800 mb-2">
        <button onClick={() => setActiveTab('info')} className={`flex-1 pb-2 text-[10px] uppercase font-bold tracking-widest ${activeTab === 'info' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-gray-500'}`}>Vehicle Info</button>
        <button onClick={() => setActiveTab('schedule')} className={`flex-1 pb-2 text-[10px] uppercase font-bold tracking-widest ${activeTab === 'schedule' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-gray-500'}`}>Timetable</button>
      </div>

      {activeTab === 'info' ? (
        <div className="space-y-3 flex-1">
          <div>
            <label className="block text-[10px] uppercase text-emerald-500 font-bold mb-1">Driver Name</label>
            <input 
              type="text" 
              value={driver} 
              onChange={e => setDriver(e.target.value)} 
              className="w-full bg-[#1b1f28] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" 
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-emerald-500 font-bold mb-1">Vehicle Details</label>
            <input 
              type="text" 
              value={vehicle} 
              onChange={e => setVehicle(e.target.value)} 
              className="w-full bg-[#1b1f28] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500" 
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2 flex-1 max-h-[150px] overflow-y-auto pr-1">
          {stops.map((stop, i) => (
            <div key={i} className="flex items-center gap-2 bg-[#1b1f28] p-1.5 rounded-lg border border-gray-800">
              <span className="flex-1 text-[10px] text-gray-300 font-semibold truncate px-1" title={stop.stop}>{stop.stop}</span>
              <input 
                type="text" 
                value={stop.time} 
                onChange={(e) => handleTimeChange(i, e.target.value)}
                className="w-20 bg-gray-900 border border-gray-700 rounded text-[10px] text-emerald-400 font-mono px-2 py-1 outline-none focus:border-emerald-500 text-center"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-2 mt-auto border-t border-gray-800">
        <button onClick={() => onSave(driver, vehicle, stops)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold py-2 rounded-lg flex items-center justify-center gap-1">
          <Save size={14} /> Update
        </button>
        <button onClick={onCancel} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] font-bold py-2 rounded-lg">
          Cancel
        </button>
      </div>
    </div>
  );
};

// --- MAIN EXPORT ENTRANCE ---
export default function AdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <AnimatePresence mode="wait">
      {!isAuthenticated ? (
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <AdminLogin onLogin={() => setIsAuthenticated(true)} />
        </motion.div>
      ) : (
        <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-screen w-full">
          <AdminDashboard />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
