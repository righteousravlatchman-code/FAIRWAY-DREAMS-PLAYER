import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface FrequencyVisualizerProps {
  name: string;
  birthDate: string;
}

export const FrequencyVisualizer: React.FC<FrequencyVisualizerProps> = ({ name, birthDate }) => {
  const bars = useMemo(() => {
    // Generate some deterministic values based on name and birthdate
    const seed = (name + birthDate).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Array.from({ length: 32 }).map((_, i) => {
      const height = 20 + (Math.sin(seed + i * 0.5) * 0.5 + 0.5) * 60;
      const delay = i * 0.05;
      const duration = 1 + (Math.cos(seed + i) * 0.5 + 0.5) * 2;
      return { height, delay, duration };
    });
  }, [name, birthDate]);

  return (
    <div className="flex items-end justify-center gap-1 h-32 w-full px-4 overflow-hidden">
      {bars.map((bar, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ 
            height: [`${bar.height}%`, `${bar.height * 1.5}%`, `${bar.height * 0.8}%`, `${bar.height}%`],
            opacity: [0.3, 0.8, 0.5, 0.3]
          }}
          transition={{ 
            duration: bar.duration, 
            repeat: Infinity, 
            delay: bar.delay,
            ease: "easeInOut"
          }}
          className="w-1 sm:w-2 bg-gold rounded-t-full shadow-[0_0_15px_rgba(201,168,76,0.3)]"
        />
      ))}
    </div>
  );
};
