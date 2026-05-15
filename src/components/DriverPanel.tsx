import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Square, MapPin, Radio, AlertCircle, Loader2 } from 'lucide-react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { BusLocation } from '../types';

export const DriverPanel: React.FC = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [status, setStatus] = useState<'idle' | 'tracking' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setStatus('tracking');
    setIsTracking(true);
    setError(null);

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentCoords({ lat: latitude, lng: longitude });

        const locationData: BusLocation = {
          lat: latitude,
          lng: longitude,
          updatedAt: new Date().toISOString(),
          driverId: auth.currentUser?.uid || 'unknown',
          busId: 'bus_01',
          status: 'active'
        };

        try {
          await setDoc(doc(db, 'busLocations', 'bus_01'), locationData);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'busLocations/bus_01');
        }
      },
      (err) => {
        setError("GPS Error: " + err.message + ". Try using Simulation Mode.");
        setStatus('error');
        stopTracking();
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    setWatchId(id);
  };

  const startSimulation = () => {
    stopTracking();
    setIsTracking(true);
    setStatus('tracking');
    
    // Sukkur route simulation
    const route = [
      [27.7152, 68.8574], [27.7160, 68.8578], [27.7170, 68.8582], 
      [27.7180, 68.8588], [27.7192, 68.8596], [27.7205, 68.8605],
      [27.7220, 68.8615], [27.7235, 68.8622], [27.7250, 68.8630],
      [27.7268, 68.8645]
    ];
    
    let index = 0;
    const intervalId = window.setInterval(async () => {
      const [lat, lng] = route[index];
      setCurrentCoords({ lat, lng });
      
      const locationData: BusLocation = {
        lat,
        lng,
        updatedAt: new Date().toISOString(),
        driverId: auth.currentUser?.uid || 'unknown',
        busId: 'bus_01',
        status: 'active'
      };

      try {
        await setDoc(doc(db, 'busLocations', 'bus_01'), locationData);
      } catch (err) {
        console.error("Simulation write error:", err);
      }

      index = (index + 1) % route.length;
    }, 2000);

    // Store as watchId casted to any for cleanup
    setWatchId(intervalId as any);
  };

  const stopTracking = async () => {
    if (watchId !== null) {
      if (status === 'tracking') {
        // If it was simulation, use clearInterval, if real, use clearWatch
        // Simplified: just try both or use the fact that intervalId is a number too
        navigator.geolocation.clearWatch(watchId);
        window.clearInterval(watchId);
      }
    }
    
    setWatchId(null);
    setIsTracking(false);
    setStatus('idle');
    setCurrentCoords(null);

    try {
      // Remove the location document when stopped
      await deleteDoc(doc(db, 'busLocations', 'bus_01'));
    } catch (err) {
      console.warn("Error deleting document on stop:", err);
    }
  };

  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        window.clearInterval(watchId);
      }
    };
  }, [watchId]);

  return (
    <div className="flex-1 flex w-full flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 text-center shadow-2xl text-slate-100">
        <div className="w-20 h-20 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          <Radio size={40} className={isTracking ? 'animate-pulse' : ''} />
        </div>
        
        <h2 className="text-2xl font-bold text-white">Host Dashboard</h2>
        <p className="text-slate-400 mt-2 text-sm">Manage live bus location broadcasting</p>

        <div className="mt-8 space-y-4">
          {!isTracking ? (
            <>
              <button 
                onClick={startTracking}
                className="w-full py-4 bg-gradient-to-tr from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 border border-white/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Play size={20} /> Start Real GPS Sharing
              </button>
              <button 
                onClick={startSimulation}
                className="w-full py-4 bg-gradient-to-tr from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 border border-white/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Radio size={20} /> Start Simulation View
              </button>
            </>
          ) : (
            <button 
              onClick={stopTracking}
              className="w-full py-4 bg-gradient-to-tr from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 border border-white/30 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Square size={20} /> Stop Journey
            </button>
          )}
        </div>

        <div className="mt-10 p-6 bg-black/20 rounded-2xl border border-white/10 text-left">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Transmission Status</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300 font-medium">Network</span>
              <span className="text-xs px-2 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-full font-bold">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300 font-medium">GPS Access</span>
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${status === 'tracking' ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' : 'bg-slate-500/20 border border-slate-500/40 text-slate-400'}`}>
                {status === 'tracking' ? 'Active' : 'Offline'}
              </span>
            </div>
            {currentCoords && (
              <div className="pt-3 border-t border-white/10 mt-3">
                 <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Current Coordinates</p>
                 <div className="flex gap-4">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} className="text-red-400" />
                      <span className="text-sm font-mono text-slate-300">{currentCoords.lat.toFixed(5)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={14} className="text-blue-400" />
                      <span className="text-sm font-mono text-slate-300">{currentCoords.lng.toFixed(5)}</span>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-4 bg-red-500/10 text-red-400 rounded-xl flex items-start gap-3 text-sm text-left border border-red-500/20"
          >
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <p>{error}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
