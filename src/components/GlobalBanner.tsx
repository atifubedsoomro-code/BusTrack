import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AlertTriangle, Bell, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const GlobalBanner = () => {
  const [alertData, setAlertData] = useState<{ message: string; active: boolean; expiresAt?: number } | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_alerts', 'global'), (doc) => {
      if (doc.exists()) {
        setAlertData(doc.data() as any);
      } else {
        setAlertData(null);
      }
    });
    return unsub;
  }, []);

  const now = Date.now();
  const isValid = alertData?.active && (!alertData.expiresAt || alertData.expiresAt > now);

  if (!isValid) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-red-500 text-white w-full shadow-md z-[200] overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-start sm:items-center justify-center gap-3">
          <AlertTriangle size={20} className="shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-sm font-semibold tracking-wide leading-tight">
            <span className="uppercase font-bold mr-2 opacity-90">Attention:</span>
            {alertData.message}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
