import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Edit2, Trash2, Tag, Coins, Folder, Shield, Calendar, 
  Paintbrush, Layers, Info, Check, AlertTriangle, RefreshCw, Sparkles,
  ArrowLeft, Globe, Percent, Clock, History
} from 'lucide-react';
import { 
  db, collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, 
  handleFirestoreError, OperationType 
} from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';

interface ShopItem {
  id: string;
  name: string;
  secondaryName?: string;
  price: number;
  color?: string;
  primary?: string;
  accent?: string;
  darkBg?: string;
  lightBg?: string;
  category?: string;
  createdAt?: string;
}

interface ClipPackage {
  id: string;
  numCoins: number;
  priceString: string;
  region: 'USA' | 'HK';
  isHot: boolean;
  labelText?: string;
  createdAt?: string;
}

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPreset: { primaryColorHex: string; accentColorHex: string };
  themeMode: 'LIGHT' | 'DARK';
  triggerNotification: (msg: string) => void;
  adminUser?: { uid: string; email?: string; name?: string } | null;
}

export default function AdminPanel({
  isOpen,
  onClose,
  selectedPreset,
  themeMode,
  triggerNotification,
  adminUser
}: AdminPanelProps) {
  // Tabs State
  const [activeTab, setActiveTab] = useState<'themes' | 'clip_packages'>('themes');

  // Logs and History drawer state
  const [logs, setLogs] = useState<any[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [lastViewedTimestamp, setLastViewedTimestamp] = useState<string>(() => {
    return localStorage.getItem('neote_last_viewed_logs_ts') || '';
  });

  // Automatically mark all current logs as viewed when the history drawer is opened
  useEffect(() => {
    if (isHistoryOpen) {
      const now = new Date().toISOString();
      localStorage.setItem('neote_last_viewed_logs_ts', now);
      setLastViewedTimestamp(now);
    }
  }, [isHistoryOpen]);

  // Themes List state
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Clip Packages state
  const [packages, setPackages] = useState<ClipPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [errorPackages, setErrorPackages] = useState<string | null>(null);

  // Common Sandbox Mode State
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  // Modals / forms states (Themes)
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditPriceOpen, setIsEditPriceOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);

  // Add Item form fields (Themes)
  const [newItemId, setNewItemId] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemSecondary, setNewItemSecondary] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(1000);
  const [newItemColor, setNewItemColor] = useState('#00C087');
  const [newItemCategory, setNewItemCategory] = useState('Themes');

  // Edit Price form fields (Themes)
  const [editPriceVal, setEditPriceVal] = useState<number>(0);

  // Modals / forms states (Packages)
  const [isAddPackageOpen, setIsAddPackageOpen] = useState(false);
  const [isEditPackageOpen, setIsEditPackageOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ClipPackage | null>(null);

  // Add Package form fields
  const [newPkgId, setNewPkgId] = useState('');
  const [newPkgNumCoins, setNewPkgNumCoins] = useState(200);
  const [newPkgPriceString, setNewPkgPriceString] = useState('$1.99');
  const [newPkgRegion, setNewPkgRegion] = useState<'USA' | 'HK'>('USA');
  const [newPkgIsHot, setNewPkgIsHot] = useState(false);
  const [newPkgLabelText, setNewPkgLabelText] = useState('');

  // Edit Package form fields
  const [editPkgNumCoins, setEditPkgNumCoins] = useState(200);
  const [editPkgPriceString, setEditPkgPriceString] = useState('$1.99');
  const [editPkgRegion, setEditPkgRegion] = useState<'USA' | 'HK'>('USA');
  const [editPkgIsHot, setEditPkgIsHot] = useState(false);
  const [editPkgLabelText, setEditPkgLabelText] = useState('');

  // Active region tab ('USA' | 'HK') for dividing packages into 2 pages
  const [packageRegionTab, setPackageRegionTab] = useState<'USA' | 'HK'>('USA');

  // Deletion Custom Modal State
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    id: string;
    type: 'theme' | 'package';
    name?: string;
  } | null>(null);

  // Helpers to obtain references
  const getDocRef = (itemId: string) => {
    if (isSandboxMode) {
      return { id: itemId, collectionName: 'shop_items', isMockRef: true };
    }
    return doc(db, 'shop_items', itemId);
  };

  const getPackageDocRef = (pkgId: string) => {
    if (isSandboxMode) {
      return { id: pkgId, collectionName: 'clip_packages', isMockRef: true };
    }
    return doc(db, 'clip_packages', pkgId);
  };

  // Stream Theme items
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    let unsubscribe: () => void = () => {};

    const startStreaming = (useSandbox: boolean) => {
      const colRef = useSandbox 
        ? { isMockRef: true, id: 'shop_items', collectionName: 'shop_items' } 
        : collection(db, 'shop_items');

      unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          const fetchedItems: ShopItem[] = [];
          snapshot.forEach((docSnap: any) => {
            fetchedItems.push({
              id: docSnap.id,
              ...docSnap.data()
            });
          });
          setItems(fetchedItems);
          setLoading(false);
          setError(null);
          setIsSandboxMode(useSandbox);
        },
        (err: any) => {
          console.warn("Themes Stream live connection failed. Attempting sandbox fallback:", err);
          if (!useSandbox) {
            try { unsubscribe(); } catch (e) {}
            triggerNotification("Active in Local Sandbox Mode.");
            startStreaming(true);
          } else {
            setError("Missing or insufficient Firestore permissions.");
            setLoading(false);
          }
        }
      );
    };

    startStreaming(isSandboxMode);

    return () => {
      try { unsubscribe(); } catch (e) {}
    };
  }, [isOpen, isSandboxMode]);

  // Stream Clip packages
  useEffect(() => {
    if (!isOpen) return;

    setLoadingPackages(true);
    let unsubscribe: () => void = () => {};

    const startPackageStreaming = (useSandbox: boolean) => {
      const colRef = useSandbox 
        ? { isMockRef: true, id: 'clip_packages', collectionName: 'clip_packages' } 
        : collection(db, 'clip_packages');

      unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          const fetchedPkgs: ClipPackage[] = [];
          snapshot.forEach((docSnap: any) => {
            fetchedPkgs.push({
              id: docSnap.id,
              ...docSnap.data()
            });
          });
          fetchedPkgs.sort((a, b) => {
            const reg = (a.region || '').localeCompare(b.region || '');
            if (reg !== 0) return reg;
            const coinDiff = (a.numCoins || 0) - (b.numCoins || 0);
            if (coinDiff !== 0) return coinDiff;
            return (a.priceString || '').localeCompare(b.priceString || '');
          });
          setPackages(fetchedPkgs);
          setLoadingPackages(false);
          setErrorPackages(null);
        },
        (err: any) => {
          console.warn("Packages Stream live connection failed. Attempting sandbox fallback:", err);
          if (!useSandbox) {
            try { unsubscribe(); } catch (e) {}
            startPackageStreaming(true);
          } else {
            setErrorPackages("Missing or insufficient permissions.");
            setLoadingPackages(false);
          }
        }
      );
    };

    startPackageStreaming(isSandboxMode);

    return () => {
      try { unsubscribe(); } catch (e) {}
    };
  }, [isOpen, isSandboxMode]);

  // Stream Admin Logs
  useEffect(() => {
    if (!isOpen) return;

    let unsubscribeLogs: () => void = () => {};

    const startStreamingLogs = (useSandbox: boolean) => {
      const colRef = useSandbox 
        ? { isMockRef: true, id: 'admin_logs', collectionName: 'admin_logs' } 
        : collection(db, 'admin_logs');

      unsubscribeLogs = onSnapshot(
        colRef,
        (snapshot) => {
          const fetchedLogs: any[] = [];
          snapshot.forEach((docSnap: any) => {
            fetchedLogs.push({
              id: docSnap.id,
              ...docSnap.data()
            });
          });
          // Sort descending by timestamp
          fetchedLogs.sort((a, b) => {
            const tsA = a.timestamp || '';
            const tsB = b.timestamp || '';
            return tsB.localeCompare(tsA);
          });
          setLogs(fetchedLogs);
        },
        (err: any) => {
          console.warn("Logs Stream live connection failed. Fallback to sandbox:", err);
          if (!useSandbox) {
            try { unsubscribeLogs(); } catch (e) {}
            startStreamingLogs(true);
          }
        }
      );
    };

    startStreamingLogs(isSandboxMode);

    return () => {
      try { unsubscribeLogs(); } catch (e) {}
    };
  }, [isOpen, isSandboxMode]);

  const logAdminAction = async (action: string, details: string) => {
    try {
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const logRef = isSandboxMode 
        ? { id: logId, collectionName: 'admin_logs', isMockRef: true }
        : doc(db, 'admin_logs', logId);

      const adminId = adminUser?.email || adminUser?.uid || 'Unknown Admin';
      const logData = {
        id: logId,
        action,
        details,
        adminId,
        timestamp: new Date().toISOString()
      };

      await setDoc(logRef, logData);
    } catch (e) {
      console.error("Failed to write admin log:", e);
    }
  };

  // Handle Add New Theme Item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = newItemId.trim().toLowerCase().replace(/\s+/g, '_');
    if (!cleanId) {
      triggerNotification("Please provide a valid unique identifier ID.");
      return;
    }

    const docRef = getDocRef(cleanId);
    const itemData: ShopItem = {
      id: cleanId,
      name: newItemName.trim(),
      secondaryName: newItemSecondary.trim() || undefined,
      price: Number(newItemPrice),
      color: newItemColor,
      primary: newItemColor,
      accent: newItemColor,
      darkBg: '#000000',
      lightBg: '#F8FAFC',
      category: newItemCategory,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(docRef, itemData);
      triggerNotification(`Successfully setDoc: Created theme "${newItemName}"!`);
      await logAdminAction(
        'Create Theme Preset',
        `Created theme preset "${newItemName.trim()}" (ID: ${cleanId}, Price: ${newItemPrice} CLIP, Color: ${newItemColor})`
      );
      setIsAddOpen(false);
      setNewItemId('');
      setNewItemName('');
      setNewItemSecondary('');
      setNewItemPrice(1000);
      setNewItemColor('#00C087');
      setNewItemCategory('Themes');
    } catch (err: any) {
      console.error("Add Theme Fail:", err);
      triggerNotification("Failed to create theme.");
      try {
        handleFirestoreError(err, OperationType.WRITE, `shop_items/${cleanId}`);
      } catch (e) {}
    }
  };

  // Handle Edit Price (Theme)
  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const docRef = getDocRef(selectedItem.id);
    try {
      await updateDoc(docRef, { price: Number(editPriceVal) });
      triggerNotification(`Successfully updated price for "${selectedItem.name}" to ${editPriceVal} CLIP!`);
      await logAdminAction(
        'Update Theme Price',
        `Updated price for theme preset "${selectedItem.name}" to ${editPriceVal} CLIP (ID: ${selectedItem.id})`
      );
      setIsEditPriceOpen(false);
      setSelectedItem(null);
    } catch (err: any) {
      console.error("Update Price Fail:", err);
      triggerNotification("Failed to update price.");
      try {
        handleFirestoreError(err, OperationType.UPDATE, `shop_items/${selectedItem.id}`);
      } catch (e) {}
    }
  };

  // Handle Delete Item (Theme)
  const handleDeleteItem = async (itemId: string, itemName: string) => {
    setDeleteConfirmTarget({ id: itemId, type: 'theme', name: itemName });
  };

  // Handle Add New Clip Package
  const handleAddPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = newPkgId.trim().toLowerCase().replace(/\s+/g, '_');
    if (!cleanId) {
      triggerNotification("Please provide a valid unique identifier ID.");
      return;
    }

    const docRef = getPackageDocRef(cleanId);
    const pkgData: ClipPackage = {
      id: cleanId,
      numCoins: Number(newPkgNumCoins),
      priceString: newPkgPriceString.trim(),
      region: newPkgRegion,
      isHot: newPkgIsHot,
      labelText: newPkgLabelText.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(docRef, pkgData);
      triggerNotification(`Successfully created package "${cleanId}"!`);
      await logAdminAction(
        'Create CLIP Package',
        `Created package "${newPkgNumCoins} CLIP" (ID: ${cleanId}, Price: ${newPkgPriceString.trim()}, Region: ${newPkgRegion}, Hot: ${newPkgIsHot}${newPkgLabelText.trim() ? `, Label: ${newPkgLabelText.trim()}` : ''})`
      );
      setIsAddPackageOpen(false);
      setNewPkgId('');
      setNewPkgNumCoins(200);
      setNewPkgPriceString('$1.99');
      setNewPkgRegion('USA');
      setNewPkgIsHot(false);
      setNewPkgLabelText('');
    } catch (err: any) {
      console.error("Add Package Fail:", err);
      triggerNotification("Failed to create package.");
      try {
        handleFirestoreError(err, OperationType.WRITE, `clip_packages/${cleanId}`);
      } catch (e) {}
    }
  };

  // Handle Edit Clip Package
  const handleUpdatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return;

    const docRef = getPackageDocRef(selectedPackage.id);
    try {
      await updateDoc(docRef, {
        numCoins: Number(editPkgNumCoins),
        priceString: editPkgPriceString.trim(),
        region: editPkgRegion,
        isHot: editPkgIsHot,
        labelText: editPkgLabelText.trim() || ''
      });
      triggerNotification(`Successfully updated package "${selectedPackage.id}"!`);
      await logAdminAction(
        'Update CLIP Package',
        `Updated package "${selectedPackage.id}" (Coins: ${editPkgNumCoins}, Price: ${editPkgPriceString.trim()}, Region: ${editPkgRegion}, Hot: ${editPkgIsHot}${editPkgLabelText.trim() ? `, Label: ${editPkgLabelText.trim()}` : ''})`
      );
      setIsEditPackageOpen(false);
      setSelectedPackage(null);
    } catch (err: any) {
      console.error("Update Package Fail:", err);
      triggerNotification("Failed to update package.");
      try {
        handleFirestoreError(err, OperationType.UPDATE, `clip_packages/${selectedPackage.id}`);
      } catch (e) {}
    }
  };

  // Handle Delete Clip Package
  const handleDeletePackage = async (pkgId: string) => {
    setDeleteConfirmTarget({ id: pkgId, type: 'package' });
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 overflow-hidden flex w-full h-full">
      {/* Full screen panel sliding in */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: '0' }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 360, damping: 32 }}
        style={{
          backgroundColor: themeMode === 'DARK' ? '#000000' : '#FFFFFF',
          color: themeMode === 'DARK' ? '#FFFFFF' : '#0F172A',
          borderColor: themeMode === 'DARK' ? `${selectedPreset.primaryColorHex}33` : undefined
        }}
        className="absolute inset-0 w-full h-full flex flex-col shadow-2xl overflow-hidden z-50"
      >
        {/* Full-Screen Header with Back Button in top left */}
        <div 
          style={{
            background: `linear-gradient(135deg, ${selectedPreset.primaryColorHex}E0 0%, ${themeMode === 'DARK' ? '#0a0f1d' : '#f1faf6'} 100%)`,
            borderColor: `${selectedPreset.primaryColorHex}26`
          }}
          className="px-5 pb-5 pt-12 flex items-center justify-between relative overflow-hidden shrink-0 border-b w-full"
        >
          <div className="flex items-center">
            {/* Back button top left */}
            <button 
              onClick={onClose}
              className="mr-4 w-9 h-9 rounded-full bg-black/35 hover:bg-black/55 flex items-center justify-center text-white cursor-pointer active:scale-95 transition-all border border-white/10 shrink-0"
              title="Back to App"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-white animate-pulse" />
              <div>
                <h3 className="text-sm font-black tracking-tight text-white uppercase">
                  Admin Panel
                </h3>
                <span className="text-[8.5px] font-bold text-teal-100 tracking-widest uppercase block mt-0.5">
                  Firebase Real-time Store Stream
                </span>
              </div>
            </div>
          </div>

          {/* History Button in the Top Right */}
          {(() => {
            const unseenLogsCount = logs.filter(log => {
              if (!lastViewedTimestamp) return true;
              return (log.timestamp || '') > lastViewedTimestamp;
            }).length;
            return (
              <button
                type="button"
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="w-9 h-9 rounded-full bg-black/35 hover:bg-black/55 flex items-center justify-center text-white cursor-pointer active:scale-95 transition-all border border-white/10 shrink-0 relative"
                title="Admin Logs History"
              >
                <History className="w-5 h-5" />
                {unseenLogsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-[8px] font-bold text-white px-1.5 py-0.5 rounded-full animate-bounce">
                    {unseenLogsCount}
                  </span>
                )}
              </button>
            );
          })()}
        </div>

        {/* Dual-Tab selector */}
        <div className={`flex border-b shrink-0 ${themeMode === 'DARK' ? 'bg-slate-950/40 border-slate-900' : 'bg-slate-50 border-slate-100'}`}>
          <button
            onClick={() => setActiveTab('themes')}
            className="flex-1 py-3 text-[10px] uppercase font-black tracking-widest transition-all border-b-2 flex items-center justify-center gap-2"
            style={{
              borderColor: activeTab === 'themes' ? selectedPreset.primaryColorHex : 'transparent',
              color: activeTab === 'themes' ? selectedPreset.primaryColorHex : '#64748B',
            }}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>Theme Shop Items</span>
          </button>
          <button
            onClick={() => setActiveTab('clip_packages')}
            className="flex-1 py-3 text-[10px] uppercase font-black tracking-widest transition-all border-b-2 flex items-center justify-center gap-2"
            style={{
              borderColor: activeTab === 'clip_packages' ? selectedPreset.primaryColorHex : 'transparent',
              color: activeTab === 'clip_packages' ? selectedPreset.primaryColorHex : '#64748B',
            }}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>CLIP Packages</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none relative z-10 pb-12">
          
          {/* TAB 1: THEMES */}
          {activeTab === 'themes' && (
            <div className="space-y-4 animate-fade-in">
              {/* Add Item Trigger Card */}
              <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                themeMode === 'LIGHT' ? 'bg-[#F8FAFC] border-slate-200 shadow-sm' : 'bg-slate-900/30 border-slate-850/80'
              }`}>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wide flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" style={{ color: selectedPreset.primaryColorHex }} /> Holographic Color Inventory
                  </h4>
                  <p className="text-[8.5px] text-slate-400 mt-0.5">Stream live colors, pricing structures & themes</p>
                </div>
                
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-[10px] font-black uppercase text-white tracking-wider cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${selectedPreset.primaryColorHex} 0%, ${selectedPreset.accentColorHex}E0 100%)`
                  }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Theme</span>
                </button>
              </div>

              {/* Feed Status and Items */}
              <div className="space-y-2">
                <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block pl-1 flex items-center justify-between">
                  <span>Theme Catalog Stream</span>
                  {isSandboxMode ? (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 font-bold flex items-center gap-1 border border-amber-900/35">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                      <span>SANDBOX FALLBACK</span>
                    </span>
                  ) : (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                      <span>LIVE CLOUD FEED</span>
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
                    <RefreshCw className="w-6 h-6 animate-spin" style={{ color: selectedPreset.primaryColorHex }} />
                    <span className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Loading Theme Stream...</span>
                  </div>
                ) : error ? (
                  <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-xl text-center flex flex-col items-center justify-center space-y-2">
                    <AlertTriangle className="w-7 h-7 text-red-400" />
                    <h5 className="text-[10.5px] font-black uppercase text-red-500">Connection Error</h5>
                    <p className="text-[9px] text-slate-400 leading-relaxed max-w-[220px]">{error}</p>
                  </div>
                ) : items.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-850 rounded-xl flex flex-col items-center justify-center space-y-2.5">
                    <Folder className="w-7 h-7 text-slate-500" />
                    <span className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider">Theme List is Empty</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-xl border transition-all relative overflow-hidden ${
                          themeMode === 'LIGHT' 
                            ? 'bg-slate-50 hover:bg-white border-slate-200 shadow-2xs' 
                            : 'bg-slate-900/25 border-slate-850/60 hover:bg-slate-900/40'
                        }`}
                      >
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-1" 
                          style={{ backgroundColor: item.color || selectedPreset.primaryColorHex }}
                        />

                        <div className="flex flex-col gap-3 p-0.5">
                          <div className="flex items-start space-x-3 pl-1.5 min-w-0">
                            <div 
                              className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs"
                              style={{ 
                                backgroundColor: (item.color || selectedPreset.primaryColorHex) + '15',
                                borderColor: (item.color || selectedPreset.primaryColorHex) + '40',
                                color: item.color || selectedPreset.primaryColorHex
                              }}
                            >
                              <Paintbrush className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-xs font-extrabold tracking-tight truncate ${
                                  themeMode === 'LIGHT' ? 'text-slate-800' : 'text-slate-100'
                                }`}>
                                  {item.name}
                                </span>
                                <span className="text-[8px] px-1 bg-slate-800 text-slate-400 font-mono rounded shrink-0">
                                  {item.id}
                                </span>
                              </div>
                              
                              {item.secondaryName && (
                                <span className="text-[8.5px] text-slate-400 block mt-0.5 font-bold leading-none truncate">
                                  {item.secondaryName}
                                </span>
                              )}

                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <span className="text-[9.5px] font-black text-amber-500 font-mono flex items-center gap-0.5">
                                  <Coins className="w-3.5 h-3.5 text-amber-500" /> {item.price} CLIP
                                </span>
                                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-0.5">
                                  <Folder className="w-3 h-3" /> {item.category || 'Themes'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pl-11 justify-start">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedItem(item);
                                setEditPriceVal(item.price);
                                setIsEditPriceOpen(true);
                              }}
                              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-all cursor-pointer text-[9px] font-bold uppercase tracking-wider ${
                                themeMode === 'LIGHT'
                                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
                              }`}
                              title="Edit Price"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit Price</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id, item.name)}
                              className="px-2.5 py-1 rounded-lg bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/35 flex items-center gap-1 transition-all cursor-pointer text-[9px] font-bold uppercase tracking-wider"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CLIP PACKAGES */}
          {activeTab === 'clip_packages' && (
            <div className="space-y-4 animate-fade-in">
              {/* Add Package Trigger Card with Changing Bar */}
              <div className={`p-4 rounded-xl border flex flex-col gap-3.5 transition-all ${
                themeMode === 'LIGHT' ? 'bg-[#F8FAFC] border-slate-200 shadow-sm' : 'bg-slate-900/30 border-slate-850/80'
              }`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wide flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" style={{ color: selectedPreset.primaryColorHex }} /> CLIP Premium Coins Packages
                    </h4>
                    <p className="text-[8.5px] text-slate-400 mt-0.5">Manage virtual coin packages, currency and regional divisions</p>
                  </div>
                  
                  <button
                    onClick={() => setIsAddPackageOpen(true)}
                    className="px-3.5 py-2 rounded-xl text-[10px] font-black uppercase text-white tracking-wider cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 shadow-md shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${selectedPreset.primaryColorHex} 0%, ${selectedPreset.accentColorHex}E0 100%)`
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Package</span>
                  </button>
                </div>

                {/* Regional Selection Changing Bar (positioned directly under description) */}
                <div className="border-t border-slate-200/50 dark:border-slate-800/60 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Active Division:</span>
                    <span className="text-[9px] font-extrabold text-slate-400 font-mono">[{packageRegionTab} REGION]</span>
                  </div>

                  <div className={`p-0.5 rounded-lg border flex w-full sm:max-w-[220px] ${
                    themeMode === 'LIGHT' ? 'bg-slate-100/80 border-slate-200' : 'bg-slate-950/80 border-slate-850/80'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setPackageRegionTab('USA')}
                      className="flex-1 py-1 px-2.5 text-[9px] uppercase font-black tracking-widest rounded transition-all cursor-pointer text-center"
                      style={{
                        backgroundColor: packageRegionTab === 'USA' ? selectedPreset.primaryColorHex : 'transparent',
                        color: packageRegionTab === 'USA' ? '#000000' : (themeMode === 'LIGHT' ? '#475569' : '#94A3B8'),
                      }}
                    >
                      USA (USD)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPackageRegionTab('HK')}
                      className="flex-1 py-1 px-2.5 text-[9px] uppercase font-black tracking-widest rounded transition-all cursor-pointer text-center"
                      style={{
                        backgroundColor: packageRegionTab === 'HK' ? selectedPreset.primaryColorHex : 'transparent',
                        color: packageRegionTab === 'HK' ? '#000000' : (themeMode === 'LIGHT' ? '#475569' : '#94A3B8'),
                      }}
                    >
                      HK (HKD)
                    </button>
                  </div>
                </div>
              </div>

              {/* Feed Status and Packages */}
              <div className="space-y-2">
                <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block pl-1 flex items-center justify-between">
                  <span>Packages Stream</span>
                  {isSandboxMode ? (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 font-bold flex items-center gap-1 border border-amber-900/35">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                      <span>SANDBOX FALLBACK</span>
                    </span>
                  ) : (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                      <span>LIVE CLOUD FEED</span>
                    </span>
                  )}
                </div>

                {loadingPackages ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
                    <RefreshCw className="w-6 h-6 animate-spin" style={{ color: selectedPreset.primaryColorHex }} />
                    <span className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">Loading Packages Stream...</span>
                  </div>
                ) : errorPackages ? (
                  <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-xl text-center flex flex-col items-center justify-center space-y-2">
                    <AlertTriangle className="w-7 h-7 text-red-400" />
                    <h5 className="text-[10.5px] font-black uppercase text-red-500">Connection Error</h5>
                    <p className="text-[9px] text-slate-400 leading-relaxed max-w-[220px]">{errorPackages}</p>
                  </div>
                ) : packages.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-850 rounded-xl flex flex-col items-center justify-center space-y-2.5">
                    <Folder className="w-7 h-7 text-slate-500" />
                    <span className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider">Packages List is Empty</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Page 1: USA Region packages */}
                    {packageRegionTab === 'USA' && (
                      <div className={`p-4 rounded-2xl border transition-all animate-fade-in ${
                        themeMode === 'LIGHT' 
                          ? 'bg-[#F1F5F9]/30 border-slate-200/80 shadow-2xs' 
                          : 'bg-slate-950/40 border-slate-900 shadow-2xs'
                      }`}>
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60 dark:border-slate-900">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/15">
                              <Globe className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                              <span className="text-[10.5px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-100 block">
                                USA Region (USD)
                              </span>
                              <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">
                                Domestic American Standard Plans
                              </span>
                            </div>
                          </div>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-mono uppercase tracking-wider border border-emerald-500/20">
                            {packages.filter(pkg => (pkg.region || 'USA') === 'USA').length} Packages
                          </span>
                        </div>
                        
                        {packages.filter(pkg => (pkg.region || 'USA') === 'USA').length === 0 ? (
                          <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-850 rounded-xl">
                            <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider">No USA packages found</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {packages.filter(pkg => (pkg.region || 'USA') === 'USA').map((pkg) => (
                              <div
                                key={pkg.id}
                                className={`p-3.5 rounded-xl border transition-all relative overflow-hidden ${
                                  themeMode === 'LIGHT' 
                                    ? 'bg-slate-50 hover:bg-white border-slate-200 shadow-2xs' 
                                    : 'bg-slate-900/25 border-slate-850/60 hover:bg-slate-900/40'
                                }`}
                              >
                                <div 
                                  className="absolute left-0 top-0 bottom-0 w-1" 
                                  style={{ backgroundColor: selectedPreset.primaryColorHex }}
                                />

                                <div className="flex flex-col gap-3 p-0.5">
                                  <div className="flex items-start space-x-3 pl-1.5 min-w-0">
                                    <div 
                                      className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs"
                                      style={{ 
                                        backgroundColor: `${selectedPreset.primaryColorHex}15`,
                                        borderColor: `${selectedPreset.primaryColorHex}40`,
                                        color: selectedPreset.primaryColorHex
                                      }}
                                    >
                                      <Coins className="w-4 h-4" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={`text-xs font-extrabold tracking-tight truncate ${
                                          themeMode === 'LIGHT' ? 'text-slate-800' : 'text-slate-100'
                                        }`}>
                                          +{pkg.numCoins} CLIP Coins
                                        </span>
                                        <span className="text-[8px] px-1 bg-slate-800 text-slate-400 font-mono rounded shrink-0">
                                          {pkg.id}
                                        </span>
                                        {pkg.isHot && (
                                          <span className="text-[6.5px] bg-red-500 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                                            HOT
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                                        <span className="text-[9.5px] font-black text-amber-500 font-mono flex items-center gap-0.5">
                                          Price: {pkg.priceString}
                                        </span>
                                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-0.5">
                                          <Globe className="w-3 h-3" /> USD Division
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 pl-11 justify-start">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedPackage(pkg);
                                        setEditPkgNumCoins(pkg.numCoins);
                                        setEditPkgPriceString(pkg.priceString);
                                        setEditPkgRegion(pkg.region);
                                        setEditPkgIsHot(pkg.isHot);
                                        setEditPkgLabelText(pkg.labelText || '');
                                        setIsEditPackageOpen(true);
                                      }}
                                      className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-all cursor-pointer text-[9px] font-bold uppercase tracking-wider ${
                                        themeMode === 'LIGHT'
                                          ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                                          : 'bg-slate-900 hover:bg-slate-850 border-slate-800/80 text-slate-400 hover:text-white'
                                      }`}
                                      title="Edit Price"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      <span>Edit Price</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeletePackage(pkg.id)}
                                      className="px-2.5 py-1 rounded-lg bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/35 flex items-center gap-1 transition-all cursor-pointer text-[9px] font-bold uppercase tracking-wider"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Page 2: Hong Kong Region packages */}
                    {packageRegionTab === 'HK' && (
                      <div className={`p-4 rounded-2xl border transition-all animate-fade-in ${
                        themeMode === 'LIGHT' 
                          ? 'bg-[#F1F5F9]/30 border-slate-200/80 shadow-2xs' 
                          : 'bg-slate-950/40 border-slate-900 shadow-2xs'
                      }`}>
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60 dark:border-slate-900">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/15">
                              <Globe className="w-4 h-4 text-teal-500" />
                            </div>
                            <div>
                              <span className="text-[10.5px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-100 block">
                                Hong Kong Region (HKD)
                              </span>
                              <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">
                                HK$ Denominated Regional Plans
                              </span>
                            </div>
                          </div>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded bg-teal-500/10 text-teal-500 font-mono uppercase tracking-wider border border-teal-500/20">
                            {packages.filter(pkg => pkg.region === 'HK').length} Packages
                          </span>
                        </div>

                        {packages.filter(pkg => pkg.region === 'HK').length === 0 ? (
                          <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-850 rounded-xl">
                            <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider">No HK packages found</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {packages.filter(pkg => pkg.region === 'HK').map((pkg) => (
                              <div
                                key={pkg.id}
                                className={`p-3.5 rounded-xl border transition-all relative overflow-hidden ${
                                  themeMode === 'LIGHT' 
                                    ? 'bg-slate-50 hover:bg-white border-slate-200 shadow-2xs' 
                                    : 'bg-slate-900/25 border-slate-850/60 hover:bg-slate-900/40'
                                }`}
                              >
                                <div 
                                  className="absolute left-0 top-0 bottom-0 w-1" 
                                  style={{ backgroundColor: selectedPreset.primaryColorHex }}
                                />

                                <div className="flex flex-col gap-3 p-0.5">
                                  <div className="flex items-start space-x-3 pl-1.5 min-w-0">
                                    <div 
                                      className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs"
                                      style={{ 
                                        backgroundColor: `${selectedPreset.primaryColorHex}15`,
                                        borderColor: `${selectedPreset.primaryColorHex}40`,
                                        color: selectedPreset.primaryColorHex
                                      }}
                                    >
                                      <Coins className="w-4 h-4" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={`text-xs font-extrabold tracking-tight truncate ${
                                          themeMode === 'LIGHT' ? 'text-slate-800' : 'text-slate-100'
                                        }`}>
                                          +{pkg.numCoins} CLIP Coins
                                        </span>
                                        <span className="text-[8px] px-1 bg-slate-800 text-slate-400 font-mono rounded shrink-0">
                                          {pkg.id}
                                        </span>
                                        {pkg.isHot && (
                                          <span className="text-[6.5px] bg-red-500 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                                            HOT
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                                        <span className="text-[9.5px] font-black text-amber-500 font-mono flex items-center gap-0.5">
                                          Price: {pkg.priceString}
                                        </span>
                                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-0.5">
                                          <Globe className="w-3 h-3" /> HKD Division
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 pl-11 justify-start">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedPackage(pkg);
                                        setEditPkgNumCoins(pkg.numCoins);
                                        setEditPkgPriceString(pkg.priceString);
                                        setEditPkgRegion(pkg.region);
                                        setEditPkgIsHot(pkg.isHot);
                                        setEditPkgLabelText(pkg.labelText || '');
                                        setIsEditPackageOpen(true);
                                      }}
                                      className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-all cursor-pointer text-[9px] font-bold uppercase tracking-wider ${
                                        themeMode === 'LIGHT'
                                          ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                                          : 'bg-slate-900 hover:bg-slate-850 border-slate-800/80 text-slate-400 hover:text-white'
                                      }`}
                                      title="Edit Price"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      <span>Edit Price</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeletePackage(pkg.id)}
                                      className="px-2.5 py-1 rounded-lg bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/35 flex items-center gap-1 transition-all cursor-pointer text-[9px] font-bold uppercase tracking-wider"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Dynamic Modals / Dialog Overlays */}
        <AnimatePresence>
          {/* 1. Add Theme Modal */}
          {isAddOpen && (
            <div className="absolute inset-0 z-55 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddOpen(false)}
                className="absolute inset-0 bg-black/85 backdrop-blur-[1px] cursor-pointer"
              />

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`w-full max-w-sm rounded-2xl p-5 border shadow-2xl relative z-10 text-left ${
                  themeMode === 'LIGHT' ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0F172A] border-slate-800 text-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Paintbrush className="w-4 h-4 text-emerald-400" /> Create Theme Card
                  </h4>
                  <button onClick={() => setIsAddOpen(false)} className="p-1 hover:bg-slate-800/10 rounded-full cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddItem} className="space-y-3 text-xs">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Unique Identifier Key (ID)</label>
                    <input 
                      type="text" 
                      value={newItemId}
                      onChange={(e) => setNewItemId(e.target.value)}
                      placeholder="e.g. orange_blast"
                      className="w-full bg-transparent border border-slate-700 rounded-lg p-2 text-xs outline-none"
                      style={{
                        backgroundColor: themeMode === 'DARK' ? '#000000' : '#FFFFFF',
                        color: themeMode === 'DARK' ? '#FFFFFF' : '#000000',
                        borderColor: themeMode === 'DARK' ? '#1E293B' : '#CBD5E1'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Theme Display Name</label>
                    <input 
                      type="text" 
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="e.g. Amber Orange"
                      className="w-full bg-transparent border border-slate-700 rounded-lg p-2 text-xs outline-none"
                      style={{
                        backgroundColor: themeMode === 'DARK' ? '#000000' : '#FFFFFF',
                        color: themeMode === 'DARK' ? '#FFFFFF' : '#000000',
                        borderColor: themeMode === 'DARK' ? '#1E293B' : '#CBD5E1'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Subtitle / Description</label>
                    <input 
                      type="text" 
                      value={newItemSecondary}
                      onChange={(e) => setNewItemSecondary(e.target.value)}
                      placeholder="e.g. Vivid Holographic Sun"
                      className="w-full bg-transparent border border-slate-700 rounded-lg p-2 text-xs outline-none"
                      style={{
                        backgroundColor: themeMode === 'DARK' ? '#000000' : '#FFFFFF',
                        color: themeMode === 'DARK' ? '#FFFFFF' : '#000000',
                        borderColor: themeMode === 'DARK' ? '#1E293B' : '#CBD5E1'
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Price (CLIP Coins)</label>
                      <input 
                        type="number" 
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(Number(e.target.value))}
                        className="w-full bg-transparent border border-slate-700 rounded-lg p-2 text-xs outline-none font-mono"
                        style={{
                          backgroundColor: themeMode === 'DARK' ? '#000000' : '#FFFFFF',
                          color: themeMode === 'DARK' ? '#FFFFFF' : '#000000',
                          borderColor: themeMode === 'DARK' ? '#1E293B' : '#CBD5E1'
                        }}
                        required
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Hex Color</label>
                      <div className="flex items-center space-x-1.5">
                        <input 
                          type="color" 
                          value={newItemColor}
                          onChange={(e) => setNewItemColor(e.target.value)}
                          className="w-8 h-8 rounded border-0 p-0 cursor-pointer outline-none bg-transparent shrink-0"
                        />
                        <input 
                          type="text" 
                          value={newItemColor}
                          onChange={(e) => setNewItemColor(e.target.value)}
                          className="w-full bg-transparent border border-slate-700 rounded-lg p-1.5 text-[10px] outline-none font-mono"
                          style={{
                            backgroundColor: themeMode === 'DARK' ? '#000000' : '#FFFFFF',
                            color: themeMode === 'DARK' ? '#FFFFFF' : '#000000',
                            borderColor: themeMode === 'DARK' ? '#1E293B' : '#CBD5E1'
                          }}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsAddOpen(false)}
                      className="flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl text-white cursor-pointer shadow-md"
                      style={{
                        background: `linear-gradient(135deg, ${selectedPreset.primaryColorHex} 0%, ${selectedPreset.accentColorHex}E0 100%)`
                      }}
                    >
                      Save Theme
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* 2. Edit Theme Price Modal */}
          {isEditPriceOpen && selectedItem && (
            <div className="absolute inset-0 z-55 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setIsEditPriceOpen(false);
                  setSelectedItem(null);
                }}
                className="absolute inset-0 bg-black/85 backdrop-blur-[1px] cursor-pointer"
              />

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`w-full max-w-sm rounded-2xl p-5 border shadow-2xl relative z-10 text-left ${
                  themeMode === 'LIGHT' ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0F172A] border-slate-800 text-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-500" /> Edit Theme Price
                  </h4>
                  <button 
                    onClick={() => {
                      setIsEditPriceOpen(false);
                      setSelectedItem(null);
                    }} 
                    className="p-1 hover:bg-slate-800/10 rounded-full cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-4">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Target Document</span>
                  <span className="text-xs font-extrabold">{selectedItem.name} ({selectedItem.id})</span>
                </div>

                <form onSubmit={handleUpdatePrice} className="space-y-4">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">New Price (CLIP Coins)</label>
                    <div className="relative">
                      <Coins className="w-4 h-4 text-amber-500 absolute left-2.5 top-2 animate-pulse" />
                      <input 
                        type="number" 
                        value={editPriceVal}
                        onChange={(e) => setEditPriceVal(Number(e.target.value))}
                        className="w-full bg-slate-905 border border-slate-705 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 outline-none font-mono"
                        style={{
                          backgroundColor: themeMode === 'DARK' ? '#000000' : '#FFFFFF',
                          color: themeMode === 'DARK' ? '#FFFFFF' : '#000000',
                          borderColor: themeMode === 'DARK' ? '#1E293B' : '#CBD5E1'
                        }}
                        required
                        min="0"
                      />
                    </div>
                  </div>

                   <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditPriceOpen(false);
                        setSelectedItem(null);
                      }}
                      className="flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                      style={{
                        borderColor: themeMode === 'LIGHT' ? '#E2E8F0' : '#1E293B'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl text-white cursor-pointer shadow-md"
                      style={{
                        background: `linear-gradient(135deg, ${selectedPreset.primaryColorHex} 0%, ${selectedPreset.accentColorHex}E0 100%)`
                      }}
                    >
                      Update Price
                    </button>
                  </div>

                  <div className="border-t border-slate-200/50 dark:border-slate-800/80 my-3 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditPriceOpen(false);
                        handleDeleteItem(selectedItem!.id, selectedItem!.name);
                        setSelectedItem(null);
                      }}
                      className="w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-900/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete This Theme</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* 3. Add Package Modal */}
          {isAddPackageOpen && (
            <div className="absolute inset-0 z-55 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddPackageOpen(false)}
                className="absolute inset-0 bg-black/85 backdrop-blur-[1px] cursor-pointer"
              />

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`w-full max-w-sm rounded-2xl p-5 border shadow-2xl relative z-10 text-left ${
                  themeMode === 'LIGHT' ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0F172A] border-slate-800 text-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-emerald-400 animate-pulse" /> Add CLIP Package
                  </h4>
                  <button onClick={() => setIsAddPackageOpen(false)} className="p-1 hover:bg-slate-800/10 rounded-full cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddPackage} className="space-y-3 text-xs">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Unique Package ID</label>
                    <input 
                      type="text" 
                      value={newPkgId}
                      onChange={(e) => setNewPkgId(e.target.value)}
                      placeholder="e.g. usa_200"
                      className="w-full bg-transparent border border-slate-700 rounded-lg p-2 text-xs outline-none"
                      style={{
                        backgroundColor: themeMode === 'DARK' ? '#000000' : '#FFFFFF',
                        color: themeMode === 'DARK' ? '#FFFFFF' : '#000000',
                        borderColor: themeMode === 'DARK' ? '#1E293B' : '#CBD5E1'
                      }}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">CLIP Coins Amount</label>
                      <input 
                        type="number" 
                        value={newPkgNumCoins}
                        onChange={(e) => setNewPkgNumCoins(Number(e.target.value))}
                        className="w-full bg-transparent border border-slate-700 rounded-lg p-2 text-xs outline-none font-mono"
                        style={{
                          backgroundColor: themeMode === 'DARK' ? '#000000' : '#FFFFFF',
                          color: themeMode === 'DARK' ? '#FFFFFF' : '#000000',
                          borderColor: themeMode === 'DARK' ? '#1E293B' : '#CBD5E1'
                        }}
                        required
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Price String</label>
                      <input 
                        type="text" 
                        value={newPkgPriceString}
                        onChange={(e) => setNewPkgPriceString(e.target.value)}
                        placeholder="e.g. $1.99"
                        className="w-full bg-transparent border border-slate-700 rounded-lg p-2 text-xs outline-none font-mono"
                        style={{
                          backgroundColor: themeMode === 'DARK' ? '#000000' : '#FFFFFF',
                          color: themeMode === 'DARK' ? '#FFFFFF' : '#000000',
                          borderColor: themeMode === 'DARK' ? '#1E293B' : '#CBD5E1'
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Region / Division</label>
                      <select
                        value={newPkgRegion}
                        onChange={(e) => setNewPkgRegion(e.target.value as 'USA' | 'HK')}
                        className="w-full bg-transparent border border-slate-700 rounded-lg p-2 text-xs outline-none font-sans"
                        style={{
                          backgroundColor: themeMode === 'DARK' ? '#000000' : '#FFFFFF',
                          color: themeMode === 'DARK' ? '#FFFFFF' : '#000000',
                          borderColor: themeMode === 'DARK' ? '#1E293B' : '#CBD5E1'
                        }}
                      >
                        <option value="USA">USA Store (USD)</option>
                        <option value="HK">HK Store (HKD)</option>
                      </select>
                    </div>
                    <div className="flex flex-col justify-end pb-1.5">
                      <label className="flex items-center space-x-2 cursor-pointer select-none py-1.5 px-2.5 rounded-lg border border-transparent hover:bg-slate-800/10">
                        <input 
                          type="checkbox" 
                          checked={newPkgIsHot}
                          onChange={(e) => setNewPkgIsHot(e.target.checked)}
                          className="w-4.5 h-4.5 accent-teal-500 rounded cursor-pointer"
                        />
                        <span className="text-[10px] uppercase font-black text-slate-400">HOT Badge</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Promo Label Text (Glow up)</label>
                    <input 
                      type="text" 
                      value={newPkgLabelText}
                      onChange={(e) => setNewPkgLabelText(e.target.value)}
                      placeholder="e.g. 4$ 95%"
                      className="w-full bg-transparent border border-slate-700 rounded-lg p-2 text-xs outline-none font-mono"
                      style={{
                        backgroundColor: themeMode === 'DARK' ? '#000000' : '#FFFFFF',
                        color: themeMode === 'DARK' ? '#FFFFFF' : '#000000',
                        borderColor: themeMode === 'DARK' ? '#1E293B' : '#CBD5E1'
                      }}
                    />
                    <span className="text-[7.5px] text-slate-500 mt-1 block">Appears over CLIP logo when clicked/selected in store</span>
                  </div>

                  <div className="flex items-center space-x-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsAddPackageOpen(false)}
                      className="flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl text-white cursor-pointer shadow-md"
                      style={{
                        background: `linear-gradient(135deg, ${selectedPreset.primaryColorHex} 0%, ${selectedPreset.accentColorHex}E0 100%)`
                      }}
                    >
                      Save Package
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* 4. Edit Package Modal */}
          {isEditPackageOpen && selectedPackage && (
            <div className="absolute inset-0 z-55 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setIsEditPackageOpen(false);
                  setSelectedPackage(null);
                }}
                className="absolute inset-0 bg-black/85 backdrop-blur-[1px] cursor-pointer"
              />

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`w-full max-w-sm rounded-2xl p-5 border shadow-2xl relative z-10 text-left ${
                  themeMode === 'LIGHT' ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0F172A] border-slate-800 text-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Edit2 className="w-4 h-4 text-teal-400" /> Edit CLIP Package
                  </h4>
                  <button 
                    onClick={() => {
                      setIsEditPackageOpen(false);
                      setSelectedPackage(null);
                    }} 
                    className="p-1 hover:bg-slate-800/10 rounded-full cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-4">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Target Package</span>
                  <span className="text-xs font-extrabold">{selectedPackage.id}</span>
                </div>

                <form onSubmit={handleUpdatePackage} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">CLIP Coins Amount</label>
                      <input 
                        type="number" 
                        value={editPkgNumCoins}
                        onChange={(e) => setEditPkgNumCoins(Number(e.target.value))}
                        className="w-full bg-transparent border border-slate-700 rounded-lg p-2 text-xs outline-none font-mono"
                        style={{
                          backgroundColor: themeMode === 'DARK' ? '#000000' : '#FFFFFF',
                          color: themeMode === 'DARK' ? '#FFFFFF' : '#000000',
                          borderColor: themeMode === 'DARK' ? '#1E293B' : '#CBD5E1'
                        }}
                        required
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Price String</label>
                      <input 
                        type="text" 
                        value={editPkgPriceString}
                        onChange={(e) => setEditPkgPriceString(e.target.value)}
                        className="w-full bg-transparent border border-slate-700 rounded-lg p-2 text-xs outline-none font-mono"
                        style={{
                          backgroundColor: themeMode === 'DARK' ? '#000000' : '#FFFFFF',
                          color: themeMode === 'DARK' ? '#FFFFFF' : '#000000',
                          borderColor: themeMode === 'DARK' ? '#1E293B' : '#CBD5E1'
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Region / Division</label>
                      <select
                        value={editPkgRegion}
                        onChange={(e) => setEditPkgRegion(e.target.value as 'USA' | 'HK')}
                        className="w-full bg-transparent border border-slate-700 rounded-lg p-2 text-xs outline-none font-sans"
                        style={{
                          backgroundColor: themeMode === 'DARK' ? '#000000' : '#FFFFFF',
                          color: themeMode === 'DARK' ? '#FFFFFF' : '#000000',
                          borderColor: themeMode === 'DARK' ? '#1E293B' : '#CBD5E1'
                        }}
                      >
                        <option value="USA">USA Store (USD)</option>
                        <option value="HK">HK Store (HKD)</option>
                      </select>
                    </div>
                    <div className="flex flex-col justify-end pb-1.5">
                      <label className="flex items-center space-x-2 cursor-pointer select-none py-1.5 px-2.5 rounded-lg border border-transparent hover:bg-slate-800/10">
                        <input 
                          type="checkbox" 
                          checked={editPkgIsHot}
                          onChange={(e) => setEditPkgIsHot(e.target.checked)}
                          className="w-4.5 h-4.5 accent-teal-500 rounded cursor-pointer"
                        />
                        <span className="text-[10px] uppercase font-black text-slate-400">HOT Badge</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Promo Label Text (Glow up)</label>
                    <input 
                      type="text" 
                      value={editPkgLabelText}
                      onChange={(e) => setEditPkgLabelText(e.target.value)}
                      placeholder="e.g. 4$ 95%"
                      className="w-full bg-transparent border border-slate-700 rounded-lg p-2 text-xs outline-none font-mono"
                      style={{
                        backgroundColor: themeMode === 'DARK' ? '#000000' : '#FFFFFF',
                        color: themeMode === 'DARK' ? '#FFFFFF' : '#000000',
                        borderColor: themeMode === 'DARK' ? '#1E293B' : '#CBD5E1'
                      }}
                    />
                    <span className="text-[7.5px] text-slate-500 mt-1 block">Appears over CLIP logo when clicked/selected in store</span>
                  </div>

                  <div className="flex items-center space-x-2 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditPackageOpen(false);
                        setSelectedPackage(null);
                      }}
                      className="flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                      style={{
                        borderColor: themeMode === 'LIGHT' ? '#E2E8F0' : '#1E293B'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl text-white cursor-pointer shadow-md"
                      style={{
                        background: `linear-gradient(135deg, ${selectedPreset.primaryColorHex} 0%, ${selectedPreset.accentColorHex}E0 100%)`
                      }}
                    >
                      Update Package
                    </button>
                  </div>

                  <div className="border-t border-slate-200/50 dark:border-slate-800/80 my-3 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditPackageOpen(false);
                        handleDeletePackage(selectedPackage.id);
                        setSelectedPackage(null);
                      }}
                      className="w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-900/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete This Package</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* 5. Custom Deletion Confirmation Modal */}
          {deleteConfirmTarget && (
            <div className="absolute inset-0 z-60 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDeleteConfirmTarget(null)}
                className="absolute inset-0 bg-black/85 backdrop-blur-[1.5px] cursor-pointer"
              />

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`w-full max-w-sm rounded-2xl p-6 border shadow-2xl relative z-10 text-left ${
                  themeMode === 'LIGHT' ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0F172A] border-slate-800 text-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3 text-red-500 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider">Confirm Delete Operation</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Action is permanent</p>
                  </div>
                </div>

                <div className={`p-4 rounded-xl mb-4 border ${
                  themeMode === 'LIGHT' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-900'
                }`}>
                  <p className="text-xs leading-relaxed text-slate-400 font-medium">
                    Are you sure you want to delete the following {deleteConfirmTarget.type === 'package' ? 'clip package' : 'theme shop item'}?
                  </p>
                  <div className="mt-2.5 font-mono text-xs font-extrabold flex items-center gap-1.5">
                    <span className="text-amber-500">[{deleteConfirmTarget.id}]</span>
                    {deleteConfirmTarget.name && (
                      <span className="text-slate-500 dark:text-slate-300">- {deleteConfirmTarget.name}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmTarget(null)}
                    className="flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-slate-700/60 text-slate-400 hover:text-white transition-all cursor-pointer text-center"
                    style={{
                      borderColor: themeMode === 'LIGHT' ? '#E2E8F0' : '#1E293B'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const { id, type } = deleteConfirmTarget;
                      setDeleteConfirmTarget(null);
                      if (type === 'package') {
                        const docRef = getPackageDocRef(id);
                        try {
                          await deleteDoc(docRef);
                          triggerNotification(`Successfully deleted package "${id}"!`);
                          await logAdminAction(
                            'DELETE_PACKAGE',
                            `Deleted Clip Package: ${id}`
                          );
                        } catch (err: any) {
                          console.error("Delete Package Fail:", err);
                          triggerNotification("Failed to delete package.");
                          try {
                            handleFirestoreError(err, OperationType.DELETE, `clip_packages/${id}`);
                          } catch (e) {}
                        }
                      } else {
                        const docRef = getDocRef(id);
                        try {
                          await deleteDoc(docRef);
                          triggerNotification(`Successfully deleted theme "${id}"!`);
                          await logAdminAction(
                            'DELETE_THEME',
                            `Deleted Theme Shop Item: ${id}`
                          );
                        } catch (err: any) {
                          console.error("Delete Theme Fail:", err);
                          triggerNotification("Failed to delete theme.");
                          try {
                            handleFirestoreError(err, OperationType.DELETE, `shop_items/${id}`);
                          } catch (e) {}
                        }
                      }
                    }}
                    className="flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white transition-all cursor-pointer text-center shadow-md shadow-red-950/20"
                  >
                    Yes, Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Admin Panel History Sidebar/Drawer */}
          {isHistoryOpen && (
            <div className="absolute inset-0 z-50 flex justify-end">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsHistoryOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-[1px] cursor-pointer"
              />

              {/* Drawer panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: '0' }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                className={`w-full max-w-sm h-full flex flex-col relative z-10 border-l relative ${
                  themeMode === 'DARK' ? 'bg-[#0b0f19] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-950'
                }`}
              >
                {/* Header */}
                <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
                  themeMode === 'DARK' ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <History className="w-4 h-4" style={{ color: selectedPreset.primaryColorHex }} />
                    <span className="text-xs font-black tracking-widest uppercase">Admin Action History</span>
                  </div>
                  <button
                    onClick={() => setIsHistoryOpen(false)}
                    className="w-7 h-7 rounded-full bg-slate-800/10 dark:bg-white/10 hover:bg-slate-800/20 dark:hover:bg-white/20 flex items-center justify-center cursor-pointer active:scale-95 transition-all text-current"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Subtitle / explanation */}
                <div className={`px-4 py-2 text-[9px] uppercase tracking-wide border-b leading-relaxed ${
                  themeMode === 'DARK' ? 'bg-slate-950 text-slate-400 border-slate-900' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  Stored in <span className="font-mono text-amber-500">Firestore: admin_logs</span>
                </div>

                {/* Log List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-60 py-10">
                      <Clock className="w-8 h-8 mb-2 animate-pulse" />
                      <p className="text-xs font-bold uppercase tracking-wider">No Admin Actions Logged Yet</p>
                      <p className="text-[9.5px] text-slate-400 mt-1 max-w-[200px] leading-normal">
                        Changes to themes and clip packages will appear here in real-time.
                      </p>
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div 
                        key={log.id} 
                        className={`p-3 rounded-xl border text-left flex flex-col space-y-1.5 transition-all ${
                          themeMode === 'DARK' 
                            ? 'bg-slate-900/30 border-slate-800 hover:border-slate-700/80' 
                            : 'bg-[#F8FAFC] border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Action Header */}
                        <div className="flex justify-between items-start">
                          <span 
                            className="text-[9.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                            style={{ 
                              backgroundColor: `${selectedPreset.primaryColorHex}12`,
                              color: selectedPreset.primaryColorHex 
                            }}
                          >
                            {log.action}
                          </span>
                          <span className="text-[8.5px] font-mono text-slate-400">
                            {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A'}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="text-xs leading-relaxed font-semibold break-words text-slate-300 dark:text-slate-100 font-sans">
                          {log.details}
                        </div>

                        {/* Admin info & date footer */}
                        <div className="flex flex-col space-y-0.5 pt-1 border-t border-dashed border-slate-800/80">
                          <div className="flex items-center justify-between text-[8.5px]">
                            <span className="text-slate-400 uppercase tracking-wider font-bold">Admin:</span>
                            <span className="font-mono text-teal-400 break-all max-w-[200px] text-right font-extrabold">{log.adminId}</span>
                          </div>
                          <div className="flex items-center justify-between text-[8.5px] text-slate-400">
                            <span className="uppercase tracking-wider font-bold">When:</span>
                            <span className="font-mono text-slate-300">
                              {log.timestamp ? new Date(log.timestamp).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
