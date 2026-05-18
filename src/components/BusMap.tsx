import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, CircleMarker } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { onSnapshot, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { BusLocation, BusId } from '../types';
import { Bus, MapPin, Navigation, LocateFixed, Route, X, User } from 'lucide-react';
import { busData } from '../data/buses';
import 'leaflet/dist/leaflet.css';

// Haversine formula to calculate distance in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) *
    Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Fix for Leaflet marker icon issues
const busIcon = divIcon({
  className: 'custom-bus-icon',
  html: `<div class="bg-[#8b5a2b] p-2 rounded-full shadow-lg border-2 border-white text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s1-1.33 1-2c0-3.33-2.67-6-6-6H7c-3.33 0-6 2.67-6 6 0 .67 1 2 1 2h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="17" cy="18" r="2"/></svg>
        </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Component to handle auto-panning the map
const RecenterMap: React.FC<{ lat: number, lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
};

export const BusMap: React.FC<{ busId: BusId }> = ({ busId }) => {
  const [location, setLocation] = useState<BusLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [etaInfo, setEtaInfo] = useState<string | null>(null);

  const [isRouteOpen, setIsRouteOpen] = useState(false);
  const selectedBusData = busData[busId];

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        alert("Couldn't fetch your location. Please check permissions.");
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (location && userLocation) {
      const dist = calculateDistance(location.lat, location.lng, userLocation.lat, userLocation.lng);
      // Assume urban bus speed of ~25 km/h -> ~416 meters / min
      const speedMperMin = 416;
      const minutes = Math.round(dist / speedMperMin);
      
      if (minutes < 1) {
        setEtaInfo("Arriving shortly!");
      } else {
        setEtaInfo(`~${minutes} min away`);
      }
    } else {
      setEtaInfo(null);
    }
  }, [location, userLocation]);

  useEffect(() => {
    // Listen for live updates from current selected bus
    const unsubscribe = onSnapshot(
      doc(db, 'busLocations', busId),
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
        console.error("Firestore Subscribe Error:", err);
        setError('Lost connection or permission denied.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [busId]);

  return (
    <div className="flex-1 w-full relative font-sans overflow-hidden bg-[#fdfbf7]">
      {loading ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-md">
          <Navigation className="animate-bounce text-[#8b5a2b] mb-2" size={48} />
          <p className="text-[#5e3a21] font-bold">Connecting to live feed...</p>
          <p className="text-[#a67c52] text-sm mt-1">{selectedBusData.label}</p>
        </div>
      ) : null}

      {/* Route Button - Bottom Left */}
      <div className="absolute bottom-40 md:bottom-8 left-4 z-40">
        <button 
          onClick={() => setIsRouteOpen(true)}
          className="bg-white/95 backdrop-blur-md shadow-lg border border-[#8b5a2b]/20 p-3 rounded-2xl flex flex-col items-center justify-center text-[#8b5a2b] hover:bg-[#8b5a2b]/10 transition-colors"
          title="View Route Schedule"
        >
          <Route size={24} />
          <span className="text-[10px] font-bold mt-1 uppercase">Route</span>
        </button>
      </div>

      {/* Top Left Area Container */}
      <div className="absolute top-4 left-4 right-4 md:right-auto z-40 pointer-events-none flex flex-col gap-3 items-start">
        {/* Top Left Driver & Bus Info */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-[#8b5a2b]/20 p-4 w-full max-w-xs transition-all pointer-events-auto">
          <div className="mb-2">
            <h2 className="font-bold text-[#4a2e15]">{selectedBusData.label}</h2>
            <p className="text-xs font-semibold text-[#8b5a2b]">{selectedBusData.name}</p>
          </div>
          <div className="text-xs text-gray-600 border-t border-gray-100 pt-2 mt-1">
            <div className="flex items-center gap-1.5 mb-1">
              <User size={14} className="text-gray-400" />
              <span className="font-medium">{selectedBusData.driverName}</span>
            </div>
            {selectedBusData.phone && (
              <div className="flex items-center gap-1.5 text-[#5e3a21]">
                <span className="font-semibold text-[10px] uppercase tracking-wider bg-[#8b5a2b]/10 px-1.5 py-0.5 rounded">Call: {selectedBusData.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Error Info Card stacked below Driver info */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl shadow-lg flex items-start gap-3 pointer-events-auto w-full max-w-xs md:max-w-md">
            <MapPin className="text-red-500 shrink-0 mt-1" size={20} />
            <div>
              <h4 className="font-bold text-red-700">No Active Data</h4>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Route Sidebar Overlay */}
      {isRouteOpen && (
        <div className="absolute inset-y-0 right-0 w-80 bg-white/95 backdrop-blur-xl shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-50 flex flex-col border-l border-[#8b5a2b]/20 transition-transform transform translate-x-0">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-[#fdfbf7]">
            <h3 className="font-bold text-[#5e3a21] flex items-center gap-2">
              <Route size={18} className="text-[#8b5a2b]" /> Route Schedule
            </h3>
            <button 
              onClick={() => setIsRouteOpen(false)}
              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-4 bg-[#8b5a2b]/5">
            <p className="text-xs font-bold text-[#8b5a2b] uppercase tracking-wider">{selectedBusData.routeTitle}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <ul className="space-y-1 relative">
              <div className="absolute left-6 top-3 bottom-3 w-px bg-gray-200" />
              {selectedBusData.stops.map((stop, idx) => (
                <li key={idx} className="relative flex items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="w-6 flex justify-end mr-4 relative z-10">
                    <div className="w-3 h-3 rounded-full bg-white border-2 border-[#8b5a2b] shadow-sm" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm">{stop.stop}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5 font-medium">{stop.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="absolute inset-0 z-10 w-full h-full">
        <MapContainer 
          center={[27.7152, 68.8574]} 
          zoom={14} 
          scrollWheelZoom={true}
          zoomControl={false}
          style={{ height: '100%', width: '100%', backgroundColor: '#e5e5e5' }}
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
                    <h3 className="font-bold text-[#5e3a21]">{selectedBusData.label}</h3>
                    <p className="text-xs text-[#a67c52]">Live Location • {selectedBusData.driverName}</p>
                    <p className="text-[10px] text-gray-500 mt-1 font-mono">
                      Last update: {new Date(location.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
              
              {location.path && location.path.length > 1 && (
                <Polyline 
                  positions={location.path.map(p => [p.lat, p.lng])} 
                  pathOptions={{ color: '#8b5a2b', weight: 6, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }} 
                />
              )}

              {userLocation && (
                <CircleMarker 
                  center={[userLocation.lat, userLocation.lng]} 
                  radius={8} 
                  pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.8, color: 'white', weight: 2 }}
                >
                  <Popup>
                    <p className="font-bold text-gray-800 text-sm">Your Location</p>
                  </Popup>
                </CircleMarker>
              )}

              <RecenterMap lat={location.lat} lng={location.lng} />
            </>
          )}
        </MapContainer>
      </div>

      {/* Floating Info Overlay */}
      {location && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-sm flex flex-col gap-3">
          
          <button 
            onClick={requestUserLocation}
            className="self-end bg-white border border-gray-200 shadow-md text-gray-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <LocateFixed size={14} className="text-[#8b5a2b]" />
            {etaInfo ? "Update My Location" : "Find My Location"}
          </button>

          <div className="backdrop-blur-xl bg-white/95 border border-gray-200 p-4 rounded-[32px] shadow-2xl flex items-center gap-4 text-gray-800">
            <div className="w-12 h-12 bg-[#8b5a2b] rounded-full flex items-center justify-center text-white shadow-lg overflow-hidden shrink-0">
              <Bus size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-[#5e3a21] leading-tight">{selectedBusData.label} is LIVE</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 font-medium">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                {selectedBusData.name}
              </p>
            </div>
            <div className="text-right pr-2">
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-widest">
                {etaInfo ? "Est. Time" : "Accuracy"}
              </span>
              <span className="text-xs font-mono font-bold text-[#8b5a2b]">
                {etaInfo ? etaInfo : "High GPS"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
