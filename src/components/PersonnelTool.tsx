import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Target, Activity, Zap, ChevronRight, Search, Filter } from 'lucide-react';
import { db, collection, onSnapshot, query, orderBy, handleFirestoreError, OperationType } from '../firebase';

interface PersonnelMember {
  id: string;
  name: string;
  role: string;
  frequency: string;
  resonance: number;
  status: 'aligned' | 'recalibrating' | 'divergent';
  insights: string;
}

export const PersonnelTool: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<PersonnelMember | null>(null);
  const [personnel, setPersonnel] = useState<PersonnelMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const contactsRef = collection(db, 'contacts');
    const q = query(contactsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeContacts = snapshot.docs.map(doc => {
        const data = doc.data();
        // Map CRM Contact to PersonnelMember
        return {
          id: doc.id,
          name: data.name || 'Unknown',
          role: data.role || 'Unspecified Node',
          frequency: data.baseFrequency || 'Uncalibrated',
          resonance: data.status === 'active' ? 90 + Math.floor(Math.random() * 10) : 
                     data.status === 'lead' ? 40 + Math.floor(Math.random() * 20) : 10,
          status: data.status === 'active' ? 'aligned' : 
                  data.status === 'lead' ? 'recalibrating' : 'divergent',
          insights: data.notes || 'No tactical intel available.'
        } as PersonnelMember;
      });
      setPersonnel(activeContacts);
      setLoading(false);
    }, (err) => {
      console.warn("Personnel access restricted/not logged in:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredPersonnel = personnel.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gold/10 text-gold border border-gold/20">
            <Users size={24} />
          </div>
          <div>
            <h2 className="font-display text-2xl text-white tracking-widest uppercase">Personnel Alignment</h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Tactical Team Resonance Tracking</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <input 
              type="text" 
              placeholder="Search frequencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs text-white focus:border-gold outline-none w-48 sm:w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Personnel List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredPersonnel.map((member) => (
            <motion.div
              key={member.id}
              onClick={() => setSelectedMember(member)}
              whileHover={{ x: 10 }}
              className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                selectedMember?.id === member.id 
                  ? 'bg-gold/10 border-gold/30' 
                  : 'bg-white/5 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-display text-lg ${
                    member.status === 'aligned' ? 'border-emerald-500/50 text-emerald-500' : 
                    member.status === 'recalibrating' ? 'border-amber-500/50 text-amber-500' : 'border-red-500/50 text-red-500'
                  }`}>
                    {member.name[0]}
                  </div>
                  {member.status === 'aligned' && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[var(--bg-color)] flex items-center justify-center">
                      <Zap size={8} className="text-white" />
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="text-white font-medium">{member.name}</h4>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{member.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Base frequency</p>
                  <p className="text-gold font-display">{member.frequency}</p>
                </div>
                
                <div className="w-24 hidden md:block">
                  <div className="flex justify-between text-[8px] uppercase tracking-widest text-zinc-500 mb-1">
                    <span>Resonance</span>
                    <span>{member.resonance}%</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${member.resonance}%` }}
                      className={`h-full ${member.resonance > 90 ? 'bg-emerald-500' : 'bg-gold'}`}
                    />
                  </div>
                </div>

                <ChevronRight className={`text-zinc-700 transition-transform ${selectedMember?.id === member.id ? 'translate-x-2 text-gold' : 'group-hover:translate-x-1'}`} size={20} />
              </div>
            </motion.div>
          ))}

          {filteredPersonnel.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
              <Users size={40} className="text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-500 uppercase tracking-widest text-[10px]">No personnel detected in the field</p>
            </div>
          )}
        </div>

        {/* Tactical Detail Overlay / Panel */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedMember ? (
              <motion.div
                key={selectedMember.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel p-8 rounded-3xl border border-white/10 sticky top-24"
              >
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-20 h-20 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold mb-4 mb-4">
                    <Target size={32} />
                  </div>
                  <h3 className="text-2xl font-display text-white mb-1">{selectedMember.name}</h3>
                  <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] uppercase tracking-widest text-zinc-400">
                    ID: {selectedMember.id.substring(0, 8).toUpperCase()}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h5 className="text-[10px] uppercase tracking-widest text-gold mb-3 flex items-center gap-2">
                      <Activity size={12} /> Strategic Insight
                    </h5>
                    <p className="text-xs text-zinc-400 leading-relaxed italic">
                      "{selectedMember.insights}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                      <p className="text-[8px] uppercase tracking-widest text-zinc-500 mb-1">Status</p>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${
                        selectedMember.status === 'aligned' ? 'text-emerald-500' : 'text-amber-500'
                      }`}>{selectedMember.status}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                      <p className="text-[8px] uppercase tracking-widest text-zinc-500 mb-1">Frequency</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gold">{selectedMember.frequency}</p>
                    </div>
                  </div>

                  <button className="w-full py-4 rounded-xl gold-gradient text-black font-bold uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-transform">
                    Initiate Synchronization
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="glass-panel p-8 rounded-3xl border border-white/5 h-full flex flex-col items-center justify-center text-center opacity-50 grayscale">
                <Users size={48} className="text-zinc-700 mb-4" />
                <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em]">Select Personnel to begin sync</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

