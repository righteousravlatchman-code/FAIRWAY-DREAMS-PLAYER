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
  const peaks = useRef<number[]>([]);
  const shakeRef = useRef(0);
  const chromaticRef = useRef(0);
  const lastAvgRef = useRef(0);
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
    const modes: VisualizerMode[] = ['bars', 'wave', 'radial', 'particles', 'mirror', 'scope', 'tunnel', 'nebula', 'vortex', 'matrix', 'kaleidoscope'];
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

    // Cinematic Beat Detection
    if (avg - lastAvgRef.current > 40 * (1 / sensitivity)) {
      shakeRef.current = 10 * intensity;
      chromaticRef.current = 15 * intensity;
    }
    lastAvgRef.current = avg;
    shakeRef.current *= 0.9;
    chromaticRef.current *= 0.8;

    // Clear with trail
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.fillStyle = `rgba(5, 5, 5, ${0.15 + pulse * 0.1})`;
    ctx.fillRect(0, 0, W, H);

    // Apply Cinematic Shake
    if (shakeRef.current > 0.1) {
      const sx = (Math.random() - 0.5) * shakeRef.current;
      const sy = (Math.random() - 0.5) * shakeRef.current;
      ctx.translate(sx, sy);
    }

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
    else if (mode === 'tunnel') drawTunnel(ctx, dataArray, W, H, theme, pulse, settings);
    else if (mode === 'nebula') drawNebula(ctx, dataArray, W, H, theme, pulse, settings);
    else if (mode === 'vortex') drawVortex(ctx, dataArray, W, H, theme, pulse, settings);
    else if (mode === 'matrix') drawMatrix(ctx, dataArray, W, H, theme, pulse, settings);
    else if (mode === 'kaleidoscope') drawKaleidoscope(ctx, dataArray, W, H, theme, pulse, settings);

    // Chromatic Aberration Effect
    if (chromaticRef.current > 0.5) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.5;
      ctx.drawImage(canvas, chromaticRef.current, 0);
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(canvas, -chromaticRef.current, 0);
      ctx.restore();
    }

    // Interaction Feedback
    if (isDragging.current) {
      const { x, y } = lastPos.current;
      const primaryColor = settings.customColor || theme.primary;
      
      ctx.save();
      // Cinematic crosshair
      ctx.strokeStyle = `${primaryColor}66`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, 20 + pulse * 20, 0, Math.PI * 2);
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = primaryColor;
      ctx.fill();
      
      // HUD-style info
      ctx.fillStyle = 'white';
      ctx.font = '8px font-mono';
      ctx.textAlign = 'left';
      ctx.fillText(`SIGNAL_SPEED: ${speed.toFixed(1)}x`, x + 30, y - 5);
      ctx.fillText(`AMPLITUDE_INTENSITY: ${intensity.toFixed(1)}x`, x + 30, y + 10);
      
      // Scanning circles
      for (let i = 0; i < 3; i++) {
        const r = ((Date.now() / 500 + i / 3) % 1) * 60;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `${primaryColor}${Math.floor((1 - r/60) * 100).toString(16).padStart(2, '0')}`;
        ctx.stroke();
      }
      ctx.restore();
    }

    requestRef.current = requestAnimationFrame(draw);
  };

  const particles = useRef<any[]>([]);
  const stars = useRef<any[]>([]);
  const matrixStreams = useRef<any[]>([]);
  const nebulaDust = useRef<any[]>([]);
  const vortexScale = useRef<number>(1);
  const mandalaRotation = useRef<number>(0);

  const drawParticles = (ctx: CanvasRenderingContext2D, d: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const avg = (d.reduce((a, b) => a + b, 0) / d.length / 255) * s.sensitivity;
    const primaryColor = s.customColor || theme.primary;
    
    // Spawn particles
    if (particles.current.length < 150 * s.intensity) {
      const count = Math.ceil(3 * s.intensity);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 20 + 5;
        const velSpeed = (Math.random() * 2 + 1) * s.speed * (0.5 + avg * 2);
        particles.current.push({
          x: W / 2 + Math.cos(angle) * radius,
          y: H / 2 + Math.sin(angle) * radius,
          vx: Math.cos(angle) * velSpeed,
          vy: Math.sin(angle) * velSpeed,
          size: Math.random() * 3 * s.intensity + 1,
          life: 1,
          color: primaryColor,
          glow: Math.random() > 0.7
        });
      }
    }

    // Update and draw particles with interactive custom vector flow
    particles.current = particles.current.filter(p => p.life > 0);
    
    ctx.save();
    
    // Web lattice connections for classic stellar constellations web
    for (let i = 0; i < particles.current.length; i++) {
      const p1 = particles.current[i];
      for (let j = i + 1; j < particles.current.length; j++) {
        const p2 = particles.current[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 80 * s.intensity) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `${primaryColor}${Math.floor((1 - dist / (80 * s.intensity)) * 30).toString(16).padStart(2, '0')}`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Render particles themselves with trailing and core flares
    particles.current.forEach(p => {
      ctx.globalAlpha = p.life * 0.9;
      ctx.fillStyle = p.color;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size + pulse * 2, 0, Math.PI * 2);
      ctx.fill();
      
      if (p.glow) {
        ctx.shadowBlur = 10 * s.intensity;
        ctx.shadowColor = p.color;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      
      p.x += p.vx * (1 + pulse * 0.5);
      p.y += p.vy * (1 + pulse * 0.5);
      
      p.life -= 0.005 * s.speed;
      
      // Slowly spiral outwards
      const angle = Math.atan2(p.y - H/2, p.x - W/2);
      p.vx += Math.cos(angle + Math.PI/2) * 0.02 * s.speed;
      p.vy += Math.sin(angle + Math.PI/2) * 0.02 * s.speed;
    });
    ctx.restore();
  };

  const drawBars = (ctx: CanvasRenderingContext2D, d: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const n = 40;
    const slot = W / n;
    const bw = slot * 0.7;
    const primaryColor = s.customColor || theme.primary;

    if (peaks.current.length !== n) {
      peaks.current = new Array(n).fill(0);
    }

    ctx.save();
    
    // Draw horizontal clean guideline
    ctx.beginPath();
    ctx.moveTo(0, H - 40);
    ctx.lineTo(W, H - 40);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.stroke();

    for (let i = 0; i < n; i++) {
      const val = Math.pow((d[Math.floor(i * d.length / n)] / 255) * s.sensitivity, 0.9);
      const bh = val * (H - 80) * 0.8 * s.intensity;
      const x = i * slot + slot * 0.15;
      const y = H - 40 - bh;

      // Create beautiful multi-segment led style bar
      const segments = 12;
      const segmentHeight = Math.max(1, bh / segments);
      
      for (let j = 0; j < segments; j++) {
        const segY = H - 40 - (j * bh / segments);
        const ratio = j / segments;
        
        ctx.fillStyle = ratio < 0.6 ? `${primaryColor}cc` : (ratio < 0.85 ? `${theme.secondary}cc` : `${theme.accent}cc`);
        ctx.fillRect(x, segY - segmentHeight + 1, bw, segmentHeight - 1);
      }

      // Draw shiny reflective light at the very tip on peak beats
      if (val > 0.8) {
        ctx.save();
        ctx.shadowBlur = 15 * s.intensity;
        ctx.shadowColor = theme.accent;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, bw, 3);
        ctx.restore();
      }

      // Handle peaks dynamics
      if (bh > peaks.current[i]) {
        peaks.current[i] = bh;
      } else {
        peaks.current[i] -= 1.5 * s.speed;
      }

      // Render floating peak markers
      const peakY = H - 40 - peaks.current[i];
      if (peaks.current[i] > 2) {
        ctx.fillStyle = theme.accent;
        ctx.fillRect(x, peakY - 3, bw, 2);
      }

      // Wet Floor Reflection
      ctx.save();
      ctx.globalAlpha = 0.15 * (1 - (i / n) * 0.1);
      ctx.translate(0, H - 40);
      ctx.scale(1, -0.4);
      
      const reflGrad = ctx.createLinearGradient(0, 0, 0, bh);
      reflGrad.addColorStop(0, `${primaryColor}66`);
      reflGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = reflGrad;
      ctx.fillRect(x, 0, bw, bh);
      ctx.restore();
    }
    
    ctx.restore();
  };

  const drawWave = (ctx: CanvasRenderingContext2D, t: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const primaryColor = s.customColor || theme.primary;
    const step = W / (t.length - 1);
    const midY = H / 2;
    
    ctx.save();
    
    // Wave 1: Golden Ambient Bass Underlay (extremely smooth, heavy, glowing)
    ctx.beginPath();
    ctx.moveTo(0, H);
    
    let points1: {x: number, y: number}[] = [];
    for (let i = 0; i < t.length; i += 4) {
      const v = ((t[i] / 255) - 0.5) * H * 0.6 * s.sensitivity * s.intensity;
      points1.push({ x: i * step, y: midY + v * 0.5 });
    }
    
    ctx.moveTo(0, midY);
    for (let i = 0; i < points1.length - 1; i++) {
      const xc = (points1[i].x + points1[i+1].x) / 2;
      const yc = (points1[i].y + points1[i+1].y) / 2;
      ctx.quadraticCurveTo(points1[i].x, points1[i].y, xc, yc);
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    const grad1 = ctx.createLinearGradient(0, midY, 0, H);
    grad1.addColorStop(0, `${theme.secondary}22`);
    grad1.addColorStop(1, 'transparent');
    ctx.fillStyle = grad1;
    ctx.fill();

    // Wave 2: Middle Frequency Fluid Cyan Ribbon (with high transparency)
    ctx.beginPath();
    let points2: {x: number, y: number}[] = [];
    for (let i = 0; i < t.length; i += 2) {
      const rawVal = t[i];
      const offset = Math.sin(i * 0.05 + Date.now() * 0.003 * s.speed) * 20;
      const v = ((rawVal / 255) - 0.5) * H * 0.8 * s.sensitivity * s.intensity + offset;
      points2.push({ x: i * step, y: midY + v * 0.8 });
    }
    
    ctx.moveTo(points2[0].x, points2[0].y);
    for (let i = 0; i < points2.length - 1; i++) {
      const xc = (points2[i].x + points2[i+1].x) / 2;
      const yc = (points2[i].y + points2[i+1].y) / 2;
      ctx.quadraticCurveTo(points2[i].x, points2[i].y, xc, yc);
    }
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 3 * s.intensity;
    ctx.shadowBlur = 15 * s.intensity;
    ctx.shadowColor = primaryColor;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Wave 3: High Frequency Sharp Laser Filament Ribbon
    ctx.beginPath();
    ctx.moveTo(0, midY);
    for (let i = 0; i < t.length; i += 8) {
      const v = ((t[i] / 255) - 0.5) * H * 0.9 * s.sensitivity * s.intensity;
      const x = i * step;
      const y = midY + v + Math.cos(i * 0.1 + Date.now() * 0.01 * s.speed) * 10 * pulse;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 1 * s.intensity;
    ctx.stroke();

    ctx.restore();
  };

  const drawRadial = (ctx: CanvasRenderingContext2D, d: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const cx = W / 2;
    const cy = H / 2;
    const minDim = Math.min(W, H);
    const r0 = minDim * 0.18 + pulse * 25; 
    const r1 = minDim * 0.48 * s.intensity;
    const primaryColor = s.customColor || theme.primary;

    ctx.save();
    
    // Draw backing solar bloom/deep glow
    const radialBloom = ctx.createRadialGradient(cx, cy, r0 * 0.5, cx, cy, r0 * 1.8);
    radialBloom.addColorStop(0, `${primaryColor}aa`);
    radialBloom.addColorStop(0.3, `${theme.secondary}33`);
    radialBloom.addColorStop(1, 'transparent');
    ctx.fillStyle = radialBloom;
    ctx.beginPath();
    ctx.arc(cx, cy, r0 * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Orbital rings in background rotating in opposite directions
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r0 * 1.3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(201, 168, 76, 0.05)';
    ctx.beginPath();
    ctx.arc(cx, cy, r0 * 1.5, 0, Math.PI * 2);
    ctx.stroke();

    // Alternate rotating satellite dot tracker
    const orbitAngle = (Date.now() / 1500) * s.speed;
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(orbitAngle) * (r0 * 1.3), cy + Math.sin(orbitAngle) * (r0 * 1.3), 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.arc(cx - Math.cos(orbitAngle * 1.5) * (r0 * 1.5), cy - Math.sin(orbitAngle * 1.5) * (r0 * 1.5), 2, 0, Math.PI * 2);
    ctx.fill();

    // Spiral Sunburst Flares
    ctx.translate(cx, cy);
    ctx.rotate(Date.now() * 0.0003 * s.speed);
    
    const slice = (Math.PI * 2) / 96;
    for (let i = 0; i < 96; i++) {
      const dIndex = Math.floor(i * d.length / 96);
      const val = Math.pow((d[dIndex] / 255) * s.sensitivity, 0.85);
      const len = (r1 - r0) * val;
      if (len < 1) continue;

      const angle = i * slice;
      const x1 = Math.cos(angle) * r0;
      const y1 = Math.sin(angle) * r0;
      
      const curveFactor = 0.08 * s.intensity * val;
      const x2 = Math.cos(angle + curveFactor) * (r0 + len);
      const y2 = Math.sin(angle + curveFactor) * (r0 + len);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(Math.cos(angle + curveFactor * 0.5) * (r0 + len * 0.5), Math.sin(angle + curveFactor * 0.5) * (r0 + len * 0.5), x2, y2);
      
      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, primaryColor);
      g.addColorStop(0.5, theme.secondary);
      g.addColorStop(1, theme.accent);
      
      ctx.strokeStyle = g;
      ctx.lineWidth = (W / 450) * s.intensity * (val + 0.4);
      ctx.lineCap = 'round';
      ctx.stroke();
      
      // Emit particle stardust flares
      if (val > 0.82 && Math.random() > 0.85) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x2 + (Math.random() - 0.5) * 8, y2 + (Math.random() - 0.5) * 8, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Core Central Ring
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, r0, 0, Math.PI * 2);
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 3 + pulse * 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r0 - 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const drawMirror = (ctx: CanvasRenderingContext2D, d: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const n = 64;
    const slot = (W / 2) / n;
    const bw = slot * 0.75;
    const primaryColor = s.customColor || theme.primary;
    
    ctx.save();
    
    // Clean horizon center line
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.stroke();

    ctx.translate(W / 2, H / 2);

    for (let i = 0; i < n; i++) {
      const v = Math.pow((d[Math.floor(i * d.length / n)] / 255) * s.sensitivity, 0.85);
      const bh = v * H * 0.45 * s.intensity;
      const x = i * slot;
      
      const g = ctx.createLinearGradient(0, -bh, 0, bh);
      g.addColorStop(0, theme.accent);
      g.addColorStop(0.3, primaryColor);
      g.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
      g.addColorStop(0.7, primaryColor);
      g.addColorStop(1, theme.secondary);

      ctx.fillStyle = g;
      
      // Symmetrical layout
      ctx.fillRect(x, -bh, bw, bh * 2);
      ctx.fillRect(-x - bw, -bh, bw, bh * 2);
      
      if (v > 0.7 && i % 4 === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, -bh - 4, bw, 2);
        ctx.fillRect(-x - bw, -bh - 4, bw, 2);
        ctx.fillRect(x, bh + 2, bw, 2);
        ctx.fillRect(-x - bw, bh + 2, bw, 2);
      }
    }
    ctx.restore();
  };

  const drawScope = (ctx: CanvasRenderingContext2D, t: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const primaryColor = s.customColor || theme.primary;
    const midY = H / 2;
    const midX = W / 2;
    
    ctx.save();

    // Background Scanner Line
    const scanAngle = (Date.now() / 2000) * s.speed;
    ctx.strokeStyle = `${primaryColor}0c`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(midX + Math.cos(scanAngle) * W, midY + Math.sin(scanAngle) * H);
    ctx.stroke();

    // Cyber HUD Wireframe Geometry
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.arc(midX, midY, 100, 0, Math.PI * 2);
    ctx.arc(midX, midY, 200, 0, Math.PI * 2);
    ctx.arc(midX, midY, 300, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(50, midY);
    ctx.lineTo(W - 50, midY);
    ctx.moveTo(midX, 50);
    ctx.lineTo(midX, H - 50);
    ctx.stroke();

    // Interactive target ticks
    ctx.font = '8px monospace';
    ctx.fillStyle = `${primaryColor}66`;
    ctx.fillText("N 0.0°", midX + 5, 25);
    ctx.fillText("S 180°", midX + 5, H - 15);
    ctx.fillText("W 270°", 15, midY - 5);
    ctx.fillText("E 90°", W - 50, midY - 5);
    ctx.fillText(`SYS_GAIN: +${(s.sensitivity * 12).toFixed(1)}dB`, 25, 40);
    ctx.fillText(`INTEGRITY: ${(98.4 + pulse * 1.5).toFixed(2)}%`, 25, 55);
    ctx.fillText("HUD_LOCK: FREQ_ACTIVE", W - 150, 40);
    
    // Draw oscilloscope path with rich phosphor glow trail
    ctx.beginPath();
    const step = W / (t.length - 1);
    for (let i = 0; i < t.length; i++) {
      const v = ((t[i] / 255) - 0.5) * H * 0.7 * s.sensitivity * s.intensity;
      const x = i * step;
      const y = midY + v;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2.5 * s.intensity;
    ctx.shadowBlur = 18 * s.intensity;
    ctx.shadowColor = primaryColor;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw active bright coordinate nodes along path
    ctx.fillStyle = '#ffffff';
    const interval = Math.floor(t.length / 12);
    for (let i = 0; i < t.length; i += interval) {
      const v = ((t[i] / 255) - 0.5) * H * 0.7 * s.sensitivity * s.intensity;
      const x = i * step;
      const y = midY + v;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  const drawTunnel = (ctx: CanvasRenderingContext2D, d: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const primaryColor = s.customColor || theme.primary;
    const time = Date.now() * 0.001 * s.speed;
    const cx = W / 2;
    const cy = H / 2;

    // Maintain 3D Starfield background inside Tunnel
    if (stars.current.length < 120) {
      for (let i = 0; i < 120; i++) {
        stars.current.push({
          x: Math.random() * W - cx,
          y: Math.random() * H - cy,
          z: Math.random() * 1000,
          color: Math.random() > 0.7 ? theme.accent : '#ffffff'
        });
      }
    }

    ctx.save();
    
    // Render Starfield
    stars.current.forEach(star => {
      star.z -= (5 + pulse * 15) * s.speed;
      if (star.z <= 0) {
        star.z = 1000;
        star.x = Math.random() * W - cx;
        star.y = Math.random() * H - cy;
      }
      
      const px = (star.x * 200) / star.z + cx;
      const py = (star.y * 200) / star.z + cy;
      const size = (1 - star.z / 1000) * 3;
      
      if (px > 0 && px < W && py > 0 && py < H) {
        ctx.fillStyle = star.color;
        ctx.globalAlpha = (1 - star.z / 1000) * 0.8;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();

    // Octagonal 3D portal rings receding into deep space
    const rings = 12;
    for (let i = 0; i < rings; i++) {
      const z = (i + (time % 1)) / rings;
      const size = (1 - z) * Math.min(W, H) * 0.95;
      const opacity = z * 0.65;
      const twist = time * 0.15 + i * 0.06;
      const freqIndex = Math.floor((i / rings) * d.length);
      const v = (d[freqIndex] / 255) * s.sensitivity * s.intensity;
      
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(twist);
      ctx.strokeStyle = primaryColor;
      ctx.globalAlpha = opacity;
      ctx.lineWidth = 1.5 + v * 9;
      
      const rad = size + v * 60;
      
      ctx.beginPath();
      const sides = 8;
      for (let j = 0; j < sides; j++) {
        const theta = (j * Math.PI * 2) / sides;
        const x = Math.cos(theta) * (rad / 2);
        const y = Math.sin(theta) * (rad / 2);
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      
      if (v > 0.65) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = primaryColor;
      }
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  };

  const drawNebula = (ctx: CanvasRenderingContext2D, d: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const primaryColor = s.customColor || theme.primary;
    const time = Date.now() * 0.0006 * s.speed;
    const cx = W / 2;
    const cy = H / 2;
    const minDim = Math.min(W, H);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    
    // Draw majestic multi-layered planetary dust cores
    const layers = 3;
    for (let i = 0; i < layers; i++) {
      const angle = time + (i * Math.PI * 2) / layers;
      const dist = pulse * 60 * s.intensity;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;
      
      const grad = ctx.createRadialGradient(x, y, 0, x, y, minDim * (0.35 + pulse * 0.15) * s.intensity);
      const color = i === 0 ? primaryColor : (i === 1 ? theme.secondary : theme.accent);
      grad.addColorStop(0, `${color}44`);
      grad.addColorStop(0.5, `${color}11`);
      grad.addColorStop(1, 'transparent');
      
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // Swirling nebula cosmic dust particles
    if (nebulaDust.current.length < 180) {
      for (let i = 0; i < 180; i++) {
        nebulaDust.current.push({
          angle: Math.random() * Math.PI * 2,
          distance: Math.random() * minDim * 0.45,
          speed: Math.random() * 0.01 + 0.002,
          size: Math.random() * 2 + 0.5,
          color: Math.random() > 0.6 ? theme.accent : '#ffffff'
        });
      }
    }

    nebulaDust.current.forEach(dust => {
      dust.angle += dust.speed * s.speed * (1 + pulse * 1.5);
      
      const breath = Math.sin(time * 2 + dust.distance * 0.01) * 15 * pulse;
      const dist = dust.distance + breath;
      
      const x = cx + Math.cos(dust.angle) * dist;
      const y = cy + Math.sin(dust.angle) * dist;
      
      if (x > 0 && x < W && y > 0 && y < H) {
        ctx.fillStyle = dust.color;
        ctx.globalAlpha = 0.1 + (1 - dust.distance / (minDim * 0.45)) * 0.6;
        ctx.beginPath();
        ctx.arc(x, y, dust.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    ctx.restore();
  };

  const drawVortex = (ctx: CanvasRenderingContext2D, d: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const cx = W / 2;
    const cy = H / 2;
    const primaryColor = s.customColor || theme.primary;
    const time = Date.now() * 0.001 * s.speed;
    const minDim = Math.min(W, H);

    if (vortexScale.current !== undefined) {
      vortexScale.current = 1 + pulse * 0.15;
    }

    ctx.save();
    
    const well = ctx.createRadialGradient(cx, cy, 10, cx, cy, minDim * 0.5);
    well.addColorStop(0, '#000000');
    well.addColorStop(0.3, 'rgba(5,5,5,0.85)');
    well.addColorStop(1, 'transparent');
    ctx.fillStyle = well;
    ctx.beginPath();
    ctx.arc(cx, cy, minDim * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(cx, cy);
    
    const arms = 8;
    for (let j = 0; j < arms; j++) {
      ctx.rotate((Math.PI * 2) / arms);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      
      let points: {x: number, y: number}[] = [];
      const steps = 40;
      for (let i = 0; i < steps; i++) {
        const freqIndex = Math.floor((i / steps) * d.length);
        const val = (d[freqIndex] / 255) * s.sensitivity;
        const rad = (i * 9 + val * 45) * s.intensity * vortexScale.current;
        const armAngle = i * 0.12 - time * 0.8 + val * 1.5;
        
        points.push({
          x: Math.cos(armAngle) * rad,
          y: Math.sin(armAngle) * rad
        });
      }
      
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i+1].x) / 2;
        const yc = (points[i].y + points[i+1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      
      ctx.strokeStyle = j % 2 === 0 ? primaryColor : theme.secondary;
      ctx.lineWidth = 1.5 + pulse * 8;
      ctx.shadowBlur = 12 * pulse;
      ctx.shadowColor = primaryColor;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    ctx.beginPath();
    ctx.arc(0, 0, 15 + pulse * 25, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 30;
    ctx.shadowColor = theme.accent;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  };

  const drawMatrix = (ctx: CanvasRenderingContext2D, d: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const primaryColor = s.customColor || theme.primary;
    const columns = Math.floor(W / 22);

    if (matrixStreams.current.length === 0) {
      for (let i = 0; i < columns; i++) {
        matrixStreams.current.push({
          x: i * 22 + 4,
          y: Math.random() * -H,
          speed: Math.random() * 4 + 2,
          depth: Math.random(),
          chars: Array.from({ length: 15 }).map(() => String.fromCharCode(0x30A0 + Math.random() * 96))
        });
      }
    }

    matrixStreams.current.forEach((stream, i) => {
      const freqIndex = Math.floor((i / columns) * d.length);
      const val = (d[freqIndex] / 255) * s.sensitivity;
      
      const charSize = Math.floor(10 + stream.depth * 8);
      ctx.font = `bold ${charSize}px monospace`;
      
      stream.y += stream.speed * s.speed * (1 + val * 2.5);
      if (stream.y > H + 120) {
        stream.y = -150;
        stream.speed = Math.random() * 4 + 2;
        stream.depth = Math.random();
      }

      stream.chars.forEach((char, index) => {
        const charY = stream.y - (index * charSize);
        if (charY < 0 || charY > H) return;

        const ageRatio = 1 - (index / stream.chars.length);
        
        ctx.fillStyle = index === 0 ? '#ffffff' : primaryColor;
        ctx.globalAlpha = ageRatio * stream.depth * (0.3 + val * 0.7);
        
        ctx.fillText(char, stream.x, charY);
        
        if (Math.random() > 0.98) {
          stream.chars[index] = String.fromCharCode(0x30A0 + Math.random() * 96);
        }
      });
    });
    
    ctx.globalAlpha = 1;
  };

  const drawKaleidoscope = (ctx: CanvasRenderingContext2D, d: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const sides = 8;
    const cx = W / 2;
    const cy = H / 2;
    const primaryColor = s.customColor || theme.primary;

    if (mandalaRotation.current !== undefined) {
      mandalaRotation.current += s.speed * 0.001 * (1 + pulse * 2);
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(mandalaRotation.current);

    ctx.strokeStyle = `rgba(255, 255, 255, ${0.01 + pulse * 0.03})`;
    ctx.lineWidth = 1;
    const geoR = W * 0.25 * s.intensity;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * geoR, Math.sin(angle) * geoR, geoR, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let i = 0; i < sides; i++) {
      ctx.rotate((Math.PI * 2) / sides);
      ctx.save();
      if (i % 2 === 1) ctx.scale(1, -1);
      
      const n = 32;
      for (let j = 0; j < n; j++) {
        const freqIndex = Math.floor(j * d.length / n);
        const val = (d[freqIndex] / 255) * s.sensitivity;
        const x = j * (W / n * 0.72) + (Math.sin(Date.now() * 0.001 * s.speed + j * 0.15) * 12);
        const y = val * H * 0.35 * s.intensity;
        
        ctx.globalAlpha = 0.2 + val * 0.7;
        
        ctx.fillStyle = primaryColor;
        ctx.fillRect(x, -y / 2, 2.5 * s.intensity, y);
        
        if (val > 0.7) {
          ctx.beginPath();
          ctx.arc(x, y / 2, 3.5 * s.intensity, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 12 * pulse;
          ctx.shadowColor = theme.accent;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        
        if (j % 3 === 0) {
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 1 * s.intensity;
          ctx.beginPath();
          ctx.arc(x, 0, y * 0.45, -Math.PI / 3, Math.PI / 3);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    
    ctx.strokeStyle = `${primaryColor}aa`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, W * 0.3 * s.intensity, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 12 + pulse * 45, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
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
