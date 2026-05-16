import React, { useEffect, useRef } from 'react';
import { VisualizerMode, ThemeColors, VisualizerSettings } from '../types';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  settings: VisualizerSettings;
  theme: ThemeColors;
  isPlaying: boolean;
  onSettingsChange?: (s: VisualizerSettings) => void;
}

export const Visualizer: React.FC<VisualizerProps> = ({ analyser, settings, theme, isPlaying, onSettingsChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const { mode, speed, sensitivity, intensity } = settings;

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current || !onSettingsChange) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) / rect.width;
    const y = 1 - (clientY - rect.top) / rect.height; // Invert Y so bottom is 0

    const dpr = window.devicePixelRatio || 1;
    lastPos.current = { 
      x: (clientX - rect.left) * dpr, 
      y: (clientY - rect.top) * dpr 
    };

    // Map X to Speed (0.1 to 3)
    const newSpeed = 0.1 + x * 2.9;
    // Map Y to Intensity (0.1 to 2)
    const newIntensity = 0.1 + y * 1.9;

    onSettingsChange({
      ...settings,
      speed: Number(newSpeed.toFixed(2)),
      intensity: Number(newIntensity.toFixed(2))
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.shiftKey && onSettingsChange) {
      const colors = ['#F27D26', '#00FF00', '#FF00FF', '#00FFFF', '#FFD700', '#FF4444'];
      const currentIndex = colors.indexOf(settings.customColor || '');
      const nextIndex = (currentIndex + 1) % colors.length;
      onSettingsChange({
        ...settings,
        customColor: colors[nextIndex]
      });
      return;
    }
    isDragging.current = true;
    handleInteraction(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      handleInteraction(e);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleDoubleClick = () => {
    if (!onSettingsChange) return;
    const modes: VisualizerMode[] = ['bars', 'wave', 'radial', 'particles', 'mirror', 'scope'];
    const currentIndex = modes.indexOf(settings.mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    
    onSettingsChange({
      ...settings,
      mode: modes[nextIndex]
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    handleInteraction(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging.current) {
      handleInteraction(e);
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  const draw = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Data gathering
    let dataArray = new Uint8Array(0);
    let timeData = new Uint8Array(0);
    
    if (analyser) {
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      timeData = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(timeData);
    } else {
      // Idle animation data
      dataArray = new Uint8Array(128);
      const time = Date.now() * speed;
      for (let i = 0; i < dataArray.length; i++) {
        dataArray[i] = Math.sin(time / 700 + i * 0.25) * 20 * intensity + 20;
      }
      timeData = new Uint8Array(512);
      for (let i = 0; i < timeData.length; i++) {
        timeData[i] = 128 + Math.sin(time / 400 + i * 0.05) * 18 * intensity;
      }
    }

    const avg = (dataArray.reduce((a, b) => a + b, 0) / (dataArray.length || 1)) * sensitivity;
    const pulse = Math.min(avg / 255, 1);

    // Clear with trail
    ctx.fillStyle = `rgba(5, 5, 5, ${0.15 + pulse * 0.1})`;
    ctx.fillRect(0, 0, W, H);

    // Ambient Glow
    const radGlow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
    const primaryColor = settings.customColor || theme.primary;
    radGlow.addColorStop(0, `${primaryColor}${Math.max(0, Math.min(255, Math.floor(pulse * 40 * intensity))).toString(16).padStart(2, '0')}`);
    radGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = radGlow;
    ctx.fillRect(0, 0, W, H);

    // Background Signal Bars
    const barCount = 40;
    const barWidth = W / barCount;
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < barCount; i++) {
      const h = (dataArray[Math.floor(i * dataArray.length / barCount)] / 255) * H * 0.5 * sensitivity;
      ctx.fillStyle = primaryColor;
      ctx.fillRect(i * barWidth, H - h, barWidth - 2, h);
    }
    ctx.globalAlpha = 1;

    if (mode === 'bars') drawBars(ctx, dataArray, W, H, theme, pulse, settings);
    else if (mode === 'wave') drawWave(ctx, timeData, W, H, theme, pulse, settings);
    else if (mode === 'radial') drawRadial(ctx, dataArray, W, H, theme, pulse, settings);
    else if (mode === 'mirror') drawMirror(ctx, dataArray, W, H, theme, pulse, settings);
    else if (mode === 'scope') drawScope(ctx, timeData, W, H, theme, pulse, settings);
    else if (mode === 'particles') drawParticles(ctx, dataArray, W, H, theme, pulse, settings);

    // Interaction Feedback
    if (isDragging.current) {
      const { x, y } = lastPos.current;
      const primaryColor = settings.customColor || theme.primary;
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = primaryColor;
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = '10px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(`SPEED: ${speed.toFixed(1)}x`, x, y - 30);
      ctx.fillText(`INTENSITY: ${intensity.toFixed(1)}x`, x, y - 42);
      ctx.restore();
    }

    requestRef.current = requestAnimationFrame(draw);
  };

  const particles = useRef<any[]>([]);

  const drawParticles = (ctx: CanvasRenderingContext2D, d: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const avg = (d.reduce((a, b) => a + b, 0) / d.length / 255) * s.sensitivity;
    const primaryColor = s.customColor || theme.primary;
    
    if (avg > 0.2 && particles.current.length < 200 * s.intensity) {
      for (let i = 0; i < 2; i++) {
        particles.current.push({
          x: W / 2,
          y: H / 2,
          vx: (Math.random() - 0.5) * 10 * avg * s.speed,
          vy: (Math.random() - 0.5) * 10 * avg * s.speed,
          life: 1,
          size: Math.random() * 3 * s.intensity + 1,
          color: primaryColor
        });
      }
    }

    particles.current = particles.current.filter(p => p.life > 0);
    particles.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.01 * s.speed;
    });
    ctx.globalAlpha = 1;
  };

  const drawBars = (ctx: CanvasRenderingContext2D, d: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const n = 64;
    const slot = W / n;
    const bw = slot * 0.7;
    const primaryColor = s.customColor || theme.primary;
    for (let i = 0; i < n; i++) {
      const v = Math.pow((d[Math.floor(i * d.length / n)] / 255) * s.sensitivity, 0.8);
      const bh = v * H * 0.8 * s.intensity;
      const x = i * slot + slot * 0.15;
      
      const gr = ctx.createLinearGradient(0, H, 0, H - bh);
      gr.addColorStop(0, `${theme.secondary}66`);
      gr.addColorStop(0.5, primaryColor);
      gr.addColorStop(1, theme.accent);
      
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.roundRect(x, H - bh, bw, bh, [4, 4, 0, 0]);
      ctx.fill();

      if (v > 0.7) {
        ctx.shadowBlur = 15 * s.intensity;
        ctx.shadowColor = primaryColor;
        ctx.fillStyle = theme.accent;
        ctx.fillRect(x, H - bh, bw, 2);
        ctx.shadowBlur = 0;
      }
    }
  };

  const drawWave = (ctx: CanvasRenderingContext2D, t: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const primaryColor = s.customColor || theme.primary;
    ctx.beginPath();
    const step = W / (t.length - 1);
    for (let i = 0; i < t.length; i++) {
      const v = ((t[i] / 255) - 0.5) * H * 0.7 * s.sensitivity * s.intensity;
      const x = i * step;
      const y = H / 2 + v;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2 * s.intensity;
    ctx.stroke();

    // Glow
    ctx.shadowBlur = 20 * s.intensity;
    ctx.shadowColor = primaryColor;
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const drawRadial = (ctx: CanvasRenderingContext2D, d: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const cx = W / 2;
    const cy = H / 2;
    const r0 = (Math.min(W, H) * 0.15 + pulse * 20) * s.intensity;
    const r1 = Math.min(W, H) * 0.45 * s.intensity;
    const primaryColor = s.customColor || theme.primary;

    for (let i = 0; i < d.length; i++) {
      const angle = (i / d.length) * Math.PI * 2 - Math.PI / 2;
      const v = Math.pow((d[i] / 255) * s.sensitivity, 0.8);
      const len = (r1 - r0) * v;
      if (len < 1) continue;

      const x1 = cx + Math.cos(angle) * r0;
      const y1 = cy + Math.sin(angle) * r0;
      const x2 = cx + Math.cos(angle) * (r0 + len);
      const y2 = cy + Math.sin(angle) * (r0 + len);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2 * s.intensity;
      ctx.stroke();
    }
  };

  const drawMirror = (ctx: CanvasRenderingContext2D, d: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const n = d.length / 2;
    const slot = W / n;
    const bw = slot * 0.8;
    const primaryColor = s.customColor || theme.primary;
    for (let i = 0; i < n; i++) {
      const v = Math.pow((d[i] / 255) * s.sensitivity, 0.8);
      const bh = v * H * 0.4 * s.intensity;
      const x = i * slot;
      
      ctx.fillStyle = primaryColor;
      ctx.fillRect(x, H / 2 - bh, bw, bh);
      ctx.fillStyle = `${primaryColor}33`;
      ctx.fillRect(x, H / 2, bw, bh);
    }
  };

  const drawScope = (ctx: CanvasRenderingContext2D, t: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const primaryColor = s.customColor || theme.primary;
    ctx.beginPath();
    const step = W / (t.length - 1);
    for (let i = 0; i < t.length; i++) {
      const v = ((t[i] / 255) - 0.5) * H * 0.8 * s.sensitivity * s.intensity;
      const x = i * step;
      const y = H / 2 + v;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = s.customColor || theme.accent;
    ctx.lineWidth = 1.5 * s.intensity;
    ctx.stroke();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    requestRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [settings, theme, analyser]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full block cursor-pointer"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
};
