import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Users, Activity, MessageSquare, Shield, Zap, Sparkles, Radio, PlayCircle, Play, Square, Mic, Heart, Flame, Star } from 'lucide-react';
import { db, auth, collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from '../firebase';
import { Track, UserProfile, LiveMessage, LiveReaction } from '../types';
import { LiveRiffCapture } from './LiveRiffCapture';

interface LiveStageProps {
  currentTrack: Track;
  user: any;
  profile: UserProfile;
  onSaveRiff?: (midiData: number[], annotation?: string) => void;
}

export const LiveStage: React.FC<LiveStageProps> = ({ currentTrack, user, profile, onSaveRiff }) => {
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [viewersCount, setViewersCount] = useState(0);
  const [selectedFreq, setSelectedFreq] = useState<number | null>(null);
  const [activeFrequencyId, setActiveFrequencyId] = useState<string | null>(null);
  const [isPlayingMidi, setIsPlayingMidi] = useState(false);
  const [reactions, setReactions] = useState<LiveReaction[]>([]);
  const [activeChatTab, setActiveChatTab] = useState<'chat' | 'polls'>('chat');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const startFrequency = (hz: number, messageId: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    stopFrequency();

    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz, audioContextRef.current.currentTime);
    
    gain.gain.setValueAtTime(0, audioContextRef.current.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, audioContextRef.current.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);

    osc.start();
    
    oscillatorRef.current = osc;
    gainNodeRef.current = gain;
    setActiveFrequencyId(messageId);
  };

  const stopFrequency = () => {
    if (oscillatorRef.current && gainNodeRef.current && audioContextRef.current) {
      try {
        gainNodeRef.current.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 0.1);
        setTimeout(() => {
          if (oscillatorRef.current) {
            oscillatorRef.current.stop();
            oscillatorRef.current.disconnect();
          }
          if (gainNodeRef.current) gainNodeRef.current.disconnect();
          oscillatorRef.current = null;
          gainNodeRef.current = null;
        }, 100);
      } catch (e) {
        console.error(e);
      }
    }
    setActiveFrequencyId(null);
  };

  useEffect(() => {
    return () => stopFrequency();
  }, []);

  useEffect(() => {
    if (!currentTrack.id) return;

    // Listen for live chat messages
    const q = query(
      collection(db, 'live_chat', currentTrack.id, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LiveMessage[];
      setMessages(newMessages.reverse());
    }, (err) => {
      console.warn("LiveStage chat error:", err);
    });

    const reactionQ = query(
      collection(db, 'live_chat', currentTrack.id, 'reactions'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribeReactions = onSnapshot(reactionQ, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const reaction = { id: change.doc.id, ...change.doc.data() } as LiveReaction;
          // Only add if it's recent (last 10 seconds) to avoid playing old reactions
          if (reaction.timestamp && reaction.timestamp.toMillis() > Date.now() - 10000) {
            setReactions(prev => [...prev, reaction]);
            setTimeout(() => {
              setReactions(prev => prev.filter(r => r.id !== reaction.id));
            }, 4000); // Remove after 4 seconds
          }
        }
      });
    }, (err) => {
      console.warn("LiveStage reactions error:", err);
    });

    // Simulate viewers (or real via presence if added later)
    const interval = setInterval(() => {
      setViewersCount(Math.floor(Math.random() * 50) + 124);
    }, 5000);

    return () => {
      unsubscribe();
      unsubscribeReactions();
      clearInterval(interval);
    };
  }, [currentTrack.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const playMidiSequence = (notes: number[]) => {
    if (!notes || !notes.length) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    setIsPlayingMidi(true);
    let startTime = ctx.currentTime + 0.1;
    
    notes.forEach((note) => {
      if (note > 0) {
        const hz = 440 * Math.pow(2, (note - 69) / 12);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.value = hz;
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, startTime + 0.25);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      }
      
      startTime += 0.25;
    });

    setTimeout(() => setIsPlayingMidi(false), (startTime - ctx.currentTime) * 1000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !user || !currentTrack.id) return;

    try {
      const msgData: any = {
        userId: user.uid,
        userName: profile.name || 'Seeker',
        userHebrewName: profile.hebrewName || '',
        userAvatar: profile.avatar || '',
        text: messageText,
        timestamp: serverTimestamp()
      };
      if (selectedFreq) {
        msgData.frequency = selectedFreq;
      }
      await addDoc(collection(db, 'live_chat', currentTrack.id, 'messages'), msgData);
      setMessageText('');
      setSelectedFreq(null);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleCaptureRiff = async (midiData: number[], annotation?: string) => {
    if (!user || !currentTrack.id) return;
    try {
      const msgData: any = {
        userId: user.uid,
        userName: profile.name || 'Seeker',
        userHebrewName: profile.hebrewName || '',
        userAvatar: profile.avatar || '',
        text: annotation ? `Captured Live Riff: ${annotation}` : `Captured a Live Sequence`,
        midiData: midiData,
        timestamp: serverTimestamp()
      };
      await addDoc(collection(db, 'live_chat', currentTrack.id, 'messages'), msgData);
    } catch (error) {
      console.error("Error sending riff message:", error);
    }
  };

  const handleSendReaction = async (type: 'heart' | 'fire' | 'star' | 'sparkle') => {
    if (!user || !currentTrack.id) return;
    
    // Play locally immediately for responsiveness
    const localReactionId = `local_${Date.now()}_${Math.random()}`;
    const xPos = Math.random() * 80 + 10; // 10% to 90%
    setReactions(prev => [...prev, {
      id: localReactionId,
      type,
      userId: user.uid,
      timestamp: null, // doesn't matter for local
      xPos
    }]);

    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== localReactionId));
    }, 4000);

    try {
      await addDoc(collection(db, 'live_chat', currentTrack.id, 'reactions'), {
        userId: user.uid,
        type,
        xPos,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending reaction:", error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
      {/* Stream Area */}
      <div className="lg:col-span-3 space-y-6 flex flex-col">
         <div className="relative flex-grow bg-black/40 rounded-3xl border border-white/5 overflow-hidden group shadow-2xl shadow-gold/5 flex flex-col">
          <div className="relative flex-grow">
           {/* Live Indicator */}
           <div className="absolute top-6 left-6 z-10 flex items-center gap-4">
             <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest animate-pulse">
               <Radio size={12} />
               Live
             </div>
             <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md text-white/90 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">
               <Users size={12} className="text-gold" />
               {viewersCount} Viewers
             </div>
           </div>

           {/* Visualizer / Video Placeholder */}
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full">
                 {/* Background Glow */}
                 <div className="absolute inset-0 bg-gradient-to-t from-gold/10 to-transparent pointer-events-none" />
                 
                 {/* Simulating Pulse Visualizer */}
                 <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                     <AnimatePresence>
                       {isPlayingMidi && (
                         <motion.div
                           initial={{ opacity: 0, scale: 0.8 }}
                           animate={{ opacity: 0.3, scale: 1.5 }}
                           exit={{ opacity: 0, scale: 2 }}
                           transition={{ duration: 0.5 }}
                           className="absolute inset-0 bg-[radial-gradient(circle,rgba(201,168,76,0.3)_0%,transparent_70%)] pointer-events-none"
                         />
                       )}
                     </AnimatePresence>
                     {[...Array(5)].map((_, i) => (
                       <motion.div
                         key={i}
                         className={`absolute border rounded-[40px] md:rounded-[80px] ${isPlayingMidi ? 'border-gold/40' : 'border-gold/20'}`}
                         initial={{ width: 100, height: 100, opacity: 0.5 }}
                         animate={{ 
                           width: [100, i % 2 === 0 ? 900 : 700], 
                           height: [100, i % 2 === 0 ? 500 : 400], 
                           opacity: [0.5, 0],
                           rotate: isPlayingMidi ? [0, 90] : 0
                         }}
                         transition={{ 
                           duration: isPlayingMidi ? 1 : 5, 
                           repeat: Infinity, 
                           delay: i * (isPlayingMidi ? 0.2 : 1),
                           ease: "easeOut" 
                         }}
                       />
                     ))}
                     
                     <div className="z-10 text-center">
                         <div className="relative inline-block">
                           <motion.div
                             animate={{ scale: [1, 1.05, 1] }}
                             transition={{ duration: 2, repeat: Infinity }}
                           >
                             <img 
                               src={currentTrack.art || '/src/assets/images/default_cover_1779345608057.png'} 
                               alt={currentTrack.title}
                               className="w-48 h-48 md:w-64 md:h-64 rounded-2xl object-cover shadow-2xl border-4 border-gold/40"
                               referrerPolicy="no-referrer"
                             />
                           </motion.div>
                         </div>
                         <h3 className="mt-6 text-2xl font-display text-white drop-shadow-lg">{currentTrack.title}</h3>
                         <p className="text-gold/80 text-sm font-mono tracking-widest uppercase mt-2 drop-shadow-md">Global Broadcast Active</p>
                     </div>
                 </div>

                 {/* Floating Reactions */}
                 <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                   <AnimatePresence>
                     {reactions.map((reaction) => {
                       const Icon = reaction.type === 'heart' ? Heart :
                                    reaction.type === 'fire' ? Flame :
                                    reaction.type === 'star' ? Star :
                                    Sparkles;
                                    
                       const colorClass = reaction.type === 'heart' ? 'text-red-500 fill-red-500' :
                                          reaction.type === 'fire' ? 'text-orange-500 fill-orange-500' :
                                          'text-gold fill-gold';

                       return (
                         <motion.div
                           key={reaction.id}
                           initial={{ opacity: 0, y: 100, scale: 0.5, x: `${reaction.xPos}%` }}
                           animate={{ opacity: [0, 1, 1, 0], y: -200, scale: [0.5, 1.2, 1] }}
                           exit={{ opacity: 0, scale: 0.5 }}
                           transition={{ duration: 3, ease: 'easeOut' }}
                           className={`absolute bottom-20 drop-shadow-xl ${colorClass}`}
                         >
                            <Icon size={28} />
                         </motion.div>
                       );
                     })}
                   </AnimatePresence>
                 </div>
              </div>
           </div>

           {/* Controls Overlay (minimal) */}
           <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between z-30">
              <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md p-3 pr-6 rounded-2xl border border-white/10">
                 <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-gold/20 animate-ping opacity-50" />
                   <Activity size={20} className="text-gold relative z-10" />
                 </div>
                 <div>
                   <h4 className="text-white text-sm font-medium">{currentTrack.title}</h4>
                   <p className="text-zinc-400 text-[10px] uppercase tracking-tighter">Live from Cinematic AI Studio</p>
                 </div>
              </div>
              
              <div className="flex items-center gap-3">
                 <button className="flex items-center gap-2 bg-black/60 backdrop-blur-md hover:bg-gold/20 text-white hover:text-gold px-4 py-3 rounded-2xl transition-all border border-white/10 hover:border-gold/30 text-xs font-bold uppercase tracking-widest shadow-xl">
                    <Shield size={14} className="text-blue-400" />
                    Verified
                 </button>
                 <button className="flex items-center gap-2 bg-gold text-black hover:bg-yellow-400 px-6 py-3 rounded-2xl transition-all shadow-[0_0_20px_rgba(201,168,76,0.3)] hover:shadow-[0_0_30px_rgba(201,168,76,0.5)] text-xs font-bold uppercase tracking-widest hover:scale-105 active:scale-95">
                    <Zap size={14} />
                    Tune In
                 </button>
              </div>
           </div>
          </div>
          
          {/* Active Queue Bar */}
          <div className="h-20 bg-black/60 border-t border-white/10 flex items-center px-6 gap-4 overflow-x-auto relative z-30">
            <div className="flex-shrink-0 flex items-center gap-2 text-gold">
              <Sparkles size={14} />
              <span className="text-[10px] uppercase font-bold tracking-widest">Up Next</span>
            </div>
            <div className="w-px h-8 bg-white/10 mx-2" />
            
            {/* Fake Upcoming Tracks */}
            {[1, 2, 3].map(i => (
               <div key={i} className="flex-shrink-0 flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-colors rounded-xl p-2 pr-4 border border-white/5 select-none cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs text-zinc-500 font-mono">
                    {i + 1}
                  </div>
                  <div>
                    <h5 className="text-[11px] font-bold text-zinc-300">Unidentified Frequency {i}</h5>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest">System Load</p>
                  </div>
               </div>
            ))}
          </div>
        </div>

        {/* Info Area */}
        <div className="surface-panel rounded-3xl p-6 border border-white/5">
           <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display text-white mb-1">{currentTrack.title}</h2>
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1"><Sparkles size={12} className="text-gold" /> AI Composed</span>
                  <span className="flex items-center gap-1"><Shield size={12} className="text-blue-400" /> Digital Twin Verified</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest">
                  Save Session
                </button>
                <button className="px-4 py-2 rounded-xl bg-gold text-black font-bold text-[10px] uppercase tracking-widest hover:scale-105 transition-all">
                  Support Artist
                </button>
              </div>
           </div>
           <p className="mt-4 text-zinc-400 text-sm leading-relaxed max-w-3xl">
              {currentTrack.description || "This live stream features consciousness-coded frequencies designed to harmonize and uplift. Join the collective digital consciousness in this real-time broadcast."}
           </p>
        </div>

        {/* Live Metrics & Telemetry (Expanded Section) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="surface-panel rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center text-center group hover:border-gold/30 transition-all">
            <Activity className="text-blue-400 mb-3 group-hover:scale-110 transition-transform" size={24} />
            <h4 className="text-2xl font-mono text-white mb-1">{Math.floor(Date.now() / 1000 % 100)}.<span className="text-sm text-zinc-500">Hz</span></h4>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Global Resonance</p>
          </div>
          <div className="surface-panel rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center text-center group hover:border-gold/30 transition-all">
            <Radio className="text-gold mb-3 group-hover:scale-110 transition-transform" size={24} />
            <h4 className="text-2xl font-mono text-white mb-1">{(95 + Math.random() * 4).toFixed(1)}<span className="text-sm text-zinc-500">%</span></h4>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Sync Rate</p>
          </div>
          <div className="surface-panel rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center text-center group hover:border-gold/30 transition-all">
            <Users className="text-emerald-400 mb-3 group-hover:scale-110 transition-transform" size={24} />
            <div className="flex -space-x-4 mb-2">
               {[1, 2, 3].map(i => (
                 <div key={i} className={`w-8 h-8 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white z-${40-i*10}`}>
                   U{i}
                 </div>
               ))}
            </div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Cohorts Active</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-1 flex flex-col h-full bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-6 border-b border-white/10 flex flex-col gap-4 bg-black/20 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gold/10 rounded-lg">
                <MessageSquare size={16} className="text-gold" />
              </div>
              <div>
                <h3 className="text-sm font-display tracking-widest text-white uppercase">Frequency Chat</h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{viewersCount} Listening</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-500 text-[9px] font-bold uppercase tracking-widest">Live</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
             <button 
               className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${activeChatTab === 'chat' ? 'bg-gold text-black' : 'text-zinc-500 hover:text-white'}`}
               onClick={() => setActiveChatTab('chat')}
             >
               Chat
             </button>
             <button 
               className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${activeChatTab === 'polls' ? 'bg-gold text-black' : 'text-zinc-500 hover:text-white'}`}
               onClick={() => setActiveChatTab('polls')}
             >
               Polls
             </button>
          </div>
        </div>

        {/* Content Area */}
        {activeChatTab === 'chat' ? (
          <>
            {/* Messages */}
            <div className="relative flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center flex-col opacity-50">
                  <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-4">
                    <MessageSquare size={24} className="text-zinc-400" />
                  </div>
                  <p className="text-xs font-display tracking-widest text-zinc-400 uppercase">Be the first to connect</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="flex gap-4 group hover:bg-white/5 p-3 -mx-3 rounded-2xl transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl border border-white/10 bg-zinc-900 overflow-hidden flex-shrink-0 shadow-lg shadow-black/50">
                      {msg.userAvatar ? (
                        <img src={msg.userAvatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[12px] font-bold text-gold">
                          {msg.userName[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-[11px] font-bold text-gold uppercase tracking-widest truncate">{msg.userName}</span>
                        {(msg as any).userHebrewName && (
                          <span className="text-[10px] font-bold text-gold/60 tracking-wider">{(msg as any).userHebrewName}</span>
                        )}
                        <span className="text-[9px] text-zinc-600 font-mono">
                          {msg.timestamp?.toDate ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed font-light">{msg.text}</p>
                      {(msg as any).midiData && (
                        <div className="mt-3 flex gap-2">
                           <button 
                             onClick={() => playMidiSequence((msg as any).midiData)}
                             className="inline-flex items-center gap-2 bg-black/60 rounded-xl pl-2 pr-4 py-1.5 border border-white/10 cursor-pointer hover:border-gold/50 hover:bg-gold/10 transition-all font-bold text-gold/80 hover:text-gold"
                           >
                             <Play fill="currentColor" size={10} />
                             <span className="text-[10px] font-mono tracking-widest uppercase">Play Seq ({((msg as any).midiData).length})</span>
                           </button>
                        </div>
                      )}
                      {(msg as any).frequency && (
                        <div className="mt-3 inline-flex items-center gap-2 bg-black/60 rounded-xl pl-2 pr-4 py-1.5 border border-white/10 cursor-pointer hover:border-gold/50 transition-all group/freq" onClick={() => activeFrequencyId === msg.id ? stopFrequency() : startFrequency((msg as any).frequency!, msg.id)}>
                          <div className={`p-1.5 rounded-lg transition-colors ${activeFrequencyId === msg.id ? 'bg-gold/20 text-gold' : 'bg-white/5 text-zinc-400 group-hover/freq:text-gold'}`}>
                            {activeFrequencyId === msg.id ? (
                              <Square fill="currentColor" size={10} className="animate-pulse" />
                            ) : (
                              <Play fill="currentColor" size={10} />
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-gold/80">{Math.floor((msg as any).frequency)} Hz</span>
                          {activeFrequencyId === msg.id && (
                            <Activity size={10} className="text-gold animate-pulse" />
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="relative p-6 bg-black/40 border-t border-white/10 backdrop-blur-xl">
              {auth.currentUser ? (
                <div className="flex flex-col gap-4">
                  <LiveRiffCapture onCapture={handleCaptureRiff} onSaveLibrary={onSaveRiff} />
                  <div className="flex justify-between items-center bg-black/40 border border-white/5 rounded-xl p-2 px-4 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                     <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">React</span>
                     <div className="flex items-center gap-4">
                       <button onClick={() => handleSendReaction('heart')} className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-red-500 hover:scale-110 active:scale-90 transition-transform">
                         <Heart size={20} className="fill-red-500" />
                       </button>
                       <button onClick={() => handleSendReaction('fire')} className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-orange-500 hover:scale-110 active:scale-90 transition-transform">
                         <Flame size={20} className="fill-orange-500" />
                       </button>
                       <button onClick={() => handleSendReaction('star')} className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-gold hover:scale-110 active:scale-90 transition-transform">
                         <Star size={20} className="fill-gold" />
                       </button>
                       <button onClick={() => handleSendReaction('sparkle')} className="p-2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-gold hover:scale-110 active:scale-90 transition-transform">
                         <Sparkles size={20} className="fill-gold" />
                       </button>
                     </div>
                  </div>
                  <form onSubmit={handleSendMessage} className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                    {[174, 285, 396, 417, 432, 528, 639, 741, 852, 963].map(hz => (
                      <button
                        key={hz}
                        type="button"
                        onClick={() => setSelectedFreq(selectedFreq === hz ? null : hz)}
                        className={`text-[9px] font-mono px-3 py-1.5 rounded-full border transition-all ${
                          selectedFreq === hz 
                            ? 'bg-gold text-black border-gold font-bold shadow-[0_0_10px_rgba(201,168,76,0.3)]' 
                            : 'bg-white/5 text-zinc-400 border-white/10 hover:border-gold/30 hover:text-gold hover:bg-white/10'
                        }`}
                      >
                        {hz}
                      </button>
                    ))}
                  </div>
                  <div className="relative flex items-center group">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Broadcast your signal..."
                      className="w-full bg-black/40 border border-white/10 rounded-[1.5rem] px-6 py-4 pr-16 text-sm text-white placeholder-zinc-500 outline-none focus:border-gold/50 focus:bg-white/5 focus:shadow-[0_0_20px_rgba(201,168,76,0.1)] transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={!messageText.trim()}
                      className="absolute right-2 p-3 bg-gold text-black rounded-full hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 disabled:bg-white/10 disabled:text-zinc-500 transition-all"
                    >
                      <Send size={16} className={messageText.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                    </button>
                  </div>
                </form>
                </div>
              ) : (
                <div className="text-center py-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Observation Mode</p>
                    <p className="text-xs text-zinc-500">Sign in to broadcast your frequency</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="relative flex-grow p-6 flex flex-col gap-6 custom-scrollbar overflow-y-auto">
             {/* Fake Polls Content */}
             <div className="surface-panel rounded-2xl p-6 border border-white/5">
                <div className="flex items-center gap-2 mb-4">
                  <Activity size={16} className="text-emerald-400" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-widest">Active Resonance Poll</h4>
                </div>
                <p className="text-xs text-zinc-400 mb-6">Which frequency bandwidth should we transition into next?</p>
                <div className="space-y-3">
                  {[
                    { label: '528Hz (Healing & Transformation)', pct: 60 },
                    { label: '432Hz (Cosmic Harmony)', pct: 25 },
                    { label: '852Hz (Spiritual Awakening)', pct: 15 }
                  ].map((opt, i) => (
                    <div key={i} className="relative bg-black/40 p-3 rounded-xl border border-white/10 overflow-hidden group cursor-pointer hover:border-gold/50 transition-all">
                       <div 
                         className="absolute inset-0 bg-gold/10 origin-left"
                         style={{ width: `${opt.pct}%` }}
                       />
                       <div className="relative flex justify-between items-center z-10">
                         <span className="text-xs font-bold text-white max-w-[80%]">{opt.label}</span>
                         <span className="text-[10px] font-mono text-gold">{opt.pct}%</span>
                       </div>
                    </div>
                  ))}
                </div>
             </div>

             <div className="surface-panel rounded-2xl p-6 border border-white/5 opacity-50 grayscale">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={16} className="text-zinc-500" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-widest">Completed: Session Theme</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-500"><span className="text-gold">Sci-Fi Ambient</span><span>72%</span></div>
                  <div className="flex justify-between text-xs text-zinc-500"><span>Dark Synthwave</span><span>18%</span></div>
                   <div className="flex justify-between text-xs text-zinc-500"><span>Acoustic Binaural</span><span>10%</span></div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
