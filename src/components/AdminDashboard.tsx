import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Users, MessageSquare, Trash2, CheckCircle, AlertCircle, Megaphone, BarChart3, Save, Plus, Music, Film, Image as ImageIcon, X, Upload, FileJson, FileAudio, Loader2, Activity, Radio, AudioLines, Globe, Lock, ShoppingBag } from 'lucide-react';
import { db, auth, collection, onSnapshot, query, orderBy, limit, deleteDoc, doc, updateDoc, setDoc, serverTimestamp, addDoc, writeBatch, storage, ref, uploadBytes, getDownloadURL, handleFirestoreError, OperationType, getDocFromServer } from '../firebase';
import { MediaItem, MediaType, Playlist, Product } from '../types';
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
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [config, setConfig] = useState<any>({
    announcement: { text: '', active: false, type: 'info' }
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [showBulkAudioForm, setShowBulkAudioForm] = useState(false);
  const [showQuickImport, setShowQuickImport] = useState(false);
  const [showPlaylistForm, setShowPlaylistForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [bulkJson, setBulkJson] = useState('');
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState<{ field: string; loading: boolean } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [batchImageUrl, setBatchImageUrl] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [isConfirmingBulkDelete, setIsConfirmingBulkDelete] = useState(false);
  
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

  const [newPlaylist, setNewPlaylist] = useState<Partial<Playlist>>({
    title: '',
    description: '',
    art: '',
    trackIds: [],
    isPublic: true
  });
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    category: 'Apparel',
    images: [],
    stock: 0,
    sizes: [],
    features: []
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

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

    // Listen to products
    const productsRef = collection(db, 'products');
    const unsubscribeProducts = onSnapshot(productsRef, (snapshot) => {
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

    // Listen to orders
    const ordersRef = collection(db, 'orders');
    const unsubscribeOrders = onSnapshot(ordersRef, (snapshot) => {
      setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'orders'));

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

  const handleBulkDelete = async () => {
    if (selectedMediaIds.length === 0) return;
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      selectedMediaIds.forEach(id => {
        batch.delete(doc(db, 'media', id));
      });
      await batch.commit();
      showToast(`Deleted ${selectedMediaIds.length} items successfully`, "success");
      setSelectedMediaIds([]);
      setIsConfirmingBulkDelete(false);
    } catch (error: any) {
      console.error("Bulk delete error:", error);
      showToast(`Failed to delete items: ${error.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBatchUpdateImages = async () => {
    if (!batchImageUrl || selectedMediaIds.length === 0) return;
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      selectedMediaIds.forEach(id => {
        batch.update(doc(db, 'media', id), {
          art: batchImageUrl,
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
      showToast(`Updated ${selectedMediaIds.length} images`, 'success');
      setSelectedMediaIds([]);
      setBatchImageUrl('');
    } catch (error) {
      console.error("Batch update error:", error);
      showToast("Failed to update images", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const seedDatabase = async () => {
    const { TRACKS } = await import('../constants');
    setIsMigrating(true);
    addLog('Starting database seeding from TRACKS constants...');
    try {
      const batch = writeBatch(db);
      let count = 0;
      
      // Get existing titles to prevent duplicates
      const existingTitles = new Set(media.map(m => m.title.toLowerCase()));

      for (const track of TRACKS) {
        if (existingTitles.has(track.title.toLowerCase())) {
          addLog(`Skipping duplicate: ${track.title}`);
          continue;
        }

        const docRef = doc(collection(db, 'media'));
        batch.set(docRef, {
          ...track,
          mediaUrl: normalizeAudioUrl(track.url || track.mediaUrl || ''),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        count++;
      }

      if (count > 0) {
        await batch.commit();
        addLog(`Seeded ${count} new tracks to Firestore`, 'success');
        showToast(`Database seeded with ${count} tracks`, 'success');
      } else {
        addLog('No new tracks to seed.', 'info');
        showToast('Library is already synced', 'info');
      }
    } catch (error: any) {
      addLog(`Seeding failed: ${error.message}`, 'error');
      showToast("Seeding failed", "error");
    } finally {
      setIsMigrating(false);
    }
  };

  const seedProducts = async () => {
    setIsMigrating(true);
    addLog('Starting product library seeding...');
    try {
      const MOCK_PRODUCTS = [
        {
          name: 'Resonance Frequency Hoodie',
          description: 'Heavyweight organic cotton oversized hoodie with 432Hz frequency wave embroidery. Engineered for deep listening sessions and thermal regulation during meditation.',
          price: 88,
          category: 'Apparel',
          images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800'],
          stock: 33,
          sizes: ['S', 'M', 'L', 'XL'],
          features: ['400GSM Organic Cotton', 'Frequency Wave Embroidery', 'Secret Inner Pocket'],
        },
        {
          name: 'GG33 Numerology Dad Hat',
          description: 'Minimalist dad hat featuring the sacred numerology patterns. A silent signal for the initiated.',
          price: 33,
          category: 'Accessories',
          images: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=800'],
          stock: 55,
          sizes: ['Adjustable'],
          features: ['100% Cotton Twill', 'Unstructured 6-panel', 'Brass Buckle'],
        },
        {
          name: 'Golden Ratio Silk Scarf',
          description: 'Mulberry silk scarf printed with the 1.618 sequence. Can be used as a meditation blindfold or an elegant accessory.',
          price: 108,
          category: 'Apparel',
          images: ['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&q=80&w=800'],
          stock: 22,
          sizes: ['90x90cm'],
          features: ['100% Mulberry Silk', 'Hand-rolled edges', 'Archival quality print'],
        },
        {
          name: 'Quantum State Scented Candle',
          description: 'Proprietary blend of Sandalwood, Frankincense, and Myrrh. Designed to anchor your physical space during frequency work.',
          price: 44,
          category: 'Lifestyle',
          images: ['https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=800'],
          stock: 88,
          sizes: ['12oz'],
          features: ['Soy Wax Blend', '60hr Burn Time', 'Amethyst Crystal Inside'],
        },
        {
          name: 'Hemi-Sync Meditation Mat',
          description: 'Ergonomic meditation mat with alignment markers designed to optimize your posture for binaural beat sessions.',
          price: 144,
          category: 'Wellness',
          images: ['https://images.unsplash.com/photo-1620138546344-7b2c08517ed5?auto=format&fit=crop&q=80&w=800'],
          stock: 11,
          sizes: ['Standard'],
          features: ['Natural Rubber Base', 'Alignment Mapping', 'Antispectral Surface'],
        },
        {
          name: 'Mystic Rebel Astrology Deck',
          description: 'A 78-card deck for navigating the digital zeitgeist. Blends traditional tarot with modern frequency archetypes.',
          price: 55,
          category: 'Tools',
          images: ['https://images.unsplash.com/photo-1601314167099-232775b3d6fd?auto=format&fit=crop&q=80&w=800'],
          stock: 99,
          sizes: ['Standard Card'],
          features: ['Gold Foil Detail', '350gsm Cardstock', 'Instruction Book Included'],
        }
      ];

      const batch = writeBatch(db);
      let count = 0;
      
      const existingNames = new Set(products.map(p => p.name.toLowerCase()));

      for (const product of MOCK_PRODUCTS) {
        if (existingNames.has(product.name.toLowerCase())) {
          addLog(`Skipping duplicate product: ${product.name}`);
          continue;
        }

        const docRef = doc(collection(db, 'products'));
        batch.set(docRef, {
          ...product,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        count++;
      }

      if (count > 0) {
        await batch.commit();
        addLog(`Successfully seeded ${count} new products`, 'success');
        showToast(`Store populated with ${count} items`, 'success');
      } else {
        addLog('No new products to seed.', 'info');
        showToast('Store library already populated', 'info');
      }
    } catch (error: any) {
      addLog(`Product seeding failed: ${error.message}`, 'error');
      showToast("Store seeding failed", "error");
    } finally {
      setIsMigrating(false);
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

  const [quickLinks, setQuickLinks] = useState('');

  const handleQuickLinkImport = async () => {
    if (!quickLinks.trim()) return;
    setIsSaving(true);
    addLog('Starting Quick Link Import...');
    
    try {
      // Split by lines or commas
      const links = quickLinks.split(/[\n,]+/).map(l => l.trim()).filter(l => l.length > 5);
      const batch = writeBatch(db);
      let count = 0;

      for (const link of links) {
        const normalized = normalizeAudioUrl(link);
        // Simple title extraction from URL uuid
        const uuidMatch = normalized.match(/([a-f0-9-]{36})/);
        const title = uuidMatch ? `Imported Signal ${uuidMatch[1].slice(0, 8)}` : `New Signal ${media.length + count + 1}`;
        
        const docRef = doc(collection(db, 'media'));
        batch.set(docRef, {
          title,
          type: 'audio',
          url: link,
          mediaUrl: normalized,
          art: '/src/assets/images/default_cover_1779345608057.png',
          genre: ['Imported'],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        count++;
      }

      await batch.commit();
      addLog(`Imported ${count} links successfully`, 'success');
      showToast(`Added ${count} songs to library`, 'success');
      setQuickLinks('');
    } catch (error: any) {
      addLog(`Import failed: ${error.message}`, 'error');
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
    if (!newPlaylist.title || !auth.currentUser) return;
    setIsSaving(true);
    try {
      const playlistData = {
        ...newPlaylist,
        userId: auth.currentUser.uid,
        updatedAt: serverTimestamp()
      };
      
      if (editingPlaylistId) {
        await updateDoc(doc(db, 'playlists', editingPlaylistId), playlistData);
      } else {
        await addDoc(collection(db, 'playlists'), {
          ...playlistData,
          createdAt: serverTimestamp()
        });
      }
      setNewPlaylist({ title: '', description: '', art: '', trackIds: [], isPublic: true });
      setEditingPlaylistId(null);
      setShowPlaylistForm(false);
      showToast(editingPlaylistId ? 'Playlist updated' : 'Playlist created', 'success');
    } catch (error) {
      console.error("Error saving playlist:", error);
      showToast('Failed to save playlist', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!newProduct.name || !newProduct.price) return;
    setIsSaving(true);
    try {
      if (editingProductId) {
        await updateDoc(doc(db, 'products', editingProductId), {
          ...newProduct,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'products'), {
          ...newProduct,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setNewProduct({ name: '', description: '', price: 0, category: 'Apparel', images: [], stock: 0, sizes: [], features: [] });
      setEditingProductId(null);
      setShowProductForm(false);
      showToast(editingProductId ? 'Product Updated' : 'Product Added', 'success');
    } catch (error) {
      console.error("Error saving product:", error);
      showToast('Error saving product', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      showToast('Product Deleted', 'success');
    } catch (error) {
      console.error("Error deleting product:", error);
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
      trackIds: playlist.trackIds || [],
      isPublic: playlist.isPublic !== undefined ? playlist.isPublic : true
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

  const handleSoloFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'art' | 'mediaUrl' | 'images', target: 'media' | 'playlist' | 'product' = 'media') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile({ field, loading: true });
    addLog(`Uploading file for ${field}: ${file.name}`);

    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const folder = field === 'art' || field === 'images' ? 'art' : (newMedia.type || 'audio');
      const storagePath = `media/${folder}/${Date.now()}_${sanitizedName}`;
      const storageRef = ref(storage, storagePath);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      
      if (target === 'media') {
        setNewMedia(prev => ({ ...prev, [field as string]: downloadUrl }));
      } else if (target === 'playlist') {
        setNewPlaylist(prev => ({ ...prev, [field as string]: downloadUrl }));
      } else if (target === 'product') {
        setNewProduct(prev => {
          if (field === 'images') {
            return { ...prev, images: [downloadUrl, ...(prev.images || []).slice(1)] };
          }
          return { ...prev, [field as string]: downloadUrl };
        });
      }
      
      addLog(`Upload success: ${file.name}`, 'success');
      showToast(`File uploaded successfully`, 'success');
    } catch (error: any) {
      console.error(`Error uploading ${field}:`, error);
      addLog(`Upload FAILED: ${error.message}`, 'error');
      showToast(`Upload failed: ${error.message}`, 'error');
    } finally {
      setIsUploadingFile(null);
    }
  };

  const handleBatchImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSaving(true);
    addLog(`Uploading batch image: ${file.name}`);
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const storagePath = `media/batch/${Date.now()}_${sanitizedName}`;
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      setBatchImageUrl(downloadUrl);
      addLog(`Batch upload success`, 'success');
      showToast("Batch image uploaded", "success");
    } catch (error: any) {
      addLog(`Batch upload failed: ${error.message}`, 'error');
      showToast(`Upload failed: ${error.message}`, "error");
    } finally {
      setIsSaving(false);
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
              art: type === 'image' ? downloadUrl : '/src/assets/images/default_cover_1779345608057.png', // Default art
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
                onClick={() => {
                  setShowQuickImport(!showQuickImport);
                  setShowMediaForm(false);
                  setShowBulkForm(false);
                  setShowBulkAudioForm(false);
                }}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest ${
                  showQuickImport ? 'bg-gold text-black border-gold' : 'bg-white/5 border-white/10 text-gold hover:bg-white/10'
                }`}
              >
                {showQuickImport ? <X size={14} /> : <AudioLines size={14} />}
                {showQuickImport ? 'Cancel' : 'Quick Link Import'}
              </button>
              <button 
                onClick={seedDatabase}
                disabled={isMigrating}
                className="flex items-center gap-2 px-6 py-2 rounded-xl border border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 transition-all text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                title="Migrates hardcoded TRACKS from constants.ts to Firestore"
              >
                {isMigrating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Onboard Initial Library
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

          {showQuickImport && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-4">
                <AudioLines className="text-gold" size={20} />
                <h3 className="text-white text-sm font-display tracking-widest">Quick Link Import</h3>
              </div>
              
              <div className="space-y-4">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest leading-relaxed">
                  Paste multiple audio links (Suno.com, direct MP3s, etc.) separated by lines or commas. 
                  Existing "Already Uploaded" content can be quickly added to your dynamic library here.
                </p>
                <textarea 
                  value={quickLinks}
                  onChange={(e) => setQuickLinks(e.target.value)}
                  placeholder="Paste links here (https://suno.com/song/... or https://.../*.mp3)"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-xs font-mono text-gold/80 outline-none focus:border-gold h-32 custom-scrollbar"
                />
                <div className="flex justify-end">
                  <button 
                    onClick={handleQuickLinkImport}
                    disabled={isSaving || !quickLinks.trim()}
                    className="px-10 py-3 rounded-xl gold-gradient text-black text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {isSaving ? 'Importing...' : 'Add Links to Library'}
                  </button>
                </div>
              </div>
            </motion.div>
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

          {selectedMediaIds.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 rounded-3xl bg-gold/10 border border-gold/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gold/20 flex items-center justify-center text-gold">
                  {isConfirmingBulkDelete ? <AlertCircle size={24} /> : <ImageIcon size={24} />}
                </div>
                <div>
                  <h3 className="text-white text-sm font-display tracking-widest">
                    {isConfirmingBulkDelete ? 'Confirm Bulk Deletion' : 'Batch Image Update'}
                  </h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{selectedMediaIds.length} items selected</p>
                </div>
              </div>
              
              <div className="flex-1 w-full max-w-md flex gap-2 items-center">
                {!isConfirmingBulkDelete ? (
                  <>
                    <div className="flex-1 flex gap-2">
                      <input 
                        type="text"
                        value={batchImageUrl}
                        onChange={(e) => setBatchImageUrl(e.target.value)}
                        placeholder="Enter new image URL for selected items..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-gold"
                      />
                      <label className="cursor-pointer p-2 rounded-xl bg-white/5 border border-white/10 text-gold hover:bg-gold hover:text-black transition-all flex items-center justify-center min-w-[40px]">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleBatchImageFileUpload} 
                          className="hidden" 
                          disabled={isSaving}
                        />
                        {isSaving && batchImageUrl === '' ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                      </label>
                    </div>
                    <button 
                      onClick={handleBatchUpdateImages}
                      disabled={isSaving || !batchImageUrl}
                      className="px-6 py-2 rounded-xl gold-gradient text-black text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 h-10"
                    >
                      {isSaving ? 'Updating...' : 'Apply Image'}
                    </button>
                    <button 
                      onClick={() => setIsConfirmingBulkDelete(true)}
                       title="Delete Selected Items"
                      className="w-10 h-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button 
                      onClick={() => setSelectedMediaIds([])}
                      className="px-4 py-2 rounded-xl bg-white/5 text-zinc-400 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all h-9"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <p className="flex-1 text-[10px] text-zinc-400 uppercase tracking-widest font-bold text-center md:text-left">
                      Permanently delete {selectedMediaIds.length} items?
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleBulkDelete}
                        disabled={isSaving}
                        className="px-6 py-2 rounded-xl bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50 h-9"
                      >
                        {isSaving ? 'Deleting...' : 'Confirm'}
                      </button>
                      <button 
                        onClick={() => setIsConfirmingBulkDelete(false)}
                        className="px-4 py-2 rounded-xl bg-white/5 text-zinc-400 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all h-9"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {media.map((item) => (
              <div 
                key={item.id} 
                className={`group relative p-4 rounded-2xl flex gap-4 items-center transition-all border ${
                  selectedMediaIds.includes(item.id) 
                    ? 'bg-gold/10 border-gold shadow-[0_0_20px_rgba(201,168,76,0.1)]' 
                    : 'bg-white/5 border-white/5 hover:border-white/20'
                }`}
              >
                <div 
                  className="absolute -left-2 -top-2 z-10 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    const exists = selectedMediaIds.includes(item.id);
                    if (exists) {
                      setSelectedMediaIds(selectedMediaIds.filter(id => id !== item.id));
                    } else {
                      setSelectedMediaIds([...selectedMediaIds, item.id]);
                    }
                  }}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                    selectedMediaIds.includes(item.id) ? 'bg-gold border-gold text-black shadow-lg shadow-gold/20' : 'bg-black/60 border-white/20 text-transparent'
                  }`}>
                    <CheckCircle size={12} className={selectedMediaIds.includes(item.id) ? 'opacity-100' : 'opacity-0'} />
                  </div>
                </div>
                <img src={item.art || '/src/assets/images/default_cover_1779345608057.png'} className="w-16 h-16 rounded-lg object-cover border border-white/10" alt="" referrerPolicy="no-referrer" />
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
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newPlaylist.art}
                      onChange={(e) => setNewPlaylist({ ...newPlaylist, art: e.target.value })}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-gold"
                      placeholder="https://..."
                    />
                    <label className="cursor-pointer p-3 rounded-xl bg-white/5 border border-white/10 text-gold hover:bg-gold hover:text-black transition-all flex items-center justify-center min-w-[48px]">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleSoloFileUpload(e, 'art', 'playlist')} 
                        className="hidden" 
                        disabled={!!isUploadingFile}
                      />
                      {isUploadingFile?.field === 'art' ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                    </label>
                  </div>
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
                <div className="flex items-center gap-4 py-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={newPlaylist.isPublic}
                      onChange={(e) => setNewPlaylist({ ...newPlaylist, isPublic: e.target.checked })}
                      className="w-4 h-4 rounded border-white/10 bg-white/5 text-gold focus:ring-gold"
                    />
                    <span className="text-[10px] uppercase tracking-widest text-zinc-400">Public for all users</span>
                  </label>
                </div>

                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-4">Select Tracks ({newPlaylist.trackIds?.length || 0})</label>
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
                      <img src={track.art || '/src/assets/images/default_cover_1779345608057.png'} alt="" className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
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
                <img src={playlist.art || '/src/assets/images/default_cover_1779345608057.png'} alt="" className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-white text-sm font-display truncate">{playlist.title}</h3>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{playlist.trackIds?.length || 0} Tracks</p>
                    <div className="flex items-center gap-1 text-[8px] text-zinc-600 uppercase tracking-widest">
                      {playlist.isPublic ? <Globe size={8} className="text-gold" /> : <Lock size={8} />}
                      <span>{playlist.isPublic ? 'Public' : 'Private'}</span>
                    </div>
                  </div>
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

        {/* Merch Store Management */}
        <section className="surface-panel rounded-3xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ShoppingBag className="text-gold" size={20} />
              <h2 className="text-xl font-display text-[var(--text-primary)]">Merch Store Artifacts</h2>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={seedProducts}
                disabled={isMigrating}
                className="flex items-center gap-2 px-6 py-2 rounded-xl border border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 transition-all text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
              >
                {isMigrating ? <Loader2 size={14} className="animate-spin" /> : <ShoppingBag size={14} />}
                Seed Store Library
              </button>
              <button 
                onClick={() => setShowProductForm(!showProductForm)}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest ${
                  showProductForm ? 'bg-gold text-black border-gold' : 'bg-white/5 border-white/10 text-gold hover:bg-white/10'
                }`}
              >
                {showProductForm ? <X size={14} /> : <Plus size={14} />}
                {showProductForm ? 'Cancel' : 'Add Product'}
              </button>
            </div>
          </div>

          {showProductForm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Product Name</label>
                  <input 
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold"
                    placeholder="E.g., Quantum resonance Hoodie"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Price ($)</label>
                  <input 
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Description</label>
                  <textarea 
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold h-24"
                    placeholder="Describe the material and frequency of this artifact..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Category</label>
                  <select 
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-400 outline-none focus:border-gold"
                  >
                    <option value="Apparel">Apparel</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Digital">Digital</option>
                    <option value="Vinyl">Vinyl</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Stock Level</label>
                  <input 
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Image URL</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newProduct.images?.[0] || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, images: [e.target.value] })}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold"
                      placeholder="https://..."
                    />
                    <label className="cursor-pointer p-3 rounded-xl bg-white/5 border border-white/10 text-gold hover:bg-gold hover:text-black transition-all flex items-center justify-center min-w-[48px]">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleSoloFileUpload(e, 'images', 'product')} 
                        className="hidden" 
                        disabled={!!isUploadingFile}
                      />
                      {isUploadingFile?.field === 'images' ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => {
                    setShowProductForm(false);
                    setEditingProductId(null);
                  }}
                  className="px-6 py-2 rounded-xl bg-white/5 text-zinc-500 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProduct}
                  disabled={isSaving || !newProduct.name || !newProduct.price}
                  className="px-8 py-2 rounded-xl gold-gradient text-black text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Processing...' : editingProductId ? 'Update Product' : 'Add Artifact'}
                </button>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map(product => (
              <div key={product.id} className="glass-panel p-4 rounded-2xl group relative overflow-hidden">
                <div className="aspect-square bg-zinc-900 rounded-xl overflow-hidden mb-4">
                  <img src={product.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-white text-xs font-bold uppercase tracking-widest truncate">{product.name}</h3>
                  <span className="text-gold font-bold text-xs">${product.price.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[8px] uppercase tracking-widest text-zinc-500">{product.category} • {product.stock} in stock</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setNewProduct(product);
                        setEditingProductId(product.id);
                        setShowProductForm(true);
                      }}
                      className="p-1.5 rounded-lg bg-white/5 text-zinc-500 hover:text-gold transition-colors"
                    >
                      <Save size={12} />
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-1.5 rounded-lg bg-white/5 text-zinc-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="p-12 text-center border border-dashed border-white/10 rounded-3xl">
              <ShoppingBag className="mx-auto text-zinc-800 mb-4" size={32} />
              <p className="text-zinc-600 text-[10px] uppercase tracking-widest">No artifacts in the store repository</p>
            </div>
          )}
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
