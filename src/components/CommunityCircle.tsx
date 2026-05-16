import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Heart, Share2, MessageCircle, Sparkles, Radio, Send, User as UserIcon, Play, Square, Activity } from 'lucide-react';
import { db, auth, collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, handleFirestoreError, OperationType, doc, getDoc } from '../firebase';

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userHebrewName?: string;
  userAvatar?: string;
  timestamp: any;
  likes: number;
  frequency?: number;
}

export function CommunityCircle() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedFreq, setSelectedFreq] = useState<number | null>(null);
  const [activeFrequencyId, setActiveFrequencyId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    return () => {
      stopFrequency();
    };
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs.reverse());
    }, (err) => {
      console.warn("Community circle restricted/not logged in:", err);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser || isSending) return;

    setIsSending(true);
    try {
      let hebrewName = '';
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          hebrewName = userDoc.data().hebrewName || '';
        }
      }

      const msgData: any = {
        text: newMessage.trim(),
        userId: auth.currentUser?.uid || '',
        userName: auth.currentUser?.displayName || 'Seeker',
        userHebrewName: hebrewName,
        userAvatar: auth.currentUser?.photoURL || '',
        timestamp: serverTimestamp(),
        likes: 0
      };
      if (selectedFreq) {
        msgData.frequency = selectedFreq;
      }
      await addDoc(collection(db, 'messages'), msgData);
      setNewMessage('');
      setSelectedFreq(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'messages');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div>
          <p className="text-gold text-[10px] uppercase tracking-[0.5em] mb-4">Global Network</p>
          <h2 className="font-display text-4xl text-[var(--text-primary)] tracking-widest">Community Circle</h2>
          <div className="h-px w-24 gold-gradient mt-4" />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-[8px] uppercase tracking-widest text-zinc-600 mb-1">Active Signals</p>
            <p className="text-gold font-display text-xl">{messages.length + 1200}</p>
          </div>
          <div className="flex gap-0.5 h-8 items-end opacity-20">
            {[1, 2, 3, 4, 5].map(i => (
              <motion.div
                key={i}
                animate={{ height: [4, 32, 10, 20, 4] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                className="w-1 bg-gold rounded-full"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-[2.5rem] border-white/5 overflow-hidden flex flex-col h-[600px] mb-12">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide"
        >
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex gap-6 ${msg.userId === auth.currentUser?.uid ? 'flex-row-reverse' : ''}`}
            >
              <div className="w-12 h-12 rounded-2xl border border-white/10 overflow-hidden flex-shrink-0 bg-zinc-900">
                {msg.userAvatar ? (
                  <img src={msg.userAvatar} alt={msg.userName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <UserIcon size={24} />
                  </div>
                )}
              </div>

              <div className={`max-w-[75%] ${msg.userId === auth.currentUser?.uid ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-3 mb-2 px-1">
                  <span className="text-[10px] font-bold text-gold uppercase tracking-widest">{msg.userName}</span>
                  {msg.userHebrewName && (
                    <span className="text-[10px] font-bold text-gold/80 tracking-widest">{msg.userHebrewName}</span>
                  )}
                  <span className="text-[8px] text-zinc-600 uppercase tracking-widest">
                    {msg.timestamp?.toDate?.() ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(msg.timestamp.toDate()) : 'Just now'}
                  </span>
                </div>
                <div className={`p-5 rounded-3xl text-sm leading-relaxed ${
                  msg.userId === auth.currentUser?.uid 
                    ? 'bg-gold/10 text-[var(--text-primary)] rounded-tr-none border border-gold/20 shadow-lg shadow-gold/5' 
                    : 'bg-white/5 text-[var(--text-secondary)] rounded-tl-none border border-white/5'
                }`}>
                  {msg.text}
                  {msg.frequency && (
                    <div className="mt-3 inline-flex items-center gap-2 bg-black/20 rounded-full px-3 py-1.5 border border-white/5 cursor-pointer hover:bg-black/40 transition-colors" onClick={() => activeFrequencyId === msg.id ? stopFrequency() : startFrequency(msg.frequency!, msg.id)}>
                      {activeFrequencyId === msg.id ? (
                        <Square fill="currentColor" size={14} className="text-gold animate-pulse" />
                      ) : (
                        <Play fill="currentColor" size={14} className="text-gold" />
                      )}
                      <span className="text-[10px] font-mono text-gold/80">{msg.frequency} Hz</span>
                      {activeFrequencyId === msg.id && (
                        <Activity size={14} className="text-gold animate-pulse ml-2" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-8 border-t border-white/5 bg-black/5 backdrop-blur-xl">
          {auth.currentUser ? (
            <form onSubmit={handleSendMessage} className="relative flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest flex items-center mr-2">Attach Freq:</span>
                {[174, 285, 396, 417, 432, 528, 639, 741, 852, 963].map(hz => (
                  <button
                    key={hz}
                    type="button"
                    onClick={() => setSelectedFreq(selectedFreq === hz ? null : hz)}
                    className={`text-[10px] font-mono px-3 py-1 rounded-full border transition-all ${
                      selectedFreq === hz 
                        ? 'bg-gold text-black border-gold font-bold' 
                        : 'bg-white/5 text-zinc-400 border-white/10 hover:border-gold/50 hover:text-gold'
                    }`}
                  >
                    {hz} Hz
                  </button>
                ))}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Broadcast your signal..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-8 pr-20 text-sm text-[var(--text-primary)] placeholder:text-zinc-600 focus:outline-none focus:border-gold/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl gold-gradient text-black flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-gold/20"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Sign in to join the conversation</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Active Seekers', value: '1,284', icon: Users },
          { label: 'Signals Sent', value: '42.8k', icon: MessageCircle },
          { label: 'Global Resonance', value: '98.4%', icon: Sparkles }
        ].map((stat, i) => (
          <div key={i} className="glass-panel p-6 rounded-3xl border-white/5 text-center group hover:border-gold/20 transition-all">
            <stat.icon size={20} className="text-gold mx-auto mb-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="text-2xl font-display text-white mb-2">{stat.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
