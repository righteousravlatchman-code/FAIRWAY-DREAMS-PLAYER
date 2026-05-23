import { useState, useEffect } from 'react';
import { Riff } from '../types';

export function useRiffLibrary() {
  const [riffs, setRiffs] = useState<Riff[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('fd_riffs');
    if (saved) {
      try {
        setRiffs(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse riffs", e);
      }
    }
  }, []);

  const saveRiff = (riffParams: Omit<Riff, 'id' | 'timestamp'>) => {
    const newRiff: Riff = {
      ...riffParams,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    
    setRiffs(prev => {
      const updated = [newRiff, ...prev];
      localStorage.setItem('fd_riffs', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteRiff = (id: string) => {
    setRiffs(prev => {
      const updated = prev.filter(r => r.id !== id);
      localStorage.setItem('fd_riffs', JSON.stringify(updated));
      return updated;
    });
  };

  return { riffs, saveRiff, deleteRiff };
}
