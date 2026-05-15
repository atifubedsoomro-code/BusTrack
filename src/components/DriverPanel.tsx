import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Square, MapPin, Radio, AlertCircle } from 'lucide-react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { BusLocation, BusId } from '../types';

export const DriverPanel: React.FC<{ busId: BusId }> = ({ busId }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [status, setStatus] = useState<'idle' | 'tracking' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [activeTrackingIds, setActiveTrackingIds] = useState<{ watch?: number, interval?: number } | null>(null);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setStatus('tracking');
    setIsTracking(true);
    setError(null);

    const updateLocation = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setCurrentCoords({ lat: latitude, lng: longitude });

      const locationData: BusLocation = {
        lat: latitude,
        lng: longitude,
        updatedAt: new Date().toISOString(),
        driverId: auth.currentUser?.uid || 'unknown',
        busId: busId,
        status: 'active'
      };

      try {
        await setDoc(doc(db, 'busLocations', busId), locationData);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `busLocations/${busId}`);
      }
    };

    const wId = navigator.geolocation.watchPosition(
      updateLocation,
      (err) => {
        setError("GPS Error: " + err.message + ". Try using Simulation Mode.");
        setStatus('error');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    const iId = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        updateLocation,
        () => {}, // ignore errors on poll, rely on watchPosition
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }, 10000); 

    setActiveTrackingIds({ watch: wId, interval: iId });
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
        busId: busId,
        status: 'active'
      };

      try {
        await setDoc(doc(db, 'busLocations', busId), locationData);
      } catch (err) {
        console.error("Simulation write error:", err);
      }

      index = (index + 1) % route.length;
    }, 2000);

    setActiveTrackingIds({ interval: intervalId as any });
  };

  const stopTracking = async () => {
    if (activeTrackingIds) {
      if (activeTrackingIds.watch !== undefined) {
        navigator.geolocation.clearWatch(activeTrackingIds.watch);
      }
      if (activeTrackingIds.interval !== undefined) {
        window.clearInterval(activeTrackingIds.interval);
      }
    }
    
    setActiveTrackingIds(null);
    setIsTracking(false);
    setStatus('idle');
    setCurrentCoords(null);

    try {
      await deleteDoc(doc(db, 'busLocations', busId));
    } catch (err) {
      console.warn("Error deleting document on stop:", err);
    }
  };

  useEffect(() => {
    return () => {
      if (activeTrackingIds) {
        if (activeTrackingIds.watch !== undefined) {
          navigator.geolocation.clearWatch(activeTrackingIds.watch);
        }
        if (activeTrackingIds.interval !== undefined) {
          window.clearInterval(activeTrackingIds.interval);
        }
      }
    };
  }, [activeTrackingIds]);

  return (
    <div className="flex-1 flex w-full flex-col items-center justify-center p-6 font-sans bg-[#fdfbf7]">
      <div className="w-full max-w-md bg-white border border-[#8b5a2b]/20 rounded-3xl p-8 text-center shadow-2xl">
        <div className="w-20 h-20 bg-[#f4ebe1] text-[#8b5a2b] border border-[#8b5a2b]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <Radio size={40} className={isTracking ? 'animate-pulse' : ''} />
        </div>
        
        <h2 className="text-2xl font-bold text-[#4a2e15]">Host Dashboard</h2>
        <p className="text-gray-500 mt-2 text-sm font-medium">Broadcasting on: <span className="text-[#8b5a2b] font-bold">{busId.replace('_', ' ').toUpperCase()}</span></p>

        <div className="mt-8 space-y-4">
          {!isTracking ? (
            <>
              <button 
                onClick={startTracking}
                className="w-full py-4 bg-[#8b5a2b] hover:bg-[#7a4b3a] text-white rounded-xl font-bold shadow-lg shadow-[#8b5a2b]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Play size={20} /> Start Real GPS Sharing
              </button>
              <button 
                onClick={startSimulation}
                className="w-full py-4 bg-white border-2 border-[#8b5a2b] hover:bg-[#8b5a2b]/5 text-[#8b5a2b] rounded-xl font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Radio size={20} /> Start Simulation View
              </button>
            </>
          ) : (
            <button 
              onClick={stopTracking}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Square size={20} /> Stop Journey
            </button>
          )}
        </div>

        <div className="mt-10 p-6 bg-gray-50 rounded-2xl border border-gray-200 text-left">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Transmission Status</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 font-medium">Network</span>
              <span className="text-xs px-2 py-1 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-full font-bold">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 font-medium">GPS Access</span>
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${status === 'tracking' ? 'bg-emerald-100 border border-emerald-200 text-emerald-700' : 'bg-gray-200 border border-gray-300 text-gray-600'}`}>
                {status === 'tracking' ? 'Active' : 'Offline'}
              </span>
            </div>
            {currentCoords && (
              <div className="pt-3 border-t border-gray-200 mt-3">
                 <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Current Coordinates</p>
                 <div className="flex gap-4">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} className="text-[#8b5a2b]" />
                      <span className="text-sm font-mono text-gray-700">{currentCoords.lat.toFixed(5)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={14} className="text-[#a67c52]" />
                      <span className="text-sm font-mono text-gray-700">{currentCoords.lng.toFixed(5)}</span>
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
            className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 text-sm text-left border border-red-200"
          >
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <p>{error}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
