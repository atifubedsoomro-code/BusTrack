import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, Polyline } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BusLocation, BusId } from '../types';
import { busData } from '../data/buses';
import 'leaflet/dist/leaflet.css';

const busIcon = divIcon({
  className: 'custom-bus-icon',
  html: `<div class="bg-emerald-500 p-2 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] border-2 border-white text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s1-1.33 1-2c0-3.33-2.67-6-6-6H7c-3.33 0-6 2.67-6 6 0 .67 1 2 1 2h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="17" cy="18" r="2"/></svg>
        </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

export const AdminMap = ({ mapTheme }: { mapTheme: 'light' | 'dark' }) => {
  const [locations, setLocations] = useState<Record<string, BusLocation>>({});

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

  // BBSUTSD approximate center coordinates
  const centerLat = 27.5250;
  const centerLng = 68.7560;
  
  return (
    <div className="w-full h-full bg-[#161921] relative z-0 flex rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
      <MapContainer 
        center={[centerLat, centerLng]} 
        zoom={11} 
        style={{ width: '100%', height: '100%', background: mapTheme === 'dark' ? '#1a1d24' : '#f8f9fa' }}
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          className={mapTheme === 'dark' ? 'map-tiles-dark' : ''}
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {Object.entries(locations).map(([id, loc]) => {
          const bus = busData[id as BusId];
          if (!bus) return null;
          
          const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
          const busNumber = parseInt(id.replace('bus_', '')) || 1;
          const routeColor = colors[(busNumber - 1) % colors.length];

          const busIconColor = divIcon({
            className: 'custom-bus-icon',
            html: `<div class="p-2 rounded-full shadow-lg border-2 border-white text-white" style="background-color: ${routeColor};">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s1-1.33 1-2c0-3.33-2.67-6-6-6H7c-3.33 0-6 2.67-6 6 0 .67 1 2 1 2h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="17" cy="18" r="2"/></svg>
                  </div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });

          return (
            <React.Fragment key={id}>
              {loc.path && loc.path.length > 0 && (
                <Polyline 
                  positions={loc.path.map(p => [p.lat, p.lng])} 
                  color={routeColor} 
                  weight={5} 
                  opacity={0.9}
                  dashArray="5, 10"
                />
              )}
              <Marker position={[loc.lat, loc.lng]} icon={busIconColor}>
                <Popup className="dark-popup">
                  <div className="p-1 text-center min-w-[120px]">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">{bus.label.split(' (')[0]}</h3>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{bus.driverName}</p>
                    <p className="text-[10px] text-gray-500 mt-1 font-mono">
                      Last ping: {new Date(loc.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
      
      {/* Overlay Status info */}
      <div className="absolute top-4 left-4 z-[400] pointer-events-none">
        <div className="bg-[#161921]/90 backdrop-blur-md border border-gray-800 p-3 rounded-xl shadow-lg pointer-events-auto">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">Live Telemetry</p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm text-gray-200 font-bold">{Object.keys(locations).length} Active Buses</span>
          </div>
        </div>
      </div>
    </div>
  );
};
