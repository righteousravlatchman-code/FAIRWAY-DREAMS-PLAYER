import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  UserPlus, 
  MoreVertical, 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare, 
  Zap, 
  Clock, 
  TrendingUp, 
  ChevronRight,
  X,
  Save,
  Trash2,
  Activity,
  User,
  ExternalLink
} from 'lucide-react';
import { db, collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';
import { useToast } from './ToastProvider';

interface Contact {
  id: string;
  name: string;
  email?: string;
  role?: string;
  baseFrequency?: string;
  status: 'lead' | 'active' | 'completed' | 'divergent';
  notes?: string;
  lastInteraction?: any;
  assignedTo?: string;
  createdAt: any;
}

interface Interaction {
  id: string;
  contactId: string;
  type: 'call' | 'email' | 'synthesis' | 'meeting';
  summary: string;
  frequency?: string;
  timestamp: any;
}

export const CRMTool: React.FC = () => {
  const { showToast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newContact, setNewContact] = useState<Partial<Contact>>({
    name: '',
    email: '',
    role: '',
    baseFrequency: '',
    status: 'lead',
    notes: ''
  });

  const [newInteraction, setNewInteraction] = useState<Partial<Interaction>>({
    type: 'synthesis',
    summary: '',
    frequency: ''
  });

  const [activeView, setActiveView] = useState<'contacts' | 'activity'>('contacts');

  useEffect(() => {
    const contactsRef = collection(db, 'contacts');
    const qContacts = query(contactsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribeContacts = onSnapshot(qContacts, (snapshot) => {
      setContacts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Contact)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'contacts'));

    const interactionsRef = collection(db, 'interactions');
    const qInteractions = query(interactionsRef, orderBy('timestamp', 'desc'));
    
    const unsubscribeInteractions = onSnapshot(qInteractions, (snapshot) => {
      setInteractions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Interaction)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'interactions'));

    return () => {
      unsubscribeContacts();
      unsubscribeInteractions();
    };
  }, []);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'contacts'), {
        ...newContact,
        createdAt: serverTimestamp(),
      });
      setShowAddForm(false);
      setNewContact({ name: '', email: '', role: '', baseFrequency: '', status: 'lead', notes: '' });
      showToast('Contact added successfully', 'success');
    } catch (error) {
      console.error("Error adding contact:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !newInteraction.summary) return;
    setIsSaving(true);
    try {
      const interactionData = {
        ...newInteraction,
        contactId: selectedContact.id,
        timestamp: serverTimestamp()
      };
      
      await addDoc(collection(db, 'interactions'), interactionData);
      
      // Update contact's last interaction
      await updateDoc(doc(db, 'contacts', selectedContact.id), {
        lastInteraction: interactionData
      });

      setShowInteractionForm(false);
      setNewInteraction({ type: 'synthesis', summary: '', frequency: '' });
      showToast('Interaction recorded', 'success');
    } catch (error) {
      console.error("Error adding interaction:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    try {
      await deleteDoc(doc(db, 'contacts', id));
      setSelectedContact(null);
      showToast('Contact deleted', 'success');
    } catch (error) {
      console.error("Error deleting contact:", error);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedInteractions = interactions.filter(i => i.contactId === selectedContact?.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gold/10 text-gold border border-gold/20">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-display text-white tracking-widest uppercase">Frequential CRM</h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Target & Node Relationship Management</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 p-1 rounded-full border border-white/10 mr-4">
            <button 
              onClick={() => setActiveView('contacts')}
              className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${activeView === 'contacts' ? 'bg-gold text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              Contacts
            </button>
            <button 
              onClick={() => setActiveView('activity')}
              className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${activeView === 'activity' ? 'bg-gold text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              Activity
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <input 
              type="text" 
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs text-white focus:border-gold outline-none w-48 sm:w-64"
            />
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full gold-gradient text-black text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all"
          >
            <UserPlus size={14} /> Add Target
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Feed area */}
        <div className="lg:col-span-2 space-y-4">
          {activeView === 'contacts' ? (
            <>
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-500 px-6 mb-2">
                <span>Contact Entity</span>
                <div className="flex gap-12 mr-12">
                  <span className="w-24 text-right">Frequency</span>
                  <span className="w-24 text-right">Status</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {filteredContacts.map((contact) => (
                  <motion.div
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    whileHover={{ x: 5 }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                      selectedContact?.id === contact.id 
                        ? 'bg-gold/10 border-gold/30' 
                        : 'bg-white/5 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full border border-white/10 flex items-center justify-center font-display text-sm ${
                        contact.status === 'active' ? 'text-emerald-500' : 
                        contact.status === 'lead' ? 'text-gold' : 'text-zinc-500'
                      }`}>
                        {contact.name[0]}
                      </div>
                      <div>
                        <h4 className="text-white font-medium text-sm">{contact.name}</h4>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-widest">{contact.role || 'Unspecified Node'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-12">
                      <div className="text-right w-24 hidden sm:block">
                        <p className="text-gold font-display text-xs">{contact.baseFrequency || '---'}</p>
                      </div>
                      
                      <div className="w-24 hidden md:block">
                        <span className={`text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border ${
                          contact.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          contact.status === 'lead' ? 'bg-gold/10 text-gold border-gold/20' :
                          'bg-white/5 text-zinc-500 border-white/10'
                        }`}>
                          {contact.status}
                        </span>
                      </div>

                      <ChevronRight size={18} className={`text-zinc-700 transition-transform ${selectedContact?.id === contact.id ? 'translate-x-1 text-gold' : 'group-hover:translate-x-0.5'}`} />
                    </div>
                  </motion.div>
                ))}

                {filteredContacts.length === 0 && (
                  <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                    <Users size={40} className="text-zinc-800 mx-auto mb-4" />
                    <p className="text-zinc-500 uppercase tracking-widest text-[10px]">No contact entities detected in the field</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-500 px-6 mb-2">
                <span>Synthesis Feed</span>
                <span className="mr-12">Time Correlation</span>
              </div>
              
              <div className="space-y-4">
                {interactions.map((interaction) => {
                  const contact = contacts.find(c => c.id === interaction.contactId);
                  return (
                    <motion.div
                      key={interaction.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-gold/30 transition-all flex items-center justify-between gap-6 group"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="p-3 rounded-xl bg-gold/10 text-gold border border-gold/20 shrink-0">
                          {interaction.type === 'call' ? <Phone size={16} /> :
                           interaction.type === 'email' ? <Mail size={16} /> :
                           interaction.type === 'meeting' ? <Users size={16} /> : <Zap size={16} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gold">{interaction.type}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-800" />
                            <button 
                              onClick={() => {
                                if (contact) {
                                  setSelectedContact(contact);
                                  setActiveView('contacts');
                                }
                              }}
                              className="text-xs font-bold text-white hover:text-gold transition-colors truncate flex items-center gap-1.5"
                            >
                              {contact?.name || 'Unknown Node'}
                              <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed italic">"{interaction.summary}"</p>
                          {interaction.frequency && (
                            <div className="mt-2 text-[8px] text-gold/60 uppercase tracking-widest font-mono">
                              Modulated at {interaction.frequency}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-zinc-500 font-mono">
                          {interaction.timestamp?.seconds ? new Date(interaction.timestamp.seconds * 1000).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Synchronizing...'}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}

                {interactions.length === 0 && (
                  <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                    <Activity size={40} className="text-zinc-800 mx-auto mb-4" />
                    <p className="text-zinc-500 uppercase tracking-widest text-[10px]">No synthesis activity logged in current timeline</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedContact ? (
              <motion.div
                key={selectedContact.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="surface-panel p-8 rounded-3xl border border-white/10 sticky top-24"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
                    <User size={32} />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDeleteContact(selectedContact.id)}
                      className="p-2 rounded-xl bg-white/5 text-zinc-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button 
                      onClick={() => setSelectedContact(null)}
                      className="p-2 rounded-xl bg-white/5 text-zinc-500 hover:text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-2xl font-display text-white mb-1 uppercase tracking-tight">{selectedContact.name}</h3>
                  <p className="text-gold text-[10px] uppercase tracking-widest font-bold">{selectedContact.role}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[8px] uppercase tracking-widest text-zinc-600 mb-1">Status</p>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${
                      selectedContact.status === 'active' ? 'text-emerald-500' : 'text-gold'
                    }`}>{selectedContact.status}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[8px] uppercase tracking-widest text-zinc-600 mb-1">Frequency</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gold">{selectedContact.baseFrequency || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-6 mb-8">
                  {selectedContact.email && (
                    <div className="flex items-center gap-3 text-zinc-400">
                      <Mail size={14} className="text-zinc-600" />
                      <span className="text-xs">{selectedContact.email}</span>
                    </div>
                  )}
                  {selectedContact.notes && (
                    <div className="space-y-2">
                      <h5 className="text-[9px] uppercase tracking-widest text-zinc-500">Node intel</h5>
                      <p className="text-xs text-zinc-400 italic leading-relaxed">"{selectedContact.notes}"</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4 border-t border-white/5 pt-8">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-[10px] uppercase tracking-widest text-gold flex items-center gap-2">
                      <Activity size={12} /> Recent History
                    </h5>
                    <button 
                      onClick={() => setShowInteractionForm(true)}
                      className="text-[9px] uppercase tracking-widest text-zinc-500 hover:text-gold transition-colors"
                    >
                      + Add Log
                    </button>
                  </div>

                  <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedInteractions.map((interaction) => (
                      <div key={interaction.id} className="relative pl-6 pb-4 border-l border-white/5 last:pb-0">
                        <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-gold/20 border border-gold/40" />
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-300">{interaction.type}</span>
                            <span className="text-[8px] text-zinc-600">
                              {interaction.timestamp?.seconds ? new Date(interaction.timestamp.seconds * 1000).toLocaleDateString() : 'Just now'}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 leading-tight">{interaction.summary}</p>
                          {interaction.frequency && (
                            <span className="text-[8px] text-gold font-mono uppercase">{interaction.frequency} Signal</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {selectedInteractions.length === 0 && (
                      <p className="text-[9px] text-zinc-600 uppercase tracking-widest text-center py-4 bg-white/5 rounded-xl border border-white/5 italic">
                        No synthesis events logged.
                      </p>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setShowInteractionForm(true)}
                  className="w-full mt-8 py-3 rounded-xl gold-gradient text-black font-bold uppercase tracking-widest text-[10px] hover:scale-102 transition-all shadow-lg shadow-gold/10"
                >
                  Record Synthesis
                </button>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/5 rounded-3xl opacity-30 grayscale hover:opacity-50 transition-opacity">
                <Users size={48} className="text-zinc-700 mb-4" />
                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em]">Select target to view dossier</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[2rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 gold-gradient" />
              
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-display text-white uppercase tracking-widest">New Target Initialization</h3>
                <button onClick={() => setShowAddForm(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddContact} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Subject Name</label>
                    <input 
                      required
                      type="text" 
                      value={newContact.name}
                      onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold"
                      placeholder="Enter identity..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Email Signal</label>
                    <input 
                      type="email" 
                      value={newContact.email}
                      onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold"
                      placeholder="target@signal.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Designation</label>
                    <input 
                      type="text" 
                      value={newContact.role}
                      onChange={(e) => setNewContact({...newContact, role: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold"
                      placeholder="Engineer, Artist, Creator..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Base Frequency</label>
                    <input 
                      type="text" 
                      value={newContact.baseFrequency}
                      onChange={(e) => setNewContact({...newContact, baseFrequency: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold font-mono"
                      placeholder="432Hz"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Field Alignment</label>
                    <select 
                      value={newContact.status}
                      onChange={(e) => setNewContact({...newContact, status: e.target.value as any})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-400 outline-none focus:border-gold appearance-none"
                    >
                      <option value="lead">Lead (Uncalibrated)</option>
                      <option value="active">Active (Synchronized)</option>
                      <option value="completed">Completed (Integrated)</option>
                      <option value="divergent">Divergent (Anomalous)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Tactical Summary</label>
                  <textarea 
                    value={newContact.notes}
                    onChange={(e) => setNewContact({...newContact, notes: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold h-24 resize-none"
                    placeholder="Enter strategic intel..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-4 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-all"
                  >
                    Abort
                  </button>
                  <button 
                    disabled={isSaving}
                    className="flex-3 py-4 gold-gradient text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-102 transition-all disabled:opacity-50"
                  >
                    {isSaving ? 'Initializing...' : 'Add Entity to field'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interaction Modal */}
      <AnimatePresence>
        {showInteractionForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInteractionForm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 gold-gradient" />
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-display text-white uppercase tracking-widest">Synthesis Log</h3>
                  <p className="text-[9px] text-gold uppercase tracking-widest font-bold">Node: {selectedContact?.name}</p>
                </div>
                <button onClick={() => setShowInteractionForm(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddInteraction} className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Interaction Protocol</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'call', name: 'Call', icon: <Phone size={12} /> },
                      { id: 'email', name: 'Email', icon: <Mail size={12} /> },
                      { id: 'synthesis', name: 'Synthesis', icon: <Zap size={12} /> },
                      { id: 'meeting', name: 'Meeting', icon: <Users size={12} /> }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setNewInteraction({...newInteraction, type: type.id as any})}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all ${
                          newInteraction.type === type.id 
                            ? 'bg-gold/20 border-gold text-gold' 
                            : 'bg-white/5 border-white/5 text-zinc-600'
                        }`}
                      >
                        {type.icon}
                        {type.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Applied Frequency (Optional)</label>
                  <input 
                    type="text" 
                    value={newInteraction.frequency}
                    onChange={(e) => setNewInteraction({...newInteraction, frequency: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold font-mono"
                    placeholder="e.g. 528Hz Love Frequency"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Outcome Summary</label>
                  <textarea 
                    required
                    value={newInteraction.summary}
                    onChange={(e) => setNewInteraction({...newInteraction, summary: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold h-28 resize-none"
                    placeholder="Detailed report of the synthesis..."
                  />
                </div>

                <button 
                  disabled={isSaving || !newInteraction.summary}
                  className="w-full py-4 gold-gradient text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-102 transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Digitizing...' : 'Log Synthesis to Dossier'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
