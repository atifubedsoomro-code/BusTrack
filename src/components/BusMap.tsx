import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { onSnapshot, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { BusLocation } from '../types';
import { Bus, MapPin, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet marker icon issues
const busIcon = L.divIcon({
  className: 'custom-bus-icon',
  html: `<div class="bg-blue-600 p-2 rounded-full shadow-lg border-2 border-white text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s1-1.33 1-2c0-3.33-2.67-6-6-6H7c-3.33 0-6 2.67-6 6 0 .67 1 2 1 2h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="17" cy="18" r="2"/></svg>
        </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Component to handle auto-panning the map
const RecenterMap: React.FC<{ lat: number, lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

export const BusMap: React.FC = () => {
  const [location, setLocation] = useState<BusLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for live updates from bus_01
    const unsubscribe = onSnapshot(
      doc(db, 'busLocations', 'bus_01'),
      (snapshot) => {
        if (snapshot.exists()) {
          setLocation(snapshot.data() as BusLocation);
          setError(null);
        } else {
          setLocation(null);
          setError('Bus is currently offline or not sharing location.');
        }
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'busLocations/bus_01');
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex-1 w-full relative font-sans overflow-hidden">
      {loading ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0f172a]/80 backdrop-blur-md">
          <Navigation className="animate-bounce text-blue-400 mb-2" size={48} />
          <p className="text-slate-300 font-medium">Connecting to live feed...</p>
        </div>
      ) : error ? (
        <div className="absolute inset-x-4 top-4 z-40 bg-red-500/10 border border-red-500/20 backdrop-blur-md p-4 rounded-2xl shadow-lg flex items-start gap-3">
          <MapPin className="text-red-400 shrink-0 mt-1" size={20} />
          <div>
            <h4 className="font-bold text-red-400">No Active Data</h4>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      ) : null}

      <div className="absolute inset-0 z-10 w-full h-full">
        <MapContainer 
          center={[27.7152, 68.8574]} 
          zoom={14} 
          scrollWheelZoom={true}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {location && (
            <>
              <Marker 
                position={[location.lat, location.lng]} 
                icon={busIcon}
              >
                <Popup>
                  <div className="text-center p-1">
                    <h3 className="font-bold text-gray-900">University Bus</h3>
                    <p className="text-xs text-gray-500">Live Location</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Last update: {new Date(location.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
              <RecenterMap lat={location.lat} lng={location.lng} />
            </>
          )}
        </MapContainer>
      </div>

      {/* Floating Info Overlay */}
      {location && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-sm">
          <div className="backdrop-blur-2xl bg-slate-900/40 border border-white/20 p-4 rounded-[40px] shadow-2xl flex items-center gap-4 text-slate-100">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg border border-white/30">
              <Bus size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white">Bus #01 is LIVE</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                Active Journey • Sukkur Route
              </p>
            </div>
            <div className="text-right pr-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">Accuracy</span>
              <span className="text-xs font-mono font-medium text-blue-400">High GPS</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
