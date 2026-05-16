import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Users, MessageSquare, Trash2, CheckCircle, AlertCircle, Megaphone, BarChart3, Save, Plus, Music, Film, Image as ImageIcon, X, Upload, FileJson, FileAudio, Loader2, Activity, Radio, AudioLines } from 'lucide-react';
import { db, collection, onSnapshot, query, orderBy, limit, deleteDoc, doc, updateDoc, setDoc, serverTimestamp, addDoc, writeBatch, storage, ref, uploadBytes, getDownloadURL, handleFirestoreError, OperationType, getDocFromServer } from '../firebase';
import { MediaItem, MediaType } from '../types';
import { useToast } from './ToastProvider';
import { normalizeAudioUrl } from '../lib/audioUtils';

export const AdminDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [config, setConfig] = useState<any>({
    announcement: { text: '', active: false, type: 'info' }
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [showBulkAudioForm, setShowBulkAudioForm] = useState(false);
  const [showPlaylistForm, setShowPlaylistForm] = useState(false);
  const [bulkJson, setBulkJson] = useState('');
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState<{ field: string; loading: boolean } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  
  const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌ ' : type === 'success' ? '✅ ' : 'ℹ️ ';
    setDebugLogs(prev => [`[${timestamp}] ${prefix}${msg}`, ...prev].slice(0, 50));
  };

  const testFirebaseConnection = async () => {
    setIsTestingConnection(true);
    addLog('Testing Firebase connection...');
    try {
      // Test Firestore
      await getDocFromServer(doc(db, 'system', 'config'));
      addLog('Firestore connection: OK', 'success');
      
      // Test Storage
      addLog(`Storage Bucket: ${storage.app.options.storageBucket}`);
      
      // Try a tiny dummy upload to test write permissions inside media/test/
      const testBlob = new Blob(['connection-test'], { type: 'text/plain' });
      const testRef = ref(storage, 'media/test/connection-test.txt');
      await uploadBytes(testRef, testBlob);
      addLog('Storage write test: OK', 'success');
      
      addLog('Firebase connection test complete.', 'success');
      showToast('Firebase connection is active and writable', 'success');
    } catch (error: any) {
      console.error("Connection test error:", error);
      addLog(`Connection test FAILED: ${error.message}`, 'error');
      
      if (error.code?.includes('storage/unauthorized') || error.message?.includes('unauthorized')) {
        addLog('TIP: Firebase Storage permissions denied. Check your Storage Security Rules, or verify you are signed in as an Admin.', 'info');
      } else if (error.code?.includes('storage/retry-limit-exceeded') || error.message?.includes('bucket') || error.message?.includes('does not exist')) {
        addLog('TIP: Storage bucket not found or disabled. IMPORTANT: You must enable "Cloud Storage" manually in the Firebase Console (console.firebase.google.com) -> click Storage -> Get Started.', 'info');
      } else {
        addLog('TIP: If you just setup Firebase, make sure you went to Firebase Console -> Storage and clicked "Get Started" to initialize your storage bucket.', 'info');
      }
      
      showToast('Firebase connection test failed', 'error');
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  const [newMedia, setNewMedia] = useState<Partial<MediaItem>>({
    type: 'audio',
    title: '',
    url: '',
    mediaUrl: '',
    art: '',
    genre: [],
    description: '',
    playlist: '',
    bpm: 0,
    key: '',
    numerologyCode: '',
    isLive: false,
    streamUrl: ''
  });

  const [newPlaylist, setNewPlaylist] = useState({
    title: '',
    description: '',
    art: '',
    trackIds: [] as string[]
  });
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);

  useEffect(() => {
    // Listen to recent messages
    const messagesRef = collection(db, 'messages');
    const qMessages = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));
    const unsubscribeMessages = onSnapshot(qMessages, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'messages'));

    // Listen to users
    const usersRef = collection(db, 'users');
    const qUsers = query(usersRef, limit(50));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    // Listen to system config
    const configRef = doc(db, 'system', 'config');
    const unsubscribeConfig = onSnapshot(configRef, (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data());
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'system/config'));

    // Listen to media
    const mediaRef = collection(db, 'media');
    const qMedia = query(mediaRef, orderBy('createdAt', 'desc'));
    const unsubscribeMedia = onSnapshot(qMedia, (snapshot) => {
      setMedia(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MediaItem)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'media'));

    // Listen to playlists
    const playlistsRef = collection(db, 'playlists');
    const qPlaylists = query(playlistsRef, orderBy('createdAt', 'desc'));
    const unsubscribePlaylists = onSnapshot(qPlaylists, (snapshot) => {
      setPlaylists(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'playlists'));

    // Listen to contacts
    const contactsRef = collection(db, 'contacts');
    const unsubscribeContacts = onSnapshot(contactsRef, (snapshot) => {
      setContacts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'contacts'));

    // Listen to interactions
    const interactionsRef = collection(db, 'interactions');
    const qInteractions = query(interactionsRef, orderBy('timestamp', 'desc'), limit(10));
    const unsubscribeInteractions = onSnapshot(qInteractions, (snapshot) => {
      setInteractions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'interactions'));

    return () => {
      unsubscribeMessages();
      unsubscribeUsers();
      unsubscribeConfig();
      unsubscribeMedia();
      unsubscribePlaylists();
      unsubscribeContacts();
      unsubscribeInteractions();
    };
  }, []);

  const [confirmDelete, setConfirmDelete] = useState<{ id: string; type: 'message' | 'media' | 'playlist' } | null>(null);

  const handleDeleteMessage = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'messages', id));
      showToast('Message deleted', 'success');
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleToggleLive = async (item: MediaItem) => {
    try {
      await updateDoc(doc(db, 'media', item.id), {
        isLive: !item.isLive
      });
      showToast(`Track is now ${!item.isLive ? 'LIVE' : 'off-air'}`, 'success');
    } catch (error) {
      console.error("Error toggling live status:", error);
    }
  };

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'system', 'config'), config);
      showToast('Configuration saved', 'success');
    } catch (error) {
      console.error("Error saving config:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRepairMediaUrls = async () => {
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      let count = 0;
      
      media.forEach(item => {
        const originalUrl = item.mediaUrl || item.url || '';
        const normalizedUrl = normalizeAudioUrl(originalUrl);
        
        if (normalizedUrl && normalizedUrl !== item.mediaUrl) {
          batch.update(doc(db, 'media', item.id), {
            mediaUrl: normalizedUrl
          });
          count++;
        }
      });
      
      if (count > 0) {
        await batch.commit();
        showToast(`Repaired ${count} media URLs.`, 'success');
      } else {
        showToast('All media URLs are already normalized.', 'info');
      }
    } catch (error: any) {
      console.error("Error repairing media URLs:", error);
      showToast(`Repair failed: ${error.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePlaylist = async () => {
    if (!newPlaylist.title) return;
    setIsSaving(true);
    try {
      if (editingPlaylistId) {
        await updateDoc(doc(db, 'playlists', editingPlaylistId), {
          ...newPlaylist,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'playlists'), {
          ...newPlaylist,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setNewPlaylist({ title: '', description: '', art: '', trackIds: [] });
      setEditingPlaylistId(null);
      setShowPlaylistForm(false);
    } catch (error) {
      console.error("Error saving playlist:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'playlists', id));
      showToast('Playlist deleted', 'success');
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting playlist:", error);
    }
  };

  const handleEditPlaylist = (playlist: any) => {
    setNewPlaylist({
      title: playlist.title,
      description: playlist.description || '',
      art: playlist.art || '',
      trackIds: playlist.trackIds || []
    });
    setEditingPlaylistId(playlist.id);
    setShowPlaylistForm(true);
    setShowMediaForm(false);
    setShowBulkForm(false);
    setShowBulkAudioForm(false);
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const finalMediaUrl = newMedia.mediaUrl || newMedia.url;
      await addDoc(collection(db, 'media'), {
        ...newMedia,
        mediaUrl: normalizeAudioUrl(finalMediaUrl || ''),
        createdAt: serverTimestamp()
      });
      setShowMediaForm(false);
      setNewMedia({
        type: 'audio',
        title: '',
        url: '',
        mediaUrl: '',
        art: '',
        genre: [],
        description: '',
        playlist: '',
        bpm: 0,
        key: '',
        numerologyCode: ''
      });
    } catch (error) {
      console.error("Error adding media:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'media', id));
      showToast('Media deleted', 'success');
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting media:", error);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError(null);
    setIsSaving(true);

    try {
      let data: any[] = [];
      
      if (bulkJson.trim().startsWith('[') || bulkJson.trim().startsWith('{')) {
        // Parse as JSON
        data = JSON.parse(bulkJson);
        if (!Array.isArray(data)) {
          data = [data];
        }
      } else {
        // Parse as CSV (simple implementation)
        const lines = bulkJson.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        
        data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const obj: any = {};
          headers.forEach((header, i) => {
            obj[header] = values[i];
          });
          return obj;
        });
      }

      if (data.length === 0) {
        throw new Error('No data found to upload.');
      }

      const mediaRef = collection(db, 'media');
      const chunkSize = 500;
      
      for (let i = 0; i < data.length; i += chunkSize) {
        const batch = writeBatch(db);
        const chunk = data.slice(i, i + chunkSize);
        
        chunk.forEach((item: any) => {
          // Basic validation - allow mediaUrl to be derived from url if missing
          const finalMediaUrl = item.mediaUrl || item.url;
          if (!item.title || !finalMediaUrl) {
            throw new Error(`Item "${item.title || 'Unknown'}" is missing required fields (title, mediaUrl or url).`);
          }

          const newDocRef = doc(mediaRef);
          batch.set(newDocRef, {
            ...item,
            mediaUrl: normalizeAudioUrl(finalMediaUrl),
            type: item.type || 'audio',
            genre: Array.isArray(item.genre) ? item.genre : (item.genre ? item.genre.split(';').map((s: string) => s.trim()) : []),
            createdAt: serverTimestamp()
          });
        });

        await batch.commit();
      }

      setBulkJson('');
      setShowBulkForm(false);
      showToast(`Successfully uploaded ${data.length} items.`, 'success');
    } catch (error: any) {
      console.error("Error in bulk upload:", error);
      setBulkError(error.message || 'Failed to parse or upload data.');
      showToast('Bulk upload failed. Check the error message.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setBulkJson(content);
        setBulkError(null);
      } catch (err) {
        setBulkError('Failed to read file.');
      }
    };
    reader.readAsText(file);
  };

  const handleSoloFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'art' | 'mediaUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile({ field, loading: true });
    addLog(`Uploading individual file for ${field}: ${file.name}`);

    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const folder = field === 'art' ? 'art' : (newMedia.type || 'audio');
      const storagePath = `media/${folder}/${Date.now()}_${sanitizedName}`;
      const storageRef = ref(storage, storagePath);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      
      setNewMedia(prev => ({ ...prev, [field]: downloadUrl }));
      addLog(`Individual upload success: ${file.name}`, 'success');
      showToast(`${field} file uploaded successfully`, 'success');
    } catch (error: any) {
      console.error(`Error uploading ${field}:`, error);
      addLog(`Individual upload FAILED: ${error.message}`, 'error');
      showToast(`Upload failed: ${error.message}`, 'error');
    } finally {
      setIsUploadingFile(null);
    }
  };

  const processBulkMediaFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    setIsUploading(true);
    setUploadProgress({ current: 0, total: filesArray.length });
    addLog(`Starting bulk upload of ${filesArray.length} files...`);

    try {
      const total = filesArray.length;
      let currentIndex = 0;
      let completedCount = 0;
      let successCount = 0;
      let failCount = 0;

      const uploadWorker = async () => {
        while (currentIndex < total) {
          const index = currentIndex++;
          if (index >= total) break;
          
          const file = filesArray[index];
          if (!file) continue;

          try {
            addLog(`Uploading: ${file.name}`);
            
            // Detect media type
            let type: MediaType = 'audio';
            if (file.type.startsWith('image/')) type = 'image';
            else if (file.type.startsWith('video/')) type = 'video';

            // 1. Upload to Storage
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
            const storagePath = `media/${type}/${Date.now()}_${sanitizedName}`;
            const storageRef = ref(storage, storagePath);
            
            const snapshot = await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(snapshot.ref);
            addLog(`Storage success: ${file.name}`, 'success');

            // 2. Create Firestore Entry
            await addDoc(collection(db, 'media'), {
              title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
              type,
              url: downloadUrl, // Set both for compatibility
              mediaUrl: downloadUrl,
              art: type === 'image' ? downloadUrl : 'https://picsum.photos/seed/audio/800/800', // Default art
              genre: ['Uncategorized'],
              createdAt: serverTimestamp(),
              description: `Bulk uploaded file: ${file.name}`,
              bpm: 0,
              key: '',
              numerologyCode: ''
            }).catch(err => {
              handleFirestoreError(err, OperationType.CREATE, 'media');
            });
            addLog(`Firestore success: ${file.name}`, 'success');
            successCount++;
          } catch (error: any) {
            const errorMsg = error.message || String(error);
            console.error(`Error uploading ${file.name}:`, error);
            addLog(`FAILED ${file.name}: ${errorMsg}`, 'error');
            failCount++;
          } finally {
            completedCount++;
            setUploadProgress({ current: completedCount, total });
          }
        }
      };

      // Run 3 uploads in parallel
      const workers = [uploadWorker(), uploadWorker(), uploadWorker()];
      await Promise.all(workers);

      addLog(`Bulk upload complete. Success: ${successCount}, Failed: ${failCount}`, failCount > 0 ? 'error' : 'success');
      
      if (failCount > 0) {
        showToast(`Processed ${total} files: ${successCount} succeeded, ${failCount} failed.`, 'warning');
      } else {
        showToast(`Successfully uploaded all ${successCount} files.`, 'success');
        setShowBulkAudioForm(false);
      }
    } catch (error: any) {
      console.error("Error in bulk media upload:", error);
      addLog(`CRITICAL ERROR: ${error.message}`, 'error');
      showToast(`Upload failed: ${error.message}`, 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleBulkMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processBulkMediaFiles(e.target.files);
    }
  };

  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragActive) setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (isUploading) return;
      processBulkMediaFiles(e.dataTransfer.files);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gold/20 text-gold">
            <Shield size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-display text-[var(--text-primary)] tracking-wider">Admin Control Center</h1>
            <p className="text-zinc-500 text-sm uppercase tracking-widest">System Oversight & Moderation</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-3">
            <Users size={16} className="text-gold" />
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Total Users</p>
              <p className="text-[var(--text-primary)] font-display">{users.length}</p>
            </div>
          </div>
          <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-3">
            <Music size={16} className="text-gold" />
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Media Items</p>
              <p className="text-[var(--text-primary)] font-display">{media.length}</p>
            </div>
          </div>
          <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-3">
            <Users size={16} className="text-gold" />
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">CRM Contacts</p>
              <p className="text-[var(--text-primary)] font-display">{contacts.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* System Configuration */}
        <section className="surface-panel rounded-3xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Megaphone className="text-gold" size={20} />
              <h2 className="text-xl font-display text-[var(--text-primary)]">Global Announcement</h2>
            </div>
            <button 
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 rounded-xl gold-gradient text-black text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
            >
              <Save size={14} /> {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Announcement Text</label>
              <textarea 
                value={config.announcement?.text || ''}
                onChange={(e) => setConfig({ ...config, announcement: { ...config.announcement, text: e.target.value } })}
                placeholder="Enter system-wide message..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-gold h-24"
              />
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Status</label>
                <button 
                  onClick={() => setConfig({ ...config, announcement: { ...config.announcement, active: !config.announcement?.active } })}
                  className={`w-full py-3 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all ${
                    config.announcement?.active ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-white/5 text-zinc-500 border border-white/10'
                  }`}
                >
                  {config.announcement?.active ? 'Active' : 'Inactive'}
                </button>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Type</label>
                <select 
                  value={config.announcement?.type || 'info'}
                  onChange={(e) => setConfig({ ...config, announcement: { ...config.announcement, type: e.target.value } })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-400 outline-none focus:border-gold"
                >
                  <option value="info">Information (Gold)</option>
                  <option value="warning">Warning (Orange)</option>
                  <option value="success">Success (Emerald)</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Media Library Management */}
        <section className="surface-panel rounded-3xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Music className="text-gold" size={20} />
              <h2 className="text-xl font-display text-[var(--text-primary)]">Media Library</h2>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setShowMediaForm(!showMediaForm);
                  setShowBulkForm(false);
                }}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest ${
                  showMediaForm ? 'bg-gold text-black border-gold' : 'bg-white/5 border-white/10 text-gold hover:bg-white/10'
                }`}
              >
                {showMediaForm ? <X size={14} /> : <Plus size={14} />}
                {showMediaForm ? 'Cancel' : 'Add New Media'}
              </button>
              <button 
                onClick={() => {
                  setShowBulkForm(!showBulkForm);
                  setShowMediaForm(false);
                  setShowBulkAudioForm(false);
                }}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest ${
                  showBulkForm ? 'bg-gold text-black border-gold' : 'bg-white/5 border-white/10 text-gold hover:bg-white/10'
                }`}
              >
                {showBulkForm ? <X size={14} /> : <Upload size={14} />}
                {showBulkForm ? 'Cancel' : 'Bulk Data'}
              </button>
              <button 
                onClick={() => {
                  setShowBulkAudioForm(!showBulkAudioForm);
                  setShowMediaForm(false);
                  setShowBulkForm(false);
                }}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest ${
                  showBulkAudioForm ? 'bg-gold text-black border-gold' : 'bg-white/5 border-white/10 text-gold hover:bg-white/10'
                }`}
              >
                {showBulkAudioForm ? <X size={14} /> : <Upload size={14} />}
                {showBulkAudioForm ? 'Cancel' : 'Bulk Upload'}
              </button>
              <button 
                onClick={testFirebaseConnection}
                disabled={isTestingConnection}
                className="flex items-center gap-2 px-6 py-2 rounded-xl border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 transition-all text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
              >
                {isTestingConnection ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
                Test Connection
              </button>
              <button 
                onClick={handleRepairMediaUrls}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 rounded-xl border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 transition-all text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                title="Fixes Suno links in existing media"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
                Repair URLs
              </button>
            </div>
          </div>

          {showBulkAudioForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`mb-8 p-12 rounded-3xl border flex flex-col items-center justify-center text-center space-y-6 transition-all ${
                isDragActive 
                ? 'bg-gold/20 border-gold shadow-2xl shadow-gold/20 scale-[1.02]' 
                : 'bg-gold/5 border-gold/10'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                {isUploading ? <Loader2 size={40} className="animate-spin" /> : <Upload size={40} />}
              </div>
              
              <div>
                <h3 className="text-xl font-display text-white mb-2">Media File Dropper</h3>
                <p className="text-zinc-500 text-xs uppercase tracking-widest max-w-md mx-auto">
                  Drag and drop multiple audio, video, or image files here, or click to select them. They will be uploaded and automatically added to your library.
                </p>
              </div>

              {uploadProgress ? (
                <div className="w-full max-w-md space-y-2">
                  <div className="flex justify-between text-[10px] uppercase tracking-widest text-zinc-500">
                    <span>Uploading...</span>
                    <span>{uploadProgress.current} / {uploadProgress.total}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                      className="h-full gold-gradient"
                    />
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer px-12 py-4 rounded-2xl gold-gradient text-black font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl shadow-gold/20">
                  <input 
                    type="file" 
                    multiple 
                    accept="audio/*,video/*,image/*" 
                    onChange={handleBulkMediaUpload} 
                    className="hidden" 
                    disabled={isUploading}
                  />
                  {isUploading ? 'Uploading...' : 'Drag & Drop or Select Files'}
                </label>
              )}

              <p className="text-[10px] text-zinc-600 uppercase tracking-widest italic">
                Supported formats: MP3, WAV, OGG, MP4, JPG, PNG, WEBP
              </p>

              {/* Troubleshooting and Storage/CORS Help Section */}
              <div className="w-full max-w-md pt-4 border-t border-white/5 text-left">
                <details className="group">
                  <summary className="flex items-center justify-between text-[10px] uppercase tracking-widest text-gold cursor-pointer select-none font-bold hover:text-white transition-colors">
                    <span>Trouble uploading or visualizer is flat?</span>
                    <span className="text-[12px] group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-4 space-y-3 text-xs text-zinc-400 leading-relaxed bg-black/30 p-4 rounded-xl border border-white/5">
                    <p>
                      <strong className="text-white">1. Ensure Storage is Initialized:</strong><br />
                      Firebase Storage is not always enabled by default on newly provisioned projects. 
                      Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-gold underline">Firebase Console</a>, open your project, click <strong className="text-white">Storage</strong> in the left sidebar, and click <strong className="text-white">Get Started</strong> to activate it.
                    </p>
                    <p>
                      <strong className="text-white">2. Run CLI Command to Fix CORS:</strong><br />
                      If files upload correctly but the player displays a CORS warning or the visualizer remains silent, Google Cloud Storage is blocking cross-origin requests. We have placed a <code className="text-gold bg-white/5 px-1 py-0.5 rounded font-mono">cors.json</code> in your project root!
                    </p>
                    <div className="bg-black/80 px-3 py-2 rounded-lg font-mono text-[10px] text-zinc-300 select-all border border-white/10 break-all leading-normal">
                      gsutil cors set cors.json gs://gen-lang-client-0225000925.firebasestorage.app
                    </div>
                  </div>
                </details>
              </div>
            </motion.div>
          )}

          {debugLogs.length > 0 && (
            <div className="mb-8 p-6 rounded-2xl bg-black/40 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Upload Activity Log</h4>
                <button 
                  onClick={() => setDebugLogs([])}
                  className="text-[9px] uppercase tracking-widest text-zinc-600 hover:text-gold transition-colors"
                >
                  Clear Logs
                </button>
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                {debugLogs.map((log, i) => (
                  <div key={i} className={`text-[9px] font-mono ${log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {showBulkForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FileJson className="text-gold" size={20} />
                  <h3 className="text-white text-sm font-display tracking-widest">Bulk JSON/CSV Upload</h3>
                </div>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white transition-all">
                    <input type="file" accept=".json,.csv" onChange={handleFileUpload} className="hidden" />
                    Upload File
                  </label>
                </div>
              </div>

              <form onSubmit={handleBulkUpload}>
                <div className="mb-4">
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">JSON Array or CSV Data</label>
                  <textarea 
                    value={bulkJson}
                    onChange={(e) => setBulkJson(e.target.value)}
                    placeholder='JSON: [{"title": "Song 1", ...}]&#10;CSV: title,mediaUrl,art,genre&#10;Song 1,https://...,https://...,ambient;lo-fi'
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-xs font-mono text-emerald-400 outline-none focus:border-gold h-48 custom-scrollbar whitespace-pre"
                  />
                </div>

                {bulkError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-500 text-[10px] uppercase tracking-widest">
                    <AlertCircle size={14} />
                    {bulkError}
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest italic">
                    Tip: For CSV, use a semicolon (;) to separate multiple genres.
                  </p>
                  <button 
                    type="submit"
                    disabled={isSaving || !bulkJson.trim()}
                    className="px-10 py-3 rounded-xl gold-gradient text-black text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {isSaving ? 'Uploading...' : 'Start Bulk Import'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
          {showMediaForm && (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleAddMedia}
              className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-3 border-b border-white/5 pb-4 mb-2">
                <h3 className="text-white text-sm font-display tracking-widest">New Media Entry</h3>
              </div>
              
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Media Type</label>
                <div className="flex gap-2">
                  {(['audio', 'video', 'image'] as MediaType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewMedia({ ...newMedia, type })}
                      className={`flex-1 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold border transition-all flex items-center justify-center gap-2 ${
                        newMedia.type === type ? 'bg-gold/20 border-gold text-gold' : 'bg-white/5 border-white/10 text-zinc-500'
                      }`}
                    >
                      {type === 'audio' && <Music size={12} />}
                      {type === 'video' && <Film size={12} />}
                      {type === 'image' && <ImageIcon size={12} />}
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Title</label>
                <input 
                  required
                  type="text" 
                  value={newMedia.title}
                  onChange={(e) => setNewMedia({ ...newMedia, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-gold"
                />
              </div>

              <div className="relative">
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Art URL (Cover)</label>
                <div className="flex gap-2">
                  <input 
                    required
                    type="text" 
                    value={newMedia.art}
                    onChange={(e) => setNewMedia({ ...newMedia, art: e.target.value })}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-gold"
                  />
                  <label className="cursor-pointer p-2 rounded-xl bg-white/5 border border-white/10 text-gold hover:bg-gold hover:text-black transition-all flex items-center justify-center min-w-[40px]">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleSoloFileUpload(e, 'art')} 
                      className="hidden" 
                      disabled={!!isUploadingFile}
                    />
                    {isUploadingFile?.field === 'art' ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                  </label>
                </div>
              </div>

              <div className="relative">
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Direct Media URL (File)</label>
                <div className="flex gap-2">
                  <input 
                    required
                    type="text" 
                    value={newMedia.mediaUrl}
                    onChange={(e) => setNewMedia({ ...newMedia, mediaUrl: e.target.value })}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-gold"
                  />
                  <label className="cursor-pointer p-2 rounded-xl bg-white/5 border border-white/10 text-gold hover:bg-gold hover:text-black transition-all flex items-center justify-center min-w-[40px]">
                    <input 
                      type="file" 
                      accept={newMedia.type === 'image' ? 'image/*' : (newMedia.type === 'video' ? 'video/*' : 'audio/*')} 
                      onChange={(e) => handleSoloFileUpload(e, 'mediaUrl')} 
                      className="hidden" 
                      disabled={!!isUploadingFile}
                    />
                    {isUploadingFile?.field === 'mediaUrl' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">External Link (Suno/Page)</label>
                <input 
                  type="text" 
                  value={newMedia.url}
                  onChange={(e) => setNewMedia({ ...newMedia, url: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Genres (Comma separated)</label>
                <input 
                  type="text" 
                  placeholder="vibes, lo-fi, etc"
                  onChange={(e) => setNewMedia({ ...newMedia, genre: e.target.value.split(',').map(s => s.trim()) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-gold"
                />
              </div>

              {newMedia.type === 'audio' && (
                <>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">BPM</label>
                    <input 
                      type="number" 
                      value={newMedia.bpm}
                      onChange={(e) => setNewMedia({ ...newMedia, bpm: parseInt(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Key</label>
                    <input 
                      type="text" 
                      value={newMedia.key}
                      onChange={(e) => setNewMedia({ ...newMedia, key: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Numerology Code</label>
                    <input 
                      type="text" 
                      value={newMedia.numerologyCode}
                      onChange={(e) => setNewMedia({ ...newMedia, numerologyCode: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-gold"
                    />
                  </div>
                  <div className="flex items-center gap-4 py-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={newMedia.isLive}
                        onChange={(e) => setNewMedia({ ...newMedia, isLive: e.target.checked })}
                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
                      />
                      <span className="text-[10px] uppercase tracking-widest text-zinc-500">Mark as Live Stream</span>
                    </label>
                  </div>
                  {newMedia.isLive && (
                    <div className="lg:col-span-2">
                      <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Stream URL (HLS/M3U8)</label>
                      <input 
                        type="text" 
                        value={newMedia.streamUrl}
                        onChange={(e) => setNewMedia({ ...newMedia, streamUrl: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-gold"
                        placeholder="https://.../playlist.m3u8"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="lg:col-span-3 flex justify-end">
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-10 py-3 rounded-xl gold-gradient text-black text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Processing...' : 'Publish to Library'}
                </button>
              </div>
            </motion.form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {media.map((item) => (
              <div key={item.id} className="group relative p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-4 items-center">
                <img src={item.art} className="w-16 h-16 rounded-lg object-cover border border-white/10" alt="" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-white text-sm font-medium truncate">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[8px] uppercase tracking-widest text-gold bg-gold/10 px-1.5 py-0.5 rounded">{item.type}</span>
                    <span className="text-[8px] uppercase tracking-widest text-zinc-500 truncate">{item.genre.join(', ')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleToggleLive(item)}
                    className={`p-2 rounded-lg transition-colors ${item.isLive ? 'bg-red-500/20 text-red-500' : 'bg-white/5 text-zinc-400 hover:text-white'}`}
                    title={item.isLive ? "End Live Stream" : "Start Live Stream"}
                  >
                    <Radio size={14} className={item.isLive ? 'animate-pulse' : ''} />
                  </button>
                  {confirmDelete?.id === item.id ? (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleDeleteMedia(item.id)}
                        className="px-2 py-1 rounded bg-red-500 text-white text-[8px] font-bold uppercase tracking-widest hover:bg-red-600 transition-colors"
                      >
                        Confirm
                      </button>
                      <button 
                        onClick={() => setConfirmDelete(null)}
                        className="px-2 py-1 rounded bg-white/5 text-zinc-400 text-[8px] font-bold uppercase tracking-widest hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setConfirmDelete({ id: item.id, type: 'media' })}
                      className="p-2 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Playlist Management */}
        <section className="surface-panel rounded-3xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-gold" size={20} />
              <h2 className="text-xl font-display text-[var(--text-primary)]">Playlists</h2>
            </div>
            <button 
              onClick={() => {
                setShowPlaylistForm(!showPlaylistForm);
                setEditingPlaylistId(null);
                setNewPlaylist({ title: '', description: '', art: '', trackIds: [] });
              }}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest ${
                showPlaylistForm ? 'bg-gold text-black border-gold' : 'bg-white/5 border-white/10 text-gold hover:bg-white/10'
              }`}
            >
              {showPlaylistForm ? <X size={14} /> : <Plus size={14} />}
              {showPlaylistForm ? 'Cancel' : 'Create Playlist'}
            </button>
          </div>

          {showPlaylistForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Playlist Title</label>
                  <input 
                    type="text"
                    value={newPlaylist.title}
                    onChange={(e) => setNewPlaylist({ ...newPlaylist, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-gold"
                    placeholder="E.g., Summer Vibes 2024"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Cover Art URL</label>
                  <input 
                    type="text"
                    value={newPlaylist.art}
                    onChange={(e) => setNewPlaylist({ ...newPlaylist, art: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-gold"
                    placeholder="https://..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Description</label>
                  <textarea 
                    value={newPlaylist.description}
                    onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-gold h-20"
                    placeholder="Describe this collection..."
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-4">Select Tracks ({newPlaylist.trackIds.length})</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {media.filter(m => m.type === 'audio').map(track => (
                    <button
                      key={track.id}
                      onClick={() => {
                        const exists = newPlaylist.trackIds.includes(track.id);
                        if (exists) {
                          setNewPlaylist({ ...newPlaylist, trackIds: newPlaylist.trackIds.filter(id => id !== track.id) });
                        } else {
                          setNewPlaylist({ ...newPlaylist, trackIds: [...newPlaylist.trackIds, track.id] });
                        }
                      }}
                      className={`flex items-center gap-3 p-2 rounded-xl border transition-all text-left ${
                        newPlaylist.trackIds.includes(track.id) 
                          ? 'bg-gold/20 border-gold text-gold' 
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      <img src={track.art} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold truncate">{track.title}</p>
                        <p className="text-[8px] uppercase tracking-tight opacity-50 truncate">{track.genre.join(', ')}</p>
                      </div>
                      {newPlaylist.trackIds.includes(track.id) && <CheckCircle size={14} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => {
                    setShowPlaylistForm(false);
                    setEditingPlaylistId(null);
                  }}
                  className="px-6 py-2 rounded-xl bg-white/5 text-zinc-500 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSavePlaylist}
                  disabled={isSaving || !newPlaylist.title || newPlaylist.trackIds.length === 0}
                  className="px-8 py-2 rounded-xl gold-gradient text-black text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingPlaylistId ? 'Update Playlist' : 'Create Playlist'}
                </button>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.map(playlist => (
              <div key={playlist.id} className="glass-panel p-4 rounded-2xl flex items-center gap-4 group">
                <img src={playlist.art || 'https://picsum.photos/seed/playlist/200/200'} alt="" className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-white text-sm font-display truncate">{playlist.title}</h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{playlist.trackIds?.length || 0} Tracks</p>
                </div>
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEditPlaylist(playlist)}
                    className="p-2 rounded-lg bg-white/5 text-gold hover:bg-gold hover:text-black transition-all"
                  >
                    <Plus size={14} />
                  </button>
                    {confirmDelete?.id === playlist.id ? (
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => handleDeletePlaylist(playlist.id)}
                          className="px-2 py-1 rounded bg-red-500 text-white text-[8px] font-bold uppercase tracking-widest hover:bg-red-600 transition-colors"
                        >
                          Confirm
                        </button>
                        <button 
                          onClick={() => setConfirmDelete(null)}
                          className="px-2 py-1 rounded bg-white/5 text-zinc-400 text-[8px] font-bold uppercase tracking-widest hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setConfirmDelete({ id: playlist.id, type: 'playlist' })}
                        className="p-2 rounded-lg bg-white/5 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CRM Overview */}
        <section className="surface-panel rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Users className="text-gold" size={20} />
              <h2 className="text-xl font-display text-[var(--text-primary)]">CRM Overview</h2>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Total Leads</p>
                <p className="text-2xl font-display text-white">{contacts.filter(c => c.status === 'lead').length}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Active Nodes</p>
                <p className="text-2xl font-display text-emerald-500">{contacts.filter(c => c.status === 'active').length}</p>
              </div>
            </div>

            <h3 className="text-[10px] uppercase tracking-widest text-gold font-bold mb-2">Recent Synthesis Events</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {interactions.map((interaction) => {
                const contact = contacts.find(c => c.id === interaction.contactId);
                return (
                  <div key={interaction.id} className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-gold shrink-0">
                        <Activity size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">{contact?.name || 'Unknown Target'}</span>
                          <span className="text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-gold/20 text-gold border border-gold/30 shrink-0">{interaction.type}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 truncate">{interaction.summary}</p>
                      </div>
                    </div>
                    <span className="text-[8px] text-zinc-600 whitespace-nowrap shrink-0">
                      {interaction.timestamp?.seconds ? new Date(interaction.timestamp.seconds * 1000).toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                );
              })}
              {interactions.length === 0 && (
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest text-center py-8">No interaction logs found</p>
              )}
            </div>
          </div>
        </section>

        {/* User Management */}
        <section className="surface-panel rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="text-gold" size={20} />
            <h2 className="text-xl font-display text-[var(--text-primary)]">User Directory</h2>
          </div>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} className="w-10 h-10 rounded-full border border-gold/30" alt="" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[var(--text-primary)] font-medium">{user.name}</p>
                      {user.hebrewName && <span className="text-[10px] font-display text-gold/60">{user.hebrewName}</span>}
                    </div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{user.role}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleToggleAdmin(user.id, user.role)}
                  className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest transition-all ${
                    user.role === 'admin' 
                      ? 'bg-gold text-black font-bold' 
                      : 'bg-white/10 text-zinc-400 hover:bg-white/20'
                  }`}
                >
                  {user.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Content Moderation */}
        <section className="surface-panel rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="text-gold" size={20} />
            <h2 className="text-xl font-display text-[var(--text-primary)]">Community Moderation</h2>
          </div>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-primary)] text-sm font-medium">{msg.userName}</span>
                    <span className="text-[10px] text-zinc-600 font-mono">
                      {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleString() : 'Recent'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {confirmDelete?.id === msg.id ? (
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="px-2 py-1 rounded bg-red-500 text-white text-[8px] font-bold uppercase tracking-widest hover:bg-red-600 transition-colors"
                        >
                          Confirm
                        </button>
                        <button 
                          onClick={() => setConfirmDelete(null)}
                          className="px-2 py-1 rounded bg-white/5 text-zinc-400 text-[8px] font-bold uppercase tracking-widest hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setConfirmDelete({ id: msg.id, type: 'message' })}
                        className="p-2 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{msg.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
