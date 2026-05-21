import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface MetalIconProps {
  iconName: string;
  size?: number;
  className?: string;
  type?: 'silver' | 'gold' | 'steel' | 'bronze';
}

export const MetalIcon: React.FC<MetalIconProps> = ({ 
  iconName, 
  size = 24, 
  className = "", 
  type = 'silver' 
}) => {
  // Map strings to icons if needed, or use directly if passed as name
  const Icon = (LucideIcons as any)[iconName] as LucideIcon || LucideIcons.HelpCircle;

  const getGradientId = () => {
    switch (type) {
      case 'gold': return 'gold-metal-gradient';
      case 'steel': return 'steel-metal-gradient';
      case 'bronze': return 'bronze-metal-gradient';
      default: return 'silver-metal-gradient';
    }
  };

  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="silver-metal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="20%" stopColor="#e5e7eb" />
            <stop offset="50%" stopColor="#9ca3af" />
            <stop offset="80%" stopColor="#e5e7eb" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <linearGradient id="gold-metal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff2ac" />
            <stop offset="20%" stopColor="#f9d423" />
            <stop offset="50%" stopColor="#ffdb01" />
            <stop offset="80%" stopColor="#f9d423" />
            <stop offset="100%" stopColor="#fff2ac" />
          </linearGradient>
          <linearGradient id="steel-metal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="50%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="bronze-metal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="50%" stopColor="#92400e" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
        </defs>
      </svg>
      <Icon 
        size={size} 
        stroke={`url(#${getGradientId()})`}
        className="filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]"
      />
    </span>
  );
};
