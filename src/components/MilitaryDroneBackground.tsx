import React from 'react';
import { motion } from 'motion/react';
import { Drone } from 'lucide-react';

export const MilitaryDroneBackground: React.FC = () => {
  const drones = React.useMemo(() => Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    size: Math.random() * 40 + 20,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 20,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.15 + 0.05,
  })), []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0">
      {drones.map((drone) => (
        <motion.div
          key={drone.id}
          initial={{ 
            x: `${drone.x}%`, 
            y: `${drone.y}%`, 
            opacity: 0,
            rotate: Math.random() * 360 
          }}
          animate={{ 
            x: [`${drone.x}%`, `${(drone.x + 10) % 100}%`, `${drone.x}%`],
            y: [`${drone.y}%`, `${(drone.y + 10) % 100}%`, `${drone.y}%`],
            opacity: drone.opacity,
            rotate: [0, 10, -10, 0]
          }}
          transition={{ 
            duration: drone.duration, 
            repeat: Infinity, 
            ease: "linear",
            delay: drone.delay
          }}
          className="absolute text-gold/30"
          style={{ width: drone.size, height: drone.size }}
        >
          <Drone size={drone.size} strokeWidth={1} />
          {/* Subtle military "sensor" glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-red-500 rounded-full blur-[1px] opacity-50 animate-pulse" />
        </motion.div>
      ))}
      
      {/* Scanline effect for that military surveillance feel */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />
    </div>
  );
};
