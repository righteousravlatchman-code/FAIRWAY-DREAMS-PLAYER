import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Riff } from '../types';

interface RiffVisualizerProps {
  riffs: Riff[];
}

const getNoteName = (note: number) => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return `${noteNames[note % 12]}${Math.floor(note / 12) - 1}`;
};

export const RiffVisualizer: React.FC<RiffVisualizerProps> = ({ riffs }) => {
  const pitchData = useMemo(() => {
    const counts: Record<number, number> = {};
    riffs.forEach(r => {
      r.midiData.forEach(note => {
        if (note > 0) {
          counts[note] = (counts[note] || 0) + 1;
        }
      });
    });

    return Object.entries(counts)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([note, count]) => ({
        name: getNoteName(Number(note)),
        frequency: count
      }));
  }, [riffs]);

  const densityData = useMemo(() => {
    return riffs.map(r => {
      const active = r.midiData.filter(n => n > 0).length;
      const total = r.midiData.length || 1;
      return {
        name: r.name.substring(0, 15) || 'Untitled',
        density: Math.round((active / total) * 100)
      };
    }).sort((a, b) => b.density - a.density); // sort by highest density
  }, [riffs]);

  const radarData = useMemo(() => {
    let highNotes = 0;
    let lowNotes = 0;
    let active = 0;
    let gaps = 0;
    let totalLength = 0;

    riffs.forEach(r => {
      totalLength += r.midiData.length;
      r.midiData.forEach(val => {
        if (val > 0) {
          active++;
          if (val > 64) highNotes++;
          else lowNotes++;
        } else {
          gaps++;
        }
      });
    });

    const total = Math.max(1, totalLength);
    const density = (active / total) * 100;
    const range = (highNotes / Math.max(1, active)) * 100;
    const rhythm = (gaps / total) * 100;
    const complexity = Math.min(100, (active / Math.max(1, riffs.length)) * 5); // proxy

    return [
      { subject: 'Density', value: Math.round(density), fullMark: 100 },
      { subject: 'High Range', value: Math.round(range), fullMark: 100 },
      { subject: 'Low Range', value: Math.round(100 - range), fullMark: 100 },
      { subject: 'Syncopation', value: Math.round(rhythm), fullMark: 100 },
      { subject: 'Complexity', value: Math.round(complexity), fullMark: 100 },
    ];
  }, [riffs]);

  if (riffs.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 mb-12">
      <div className="surface-panel rounded-2xl p-6 border border-white/10 bg-black/40 backdrop-blur-xl hover:border-gold/30 transition-all">
        <h3 className="text-gold font-display uppercase tracking-widest text-xs mb-6">Pitch Distribution</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pitchData}>
              <defs>
                <linearGradient id="colorPitch" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C9A84C" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#C9A84C" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(201,168,76,0.1)' }}
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
              />
              <Bar dataKey="frequency" fill="url(#colorPitch)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="surface-panel rounded-2xl p-6 border border-white/10 bg-black/40 backdrop-blur-xl hover:border-gold/30 transition-all">
        <h3 className="text-gold font-display uppercase tracking-widest text-xs mb-6">Tempo/Note Density (%)</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={densityData}>
              <defs>
                <linearGradient id="colorDensity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val.length > 5 ? val.substring(0, 5) + '...' : val} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip 
                cursor={{ stroke: 'rgba(255,255,255,0.3)', strokeWidth: 1, strokeDasharray: '3 3' }}
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
              />
              <Area type="monotone" dataKey="density" stroke="#ffffff" strokeWidth={2} fillOpacity={1} fill="url(#colorDensity)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="surface-panel rounded-2xl p-6 border border-white/10 bg-black/40 backdrop-blur-xl hover:border-gold/30 transition-all">
        <h3 className="text-gold font-display uppercase tracking-widest text-xs mb-6">Acoustic Profile</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Profile" dataKey="value" stroke="#C9A84C" strokeWidth={2} fill="#C9A84C" fillOpacity={0.4} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
