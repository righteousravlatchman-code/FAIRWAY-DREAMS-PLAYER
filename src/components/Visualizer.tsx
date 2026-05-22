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
    const modes: VisualizerMode[] = ['bars', 'wave', 'radial', 'particles', 'mirror', 'scope', 'tunnel', 'nebula', 'vortex', 'matrix', 'kaleidoscope', 'liquid', 'dna', 'galaxy', 'atom', 'blackhole', 'constellation'];
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
      // Idle animation data: blend multiple harmonics to simulate rich, complex organic soundscapes!
      dataArray = new Uint8Array(128);
      const time = Date.now() * 0.001 * speed;
      for (let i = 0; i < dataArray.length; i++) {
        const bass = Math.sin(time * 0.8 - i * 0.04) * 35;
        const mid = Math.cos(time * 1.8 + i * 0.1) * 15;
        const treble = Math.sin(time * 3.5 - i * 0.25) * (8 + Math.sin(time * 0.5) * 4);
        const noise = (Math.sin(time * 10 + i) * 2);
        
        // Distribution focusing the energy toward the lower frequencies
        const distribution = Math.exp(-Math.pow((i - 20) / 45, 2));
        dataArray[i] = Math.max(10, 40 + (bass + mid + treble + noise) * distribution * intensity);
      }
      
      timeData = new Uint8Array(512);
      for (let i = 0; i < timeData.length; i++) {
        const primaryWave = Math.sin(time * 1.5 + i * 0.02) * 35;
        const higherHarmonic = Math.cos(time * 3.2 + i * 0.06) * 12;
        const subBass = Math.sin(time * 0.6 + i * 0.008) * 20;
        timeData[i] = 128 + Math.max(-100, Math.min(100, (primaryWave + higherHarmonic + subBass) * intensity));
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

    // Determine trail alpha based on mode
    let trailAlpha = 0.15;
    if (mode === 'particles' || mode === 'galaxy' || mode === 'nebula') trailAlpha = 0.3;
    if (mode === 'blackhole' || mode === 'atom' || mode === 'dna') trailAlpha = 0.2;
    if (mode === 'wave' || mode === 'liquid' || mode === 'tunnel') trailAlpha = 0.5;

    // Clear with trail
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.fillStyle = `rgba(5, 5, 5, ${trailAlpha + pulse * 0.1})`;
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
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = radGlow;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';

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
    
    // Smooth rendering for visualizers
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

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
    else if (mode === 'liquid') drawLiquid(ctx, dataArray, W, H, theme, pulse, settings);
    else if (mode === 'dna') drawDNA(ctx, dataArray, W, H, theme, pulse, settings);
    else if (mode === 'galaxy') drawGalaxy(ctx, dataArray, W, H, theme, pulse, settings);
    else if (mode === 'atom') drawAtom(ctx, dataArray, timeData, W, H, theme, pulse, settings);
    else if (mode === 'blackhole') drawBlackHole(ctx, dataArray, timeData, W, H, theme, pulse, settings);
    else if (mode === 'constellation') drawConstellation(ctx, dataArray, W, H, theme, pulse, settings);

    // Dynamic High-Energy Flash Effect
    if (chromaticRef.current > 5) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `${theme.accent}${Math.min(255, Math.floor(chromaticRef.current * 4)).toString(16).padStart(2, '0')}`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

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

    // Add cinematic vignette
    const vignetteGrad = ctx.createRadialGradient(W/2, H/2, W/4, W/2, H/2, W/1.2);
    vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vignetteGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';

    // Subtle CRT Scanlines with very slow drift
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    const scanlineDrift = (Date.now() / 40) % 4;
    for (let i = -4; i < H; i += 4) {
      ctx.fillRect(0, i + scanlineDrift, W, 1);
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
  const dnaRotation = useRef<number>(0);
  const galaxyRotation = useRef<number>(0);
  const atomRotation = useRef<number>(0);
  const blackHoleRotation = useRef<number>(0);

  const drawParticles = (ctx: CanvasRenderingContext2D, d: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const avg = (d.reduce((a, b) => a + b, 0) / d.length / 255) * s.sensitivity;
    const primaryColor = s.customColor || theme.primary;
    
    // Spawn particles
    if (particles.current.length < 180 * s.intensity) {
      const count = Math.ceil(4 * s.intensity);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 30 + 5;
        const velSpeed = (Math.random() * 2.5 + 1) * s.speed * (0.6 + avg * 2.5);
        particles.current.push({
          x: W / 2 + Math.cos(angle) * radius,
          y: H / 2 + Math.sin(angle) * radius,
          vx: Math.cos(angle) * velSpeed,
          vy: Math.sin(angle) * velSpeed,
          size: Math.random() * 3.5 * s.intensity + 1,
          life: 1,
          color: Math.random() > 0.4 ? primaryColor : theme.accent,
          glow: Math.random() > 0.65
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
        
        if (dist < 90 * s.intensity) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          const alphaHex = Math.floor((1 - dist / (90 * s.intensity)) * 42).toString(16).padStart(2, '0');
          ctx.strokeStyle = `${p1.color}${alphaHex}`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    // Render particles themselves with trailing and core flares
    particles.current.forEach(p => {
      ctx.globalAlpha = p.life * 0.95;
      
      // Outer light bloom representation
      const particleGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3 + pulse * 10);
      particleGlow.addColorStop(0, p.color);
      particleGlow.addColorStop(0.3, `${p.color}aa`);
      particleGlow.addColorStop(1, 'transparent');
      
      ctx.fillStyle = particleGlow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3 + pulse * 10, 0, Math.PI * 2);
      ctx.fill();
      
      if (p.glow) {
        ctx.save();
        ctx.shadowBlur = 15 * s.intensity;
        ctx.shadowColor = p.color;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      
      // Interactive gravity attraction pulling towards mouse cursor if dragging!
      if (isDragging.current) {
        const { x: tx, y: ty } = lastPos.current;
        const dx = tx - p.x;
        const dy = ty - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // Gravitational force pull vector
        const force = Math.min(2.5, (180 / dist) * s.speed);
        p.vx += (dx / dist) * force * 0.12;
        p.vy += (dy / dist) * force * 0.12;
        
        // Draw a faint vector tracking thread line to the cursor
        if (dist < 200) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(tx, ty);
          ctx.strokeStyle = `${p.color}09`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
      
      p.x += p.vx * (1 + pulse * 0.6);
      p.y += p.vy * (1 + pulse * 0.6);
      
      p.life -= 0.004 * s.speed;
      
      // Physics: slowly rotate and spiral outwards or wrap in orbitals
      const angle = Math.atan2(p.y - H/2, p.x - W/2);
      const orbitTwist = (isDragging.current ? 0.04 : 0.015) * s.speed;
      p.vx += Math.cos(angle + Math.PI / 2) * orbitTwist;
      p.vy += Math.sin(angle + Math.PI / 2) * orbitTwist;
      
      // Drag/Friction to regulate infinite speeds
      p.vx *= 0.985;
      p.vy *= 0.985;
    });
    ctx.restore();
  };

  const drawBars = (ctx: CanvasRenderingContext2D, d: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const n = 48; // Higher density for premium detail
    const slot = W / n;
    const bw = slot * 0.72;
    const primaryColor = s.customColor || theme.primary;

    if (peaks.current.length !== n) {
      peaks.current = new Array(n).fill(0);
    }

    ctx.save();
    
    // Draw cyber-spectrogram background frequency line grid markers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 6; i++) {
      const lineY = (H / 7) * i;
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(W, lineY);
      ctx.stroke();
    }

    // Centered horizon line
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    for (let i = 0; i < n; i++) {
      const val = Math.pow((d[Math.floor(i * d.length / n)] / 255) * s.sensitivity, 0.85);
      // Equalizer bars spread symmetrically upwards and downwards from center axis
      const bh = val * (H * 0.38) * s.intensity;
      const x = i * slot + slot * 0.14;
      
      // Upward segment rendering
      const segments = 14;
      const segmentHeight = Math.max(1, bh / segments);
      
      for (let j = 0; j < segments; j++) {
        const segY = (H / 2) - (j * bh / segments);
        const ratio = j / segments;
        
        ctx.fillStyle = ratio < 0.5 
          ? `${primaryColor}${Math.floor((1 - ratio) * 230).toString(16).padStart(2, '0')}` 
          : (ratio < 0.82 
            ? `${theme.secondary}d0` 
            : `${theme.accent}d0`);
            
        ctx.fillRect(x, segY - segmentHeight + 1, bw, segmentHeight - 1);
        
        // Symmetrical downward column rendering
        const segYDown = (H / 2) + (j * bh / segments);
        ctx.fillRect(x, segYDown, bw, segmentHeight - 1);
      }

      // Floating dynamic tip peaks tracking
      if (bh > peaks.current[i]) {
        peaks.current[i] = bh;
      } else {
        peaks.current[i] -= 1.8 * s.speed;
      }

      const peakOffset = peaks.current[i];
      if (peakOffset > 2) {
        ctx.fillStyle = theme.accent;
        // Upper peak indicator
        ctx.fillRect(x, (H / 2) - peakOffset - 3, bw, 2);
        // Lower peak indicator
        ctx.fillRect(x, (H / 2) + peakOffset + 1, bw, 2);
        
        // Shiny flare at peaks
        if (val > 0.85) {
          ctx.save();
          ctx.shadowBlur = 12 * s.intensity;
          ctx.shadowColor = theme.accent;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, (H / 2) - peakOffset - 4, bw, 2);
          ctx.fillRect(x, (H / 2) + peakOffset + 2, bw, 2);
          ctx.restore();
        }
      }

      // Subtle Wet mirror reflections under the bars
      ctx.save();
      ctx.globalAlpha = 0.08 * (1 - (i / n) * 0.15);
      ctx.translate(0, H);
      ctx.scale(1, -0.3);
      ctx.fillStyle = primaryColor;
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
    
    // Wave 1: Ambient golden filling underlay (smooth Bezier interpolation)
    ctx.beginPath();
    ctx.moveTo(0, H);
    
    let points1: {x: number, y: number}[] = [];
    for (let i = 0; i < t.length; i += 4) {
      const v = ((t[i] / 255) - 0.5) * H * 0.55 * s.sensitivity * s.intensity;
      points1.push({ x: i * step, y: midY + v * 0.6 });
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
    grad1.addColorStop(0, `${theme.secondary}1a`);
    grad1.addColorStop(0.7, `${primaryColor}08`);
    grad1.addColorStop(1, 'transparent');
    ctx.fillStyle = grad1;
    ctx.fill();

    // Wave 2: Liquid fluid Ribbon with translucent gradients
    ctx.beginPath();
    let points2: {x: number, y: number}[] = [];
    for (let i = 0; i < t.length; i += 2) {
      const rawVal = t[i];
      const offset = Math.sin(i * 0.04 + Date.now() * 0.002 * s.speed) * 15;
      const v = ((rawVal / 255) - 0.5) * H * 0.78 * s.sensitivity * s.intensity + offset;
      points2.push({ x: i * step, y: midY + v * 0.82 });
    }
    
    ctx.moveTo(points2[0].x, points2[0].y);
    for (let i = 0; i < points2.length - 1; i++) {
      const xc = (points2[i].x + points2[i+1].x) / 2;
      const yc = (points2[i].y + points2[i+1].y) / 2;
      ctx.quadraticCurveTo(points2[i].x, points2[i].y, xc, yc);
    }
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 3.5 * s.intensity;
    ctx.shadowBlur = 18 * s.intensity;
    ctx.shadowColor = primaryColor;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Drawing sparkling peak crest flares
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < points2.length; i += 8) {
      const p = points2[i];
      const dy = Math.abs(p.y - midY);
      if (dy > H * 0.20 && Math.random() > 0.6) {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = theme.accent;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5 * s.intensity, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Wave 3: High Frequency sharp laser line
    ctx.beginPath();
    ctx.moveTo(0, midY);
    for (let i = 0; i < t.length; i += 6) {
      const v = ((t[i] / 255) - 0.5) * H * 0.88 * s.sensitivity * s.intensity;
      const x = i * step;
      const y = midY + v + Math.cos(i * 0.12 + Date.now() * 0.008 * s.speed) * 8 * pulse;
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
    
    // Core radial boundaries
    const r0 = minDim * 0.18 + pulse * 25; 
    const r1 = minDim * 0.48 * s.intensity;
    const primaryColor = s.customColor || theme.primary;

    ctx.save();
    
    // Draw backing solar bloom/deep glow
    const radialBloom = ctx.createRadialGradient(cx, cy, r0 * 0.4, cx, cy, r0 * 1.9);
    radialBloom.addColorStop(0, `${primaryColor}b8`);
    radialBloom.addColorStop(0.4, `${theme.secondary}38`);
    radialBloom.addColorStop(1, 'transparent');
    ctx.fillStyle = radialBloom;
    ctx.beginPath();
    ctx.arc(cx, cy, r0 * 1.9, 0, Math.PI * 2);
    ctx.fill();

    // Concentric EQ dials in background (Bass & Vocal mid-range trackers)
    ctx.strokeStyle = `${theme.secondary}12`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r0 * 1.25, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `${primaryColor}0c`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r0 * 1.45, 0, Math.PI * 2);
    ctx.stroke();

    // Orbital satellite tracking dots
    const orbitAngle = (Date.now() / 1200) * s.speed;
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(orbitAngle) * (r0 * 1.25), cy + Math.sin(orbitAngle) * (r0 * 1.25), 3.5 + pulse * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.arc(cx - Math.cos(orbitAngle * 1.4) * (r0 * 1.45), cy - Math.sin(orbitAngle * 1.4) * (r0 * 1.45), 2.5 + pulse * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Sunburst flares
    ctx.translate(cx, cy);
    ctx.rotate(Date.now() * 0.00025 * s.speed);
    
    const slice = (Math.PI * 2) / 108;
    for (let i = 0; i < 108; i++) {
      const dIndex = Math.floor(i * d.length / 108);
      const val = Math.pow((d[dIndex] / 255) * s.sensitivity, 0.85);
      const len = (r1 - r0) * val;
      if (len < 1) continue;

      const angle = i * slice;
      const x1 = Math.cos(angle) * r0;
      const y1 = Math.sin(angle) * r0;
      
      // Curved magnetic solar flares
      const curveFactor = 0.09 * s.intensity * val;
      const x2 = Math.cos(angle + curveFactor) * (r0 + len);
      const y2 = Math.sin(angle + curveFactor) * (r0 + len);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(
        Math.cos(angle + curveFactor * 0.5) * (r0 + len * 0.5),
        Math.sin(angle + curveFactor * 0.5) * (r0 + len * 0.5),
        x2, y2
      );
      
      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, primaryColor);
      g.addColorStop(0.5, theme.secondary);
      g.addColorStop(1, theme.accent);
      
      ctx.strokeStyle = g;
      ctx.lineWidth = (W / 460) * s.intensity * (val + 0.45);
      ctx.lineCap = 'round';
      ctx.stroke();
      
      // Solar stardust flares spitting off tips
      if (val > 0.8 && Math.random() > 0.8) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(
          x2 + (Math.random() - 0.5) * 10,
          y2 + (Math.random() - 0.5) * 10,
          1.5 * s.intensity,
          0, Math.PI * 2
        );
        ctx.fill();
      }
    }
    
    // Core Central Rings (High-end HUD-style)
    ctx.restore();
    
    ctx.beginPath();
    ctx.arc(cx, cy, r0, 0, Math.PI * 2);
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 3 + pulse * 6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r0 - 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const drawMirror = (ctx: CanvasRenderingContext2D, d: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    // n frequency components which are mirrored 4-ways (symmetrically across X and Y axes)
    const n = 40;
    const slot = (W / 2) / n;
    const bw = slot * 0.72;
    const primaryColor = s.customColor || theme.primary;
    
    ctx.save();
    
    // Drawing a faint central coordinate grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();

    ctx.translate(W / 2, H / 2);

    // Glowing core diamond web that expands using low frequency bass energy!
    const bassVal = (d[2] / 255) * s.sensitivity;
    const dSize = 25 + bassVal * 70 * s.intensity;
    ctx.beginPath();
    ctx.moveTo(0, -dSize);
    ctx.lineTo(dSize, 0);
    ctx.lineTo(0, dSize);
    ctx.lineTo(-dSize, 0);
    ctx.closePath();
    ctx.strokeStyle = `${primaryColor}22`;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 10;
    ctx.shadowColor = primaryColor;
    ctx.stroke();
    ctx.shadowBlur = 0;

    let barsHistory: {x: number, y: number}[] = [];

    for (let i = 0; i < n; i++) {
      const v = Math.pow((d[Math.floor(i * d.length / n)] / 255) * s.sensitivity, 0.85);
      const bh = v * H * 0.42 * s.intensity;
      const x = i * slot + 2;
      
      const g = ctx.createLinearGradient(0, -bh, 0, bh);
      g.addColorStop(0, theme.accent);
      g.addColorStop(0.3, primaryColor);
      g.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
      g.addColorStop(0.7, primaryColor);
      g.addColorStop(1, theme.secondary);

      ctx.fillStyle = g;
      
      // Render 4-Way Symmetrical block grid pairs (Quadrant symmetrical reflection!)
      // Quadrant 1 and 4 (Right side up & down)
      ctx.fillRect(x, -bh, bw, bh * 2);
      // Quadrant 2 and 3 (Left side up & down)
      ctx.fillRect(-x - bw, -bh, bw, bh * 2);
      
      barsHistory.push({ x: x, y: bh });

      // Peak tip glowing markers
      if (v > 0.68) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, -bh - 4, bw, 2);
        ctx.fillRect(-x - bw, -bh - 4, bw, 2);
        ctx.fillRect(x, bh + 2, bw, 2);
        ctx.fillRect(-x - bw, bh + 2, bw, 2);
      }
    }

    // Intersecting laser filament network connecting adjacent quadrant bar-tips on music peaks!
    if (bassVal > 0.5) {
      ctx.beginPath();
      ctx.strokeStyle = `${theme.accent}1c`;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < barsHistory.length - 1; i += 2) {
        const p1 = barsHistory[i];
        const p2 = barsHistory[i + 1];
        // Connect diagonals to draw a beautiful web lattice
        ctx.moveTo(p1.x, -p1.y);
        ctx.lineTo(p2.x, -p2.y);
        ctx.moveTo(-p1.x, -p1.y);
        ctx.lineTo(-p2.x, -p2.y);
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.moveTo(-p1.x, p1.y);
        ctx.lineTo(-p2.x, p2.y);
      }
      ctx.stroke();
    }
    
    ctx.restore();
  };

  const drawScope = (ctx: CanvasRenderingContext2D, t: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const primaryColor = s.customColor || theme.primary;
    const midY = H / 2;
    const midX = W / 2;
    
    ctx.save();

    // High frequency digital glitch decimation (horizontal offset bars on heavy peaks)
    if (pulse > 0.35 && Math.random() > 0.72) {
      const gHeight = Math.random() * 40 + 10;
      const gRowY = Math.random() * (H - gHeight);
      const shiftX = (Math.random() - 0.5) * 26 * s.intensity;
      ctx.save();
      ctx.rect(0, gRowY, W, gHeight);
      ctx.clip();
      ctx.translate(shiftX, 0);
    }

    // Background HUD grid & rotating scanning line
    const scanAngle = (Date.now() / 1600) * s.speed;
    ctx.strokeStyle = `${primaryColor}0b`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(midX + Math.cos(scanAngle) * W * 0.8, midY + Math.sin(scanAngle) * H * 0.8);
    ctx.stroke();

    // HUD Circular Rings & Reticles
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(midX, midY, 80, 0, Math.PI * 2);
    ctx.arc(midX, midY, 180, 0, Math.PI * 2);
    ctx.arc(midX, midY, 280, 0, Math.PI * 2);
    ctx.stroke();

    // Reticle Tick Marks
    ctx.strokeStyle = `${primaryColor}1a`;
    ctx.beginPath();
    ctx.moveTo(midX - 290, midY);
    ctx.lineTo(midX - 275, midY);
    ctx.moveTo(midX + 275, midY);
    ctx.lineTo(midX + 290, midY);
    ctx.moveTo(midX, midY - 190);
    ctx.lineTo(midX, midY - 175);
    ctx.moveTo(midX, midY + 175);
    ctx.lineTo(midX, midY + 190);
    ctx.stroke();

    // High-tech HUD Telemetry & Status overlay (pure decorative aesthetics)
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = `${primaryColor}80`;
    ctx.fillText("N 359.8°", midX - 20, 20);
    ctx.fillText("S 180.0°", midX - 20, H - 12);
    ctx.fillText(`SYS_GAIN: +${(s.sensitivity * 12.5).toFixed(1)}dB`, 25, 45);
    ctx.fillText(`AUST_INTEGRITY: ${(98.5 + pulse * 1.4).toFixed(3)}%`, 25, 60);
    ctx.fillText(`CLOCK_GEN: ${(Date.now() % 1000).toString().padStart(3, '0')}_HZ`, 25, 75);
    ctx.fillText(`HUD_LOCK: FREQ_VECTOR_A2`, W - 150, 45);
    ctx.fillText(`AMPL_RATIO: ${s.intensity.toFixed(1)}X`, W - 150, 60);
    
    // Draw central vector Lissajous circular oscilloscope (mathematically gorgeous representation)
    ctx.beginPath();
    const lMax = Math.min(130, t.length);
    for (let i = 0; i < lMax; i++) {
      // Create parametric coordinates combining sine/cosine sound structures
      const ang = (i / lMax) * Math.PI * 2;
      const v1 = ((t[i] / 255) - 0.5) * 80 * s.sensitivity;
      const v2 = ((t[Math.floor((i * 1.5) % t.length)] / 255) - 0.5) * 80 * s.intensity;
      
      const rad = 80 + v1 + v2;
      const lx = midX + Math.cos(ang) * rad;
      const ly = midY + Math.sin(ang) * rad;
      
      if (i === 0) ctx.moveTo(lx, ly);
      else ctx.lineTo(lx, ly);
    }
    ctx.closePath();
    ctx.strokeStyle = `${theme.accent}24`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw main oscilloscope path with custom phosphor glow
    ctx.beginPath();
    const step = W / (t.length - 1);
    for (let i = 0; i < t.length; i++) {
      const v = ((t[i] / 255) - 0.5) * H * 0.76 * s.sensitivity * s.intensity;
      const x = i * step;
      const y = midY + v;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2.5 * s.intensity;
    ctx.shadowBlur = 15 * s.intensity;
    ctx.shadowColor = primaryColor;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Glowing coordinate target boxes along path
    ctx.fillStyle = '#ffffff';
    const interval = Math.floor(t.length / 14);
    for (let i = interval; i < t.length; i += interval) {
      const v = ((t[i] / 255) - 0.5) * H * 0.76 * s.sensitivity * s.intensity;
      const x = i * step;
      const y = midY + v;
      ctx.fillRect(x - 2, y - 2, 4, 4);
    }

    ctx.restore(); // Restores from clip if any
  };

  const drawTunnel = (ctx: CanvasRenderingContext2D, d: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const primaryColor = s.customColor || theme.primary;
    const time = Date.now() * 0.001 * s.speed;
    const cx = W / 2;
    const cy = H / 2;

    // Maintain 3D Starfield background inside Tunnel (with warp trails)
    if (stars.current.length < 130) {
      for (let i = 0; i < 130; i++) {
        stars.current.push({
          x: Math.random() * W - cx,
          y: Math.random() * H - cy,
          z: Math.random() * 1000,
          color: Math.random() > 0.6 ? theme.accent : '#ffffff'
        });
      }
    }

    ctx.save();
    
    // Render Starfield with warp velocity stretching lines
    stars.current.forEach(star => {
      // Fall velocity accelerated on sound beats
      const vMove = (6 + pulse * 28) * s.speed;
      star.z -= vMove;
      
      if (star.z <= 0) {
        star.z = 1000;
        star.x = Math.random() * W - cx;
        star.y = Math.random() * H - cy;
      }
      
      const px = (star.x * 200) / star.z + cx;
      const py = (star.y * 200) / star.z + cy;
      const size = (1 - star.z / 1000) * 2;
      
      // Calculate star trail stretch back coordinates
      const prevZ = star.z + vMove * 1.5;
      const ppx = (star.x * 200) / prevZ + cx;
      const ppy = (star.y * 200) / prevZ + cy;
      
      if (px > 0 && px < W && py > 0 && py < H) {
        ctx.strokeStyle = star.color;
        ctx.globalAlpha = (1 - star.z / 1000) * 0.75;
        ctx.lineWidth = size;
        ctx.beginPath();
        ctx.moveTo(ppx, ppy);
        ctx.lineTo(px, py);
        ctx.stroke();
      }
    });
    ctx.restore();

    // Receding octagonal warp rings
    const rings = 14;
    const corners: {x: number, y: number}[][] = [];

    for (let i = 0; i < rings; i++) {
      const z = (i + (time % 1)) / rings;
      const size = (1 - z) * Math.min(W, H) * 0.98;
      const opacity = z * 0.72;
      const twist = time * 0.12 + i * 0.055;
      const freqIndex = Math.floor((i / rings) * d.length);
      const v = (d[freqIndex] / 255) * s.sensitivity * s.intensity;
      
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(twist);
      ctx.strokeStyle = primaryColor;
      ctx.globalAlpha = opacity;
      ctx.lineWidth = 1.2 + v * 11;
      
      const rad = size + v * 62;
      const ringCorners: {x: number, y: number}[] = [];
      
      ctx.beginPath();
      const sides = 8;
      for (let j = 0; j < sides; j++) {
        const theta = (j * Math.PI * 2) / sides;
        const rx = Math.cos(theta) * (rad / 2);
        const ry = Math.sin(theta) * (rad / 2);
        if (j === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
        ringCorners.push({ x: rx, y: ry });
      }
      ctx.closePath();
      
      if (v > 0.6) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = primaryColor;
      }
      ctx.stroke();
      ctx.restore();

      corners.push(ringCorners.map(c => {
        // Project corners relative to global coordinates to draw mesh ribs
        const cosR = Math.cos(twist);
        const sinR = Math.sin(twist);
        return {
          x: cx + (c.x * cosR - c.y * sinR),
          y: cy + (c.x * sinR + c.y * cosR)
        };
      }));
    }

    // Connect perspective mesh grid rib corners to map out the full 3D wireframe mesh tunnel
    ctx.save();
    ctx.strokeStyle = `${primaryColor}13`;
    ctx.lineWidth = 0.8;
    for (let j = 0; j < 8; j++) {
      ctx.beginPath();
      for (let i = 0; i < corners.length - 1; i++) {
        const p1 = corners[i][j];
        const p2 = corners[i + 1][j];
        if (p1 && p2) {
          ctx.lineTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
        }
      }
      ctx.stroke();
    }
    ctx.restore();

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
    
    // Volumetric supernova trigger on extreme beat spikes!
    const bassVal = (d[2] / 255) * s.sensitivity;
    if (bassVal > 0.86) {
      const novaGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, minDim * 0.45 * s.intensity);
      novaGrad.addColorStop(0, '#ffffff');
      novaGrad.addColorStop(0.2, `${theme.accent}77`);
      novaGrad.addColorStop(0.5, `${primaryColor}22`);
      novaGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = novaGrad;
      ctx.fillRect(0, 0, W, H);
      
      // Radiating supernova expansion shockwave ring
      ctx.beginPath();
      ctx.arc(cx, cy, minDim * 0.22 + bassVal * 100, 0, Math.PI * 2);
      ctx.strokeStyle = `${theme.accent}33`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Draw majestic multi-layered planetary dust cores
    const layers = 4;
    for (let i = 0; i < layers; i++) {
      const angle = time + (i * Math.PI * 2) / layers;
      const dist = pulse * 70 * s.intensity;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;
      
      const grad = ctx.createRadialGradient(x, y, 0, x, y, minDim * (0.36 + pulse * 0.16) * s.intensity);
      const color = i === 0 ? primaryColor : (i === 1 ? theme.secondary : (i === 2 ? theme.accent : '#ffffff'));
      grad.addColorStop(0, `${color}4a`);
      grad.addColorStop(0.5, `${color}14`);
      grad.addColorStop(1, 'transparent');
      
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // Swirling nebula cosmic dust particles
    if (nebulaDust.current.length < 200) {
      for (let i = 0; i < 200; i++) {
        nebulaDust.current.push({
          angle: Math.random() * Math.PI * 2,
          distance: Math.random() * minDim * 0.48,
          speed: Math.random() * 0.009 + 0.002,
          size: Math.random() * 2.2 + 0.5,
          color: Math.random() > 0.6 ? theme.accent : (Math.random() > 0.4 ? theme.secondary : '#ffffff')
        });
      }
    }

    nebulaDust.current.forEach(dust => {
      // Cosmic spiral speed increases proportional to rhythmic pulse
      dust.angle += dust.speed * s.speed * (1 + pulse * 1.8);
      
      const breath = Math.sin(time * 2.5 + dust.distance * 0.012) * 18 * pulse;
      let dist = dust.distance + breath;
      
      let x = cx + Math.cos(dust.angle) * dist;
      let y = cy + Math.sin(dust.angle) * dist;
      
      // Interactive gravity: stardust attracts towards cursor if dragging
      if (isDragging.current) {
        const { x: tx, y: ty } = lastPos.current;
        const dx = tx - x;
        const dy = ty - y;
        const dMouse = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dMouse < 180) {
          x += (dx / dMouse) * (180 - dMouse) * 0.08 * s.speed;
          y += (dy / dMouse) * (180 - dMouse) * 0.08 * s.speed;
        }
      }

      if (x > 0 && x < W && y > 0 && y < H) {
        ctx.fillStyle = dust.color;
        ctx.globalAlpha = 0.12 + (1 - dust.distance / (minDim * 0.48)) * 0.65;
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
      vortexScale.current = 1 + pulse * 0.18;
    }

    ctx.save();
    
    // Sucking event horizon background well
    const well = ctx.createRadialGradient(cx, cy, 15, cx, cy, minDim * 0.5);
    well.addColorStop(0, '#000000');
    well.addColorStop(0.35, 'rgba(4,4,6,0.92)');
    well.addColorStop(1, 'transparent');
    ctx.fillStyle = well;
    ctx.beginPath();
    ctx.arc(cx, cy, minDim * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(cx, cy);
    
    // Multi-arm acoustic helix layout
    const arms = 8;
    for (let j = 0; j < arms; j++) {
      ctx.rotate((Math.PI * 2) / arms);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      
      let points: {x: number, y: number}[] = [];
      const steps = 48;
      for (let i = 0; i < steps; i++) {
        const freqIndex = Math.floor((i / steps) * d.length);
        const val = (d[freqIndex] / 255) * s.sensitivity;
        const rad = (i * 9.5 + val * 48) * s.intensity * vortexScale.current;
        // Turbulence calculations based on music spectrum and elapsed time
        const armAngle = i * 0.11 - time * 0.85 + val * 1.6;
        
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
      
      // Color alternating arms to create beautiful interleaved flows
      ctx.strokeStyle = j % 2 === 0 ? primaryColor : theme.secondary;
      ctx.lineWidth = 1.3 + pulse * 9;
      ctx.shadowBlur = 14 * pulse;
      ctx.shadowColor = primaryColor;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    
    // Core singular photon accretion circle flaring aggressively on beats!
    ctx.beginPath();
    ctx.arc(0, 0, 16 + pulse * 28, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 32 * s.intensity;
    ctx.shadowColor = theme.accent;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  };

  const drawMatrix = (ctx: CanvasRenderingContext2D, d: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const primaryColor = s.customColor || theme.primary;
    const columns = Math.ceil(W / 22);

    // Initializing falling streams if empty
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

    // Far background binary waveform ribbon grid (simulates code matrix underlay)
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = `${theme.secondary}0d`;
    for (let c = 0; c < columns; c += 2) {
      const idx = Math.floor((c / columns) * d.length);
      const val = d[idx] || 0;
      const binY = H - 30 - (val / 255) * (H * 0.4);
      ctx.fillText(Math.random() > 0.5 ? "1" : "0", c * 22, binY);
    }

    matrixStreams.current.forEach((stream, i) => {
      const freqIndex = Math.floor((i / columns) * d.length);
      const val = (d[freqIndex] / 255) * s.sensitivity;
      
      const charSize = Math.floor(10 + stream.depth * 8);
      ctx.font = `bold ${charSize}px monospace`;
      
      // Speed reacts to individual column frequencies
      stream.y += stream.speed * s.speed * (1 + val * 2.8);
      if (stream.y > H + 120) {
        stream.y = -150;
        stream.speed = Math.random() * 4 + 2;
        stream.depth = Math.random();
      }

      // Depth of Field Blurring simulation based on stream depth
      if (stream.depth < 0.45) {
        ctx.filter = 'blur(1px)';
      } else {
        ctx.filter = 'none';
      }

      stream.chars.forEach((char, index) => {
        const charY = stream.y - (index * charSize);
        if (charY < 0 || charY > H) return;

        const ageRatio = 1 - (index / stream.chars.length);
        
        ctx.fillStyle = index === 0 ? '#ffffff' : primaryColor;
        ctx.globalAlpha = ageRatio * stream.depth * (0.28 + val * 0.72);
        
        ctx.fillText(char, stream.x, charY);
        
        // Dynamic character glitching
        if (Math.random() > 0.97) {
          stream.chars[index] = String.fromCharCode(0x30A0 + Math.random() * 96);
        }
      });
    });
    
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
  };

  const drawKaleidoscope = (ctx: CanvasRenderingContext2D, d: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const sides = 8;
    const cx = W / 2;
    const cy = H / 2;
    const primaryColor = s.customColor || theme.primary;

    if (mandalaRotation.current !== undefined) {
      // Rotation speed is modulated by the rhythmic audio pulse
      mandalaRotation.current += s.speed * 0.001 * (1 + pulse * 2.2);
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(mandalaRotation.current);

    // Draw Sacred Geometry Golden Background Grid
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.015 + pulse * 0.035})`;
    ctx.lineWidth = 1;
    const maxDim = Math.max(W, H);
    const geoR = maxDim * 0.38 * s.intensity;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * geoR, Math.sin(angle) * geoR, geoR, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Sacred interlocking geometric flower paths
    for (let i = 0; i < sides; i++) {
      ctx.rotate((Math.PI * 2) / sides);
      ctx.save();
      if (i % 2 === 1) ctx.scale(1, -1);
      
      const n = 42; // increased resolution for wider expanse
      for (let j = 0; j < n; j++) {
        const freqIndex = Math.floor(j * d.length / n);
        const val = (d[freqIndex] / 255) * s.sensitivity;
        const x = j * ((maxDim / n) * 0.95) + (Math.sin(Date.now() * 0.001 * s.speed + j * 0.16) * 14);
        const y = val * maxDim * 0.25 * s.intensity;
        
        ctx.globalAlpha = 0.22 + val * 0.78;
        
        ctx.fillStyle = primaryColor;
        ctx.fillRect(x, -y / 2, 2.8 * s.intensity, y);
        
        // Glowing crystallised points on frequency peaks
        if (val > 0.68) {
          ctx.beginPath();
          ctx.arc(x, y / 2, 4 * s.intensity, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 14 * pulse;
          ctx.shadowColor = theme.accent;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        
        // Multi-layered geometric ripples (arcs)
        if (j % 3 === 0) {
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 1 * s.intensity;
          ctx.beginPath();
          ctx.arc(x, 0, y * 0.55, -Math.PI / 3, Math.PI / 3);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    
    // Poly-axial framing rings
    ctx.strokeStyle = `${primaryColor}66`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, maxDim * 0.42 * s.intensity, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `${theme.accent}44`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, maxDim * 0.48 * s.intensity, 0, Math.PI * 2);
    ctx.stroke();

    // Central core pulsing Sacred Geometry loop
    ctx.beginPath();
    ctx.arc(0, 0, 14 + pulse * 48, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    ctx.restore();
  };

  const drawLiquid = (ctx: CanvasRenderingContext2D, d: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const primaryColor = s.customColor || theme.primary;
    const time = Date.now() * 0.001 * s.speed;
    ctx.save();
    
    // Background viscous glow
    const cx = W / 2;
    const cy = H / 2;
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.6);
    bgGrad.addColorStop(0, `${primaryColor}1a`);
    bgGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Multi-layer blob simulation using overlapping bezier waves
    const layers = 5;
    for (let j = 0; j < layers; j++) {
      ctx.beginPath();
      ctx.moveTo(0, H);
      
      const layerOffset = j * 0.4;
      const points: {x: number, y: number}[] = [];
      const steps = 16;
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * W;
        const freqIndex = Math.floor((i / steps) * (d.length * 0.8));
        const val = ((d[freqIndex] || 0) / 255) * s.sensitivity;
        
        // Fluid organic movement combining sine waves
        const wave = Math.sin(time + x * 0.003 + layerOffset) * 40 +
                     Math.cos(time * 0.7 + x * 0.005 - layerOffset) * 20;
                     
        const yHeight = H * (0.35 + j * 0.12) - (val * H * 0.45 * s.intensity) + wave;
        points.push({ x, y: yHeight });
      }
      
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      
      const opacities = ['33', '4d', '66', '80', 'aa'];
      const colors = [theme.secondary, primaryColor, theme.accent, theme.secondary, primaryColor];
      ctx.fillStyle = `${colors[j % colors.length]}${opacities[j]}`;
      
      // Add subtle glossy shine
      ctx.shadowBlur = 10;
      ctx.shadowColor = `${primaryColor}44`;
      ctx.fill();
      
      // Glossy highlight ribbon on the top edge
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + pulse * 0.3})`;
      ctx.lineWidth = 1.5 + pulse * 2;
      ctx.stroke();
    }
    
    // Floating gooey droplets jumping out of the liquid
    const numDroplets = 24;
    for (let i = 0; i < numDroplets; i++) {
      const freqIndex = Math.floor((i / numDroplets) * d.length);
      const val = (d[freqIndex] / 255) * s.sensitivity;
      if (val > 0.45) {
        const dropX = (W / numDroplets) * i + Math.sin(time + i) * 20;
        const dropY = H * 0.8 - val * H * 0.7 * s.intensity - Math.random() * 50;
        
        ctx.beginPath();
        const dropSize = 2 + val * 10;
        ctx.arc(dropX, dropY, dropSize, 0, Math.PI * 2);
        ctx.fillStyle = `${primaryColor}cc`;
        ctx.fill();
        
        // Inner highlight
        ctx.beginPath();
        ctx.arc(dropX - dropSize*0.3, dropY - dropSize*0.3, dropSize * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
      }
    }
    
    ctx.restore();
  };

  const drawDNA = (ctx: CanvasRenderingContext2D, d: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const primaryColor = s.customColor || theme.primary;
    if (dnaRotation.current !== undefined) {
      dnaRotation.current += s.speed * 0.015 * (1 + pulse * 0.5);
    }
    const r = dnaRotation.current;
    
    ctx.save();
    const cx = W / 2;
    
    // Matrix-style vertical scan lines background
    ctx.fillStyle = `${primaryColor}08`;
    for (let i = 0; i < W; i += 40) {
      ctx.fillRect(i, 0, 1, H);
    }
    
    const nodes = 40;
    const startY = H * 0.1;
    const endY = H * 0.9;
    const spanY = endY - startY;
    
    const strandDistance = 60 + pulse * 40 * s.intensity;
    
    // Draw connections first so they are behind points
    for (let i = 0; i <= nodes; i++) {
      const cy = startY + (i / nodes) * spanY;
      const angle = r + (i * 0.3); // 0.3 handles the twist rate
      
      const freqIndex = Math.floor((i / nodes) * d.length);
      const val = (d[freqIndex] / 255) * s.sensitivity;
      const expandedDist = strandDistance + (val * 80 * s.intensity);
      
      const x1 = cx + Math.sin(angle) * expandedDist;
      const x2 = cx + Math.sin(angle + Math.PI) * expandedDist;
      
      // Rung glows heavily on strong frequencies
      ctx.beginPath();
      ctx.moveTo(x1, cy);
      ctx.lineTo(x2, cy);
      ctx.strokeStyle = val > 0.6 ? `${theme.accent}aa` : `rgba(255, 255, 255, ${0.1 + val * 0.3})`;
      ctx.lineWidth = 1 + val * 3;
      ctx.stroke();
    }
    
    // Draw the two strands
    for (let strand = 0; strand < 2; strand++) {
      ctx.beginPath();
      for (let i = 0; i <= nodes; i++) {
        const cy = startY + (i / nodes) * spanY;
        const angle = r + (i * 0.3) + (strand * Math.PI);
        
        const freqIndex = Math.floor((i / nodes) * d.length);
        const val = (d[freqIndex] / 255) * s.sensitivity;
        const expandedDist = strandDistance + (val * 80 * s.intensity);
        
        const px = cx + Math.sin(angle) * expandedDist;
        
        if (i === 0) ctx.moveTo(px, cy);
        else ctx.lineTo(px, cy);
      }
      ctx.strokeStyle = strand === 0 ? primaryColor : theme.secondary;
      ctx.lineWidth = 3 + pulse * 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowBlur = 15;
      ctx.shadowColor = strand === 0 ? primaryColor : theme.secondary;
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Draw nucleotide nodes on the strand
      for (let i = 0; i <= nodes; i++) {
        const cy = startY + (i / nodes) * spanY;
        const angle = r + (i * 0.3) + (strand * Math.PI);
        
        const freqIndex = Math.floor((i / nodes) * d.length);
        const val = (d[freqIndex] / 255) * s.sensitivity;
        const expandedDist = strandDistance + (val * 80 * s.intensity);
        
        const px = cx + Math.sin(angle) * expandedDist;
        const pz = Math.cos(angle); // depth
        
        // Size mapping incorporating depth
        const scale = 0.5 + (pz + 1) * 0.5; // 0 to 1
        const nodeSize = (3 + val * 6) * scale * s.intensity;
        
        ctx.beginPath();
        ctx.arc(px, cy, nodeSize, 0, Math.PI * 2);
        ctx.fillStyle = val > 0.7 ? '#ffffff' : (strand === 0 ? primaryColor : theme.secondary);
        
        if (val > 0.8) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ffffff';
        }
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Inner depth highlight
        ctx.beginPath();
        ctx.arc(px - nodeSize*0.2, cy - nodeSize*0.2, nodeSize * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
      }
    }
    
    // Surrounding bio-particles floating around the helix
    const bioParticles = 30;
    for (let i = 0; i < bioParticles; i++) {
      const pY = (Date.now() * 0.05 * s.speed + i * 40) % H;
      const pX = cx + Math.sin(Date.now() * 0.002 + i) * 150;
      const val = (d[i % d.length] / 255);
      
      ctx.beginPath();
      ctx.arc(pX, pY, 1.5 + (val * 3), 0, Math.PI * 2);
      ctx.fillStyle = `${theme.accent}88`;
      ctx.fill();
    }
    
    ctx.restore();
  };

  const drawGalaxy = (ctx: CanvasRenderingContext2D, d: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const primaryColor = s.customColor || theme.primary;
    galaxyRotation.current += s.speed * 0.005 * (1 + pulse * 2);
    const rot = galaxyRotation.current;
    
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(rot);
    ctx.globalCompositeOperation = 'screen';
    
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.4);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.1, primaryColor);
    coreGrad.addColorStop(0.4, `${theme.secondary}66`);
    coreGrad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(0, 0, W, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad;
    ctx.fill();
    
    const arms = 5;
    const pointsPerArm = 200;
    
    for (let i = 0; i < pointsPerArm; i++) {
      const dataIndex = Math.floor((i / pointsPerArm) * d.length);
      const val = d[dataIndex] / 255;
      
      const r = i * (Math.min(W, H) / pointsPerArm) * 0.8;
      const spiralTheta = i * 0.05;
      
      for (let arm = 0; arm < arms; arm++) {
        const armOffset = (Math.PI * 2 / arms) * arm;
        const jitter = (Math.random() - 0.5) * val * 50 * s.intensity;
        
        const x = Math.cos(spiralTheta + armOffset) * r + jitter;
        const y = Math.sin(spiralTheta + armOffset) * r + jitter;
        
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.5, val * 5 * s.intensity), 0, Math.PI * 2);
        
        const isAccent = Math.random() > 0.8;
        ctx.fillStyle = isAccent ? theme.accent : primaryColor;
        ctx.globalAlpha = 0.8 * val;
        ctx.fill();
      }
    }
    ctx.restore();
  };

  const drawAtom = (ctx: CanvasRenderingContext2D, d: Uint8Array, t: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const primaryColor = s.customColor || theme.primary;
    atomRotation.current += s.speed * 0.01;
    const rot = atomRotation.current;
    
    ctx.save();
    ctx.translate(W / 2, H / 2);
    
    ctx.beginPath();
    const nucleusRadius = 10 + pulse * 20 * s.intensity;
    ctx.arc(0, 0, nucleusRadius, 0, Math.PI * 2);
    ctx.fillStyle = primaryColor;
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 20 + pulse * 20;
    ctx.fill();
    
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(
            Math.cos(i + rot*5)*nucleusRadius*0.5,
            Math.sin(i + rot*5)*nucleusRadius*0.5,
            nucleusRadius * 0.3,
            0, Math.PI * 2
        );
        ctx.fillStyle = i % 2 === 0 ? theme.accent : theme.secondary;
        ctx.fill();
    }
    
    const orbits = 4;
    for (let i = 0; i < orbits; i++) {
      ctx.save();
      ctx.rotate(rot * (i + 1) * 0.5 + (i * Math.PI / orbits));
      
      const val = d[i * 20] / 255; 
      const rx = Math.abs(W * 0.15 + (val * W * 0.1 * s.intensity));
      const ry = Math.abs(Math.max(W * 0.05, W * 0.4 + (val * W * 0.1 * s.intensity)));
      
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `${primaryColor}44`;
      ctx.lineWidth = 1;
      ctx.stroke();
      
      const electronAngle = rot * (i + 2) * 2;
      const ex = Math.cos(electronAngle) * rx;
      const ey = Math.sin(electronAngle) * ry;
      
      ctx.beginPath();
      ctx.arc(ex, ey, 4 + val * 4, 0, Math.PI * 2);
      ctx.fillStyle = theme.accent;
      ctx.shadowColor = theme.accent;
      ctx.shadowBlur = 10;
      ctx.fill();
      
      ctx.restore();
    }
    ctx.restore();
  };

  const drawBlackHole = (ctx: CanvasRenderingContext2D, d: Uint8Array, t: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const primaryColor = s.customColor || theme.primary;
    blackHoleRotation.current -= s.speed * 0.02 * (1 + pulse);
    const rot = blackHoleRotation.current;
    
    ctx.save();
    ctx.translate(W / 2, H / 2);
    
    ctx.save();
    ctx.scale(1, 0.4);
    ctx.rotate(rot);
    const radInner = W * 0.15;
    const radOuter = W * 0.45;
    
    const grad = ctx.createRadialGradient(0, 0, radInner, 0, 0, radOuter);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, primaryColor);
    grad.addColorStop(0.7, `${theme.secondary}CC`);
    grad.addColorStop(1, 'transparent');
    
    ctx.beginPath();
    ctx.arc(0, 0, radOuter, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    
    ctx.fill();
    
    ctx.beginPath();
    for (let i = 0; i < 180; i++) {
        const val = d[i] / 255;
        const ang = (i / 180) * Math.PI * 2;
        const r = radInner + (radOuter - radInner) * 0.5 + val * 100 * s.intensity;
        if (i === 0) ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
        else ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
    }
    ctx.closePath();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
    
    ctx.beginPath();
    const eventHorizonSize = W * 0.15 + pulse * 10 * s.intensity;
    ctx.arc(0, 0, eventHorizonSize, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.shadowColor = theme.accent || primaryColor;
    ctx.shadowBlur = 40;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, 0, eventHorizonSize + 1, 0, Math.PI * 2);
    ctx.lineWidth = 2 + pulse * 4;
    ctx.strokeStyle = primaryColor;
    ctx.stroke();

    ctx.restore();
  };

  const drawConstellation = (ctx: CanvasRenderingContext2D, d: Uint8Array, W: number, H: number, theme: ThemeColors, pulse: number, s: VisualizerSettings) => {
    const primaryColor = s.customColor || theme.primary;
    
    ctx.save();
    
    const numStars = 60;
    const stars = [];
    
    for(let i=0; i<numStars; i++) {
        const val = d[i * 2 % d.length] / 255;
        const dx = Math.sin((i * 3.14) + Date.now()*0.0001 * s.speed) * W * 0.4;
        const dy = Math.cos((i * 2.71) + Date.now()*0.0001 * s.speed) * H * 0.4;
        stars.push({ x: W/2 + dx, y: H/2 + dy, val });
    }
    
    ctx.globalCompositeOperation = 'screen';
    
    const hexToRgbTuple = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [201, 168, 76];
    };
    const rgb = hexToRgbTuple(primaryColor);
    
    ctx.beginPath();
    for (let i=0; i<stars.length; i++) {
        for (let j=i+1; j<stars.length; j++) {
            const dist = Math.hypot(stars[i].x - stars[j].x, stars[i].y - stars[j].y);
            const connectionThreshold = 100 + (stars[i].val * 50 * s.intensity);
            
            if (dist < connectionThreshold) {
                const alpha = Math.max(0.05, 1 - (dist / connectionThreshold)) * (0.2 + pulse);
                ctx.moveTo(stars[i].x, stars[i].y);
                ctx.lineTo(stars[j].x, stars[j].y);
                
                ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
                ctx.stroke();
                ctx.beginPath();
            }
        }
    }
    
    for (let i=0; i<stars.length; i++) {
        ctx.beginPath();
        const starSize = 1 + stars[i].val * 5 * s.intensity;
        ctx.arc(stars[i].x, stars[i].y, starSize, 0, Math.PI*2);
        ctx.fillStyle = theme.accent;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 10 + stars[i].val * 20;
        ctx.fill();
        
        if (stars[i].val > 0.8) {
           ctx.fillStyle = 'rgba(255,255,255,0.4)';
           ctx.font = '8px monospace';
           ctx.fillText(`C-${i} ${Math.floor(stars[i].val*100)}%`, stars[i].x + 5, stars[i].y - 5);
        }
    }
    
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
