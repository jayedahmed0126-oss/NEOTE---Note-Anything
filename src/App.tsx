import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Moon, 
  Sun, 
  Sparkles, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Facebook, 
  MessageSquare, 
  Home as HomeIcon, 
  ShoppingBag, 
  Settings as SettingsIcon, 
  Coins, 
  User, 
  ChevronRight, 
  CheckCircle2, 
  RefreshCw, 
  FileCode, 
  Download,
  Flame,
  Info,
  LogOut,
  Shield,
  FileText,
  CreditCard,
  ArrowLeft,
  History,
  Gem,
  Pencil,
  Lock,
  Menu,
  Mail,
  Phone,
  MapPin,
  Globe,
  Laptop,
  Tablet,
  Camera,
  X,
  AlertTriangle,
  Pin,
  WifiOff,
  Wifi
} from 'lucide-react';
import { Note, ActiveScreen, ThemeMode, UserAccount, FlutterCodePreset, DeviceSession } from './types';
import LoginScreen from './components/LoginScreen';
import SplashScreen from './components/SplashScreen';
import PremiumPaperclipIcon from './components/PremiumPaperclipIcon';
import AdminPanel from './components/AdminPanel';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType, onAuthStateChanged, signOut, User as FirebaseUser, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc, collection, query, where, getDocFromServer, changeUserPassword, deleteUserAccount, onSnapshot } from './lib/firebase';

const getInitials = (name: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  }
  return parts[0].slice(0, 2).toUpperCase();
};
import { 
  getFlutterMainCode, 
  getFlutterThemeCode, 
  getFlutterNotesDashboardCode, 
  getFlutterNoteEditorCode 
} from './utils/flutterCodeTemplates';

// Preset color combinations inspired by Gate.io and user requirements, all built around #00C087
const COLOR_PRESETS = [
  {
    name: 'Pure Green',
    primary: '#00C087', // Vibrant Green Primary
    accent: '#00C087',  // Vibrant Green Accent
    darkBg: '#000000',  // Pure black dark theme background
    lightBg: '#F8FAFC',
  },
  {
    name: 'Mint Cyber',
    primary: '#008F63', // Darker Mint Blue-Green
    accent: '#10B981',  // Emerald Highlight
    darkBg: '#000000',  // Guard pure black
    lightBg: '#E6F9F3',
  },
  {
    name: 'Sea Emerald',
    primary: '#053A2E', // Rich Deep Forest
    accent: '#00C087',  // Vibrant Green Highlight
    darkBg: '#000000',  // Guard pure black
    lightBg: '#F0FDF4',
  },
  {
    name: 'Pure Emerald',
    primary: '#00C087', // Uniform high visibility
    accent: '#00C087',  
    darkBg: '#000000',  // Guard pure black
    lightBg: '#F4FCF9',
  }
];

// 4 custom color themes for purchase as requested by user
const SHOP_THEMES = [
  {
    id: 'lime',
    name: 'Green Theme',
    secondaryName: 'Emerald Green',
    color: '#00C087',
    primary: '#00C087',
    accent: '#00C087',
    price: 0,
    darkBg: '#000000',
    lightBg: '#F8FAFC',
  },
  {
    id: 'violet',
    name: 'Violet Theme',
    secondaryName: 'Hyper Violet',
    color: '#9D00FF',
    primary: '#9D00FF',
    accent: '#9D00FF',
    price: 2500,
    darkBg: '#000000',
    lightBg: '#FAF5FF',
  },
  {
    id: 'green_cyan',
    name: 'Blue Theme',
    secondaryName: 'Cyber Aqua Blue',
    color: '#00F5FF',
    primary: '#00F5FF',
    accent: '#00F5FF',
    price: 5000,
    darkBg: '#000000',
    lightBg: '#F0FDFF',
  },
  {
    id: 'red',
    name: 'Red Theme',
    secondaryName: 'Electric Neon Red',
    color: '#FF0055',
    primary: '#FF0055',
    accent: '#FF0055',
    price: 10000,
    darkBg: '#000000',
    lightBg: '#FFF5F7',
  }
];

function generateUniqueIdCode(emailOrPhone?: string): string {
  const cleanId = (emailOrPhone || '').trim().toLowerCase();
  if (cleanId) {
    let hash = 0;
    for (let i = 0; i < cleanId.length; i++) {
      hash = (hash << 5) - hash + cleanId.charCodeAt(i);
      hash |= 0;
    }
    hash = Math.abs(hash);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '#';
    let tempHash = hash;
    for (let i = 0; i < 7; i++) {
      result += chars.charAt(tempHash % chars.length);
      tempHash = Math.floor(tempHash / chars.length) || (hash + i + 19);
    }
    return result;
  }

  // Fallback
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '#';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function App() {
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [firebaseLoading, setFirebaseLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [showGlobalSplash, setShowGlobalSplash] = useState(true);
  const [globalSplashDuration, setGlobalSplashDuration] = useState(2550);
  const [isThemeChangeSplash, setIsThemeChangeSplash] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [simulatedOffline, setSimulatedOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Computed connection status
  const isCurrentlyOnline = isOnline && !simulatedOffline;

  // Emulator settings
  const [themeMode, setThemeMode] = useState<ThemeMode>(ThemeMode.DARK);
  const [userAccount, setUserAccount] = useState<UserAccount>(() => {
    const stored = localStorage.getItem('user_account_profile');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        let emailVal = parsed.email || '';
        let phoneVal = parsed.phone || '';
        if (emailVal === 'N/A') emailVal = '';
        if (phoneVal === 'N/A') phoneVal = '';
        return {
          name: parsed.name || 'User Account',
          avatarUrl: parsed.avatarUrl || '',
          premiumCoins: typeof parsed.premiumCoins === 'number' ? parsed.premiumCoins : 0,
          phone: phoneVal,
          email: emailVal,
          country: parsed.country || 'Bangladesh',
          idCode: generateUniqueIdCode(emailVal || phoneVal),
          role: parsed.role || 'user'
        };
      } catch (e) {
        // Fallback
      }
    }
    return {
      name: 'User Account',
      avatarUrl: '',
      premiumCoins: 0,
      phone: '',
      email: '',
      country: 'Bangladesh',
      idCode: generateUniqueIdCode(),
      role: 'user'
    };
  });

  const [hasInitialProfileLoaded, setHasInitialProfileLoaded] = useState(false);

  useEffect(() => {
    localStorage.setItem('user_account_profile', JSON.stringify(userAccount));
    if (currentUser && hasInitialProfileLoaded) {
      setDoc(doc(db, 'users', currentUser.uid), {
        name: userAccount.name,
        avatarUrl: userAccount.avatarUrl || '',
        premiumCoins: userAccount.premiumCoins,
        phone: userAccount.phone || '',
        email: userAccount.email || '',
        country: userAccount.country || '',
        idCode: userAccount.idCode || '',
        role: userAccount.role || 'user'
      }, { merge: true }).catch(err => {
        console.warn("Could not save user profile to firestore", err);
        setFirebaseError(err instanceof Error ? err.message : String(err));
      });
    }
  }, [userAccount, currentUser, hasInitialProfileLoaded]);

  // Selected preset colors
  const [selectedPreset, setSelectedPreset] = useState<FlutterCodePreset>(() => {
    const stored = localStorage.getItem('neote_selected_preset');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return {
      primaryColorHex: '#00C087',
      accentColorHex: '#00C087',
      darkBgColorHex: '#000000',
      lightBgColorHex: '#F8FAFC',
    };
  });

  useEffect(() => {
    localStorage.setItem('neote_selected_preset', JSON.stringify(selectedPreset));
    if (currentUser && hasInitialProfileLoaded) {
      setDoc(doc(db, 'users', currentUser.uid), {
        selectedPreset: selectedPreset
      }, { merge: true }).catch(err => {
        console.warn("Could not save selected preset to firestore", err);
        setFirebaseError(err instanceof Error ? err.message : String(err));
      });
    }
  }, [selectedPreset, currentUser, hasInitialProfileLoaded]);

  // Owned color themes for purchase as requested
  const [ownedThemes, setOwnedThemes] = useState<string[]>(() => {
    const stored = localStorage.getItem('neote_owned_themes');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Always ensure default lime green color is owned
          if (!parsed.includes('#00C087')) {
            parsed.push('#00C087');
          }
          return parsed;
        }
      } catch (e) {}
    }
    return ['#00C087'];
  });

  useEffect(() => {
    localStorage.setItem('neote_owned_themes', JSON.stringify(ownedThemes));
    if (currentUser && hasInitialProfileLoaded) {
      setDoc(doc(db, 'users', currentUser.uid), {
        ownedThemes: ownedThemes
      }, { merge: true }).catch(err => {
        console.warn("Could not save owned themes to firestore", err);
        setFirebaseError(err instanceof Error ? err.message : String(err));
      });
    }
  }, [ownedThemes, currentUser, hasInitialProfileLoaded]);

  // Notes data (persisted in localStorage)
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditorActive, setIsEditorActive] = useState(false);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [isEditingNoteInline, setIsEditingNoteInline] = useState(false);
  const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserAccount>(userAccount);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);

  // Dynamic collections streamed from Firestore with fallback to defaults
  const [dynamicShopThemes, setDynamicShopThemes] = useState<any[]>(SHOP_THEMES);
  const [dynamicClipPackages, setDynamicClipPackages] = useState<any[]>(() => [
    { id: 'usa_100', numCoins: 100, priceString: '$1.00', region: 'USA', isHot: false },
    { id: 'usa_500', numCoins: 500, priceString: '$4.99', region: 'USA', isHot: true },
    { id: 'usa_1200', numCoins: 1200, priceString: '$9.99', region: 'USA', isHot: false },
    { id: 'usa_2500', numCoins: 2500, priceString: '$19.99', region: 'USA', isHot: false },
    { id: 'usa_5000', numCoins: 5000, priceString: '$34.99', region: 'USA', isHot: false },
    { id: 'usa_10000', numCoins: 10000, priceString: '$59.99', region: 'USA', isHot: false },
    
    { id: 'hk_100', numCoins: 100, priceString: 'HK$8.00', region: 'HK', isHot: false },
    { id: 'hk_500', numCoins: 500, priceString: 'HK$38.00', region: 'HK', isHot: true },
    { id: 'hk_1200', numCoins: 1200, priceString: 'HK$78.00', region: 'HK', isHot: false },
    { id: 'hk_2500', numCoins: 2500, priceString: 'HK$158.00', region: 'HK', isHot: false },
    { id: 'hk_5000', numCoins: 5000, priceString: 'HK$268.00', region: 'HK', isHot: false },
    { id: 'hk_10000', numCoins: 10000, priceString: 'HK$468.00', region: 'HK', isHot: false }
  ]);

  useEffect(() => {
    let unsubThemes = () => {};
    let unsubPackages = () => {};

    const startThemeStream = (useSandbox: boolean) => {
      const ref = useSandbox 
        ? { isMockRef: true, id: 'shop_items', collectionName: 'shop_items' } 
        : collection(db, 'shop_items');

      unsubThemes = onSnapshot(ref, (snapshot) => {
        const items: any[] = [];
        snapshot.forEach((docSnap: any) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });
        if (items.length > 0) {
          setDynamicShopThemes(items);
        }
      }, (err) => {
        console.warn("Theme stream failed, trying sandbox fallback...", err);
        if (!useSandbox) {
          startThemeStream(true);
        }
      });
    };

    const startPackageStream = (useSandbox: boolean) => {
      const ref = useSandbox 
        ? { isMockRef: true, id: 'clip_packages', collectionName: 'clip_packages' } 
        : collection(db, 'clip_packages');

      unsubPackages = onSnapshot(ref, (snapshot) => {
        const items: any[] = [];
        snapshot.forEach((docSnap: any) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });
        if (items.length > 0) {
          // Sort packages by region then numCoins
          items.sort((a, b) => {
            const reg = (a.region || '').localeCompare(b.region || '');
            if (reg !== 0) return reg;
            return (a.numCoins || 0) - (b.numCoins || 0);
          });
          setDynamicClipPackages(items);
        }
      }, (err) => {
        console.warn("Package stream failed, trying sandbox fallback...", err);
        if (!useSandbox) {
          startPackageStream(true);
        }
      });
    };

    startThemeStream(false);
    startPackageStream(false);

    return () => {
      try { unsubThemes(); } catch(e){}
      try { unsubPackages(); } catch(e){}
    };
  }, []);

  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  useEffect(() => {
    if (isEditingProfile) {
      setTempProfile({ ...userAccount });
    }
  }, [isEditingProfile]);
  const [isBuyCoinsOpen, setIsBuyCoinsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('neote_logged_in') === 'true';
  });
  const [showHistoryList, setShowHistoryList] = useState(false);
  const [buyClipRegion, setBuyClipRegion] = useState<'USA' | 'HK'>('USA');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<{ id: string; amount: number; price: string; date: string }[]>(() => {
    const stored = localStorage.getItem('purchase_history_v2');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('purchase_history_v2', JSON.stringify(purchaseHistory));
    if (currentUser && hasInitialProfileLoaded) {
      setDoc(doc(db, 'users', currentUser.uid), {
        purchaseHistory: purchaseHistory
      }, { merge: true }).catch(err => {
        console.warn("Could not save purchase history to firestore", err);
      });
    }
  }, [purchaseHistory, currentUser, hasInitialProfileLoaded]);

  const [currentDeviceId] = useState<string>(() => {
    let id = localStorage.getItem('neote_device_id_v1');
    if (!id) {
      id = 'dev-1';
      localStorage.setItem('neote_device_id_v1', id);
    }
    return id;
  });

  const [isDevicesOpen, setIsDevicesOpen] = useState(false);
  const [isDevCodeModalOpen, setIsDevCodeModalOpen] = useState(false);
  const [selectedDevFileTab, setSelectedDevFileTab] = useState<'model' | 'service' | 'auth' | 'rules'>('model');
  const [deviceSessions, setDeviceSessions] = useState<DeviceSession[]>(() => {
    const stored = localStorage.getItem('neote_device_sessions');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // Fallback below
      }
    }
    return [
      {
        id: 'dev-1',
        name: 'React Web Emulator V3.5 (Current)',
        type: 'desktop',
        status: 'online',
        loginTime: '2026-06-18 03:00 AM',
        location: 'Dhaka, Bangladesh (IP: 103.145.22.8)'
      },
      {
        id: 'dev-2',
        name: 'iPhone 15 Pro Max',
        type: 'mobile',
        status: 'online',
        loginTime: '2026-06-17 11:24 PM',
        location: 'Dhaka, Bangladesh (IP: 103.145.22.12)'
      },
      {
        id: 'dev-3',
        name: 'MacBook Pro 16"',
        type: 'desktop',
        status: 'offline',
        loginTime: '2026-06-15 08:30 AM',
        logoutTime: '2026-06-16 06:15 PM',
        location: 'Sylhet, Bangladesh (IP: 182.160.15.4)'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('neote_device_sessions', JSON.stringify(deviceSessions));
    if (currentUser && hasInitialProfileLoaded) {
      setDoc(doc(db, 'users', currentUser.uid), {
        deviceSessions: deviceSessions
      }, { merge: true }).catch(err => {
        console.warn("Could not save device sessions to firestore", err);
      });
    }
  }, [deviceSessions, currentUser, hasInitialProfileLoaded]);

  // Active navigation tab *inside* the phone emulator (Default is Home / 0)
  const [activeTab, setActiveTab] = useState<number>(0); 
  const [emulatorRatio, setEmulatorRatio] = useState<'9/16' | '9/19.5' | 'free'>('9/16');
  const [showDeviceFrame, setShowDeviceFrame] = useState<boolean>(true);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');

  const slideVariants = {
    enter: (direction: 'left' | 'right') => ({
      x: direction === 'left' ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'left' ? '-100%' : '100%',
      opacity: 0
    })
  };

  const logTabChangeWithDirection = (targetTab: number) => {
    if (targetTab === activeTab) return;
    setSlideDirection(targetTab > activeTab ? 'left' : 'right');
    setActiveTab(targetTab);
  };

  // Code viewer tab selection
  const [selectedCodeTab, setSelectedCodeTab] = useState<'main' | 'theme' | 'dashboard' | 'editor'>('dashboard');
  
  // Feedback to user (e.g. "Code Copied!")
  const [copiedFeedback, setCopiedFeedback] = useState<string | null>(null);
  const [alertNotification, setAlertNotification] = useState<string | null>(null);
  const [coinFloatText, setCoinFloatText] = useState<{ id: number; text: string }[]>([]);
  
  // New Note temporary input state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('General');
  const [noteColor, setNoteColor] = useState('');
  const [notePinned, setNotePinned] = useState(false);

  // Initial Sample Notes
  const defaultNotes: Note[] = [];

  // --- FIREBASE AUTH & FIRESTORE SYNCHRONIZATION ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setHasInitialProfileLoaded(false);
        setCurrentUser(user);
        setIsLoggedIn(true);
        setFirebaseLoading(true);
        setFirebaseError(null);

        try {
          // 1. Fetch user account profile
          const userDocRef = doc(db, 'users', user.uid);
          let userSnap;
          let fetchProfileSuccess = false;
          let fetchedUserNotes: Note[] | null = null;
          try {
            userSnap = await getDoc(userDocRef);
            fetchProfileSuccess = true;
          } catch (err) {
            console.warn("Could not fetch user profile from Firestore (falling back to local memory/local storage profile)", err);
          }

          if (fetchProfileSuccess && userSnap && userSnap.exists()) {
            const data = userSnap.data();
            const conformingId = generateUniqueIdCode(data.email || data.phone || user.email || user.phoneNumber || 'guest-user');

            if (data.Notes && Array.isArray(data.Notes)) {
              fetchedUserNotes = data.Notes;
            }

            setUserAccount({
              name: data.name || user.displayName || 'User Account',
              avatarUrl: data.avatarUrl || '',
              premiumCoins: typeof data.premiumCoins === 'number' ? data.premiumCoins : 0,
              phone: (data.phone === 'N/A' ? '' : (data.phone || '')),
              email: (data.email?.endsWith('@neote.app') || data.email === 'N/A') ? '' : (data.email || user.email || ''),
              country: data.country || 'Bangladesh',
              idCode: conformingId,
              role: data.role || 'user'
            });

            if (data.selectedPreset) {
              setSelectedPreset(data.selectedPreset);
            }
            if (data.ownedThemes) {
              setOwnedThemes(data.ownedThemes);
            }
            if (data.purchaseHistory) {
              setPurchaseHistory(data.purchaseHistory);
            }

            // Sync current device session of this device users log in - enforcing 1 session per device
            let currentSessions = data.deviceSessions || [];
            const deviceId = localStorage.getItem('neote_device_id_v1') || 'dev-1';

            // Find current session by deviceId
            const currentSessIndex = currentSessions.findIndex((s: any) => s.id === deviceId);
            const currentSessionObj: DeviceSession = currentSessIndex !== -1 ? {
              ...currentSessions[currentSessIndex],
              status: 'online',
              loginTime: new Date().toLocaleString(),
              location: 'Dhaka, Bangladesh (IP: 103.145.22.8)'
            } : {
              id: deviceId,
              name: navigator.userAgent.includes('Mobile') ? 'Mobile Web Device' : 'Desktop Web Emulator (Current)',
              type: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
              status: 'online',
              loginTime: new Date().toLocaleString(),
              location: 'Dhaka, Bangladesh (IP: 103.145.22.8)'
            };

            // Deduplicate all sessions to guarantee strictly 1 session per device name/type (cleaning up duplicates/old random sessions)
            const uniqueSessionsMap = new Map<string, DeviceSession>();
            uniqueSessionsMap.set(deviceId, currentSessionObj);

            currentSessions.forEach((s: any) => {
              if (s.id === deviceId) return; // current device is already added and prioritized
              
              // Only keep other devices if they represent a unique physical device name/type
              const alreadyExists = Array.from(uniqueSessionsMap.values()).some(
                (existing) => existing.name === s.name && existing.type === s.type
              );
              if (!uniqueSessionsMap.has(s.id) && !alreadyExists) {
                uniqueSessionsMap.set(s.id, s);
              }
            });

            currentSessions = Array.from(uniqueSessionsMap.values());
            setDeviceSessions(currentSessions);

            // Save session tracking immediately under rules back to user database document
            await setDoc(userDocRef, {
              deviceSessions: currentSessions,
              lastLoginAt: new Date().toISOString()
            }, { merge: true });

          } else {
            // Either profile doesn't exist, or we couldn't fetch it due to permission restrictions.
            // If we successfully determined it doesn't exist, let's try to set it.
            if (fetchProfileSuccess && userSnap && !userSnap.exists()) {
              const initialId = generateUniqueIdCode(userAccount.email || userAccount.phone || user.email || user.phoneNumber || 'guest-user');
              const deviceId = localStorage.getItem('neote_device_id_v1') || 'dev-1';

              const initialSession: DeviceSession = {
                id: deviceId,
                name: navigator.userAgent.includes('Mobile') ? 'Mobile Web Device' : 'Desktop Web Emulator (Current)',
                type: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
                status: 'online',
                loginTime: new Date().toLocaleString(),
                location: 'Dhaka, Bangladesh (IP: 103.145.22.8)'
              };

              const isPhoneUser = user.email?.endsWith('@neote.app');
              const initialDoc = {
                name: userAccount.name || user.displayName || 'User Account',
                avatarUrl: userAccount.avatarUrl || '',
                premiumCoins: userAccount.premiumCoins ?? 0,
                phone: isPhoneUser ? (user.email?.split('@')[0] || userAccount.phone || '') : (userAccount.phone || ''),
                email: isPhoneUser ? '' : (user.email || userAccount.email || ''),
                country: 'Bangladesh',
                idCode: initialId,
                ownedThemes: ownedThemes,
                selectedPreset: selectedPreset,
                purchaseHistory: purchaseHistory,
                deviceSessions: [initialSession],
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
                role: 'user'
              };
              setDeviceSessions([initialSession]);
              try {
                await setDoc(userDocRef, initialDoc);
              } catch (err) {
                console.warn("Could not auto-create user profile in Firestore", err);
              }
            } else {
              // Fetch failed due to permission restriction. Use local profile.
              const localStoredProfile = localStorage.getItem('user_account_profile');
              if (localStoredProfile) {
                try {
                  const data = JSON.parse(localStoredProfile);
                  setUserAccount(data);
                } catch (e) {}
              }
            }
          }

          setHasInitialProfileLoaded(true);

          // 2. Load Notes from Firestore (handling both the new "Notes" field and the fallback notes collection)
          let loadedNotes: Note[] = [];
          if (fetchedUserNotes && Array.isArray(fetchedUserNotes)) {
            loadedNotes = [...fetchedUserNotes];
          } else {
            // Fallback to query notes collection
            try {
              const notesQuery = query(collection(db, 'notes'), where('userId', '==', user.uid));
              const querySnapshot = await getDocs(notesQuery);
              querySnapshot.forEach((docSnapshot: any) => {
                const d = docSnapshot.data();
                loadedNotes.push({
                  id: docSnapshot.id,
                  title: d.title || '',
                  content: d.content || '',
                  category: d.category || 'General',
                  updatedAt: d.updatedAt || 'Just now',
                  createdAt: d.createdAt || d.updatedAt || 'Just now',
                  color: d.color || '#00C087',
                  userId: d.userId || user.uid,
                  pinned: !!d.pinned,
                });
              });
            } catch (notesErr) {
              console.warn("Could not query fallback notes collection:", notesErr);
            }
          }

          // Migrate any guest notes to this logged-in user account if they exist
          const localNotesStr = localStorage.getItem('flutter_mockup_notes');
          if (localNotesStr) {
            try {
              const localNotesParsed = JSON.parse(localNotesStr);
              const guestNotes = localNotesParsed.filter((n: any) => 
                n.id !== '1' && n.id !== '2' && n.id !== '3' && 
                (!n.userId || n.userId === 'guest-user')
              );

              if (guestNotes.length > 0) {
                for (const note of guestNotes) {
                  const noteId = note.id || Date.now().toString() + Math.random().toString(36).substr(2, 5);
                  const migratedNote: Note = {
                    id: noteId,
                    title: note.title || '',
                    content: note.content || '',
                    category: note.category || 'General',
                    createdAt: note.createdAt || 'Just now',
                    updatedAt: note.updatedAt || 'Just now',
                    color: note.color || '#00C087',
                    userId: user.uid,
                    pinned: !!note.pinned
                  };
                  if (!loadedNotes.some(n => n.id === noteId)) {
                    loadedNotes.push(migratedNote);
                  }
                  // Save individual record to notes collection as well
                  await setDoc(doc(db, 'notes', noteId), migratedNote);
                }
              }
            } catch (migrationErr) {
              console.warn("Could not migrate guest notes to Firestore account:", migrationErr);
            }
          }

          // Filter out defaults and save/sync state
          const filteredNotes = loadedNotes.filter(n => n.id !== '1' && n.id !== '2' && n.id !== '3');
          setNotes(filteredNotes);
          localStorage.setItem('flutter_mockup_notes', JSON.stringify(filteredNotes));

          // Immediately ensure "Notes" field is fully saved/updated on the user document
          try {
            await setDoc(doc(db, 'users', user.uid), {
              Notes: filteredNotes
            }, { merge: true });
          } catch (syncErr) {
            console.warn("Could not sync Notes field on user doc during init:", syncErr);
          }

        } catch (err) {
          console.error("Error loading user profile:", err);
          const errMsg = err instanceof Error ? err.message : String(err);
          setFirebaseError(errMsg);
          
          // Fallback to local storage (and filter out dummy note IDs)
          const local = localStorage.getItem('flutter_mockup_notes');
          if (local) {
            try {
              const parsed = JSON.parse(local);
              const filtered = parsed.filter((n: any) => n.id !== '1' && n.id !== '2' && n.id !== '3');
              setNotes(filtered);
              localStorage.setItem('flutter_mockup_notes', JSON.stringify(filtered));
            } catch (e) {}
          } else {
            setNotes([]);
          }
        } finally {
          setFirebaseLoading(false);
        }
      } else {
        setHasInitialProfileLoaded(false);
        setCurrentUser(null);
        setFirebaseError(null);
        const isGuest = localStorage.getItem('neote_is_guest_mode') === 'true';
        if (isGuest) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
        // Reset to default/local notes
        const local = localStorage.getItem('flutter_mockup_notes');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            const filtered = parsed.filter((n: any) => n.id !== '1' && n.id !== '2' && n.id !== '3');
            setNotes(filtered);
            localStorage.setItem('flutter_mockup_notes', JSON.stringify(filtered));
          } catch(e) {}
        } else {
          setNotes(defaultNotes);
        }
      }
    });

    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    return () => unsubscribe();
  }, []);

  const saveNotesToStateAndStorage = (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    localStorage.setItem('flutter_mockup_notes', JSON.stringify(updatedNotes));

    if (currentUser) {
      // Filter out any other user's notes or general defaults if they are present in other sessions
      const userNotes = updatedNotes.filter(n => n.userId === currentUser.uid || !n.userId).map(n => ({
        ...n,
        userId: currentUser.uid // Ensure correct userId is attached
      }));

      setDoc(doc(db, 'users', currentUser.uid), {
        Notes: userNotes
      }, { merge: true }).catch(err => {
        console.warn("Could not save Notes to user's profile document:", err);
      });
    }
  };

  // --- ACTIONS ---
  const handleAddNewNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!noteTitle.trim()) {
      triggerNotification('Please enter a note title!');
      return;
    }

    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    const newNote: Note = {
      id: Date.now().toString(),
      title: noteTitle,
      content: noteContent || 'No additional details provided.',
      category: noteCategory,
      createdAt: timeFormatted,
      updatedAt: timeFormatted,
      color: noteColor || selectedPreset.accentColorHex,
      userId: currentUser ? currentUser.uid : 'guest-user',
      pinned: notePinned
    };

    const newNotesList = [newNote, ...notes];
    saveNotesToStateAndStorage(newNotesList);

    if (currentUser) {
      setDoc(doc(db, 'notes', newNote.id), {
        title: newNote.title,
        content: newNote.content,
        category: newNote.category,
        createdAt: newNote.createdAt,
        updatedAt: newNote.updatedAt,
        color: newNote.color,
        userId: currentUser.uid,
        pinned: notePinned
      }).catch(err => {
        console.warn("Could not save new note to Firestore", err);
      });
    }
    
    // Reset fields
    setNoteTitle('');
    setNoteContent('');
    setIsEditorActive(false);
    setEditingNote(null);
    triggerNotification('Note added successfully!');
  };

  const handleUpdateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;
    if (!noteTitle.trim()) {
      triggerNotification('Note title cannot be empty!');
      return;
    }

    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    const updated = notes.map(n => {
      if (n.id === editingNote.id) {
        return {
          ...n,
          title: noteTitle,
          content: noteContent,
          category: noteCategory,
          updatedAt: timeFormatted,
          pinned: notePinned
        };
      }
      return n;
    });

    saveNotesToStateAndStorage(updated);

    if (currentUser) {
      setDoc(doc(db, 'notes', editingNote.id), {
        title: noteTitle,
        content: noteContent,
        category: noteCategory,
        updatedAt: timeFormatted,
        userId: currentUser.uid,
        pinned: notePinned
      }, { merge: true }).catch(err => {
        console.warn("Could not update note in Firestore", err);
      });
    }

    setIsEditorActive(false);
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
    triggerNotification('Note updated!');
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering container click
    setNoteIdToDelete(id);
  };

  const executeDeleteNote = () => {
    if (!noteIdToDelete) return;
    const filtered = notes.filter(n => n.id !== noteIdToDelete);
    saveNotesToStateAndStorage(filtered);
    
    if (editingNote && editingNote.id === noteIdToDelete) {
      setIsEditorActive(false);
      setEditingNote(null);
    }

    if (currentUser) {
      deleteDoc(doc(db, 'notes', noteIdToDelete)).catch(err => {
        console.warn("Could not delete note in Firestore", err);
      });
    }

    triggerNotification('Note removed!');
    setNoteIdToDelete(null);
  };

  const handleTogglePin = (note: Note, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updatedStatus = !note.pinned;
    const updated = notes.map(n => {
      if (n.id === note.id) {
        return {
          ...n,
          pinned: updatedStatus
        };
      }
      return n;
    });
    saveNotesToStateAndStorage(updated);
    
    if (viewingNote && viewingNote.id === note.id) {
      setViewingNote(prev => prev ? { ...prev, pinned: updatedStatus } : null);
    }
    
    setNotePinned(updatedStatus);
    triggerNotification(updatedStatus ? 'Note pinned to top!' : 'Note unpinned');

    if (currentUser) {
      setDoc(doc(db, 'notes', note.id), {
        pinned: updatedStatus
      }, { merge: true }).catch(err => {
        console.warn("Could not sync pinned status with Firestore", err);
      });
    }
  };

  const startEditing = (note: Note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteCategory(note.category);
    setNotePinned(!!note.pinned);
    setIsEditorActive(true);
  };

  const startViewing = (note: Note) => {
    setViewingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNotePinned(!!note.pinned);
    setIsEditingNoteInline(false);
  };

  const handleConfirmEditInViewing = () => {
    if (!viewingNote) return;
    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    const updated = notes.map((n) => {
      if (n.id === viewingNote.id) {
        return {
          ...n,
          title: noteTitle,
          content: noteContent,
          updatedAt: timeFormatted,
          pinned: notePinned
        };
      }
      return n;
    });
    saveNotesToStateAndStorage(updated);
    setViewingNote({
      ...viewingNote,
      title: noteTitle,
      content: noteContent,
      updatedAt: timeFormatted,
      pinned: notePinned
    });
    setIsEditingNoteInline(false);
    triggerNotification('Note updated successfully!');

    if (currentUser) {
      setDoc(doc(db, 'notes', viewingNote.id), {
        title: noteTitle,
        content: noteContent,
        updatedAt: timeFormatted,
        userId: currentUser.uid,
        pinned: notePinned
      }, { merge: true }).catch(err => {
        console.warn("Could not update note in Firestore", err);
      });
    }
  };

  const startCreating = () => {
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteCategory('General');
    setNotePinned(false);
    setIsEditorActive(true);
  };

  // Dynamic feedback and status notifier
  const triggerNotification = (message: string) => {
    setAlertNotification(message);
    setTimeout(() => {
      setAlertNotification(null);
    }, 3000);
  };

  useEffect(() => {
    const notice = localStorage.getItem('neote_delete_notice');
    if (notice) {
      triggerNotification(notice);
      localStorage.removeItem('neote_delete_notice');
    }
  }, []);

  const handleAddCoins = () => {
    setUserAccount(prev => ({
      ...prev,
      premiumCoins: prev.premiumCoins + 10
    }));

    // Spawn floating anim indicator
    const newId = Date.now();
    setCoinFloatText(prev => [...prev, { id: newId, text: '+10!' }]);
    setTimeout(() => {
      setCoinFloatText(prev => prev.filter(item => item.id !== newId));
    }, 1000);

    triggerNotification('Added 10 Premium CLIP!');
  };

  const handlePurchaseCoins = (amount: number, priceStr: string) => {
    setUserAccount(prev => ({
      ...prev,
      premiumCoins: prev.premiumCoins + amount
    }));

    const dateStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newTx = {
      id: Math.random().toString(),
      amount,
      price: priceStr,
      date: dateStr
    };
    setPurchaseHistory(prev => [newTx, ...prev]);

    const newId = Date.now();
    setCoinFloatText(prev => [...prev, { id: newId, text: `+${amount}!` }]);
    setTimeout(() => {
      setCoinFloatText(prev => prev.filter(item => item.id !== newId));
    }, 1200);

    triggerNotification(`Successfully bought ${amount} Premium CLIP!`);
  };

  const handleSpendCoins = (amount: number, objectName: string) => {
    if (userAccount.premiumCoins < amount) {
      triggerNotification('Not enough Premium CLIP! Click the badge to add +10.');
      return;
    }
    setUserAccount(prev => ({
      ...prev,
      premiumCoins: prev.premiumCoins - amount
    }));
    triggerNotification(`Spent ${amount} CLIP on: ${objectName}!`);
  };

  const buyThemeColour = (themeId: string, name: string, price: number, colorHex: string) => {
    // Check if already owned
    if (ownedThemes.includes(colorHex)) {
      triggerNotification(`You already own the ${name}!`);
      return;
    }
    // Check balance
    if (userAccount.premiumCoins < price) {
      triggerNotification(`Not enough CLIP to buy ${name} (needs ${price} CLIP)!`);
      setIsBuyCoinsOpen(true);
      return;
    }

    // Spend
    setUserAccount(prev => ({
      ...prev,
      premiumCoins: prev.premiumCoins - price
    }));
    setOwnedThemes(prev => [...prev, colorHex]);
    triggerNotification(`Successfully bought ${name} for ${price} CLIP! 🎉`);
  };

  const applyShopTheme = (colorHex: string) => {
    const theme = dynamicShopThemes.find(t => t.color === colorHex);
    if (!theme) return;
    setSelectedPreset({
      primaryColorHex: theme.color,
      accentColorHex: theme.accent,
      darkBgColorHex: theme.darkBg,
      lightBgColorHex: theme.lightBg,
    });
    setIsThemeChangeSplash(true);
    setShowGlobalSplash(true);
    triggerNotification(`${theme.name} applied successfully! The whole application design adjusted. ✨`);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUserAccount(prev => {
      const isPhoneUser = currentUser?.email?.endsWith('@neote.app') || (prev.phone && !prev.email);
      const emailVal = isPhoneUser ? '' : (tempProfile.email || '');
      const phoneVal = isPhoneUser ? (tempProfile.phone || '') : '';
      const derivedId = generateUniqueIdCode(emailVal || phoneVal || prev.email || prev.phone);
      return {
        ...prev,
        name: tempProfile.name,
        avatarUrl: tempProfile.avatarUrl || '',
        phone: phoneVal,
        email: emailVal,
        country: tempProfile.country || '',
        idCode: derivedId
      };
    });
    setIsEditingProfile(false);
    triggerNotification('Profile configurations saved!');
  };

  // Copy code utility
  const copyToClipboard = (code: string, fileName: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFeedback(fileName);
    setTimeout(() => {
      setCopiedFeedback(null);
    }, 2500);
  };

  // Reset to default
  const resetAllData = () => {
    saveNotesToStateAndStorage(defaultNotes);
    setUserAccount({
      name: 'User Account',
      avatarUrl: '',
      premiumCoins: 0,
      phone: '',
      email: '',
      country: '',
      idCode: generateUniqueIdCode()
    });
    setSelectedPreset({
      primaryColorHex: COLOR_PRESETS[0].primary,
      accentColorHex: COLOR_PRESETS[0].accent,
      darkBgColorHex: COLOR_PRESETS[0].darkBg,
      lightBgColorHex: COLOR_PRESETS[0].lightBg,
    });
    setThemeMode(ThemeMode.DARK);
    setActiveTab(0);
    setIsEditorActive(false);
    setEditingNote(null);
    triggerNotification('Reset mockup state to defaults!');
  };

  // Auto compile individual Dart Code tab content
  const getActiveCodeText = () => {
    switch (selectedCodeTab) {
      case 'main':
        return getFlutterMainCode(selectedPreset, userAccount.name, userAccount.premiumCoins);
      case 'theme':
        return getFlutterThemeCode(selectedPreset);
      case 'dashboard':
        return getFlutterNotesDashboardCode(selectedPreset);
      case 'editor':
        return getFlutterNoteEditorCode(selectedPreset);
    }
  };

  const getActiveCodeFileName = () => {
    switch (selectedCodeTab) {
      case 'main': return 'main.dart';
      case 'theme': return 'theme.dart';
      case 'dashboard': return 'notes_dashboard.dart';
      case 'editor': return 'note_editor_screen.dart';
    }
  };

  // Apply custom preset values
  const applyPresetColors = (preset: typeof COLOR_PRESETS[0]) => {
    setSelectedPreset({
      primaryColorHex: preset.primary,
      accentColorHex: preset.accent,
      darkBgColorHex: preset.darkBg,
      lightBgColorHex: preset.lightBg,
    });
    setIsThemeChangeSplash(true);
    setShowGlobalSplash(true);
    triggerNotification(`Applied ${preset.name} branding theme!`);
  };

  const dynamicStyles = {
    '--dynamic-primary': selectedPreset.primaryColorHex,
    '--dynamic-primary-5': `${selectedPreset.primaryColorHex}0D`,  // ~5%
    '--dynamic-primary-10': `${selectedPreset.primaryColorHex}1A`, // ~10%
    '--dynamic-primary-15': `${selectedPreset.primaryColorHex}26`, // ~15%
    '--dynamic-primary-20': `${selectedPreset.primaryColorHex}33`, // ~20%
    '--dynamic-primary-30': `${selectedPreset.primaryColorHex}4D`, // ~30%
    '--dynamic-primary-40': `${selectedPreset.primaryColorHex}66`, // ~40%
  } as React.CSSProperties;

  return (
    <div 
      style={dynamicStyles}
      className="min-h-screen bg-black text-slate-100 font-sans flex flex-col selection:bg-[#00C087]/30 selection:text-[#00C087]"
    >
      <style>{`
        /* Dynamic Theme Variable Style Overrides */
        .text-\\[\\#00C087\\] { color: var(--dynamic-primary) !important; }
        .border-\\[\\#00C087\\] { border-color: var(--dynamic-primary) !important; }
        .bg-\\[\\#00C087\\] { background-color: var(--dynamic-primary) !important; }
        .bg-\\[\\#00C087\\]\\/15 { background-color: var(--dynamic-primary-15) !important; }
        .border-\\[\\|#00C087\\]\\/30 { border-color: var(--dynamic-primary-30) !important; }
        .border-\\[\\#00C087\\]\\/30 { border-color: var(--dynamic-primary-30) !important; }
        .border-\\[\\#00C087\\]\\/20 { border-color: var(--dynamic-primary-20) !important; }
        .border-\\[\\#00C087\\]\\/15 { border-color: var(--dynamic-primary-15) !important; }
        .bg-\\[\\#00C087\\]\\/10 { background-color: var(--dynamic-primary-10) !important; }
        .bg-\\[\\#00C087\\]\\/5 { background-color: var(--dynamic-primary-5) !important; }
        
        /* Pseudo Class Matches for Tailwind */
        .hover\\:border-\\[\\#00C087\\]:hover { border-color: var(--dynamic-primary) !important; }
        .hover\\:bg-\\[\\#00C087\\]:hover { background-color: var(--dynamic-primary) !important; }
        .focus\\:border-\\[\\#00C087\\]:focus { border-color: var(--dynamic-primary) !important; }
        
        /* Selection and other Emerald class replacements */
        ::selection { background-color: var(--dynamic-primary-30) !important; color: var(--dynamic-primary) !important; }
        .selection\\:bg-\\[\\#00C087\\]\\/30 *::selection { background-color: var(--dynamic-primary-30) !important; }
        
        /* Green status circle */
        .bg-emerald-950\\/30 { background-color: var(--dynamic-primary-15) !important; border-color: var(--dynamic-primary-30) !important; }
        .text-[#00C087] { color: var(--dynamic-primary) !important; }
        span.bg-teal-400 { background-color: var(--dynamic-primary) !important; }
        span.bg-emerald-500\\/15 { background-color: var(--dynamic-primary-15) !important; color: var(--dynamic-primary) !important; }
      `}</style>
      
      {/* CORE DESKTOP LAYOUT (Full Screen & Personalization Sidebar) */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row items-stretch gap-8 relative">
        
        {/* LEFT COLUMN: BRANDING & PERSONALIZATION CENTER */}
        <div className="w-full lg:w-72 flex flex-col bg-slate-950/60 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-5 flex-none font-sans text-left">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#00C087]" /> Customize Style
            </h3>
            <p className="text-[11px] text-slate-400">Dynamically load colors and adjust typography themes in real-time.</p>
          </div>

          {/* PALETTE BUTTONS */}
          <div className="space-y-2 border-t border-slate-800/80 pt-4">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Branding Palettes</span>
            <div className="grid grid-cols-2 gap-2">
              {COLOR_PRESETS.map((preset, idx) => {
                const isSelected = selectedPreset.primaryColorHex === preset.primary;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPresetColors(preset)}
                    className="flex flex-col items-center p-2 rounded-xl border transition-all hover:scale-102 active:scale-98 cursor-pointer text-center"
                    style={{
                      borderColor: isSelected ? selectedPreset.primaryColorHex : '#1E293B',
                      backgroundColor: isSelected ? `${selectedPreset.primaryColorHex}10` : 'transparent'
                    }}
                  >
                    <div className="flex h-4 w-10 rounded-full overflow-hidden border border-slate-800 mb-1.5 shrink-0">
                      <div className="w-1/2" style={{ backgroundColor: preset.primary }}></div>
                      <div className="w-1/2" style={{ backgroundColor: preset.accent }}></div>
                    </div>
                    <span className="text-[9.5px] font-black text-slate-300 tracking-tight whitespace-nowrap">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* HEX COLOR INPUT EDITORS */}
          <div className="space-y-3.5 border-t border-slate-800/80 pt-4">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Precise Adjustments</span>
            
            <div className="space-y-2.5">
              <div>
                <label className="text-[9.5px] text-slate-400 font-bold block mb-1">Primary Color (HEX):</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="color" 
                    value={selectedPreset.primaryColorHex}
                    onChange={(e) => setSelectedPreset(prev => ({ ...prev, primaryColorHex: e.target.value }))}
                    className="w-7 h-7 bg-transparent border-0 cursor-pointer rounded"
                  />
                  <input 
                    type="text" 
                    value={selectedPreset.primaryColorHex}
                    onChange={(e) => setSelectedPreset(prev => ({ ...prev, primaryColorHex: e.target.value }))}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono w-24 text-slate-300 focus:outline-none focus:border-current"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9.5px] text-slate-400 font-bold block mb-1">Accent Highlight (HEX):</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="color" 
                    value={selectedPreset.accentColorHex}
                    onChange={(e) => setSelectedPreset(prev => ({ ...prev, accentColorHex: e.target.value }))}
                    className="w-7 h-7 bg-transparent border-0 cursor-pointer rounded"
                  />
                  <input 
                    type="text" 
                    value={selectedPreset.accentColorHex}
                    onChange={(e) => setSelectedPreset(prev => ({ ...prev, accentColorHex: e.target.value }))}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono w-24 text-slate-300 focus:outline-none focus:border-current"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* NETWORK SIMULATOR */}
          <div className="space-y-2 border-t border-slate-800/80 pt-4">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block flex items-center justify-between">
              <span>Network State</span>
              <span className={`text-[8px] font-mono px-1 py-0.5 rounded ${isCurrentlyOnline ? 'bg-emerald-950 text-emerald-400 font-bold' : 'bg-red-950 text-red-400 font-bold animate-pulse'}`}>
                {isCurrentlyOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                setSimulatedOffline(prev => {
                  const newVal = !prev;
                  triggerNotification(newVal ? 'Simulated device going offline!' : 'Restored network connection!');
                  return newVal;
                });
              }}
              className={`w-full py-2 text-[9.5px] uppercase font-black rounded-lg transition-all text-center cursor-pointer flex items-center justify-center space-x-1.5 border ${
                simulatedOffline 
                  ? 'bg-red-950/40 border-red-900 text-red-400 hover:bg-red-900/25' 
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
              }`}
            >
              {simulatedOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              <span>{simulatedOffline ? 'Simulate Offline' : 'Disconnect (Simulate)'}</span>
            </button>
            <p className="text-[9px] text-slate-500 italic text-center leading-normal">
              * Tests the Play Store online-only blocking screen.
            </p>
          </div>

          {/* APPEARANCE MODE SWITCHER */}
          <div className="space-y-2 border-t border-slate-800/80 pt-4 flex-1 flex flex-col justify-end">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Device Theme</span>
            <div className="flex gap-2 p-1 bg-slate-900/60 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setThemeMode(ThemeMode.LIGHT);
                  triggerNotification('Switched screen to Light Canvas Mode');
                }}
                className={`flex-1 py-1.5 text-[9.5px] uppercase font-bold rounded-lg transition-all text-center cursor-pointer ${
                  themeMode === ThemeMode.LIGHT ? 'bg-[#00C087] text-slate-950 font-extrabold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => {
                  setThemeMode(ThemeMode.DARK);
                  triggerNotification('Switched screen to Dark Canvas Mode');
                }}
                className={`flex-1 py-1.5 text-[9.5px] uppercase font-bold rounded-lg transition-all text-center cursor-pointer ${
                  themeMode === ThemeMode.DARK ? 'bg-[#00C087] text-slate-950 font-extrabold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dark
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: GORGEOUS PHYSICAL ANDROID HANDSET EMULATOR */}
        <div className="flex-1 flex justify-center items-center py-2 md:py-4 bg-slate-900/10 rounded-[36px] border border-slate-800/40 p-2 md:p-6 shadow-inner min-h-[700px]">
          <div className="relative w-full max-w-[385px] transition-all duration-300">
            {/* Matte dark real Android phone frame feel */}
            <div className="relative mx-auto rounded-[46px] bg-[#0A0F1D] p-3.5 border-[10px] border-slate-950 shadow-2xl shadow-indigo-950/40 ring-1 ring-slate-800/80 group">
              
              {/* Ear-piece speaker speaker notch */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-28 h-5.5 bg-slate-950 rounded-b-xl z-30 flex items-center justify-center">
                <div className="w-10 h-0.5 bg-slate-800 rounded-full mb-0.5"></div>
                <div className="w-2 h-2 bg-[#090D16] rounded-full absolute right-5 top-1.5 border border-slate-800/30"></div>
              </div>

              {/* Side buttons */}
              <div className="absolute right-[-11.5px] top-24 w-[3.5px] h-10 bg-slate-800 rounded-r border-r border-slate-705/40 shadow"></div>
              <div className="absolute right-[-11.5px] top-38 w-[3.5px] h-16 bg-slate-800 rounded-r border-r border-slate-705/40 shadow"></div>

              {/* Interactive AMOLED Phone screen frame */}
              <div 
                style={{
                  backgroundColor: themeMode === ThemeMode.DARK ? selectedPreset.darkBgColorHex : selectedPreset.lightBgColorHex,
                  color: themeMode === ThemeMode.DARK ? '#F1F5F9' : '#0F172A',
                  fontFamily: 'Inter, sans-serif'
                }}
                className="w-full overflow-hidden flex flex-col relative z-20 shadow-inner select-none transition-all duration-300 rounded-[32px] aspect-[9/19.2] bg-transparent"
              >
          <AnimatePresence mode="wait">
            {showGlobalSplash && (
                  <motion.div
                    key="splash"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(8px)", transition: { duration: 0.4, ease: "easeInOut" } }}
                    className="absolute inset-0 z-[100]"
                  >
                    <SplashScreen 
                      onComplete={() => {
                        setShowGlobalSplash(false);
                        setIsThemeChangeSplash(false);
                      }} 
                      primaryColor={selectedPreset.primaryColorHex} 
                      durationMs={globalSplashDuration}
                      isThemeChange={isThemeChangeSplash}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* STATUS BAR */}
              <div className="px-5 pt-3 pb-1 flex justify-between items-center text-[11px] font-mono opacity-80 select-none z-10 font-bold">
                {/* Simulated Real Time clock */}
                <span>10:52 PM</span>
                <div className="flex items-center space-x-1.5">
                  {isCurrentlyOnline ? (
                    <span className="text-[10px] text-emerald-500 font-bold">5G</span>
                  ) : (
                    <span className="text-[10px] text-red-500 font-bold flex items-center gap-0.5 animate-pulse">
                      <WifiOff className="w-3 h-3 text-red-500" />
                      <span>OFFLINE</span>
                    </span>
                  )}
                  {/* Small Battery meter */}
                  <div className="w-5.5 h-2.5 border border-current rounded-sm p-0.5 flex items-center">
                    <div className="bg-current h-full w-4/5 rounded-2xs"></div>
                  </div>
                </div>
              </div>

              {!isCurrentlyOnline ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none relative z-10">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 animate-pulse bg-red-500/10 text-red-500 border border-red-500/20 shadow-lg shadow-red-500/5">
                    <WifiOff className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <h2 className="text-sm font-black tracking-tight uppercase text-red-500">
                      No Internet Connection
                    </h2>
                    <p className="text-[10px] text-slate-400 leading-relaxed max-w-[240px] mx-auto">
                      This is an <span className="text-white font-black">Android-Only, Online-Only App</span>. Without an active internet connection, it cannot be opened or used.
                    </p>
                    <p className="text-[9px] text-slate-500 leading-normal max-w-[220px] mx-auto">
                      Please connect your device to Wi-Fi or cellular networks and try again.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const status = navigator.onLine;
                      setIsOnline(status);
                      if (status) {
                        triggerNotification("Internet connection active!");
                      } else {
                        triggerNotification("Still offline. Please check your network.");
                      }
                    }}
                    className="py-2 px-5 rounded-xl font-bold text-[10px] uppercase tracking-wide transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow"
                    style={{
                      background: `linear-gradient(135deg, ${selectedPreset.primaryColorHex} 0%, ${selectedPreset.accentColorHex} 100%)`,
                      color: '#FFFFFF'
                    }}
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Try Reconnecting</span>
                  </button>
                  
                  <div className="absolute bottom-6 left-0 right-0">
                    <span className="text-[8px] font-black text-slate-500 tracking-wider uppercase block mb-0.5">Android System Security</span>
                    <span className="text-[7.5px] text-slate-600 font-mono">STATUS: ERR_INTERNET_DISCONNECTED</span>
                  </div>
                </div>
              ) : !isLoggedIn ? (
                <LoginScreen 
                  selectedPreset={selectedPreset}
                  themeMode={themeMode}
                  onLogin={(info) => {
                    setUserAccount(prev => ({
                      ...prev,
                      name: info.name,
                      email: info.email,
                      phone: info.phone
                    }));
                    setIsLoggedIn(true);
                    localStorage.setItem('neote_logged_in', 'true');
                  }}
                />
              ) : viewingNote ? (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex-1 flex flex-col p-5 overflow-y-auto min-h-0 relative select-none"
                >
                  {/* Note Details View Page Header */}
                  <div className="flex justify-between items-center pb-3 border-b border-dashed mb-5"
                    style={{ borderColor: themeMode === ThemeMode.LIGHT ? '#E2E8F0' : '#334155' }}
                  >
                    {/* Top Left Edit Option */}
                    {!isEditingNoteInline ? (
                      <button 
                        type="button"
                        onClick={() => setIsEditingNoteInline(true)}
                        className="py-1 px-3 rounded-lg border transition-all duration-200 cursor-pointer flex items-center justify-center space-x-1 hover:scale-105 active:scale-95 text-xs font-bold"
                        style={{ 
                          backgroundColor: `${selectedPreset.primaryColorHex}15`,
                          borderColor: selectedPreset.primaryColorHex,
                          color: selectedPreset.primaryColorHex,
                        }}
                        title="Edit this note"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    ) : (
                      <button 
                        type="button"
                        onClick={handleConfirmEditInViewing}
                        className="py-1 px-3 rounded-lg border transition-all duration-200 cursor-pointer flex items-center justify-center space-x-1 hover:scale-105 active:scale-95 text-xs font-bold text-white-important bg-emerald-600"
                        style={{ 
                          borderColor: '#10B981',
                        }}
                        title="Confirm changes"
                      >
                        <Check className="w-3 h-3 text-white" />
                        <span className="text-white">Confirm</span>
                      </button>
                    )}
                    
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] uppercase tracking-[0.2em] font-extrabold text-slate-400">
                        {isEditingNoteInline ? 'Editing Mode' : 'Viewing Note'}
                      </span>
                    </div>

                    {/* Top Right Back Option */}
                    <button 
                      type="button"
                      onClick={() => {
                        if (isEditingNoteInline) {
                          setIsEditingNoteInline(false);
                        } else {
                          setViewingNote(null);
                        }
                      }}
                      className="py-1 px-3 rounded-lg border transition-all duration-200 cursor-pointer flex items-center justify-center space-x-1 hover:scale-105 active:scale-95 text-xs font-bold font-sans"
                      style={{ 
                        backgroundColor: themeMode === ThemeMode.LIGHT ? '#FFFFFF' : '#1E293B',
                        borderColor: themeMode === ThemeMode.LIGHT ? '#E2E8F0' : '#475569',
                        color: themeMode === ThemeMode.LIGHT ? '#475569' : '#CBD5E1',
                      }}
                      title="Back to notes list"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Back</span>
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 flex flex-col justify-start text-left space-y-4">
                    {!isEditingNoteInline ? (
                      <>
                        <div className="border-b pb-2" style={{ borderColor: themeMode === ThemeMode.LIGHT ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}>
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-black mb-1">
                            Title
                          </span>
                          <div className="flex justify-between items-start space-x-4">
                            <h1 className="text-xl font-sans font-black tracking-tight flex-1"
                              style={{ color: themeMode === ThemeMode.LIGHT ? '#1E293B' : '#F8FAFC' }}
                            >
                              {viewingNote.title}
                            </h1>
                            <button
                              type="button"
                              onClick={() => handleTogglePin(viewingNote)}
                              className={`py-1 px-2.5 rounded-lg border transition-all duration-200 cursor-pointer flex items-center justify-center space-x-1 hover:scale-105 active:scale-95 text-[10px] font-bold uppercase tracking-wider ${
                                viewingNote.pinned
                                  ? 'text-amber-500 bg-amber-500/10 border-amber-500/40 shadow-xs'
                                  : themeMode === ThemeMode.LIGHT
                                    ? 'text-slate-400 bg-slate-50 border-slate-200 hover:text-slate-600 hover:bg-slate-100'
                                    : 'text-slate-500 border-transparent hover:bg-slate-800 hover:text-slate-300'
                              }`}
                              title={viewingNote.pinned ? "Unpin note" : "Pin note to top"}
                            >
                              <Pin className={`w-3 h-3 ${viewingNote.pinned ? 'fill-current text-amber-500' : ''}`} />
                              <span>{viewingNote.pinned ? 'Pinned' : 'Pin'}</span>
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1.5 block font-mono">
                            Created: {viewingNote.createdAt || viewingNote.updatedAt || 'Just now'}
                          </p>
                        </div>

                        <div className="flex-1 overflow-y-auto leading-relaxed select-text">
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-black mb-1.5">
                            Note Content
                          </span>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed"
                            style={{ color: themeMode === ThemeMode.LIGHT ? '#475569' : '#E2E8F0' }}
                          >
                            {viewingNote.content || <em className="text-slate-500">No content in this note.</em>}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 uppercase tracking-widest block font-black">
                              Note Title
                            </label>
                            <input 
                              type="text" 
                              value={noteTitle}
                              onChange={(e) => setNoteTitle(e.target.value)}
                              placeholder="Title"
                              className="w-full bg-transparent border-b-2 font-semibold text-sm py-2 px-1 focus:outline-none transition-all duration-300 focus:border-current"
                              style={{
                                borderColor: themeMode === ThemeMode.LIGHT ? '#E2E8F0' : '#334155',
                                color: themeMode === ThemeMode.LIGHT ? '#0F172A' : '#F8FAFC',
                              }}
                              required
                            />
                            <div className="flex items-center space-x-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setNotePinned(!notePinned)}
                                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-[10px] uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                                  notePinned
                                    ? 'text-amber-500 bg-amber-500/10 border-amber-500/40 shadow-xs'
                                    : themeMode === ThemeMode.LIGHT
                                      ? 'text-slate-400 bg-slate-50 border-slate-200 hover:text-slate-600 hover:bg-slate-100'
                                      : 'text-slate-500 border-transparent hover:bg-slate-800 hover:text-slate-300'
                                }`}
                              >
                                <Pin className={`w-3 h-3 ${notePinned ? 'fill-current text-amber-500' : ''}`} />
                                <span>{notePinned ? 'Pinned to Top' : 'Pin to Top'}</span>
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 uppercase tracking-widest block font-black">
                              Note Content
                            </label>
                            <div className="relative rounded-xl border p-2.5"
                              style={{
                                backgroundColor: themeMode === ThemeMode.LIGHT ? '#FAF9F6' : '#0B0F19',
                                borderColor: themeMode === ThemeMode.LIGHT ? '#E2E8F0' : '#1E293B',
                              }}
                            >
                              <textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                placeholder="Note anything "
                                rows={10}
                                className="w-full bg-transparent text-xs focus:outline-none resize-none leading-relaxed"
                                style={{
                                  color: themeMode === ThemeMode.LIGHT ? '#334155' : '#E2E8F0',
                                }}
                              ></textarea>
                            </div>
                          </div>
                        </div>

                        <button 
                          type="button"
                          onClick={handleConfirmEditInViewing}
                          className="w-full py-3.5 font-bold rounded-xl text-[11px] uppercase tracking-wider text-white mt-5 active:scale-95 transition-transform flex items-center justify-center space-x-1 shadow-md cursor-pointer"
                          style={{
                            background: `linear-gradient(135deg, ${selectedPreset.primaryColorHex} 0%, ${selectedPreset.accentColorHex}C0 100%)`,
                            boxShadow: `0 4px 14px ${selectedPreset.primaryColorHex}40`
                          }}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          <span>Confirm Changes</span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : isEditorActive ? (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex-1 flex flex-col p-5 overflow-y-auto min-h-0 relative select-none"
                >
                  {/* Classical Design Header */}
                  <div className="flex justify-between items-center pb-3 border-b border-dashed mb-5"
                    style={{ borderColor: themeMode === ThemeMode.LIGHT ? '#E2E8F0' : '#334155' }}
                  >
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-slate-400">
                        {editingNote ? 'Modify Entry' : 'New Entry'}
                      </span>
                      <h3 className="text-[16px] font-sans font-black tracking-tight mt-0.5"
                        style={{ color: themeMode === ThemeMode.LIGHT ? '#1E293B' : '#F8FAFC' }}
                      >
                        {editingNote ? 'Edit Flutter Note' : 'Create Classical Note'}
                      </h3>
                    </div>
                    
                    <button 
                      type="button"
                      onClick={() => {
                        setIsEditorActive(false);
                        setEditingNote(null);
                        setNoteTitle('');
                        setNoteContent('');
                      }}
                      className="p-2 rounded-full border transition-all duration-200 cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95"
                      style={{ 
                        backgroundColor: themeMode === ThemeMode.LIGHT ? '#FFFFFF' : '#1E293B',
                        borderColor: themeMode === ThemeMode.LIGHT ? '#E2E8F0' : '#475569',
                        color: themeMode === ThemeMode.LIGHT ? '#475569' : '#CBD5E1',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}
                      title="Close Draft"
                    >
                      <X className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>

                  <form 
                    onSubmit={editingNote ? handleUpdateNote : handleAddNewNote}
                    className="flex-1 flex flex-col justify-between text-left"
                  >
                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 uppercase tracking-widest block font-black">
                          note title
                        </label>
                        <input 
                          type="text" 
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          placeholder="Title"
                          className="w-full bg-transparent border-b-2 font-semibold text-sm py-2 px-1 focus:outline-none transition-all duration-300 focus:border-current"
                          style={{
                            borderColor: themeMode === ThemeMode.LIGHT ? '#E2E8F0' : '#334155',
                            color: themeMode === ThemeMode.LIGHT ? '#0F172A' : '#F8FAFC',
                          }}
                          required
                        />
                        <div className="flex items-center space-x-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setNotePinned(!notePinned)}
                            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-[10px] uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                              notePinned
                                ? 'text-amber-500 bg-amber-500/10 border-amber-500/40 shadow-xs'
                                : themeMode === ThemeMode.LIGHT
                                  ? 'text-slate-400 bg-slate-50 border-slate-200 hover:text-slate-600 hover:bg-slate-100'
                                  : 'text-slate-500 border-transparent hover:bg-slate-800 hover:text-slate-300'
                            }`}
                          >
                            <Pin className={`w-3 h-3 ${notePinned ? 'fill-current text-amber-500' : ''}`} />
                            <span>{notePinned ? 'Pinned to Top' : 'Pin to Top'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 uppercase tracking-widest block font-black">
                          Note content
                        </label>
                        <div className="relative rounded-xl border p-2.5"
                          style={{
                            backgroundColor: themeMode === ThemeMode.LIGHT ? '#FAF9F6' : '#0B0F19',
                            borderColor: themeMode === ThemeMode.LIGHT ? '#E2E8F0' : '#1E293B',
                          }}
                        >
                          <textarea
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            placeholder="Note anything "
                            rows={8}
                            className="w-full bg-transparent text-xs focus:outline-none resize-none leading-relaxed"
                            style={{
                              color: themeMode === ThemeMode.LIGHT ? '#334155' : '#E2E8F0',
                            }}
                          ></textarea>
                        </div>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3.5 font-bold rounded-xl text-[11px] uppercase tracking-wider text-white mt-5 active:scale-95 transition-transform flex items-center justify-center space-x-1 shadow-md cursor-pointer"
                      style={{
                        background: `linear-gradient(135deg, ${selectedPreset.primaryColorHex} 0%, ${selectedPreset.accentColorHex}C0 100%)`,
                        boxShadow: `0 4px 14px ${selectedPreset.primaryColorHex}40`
                      }}
                    >
                      <span>{editingNote ? 'Save Draft' : 'Create Entry'}</span>
                    </button>
                  </form>
                </motion.div>
              ) : (
                <>
                  {/* 1. TOP HEADER (Account Details, Premium Coins Badge) */}
                  {activeTab !== 2 ? (
                <div className="px-4 py-2 mt-4 flex justify-between items-center z-10">
                  
                  {/* Account Details */}
                  {activeTab !== 1 ? (
                    <div className="flex items-center space-x-1.5 cursor-pointer group" onClick={() => setIsProfileDrawerOpen(true)}>
                      <div className="relative">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer border-2 transition-all duration-300 group-hover:scale-110 active:scale-95 overflow-hidden"
                          style={{ 
                            borderColor: themeMode === ThemeMode.LIGHT ? '#00A372' : 'rgba(255, 255, 255, 0.45)',
                            background: `linear-gradient(180deg, ${selectedPreset.accentColorHex} 0%, ${selectedPreset.accentColorHex}B0 100%)`,
                            boxShadow: 'inset 0 2px 3px rgba(255, 255, 255, 0.45), inset 0 -2px 3px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.3)',
                          }}
                        >
                          {userAccount.avatarUrl ? (
                            <img 
                              src={userAccount.avatarUrl} 
                              alt="User Avatar" 
                              className="w-full h-full rounded-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-white text-[10px] font-black uppercase tracking-tight select-none">
                              {getInitials(userAccount.name)}
                            </span>
                          )}
                        </div>
                        {/* Tiny status indicator */}
                        <span className="absolute bottom-0 right-0 w-2 h-2 bg-teal-400 rounded-full ring-1.5 ring-slate-900"></span>
                      </div>

                      {/* Configurable account name label */}
                      <div className="max-w-[100px]">
                        <div 
                          className="px-2 py-0.5 text-[9.5px] font-black rounded-full tracking-wide truncate max-h-[22px] uppercase border transition-all duration-300 group-hover:scale-105 select-none cursor-pointer"
                          style={{ 
                            background: `linear-gradient(180deg, ${selectedPreset.accentColorHex} 0%, ${selectedPreset.accentColorHex}C0 100%)`,
                            borderColor: themeMode === ThemeMode.LIGHT ? '#00A372' : 'rgba(255, 255, 255, 0.4)',
                            borderWidth: '1.5px',
                            boxShadow: 'inset 0 1.5px 3px rgba(255, 255, 255, 0.4), inset 0 -1.5px 3px rgba(0, 0, 0, 0.25), 0 3px 6px rgba(0, 0, 0, 0.25)',
                            color: '#FFFFFF',
                            textShadow: '0 1px 1.5px rgba(0, 0, 0, 0.3)'
                          }}
                        >
                          {userAccount.name || 'Account Name'}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div />
                  )}

                  {/* Premium Coins Interactive Badge (Neon Paperclip Styled) */}
                  <div className="relative">
                    <button
                      onClick={() => setIsBuyCoinsOpen(true)}
                      className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-black transition-all hover:scale-105 active:scale-95 border-[1.5px] cursor-pointer shadow-sm"
                      style={{
                        background: themeMode === ThemeMode.LIGHT 
                          ? '#F1F5F9' 
                          : `linear-gradient(180deg, ${selectedPreset.primaryColorHex}20 0%, ${selectedPreset.primaryColorHex}05 100%)`,
                        color: themeMode === ThemeMode.LIGHT ? '#0F172A' : '#FFFFFF',
                        borderColor: selectedPreset.primaryColorHex,
                        boxShadow: `inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 0 10px ${selectedPreset.primaryColorHex}66`,
                      }}
                    >
                      <PremiumPaperclipIcon 
                        className="w-3.5 h-3.5 animate-pulse shrink-0" 
                        glowColor={selectedPreset.primaryColorHex} 
                      />
                      <span className={`drop-shadow-[0_1px_1px_rgba(0,0,0,0.75)] uppercase tracking-wider font-extrabold ${themeMode === ThemeMode.LIGHT ? 'text-slate-905' : 'text-teal-100'}`}>
                        +{userAccount.premiumCoins}
                      </span>
                    </button>

                    {/* Coin float alert animation text */}
                    {coinFloatText.map(item => (
                      <span 
                        key={item.id}
                        className="absolute -top-6 right-2 text-xs text-teal-300 font-black animate-bounce z-40 bg-slate-950 px-1 py-0.5 rounded border border-teal-500/30 shadow"
                      >
                        {item.text}
                      </span>
                    ))}
                  </div>

                </div>
              ) : (
                <div className="mt-6"></div>
              )}

              {/* Central Top Dynamic Header Label */}
              <div className="px-5 py-1 text-center z-10 mt-1">
                {activeTab === 0 && (
                  <h2 className="text-[20px] font-black tracking-tight mt-0.5">Notes</h2>
                )}
                {activeTab === 1 && (
                  <h2 className="text-[22px] font-black tracking-widest uppercase text-center mt-2.5" style={{ color: selectedPreset.primaryColorHex }}>
                    Shop
                  </h2>
                )}
                {activeTab === 2 && (
                  <div className="flex items-center justify-between w-full animate-fade-in">
                    <div className="flex items-center bg-slate-900/45 px-2.5 py-1 rounded-full border border-slate-800/40 shadow-inner overflow-hidden">
                      {/* Premium vertical themed color bar */}
                      <div 
                        className="w-1 h-4.5 rounded-full shrink-0 relative z-20"
                        style={{
                          backgroundColor: selectedPreset.primaryColorHex,
                          boxShadow: `0 0 10px ${selectedPreset.primaryColorHex}`
                        }}
                      />

                      {/* Slide-out hidden mask container */}
                      <div className="overflow-hidden flex items-center h-5 relative z-10 pl-1.5">
                        <motion.span 
                          initial={{ x: "-105%", opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.15, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                          className="text-[12px] font-black tracking-[0.15em] text-white uppercase select-none block leading-none"
                        >
                          NEO<span style={{ color: selectedPreset.primaryColorHex }}>TE</span>
                        </motion.span>
                      </div>
                    </div>
                    {/* Upper right side pencil edit trigger */}
                    <button 
                      onClick={() => {
                        setIsEditingProfile(prev => !prev);
                        triggerNotification(isEditingProfile ? 'Switched back to profile view' : 'Switched to profile editing form!');
                      }}
                      className="p-1 rounded-full transition-transform active:scale-95 cursor-pointer"
                      style={{ color: selectedPreset.primaryColorHex }}
                      title="Edit Profile Info"
                    >
                      <Pencil className="w-4.5 h-4.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* 2. DYNAMIC MAIN CONTENT VIEWPORTS BASED ON TAB */}
              <div className="flex-1 overflow-hidden min-h-0 relative z-10 select-none">
                <AnimatePresence initial={false}>
                  <motion.div
                    key={activeTab}
                    custom={slideDirection}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "spring", stiffness: 420, damping: 35 }}
                    className="absolute inset-0 px-4 py-2 overflow-y-auto flex flex-col justify-start scrollbar-none"
                  >
                
                {/* SCREEN: HOME PAGE (NOTES LISTINGS) */}
                {activeTab === 0 && (
                  <div className="h-full flex flex-col justify-between space-y-2">
                    
                    {/* Interactive Clickable Box/Container acting as primary Notes Display Area (2/3 of vertical space) */}
                    <div 
                      onClick={() => {
                        triggerNotification('Notes container clicked! Opening detailed note view.');
                        if (notes.length > 0) {
                          startViewing(notes[0]);
                        } else {
                          startCreating();
                        }
                      }}
                      className="rounded-2xl p-3 border-2 flex flex-col h-[64%] flex-none cursor-pointer transition-all duration-300 group/container"
                      style={{
                        backgroundColor: themeMode === ThemeMode.DARK ? 'rgba(255,255,255,0.02)' : 'rgba(241,245,249,0.7)',
                        borderColor: selectedPreset.primaryColorHex,
                        boxShadow: `0 0 16px ${selectedPreset.primaryColorHex}60, inset 0 0 10px ${selectedPreset.primaryColorHex}20`
                      }}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Notes Display Area</span>
                        <div className="flex space-x-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation(); // Avoid triggering container click
                              startCreating();
                            }}
                            className="p-1 rounded-full text-white transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer border shadow-sm"
                            style={{
                              backgroundColor: `${selectedPreset.primaryColorHex}25`,
                              borderColor: selectedPreset.primaryColorHex,
                              color: selectedPreset.primaryColorHex
                            }}
                            title="Add a custom note"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </div>
                      </div>

                      {/* Display elements inside Notes section */}
                      <div 
                        className="space-y-1.5 flex-1 overflow-y-auto pr-1 liquid-bubble-scroll min-h-0"
                        style={{ '--slider-color': selectedPreset.accentColorHex } as React.CSSProperties}
                      >
                        {firebaseLoading ? (
                          <div className="h-full flex flex-col items-center justify-center text-center p-2">
                            <RefreshCw className="w-5 h-5 animate-spin text-teal-400" style={{ color: selectedPreset.primaryColorHex }} />
                            <p className="text-[10px] font-bold mt-2 text-slate-400">Loading Cloud Notes...</p>
                          </div>
                        ) : notes.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center p-2 text-slate-400/80 font-bold text-sm tracking-wider uppercase">
                            empty
                          </div>
                        ) : (
                          [...notes]
                          .sort((a, b) => {
                            const pinA = a.pinned ? 1 : 0;
                            const pinB = b.pinned ? 1 : 0;
                            return pinB - pinA;
                          })
                          .map((note, index) => (
                            <div 
                              key={note.id}
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent container click event duplicate
                                startViewing(note);
                              }}
                              className="p-3 rounded-xl transition-all hover:translate-x-1 text-left relative overflow-hidden group shadow-xs cursor-pointer flex justify-between items-center"
                              style={{
                                backgroundColor: themeMode === ThemeMode.DARK ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
                                border: note.pinned 
                                  ? `1px solid rgba(245, 158, 11, 0.4)`
                                  : `1px solid ${themeMode === ThemeMode.DARK ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`
                              }}
                            >
                              {/* Sleek horizontal line indicator aligning with Wireframe Sketch bars */}
                              <div 
                                className="absolute top-0 left-0 right-0 h-[3px]"
                                style={{ backgroundColor: note.pinned ? '#F59E0B' : (index % 2 === 0 ? selectedPreset.accentColorHex : selectedPreset.primaryColorHex) }}
                              ></div>
                              
                              <div className="flex flex-col flex-1 min-w-0 pr-4">
                                <div className="flex items-center space-x-1">
                                  <h4 className="text-xs font-bold truncate max-w-[155px]" style={{ color: themeMode === ThemeMode.DARK ? '#F8FAFC' : '#1E293B' }}>
                                    {note.title}
                                  </h4>
                                  {note.pinned && (
                                    <Pin className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0 transform -rotate-12 animate-pulse" />
                                  )}
                                </div>
                                <span className="text-[9px] opacity-65 mt-0.5" style={{ color: themeMode === ThemeMode.DARK ? '#94A3B8' : '#64748B' }}>
                                  Created: {note.createdAt || note.updatedAt || 'Just now'}
                                </span>
                              </div>

                              <div className="flex items-center space-x-1 shrink-0">
                                <button
                                  onClick={(e) => handleTogglePin(note, e)}
                                  className={`p-1 rounded transition-all scale-95 hover:scale-105 border ${
                                    note.pinned 
                                      ? 'text-amber-500 bg-amber-50 border-amber-300 hover:bg-amber-100' 
                                      : themeMode === ThemeMode.LIGHT 
                                        ? 'text-slate-400 bg-slate-50 border-slate-200 hover:text-slate-600 hover:bg-slate-100' 
                                        : 'text-slate-500 hover:text-slate-300 border-transparent hover:bg-slate-800'
                                  }`}
                                  title={note.pinned ? "Unpin note" : "Pin note to top"}
                                >
                                  <Pin className={`w-3.5 h-3.5 ${note.pinned ? 'fill-current' : ''}`} />
                                </button>

                                <button
                                  onClick={(e) => handleDeleteNote(note.id, e)}
                                  className={`p-1 rounded transition-all scale-95 hover:scale-105 border ${
                                    themeMode === ThemeMode.LIGHT
                                      ? 'text-red-600 bg-red-50 border-red-500/70 hover:bg-red-100'
                                      : 'text-red-400 hover:text-red-600 border-transparent hover:bg-slate-800'
                                  }`}
                                  title="Delete note"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Small instructions tooltip helper */}
                      <p className={`text-[9px] font-bold text-center mt-1.5 ${themeMode === ThemeMode.DARK ? 'text-[#00C087] animate-pulse' : 'text-slate-500'}`}>
                        ⚡ Click Container to Open Editor
                      </p>
                    </div>

                    {/* 3. MID-SECTION QUICK LINKS (1/3 of vertical space, using small horizontal icons) */}
                    <div className="h-[32%] flex flex-col justify-center min-h-0">
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 block mb-1 text-left">Quick Links</span>
                      <div className="grid grid-cols-4 gap-2 bg-slate-900/10 dark:bg-black/20 p-2 rounded-xl border border-slate-500/5">
                        
                        {/* Facebook icon button with label below */}
                        <div className="flex flex-col items-center space-y-0.5">
                          <button
                            onClick={() => triggerNotification('Mock Integration: Sharing notes with Facebook feed!')}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 text-white cursor-pointer"
                            style={{
                              background: 'linear-gradient(135deg, #1877F2 0%, #166FE5 100%)',
                              border: themeMode === ThemeMode.LIGHT ? '2.5px solid #041E15' : '1.5px solid rgba(255, 255, 255, 0.45)',
                              boxShadow: 'inset 0 1.5px 2px rgba(255, 255, 255, 0.4), inset 0 -1.5px 2px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.2)'
                            }}
                            title="Share on Facebook"
                          >
                            <Facebook className={`w-4 h-4 fill-current stroke-none ${themeMode === ThemeMode.LIGHT ? 'p-0.5 border border-white rounded-full' : ''}`} />
                          </button>
                          <span className="text-[8.5px] font-black opacity-80 select-none">Share</span>
                        </div>

                        {/* AI Copilot icon button with label below */}
                        <div className="flex flex-col items-center space-y-0.5">
                          <button
                            onClick={() => triggerNotification('Mock Integration: AI Copilot Assistant Chat initialized!')}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 text-white cursor-pointer"
                            style={{
                              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                              border: themeMode === ThemeMode.LIGHT ? '2.5px solid #041E15' : '1.5px solid rgba(255, 255, 255, 0.45)',
                              boxShadow: 'inset 0 1.5px 2px rgba(255, 255, 255, 0.4), inset 0 -1.5px 2px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.2)'
                            }}
                            title="AI Copilot Chat"
                          >
                            <MessageSquare className={`w-4 h-4 text-white ${themeMode === ThemeMode.LIGHT ? 'p-0.5 border border-white rounded-full' : ''}`} />
                          </button>
                          <span className="text-[8.5px] font-black opacity-80 select-none">AI Chat</span>
                        </div>

                        {/* Export/Copy Drafts button with label below */}
                        <div className="flex flex-col items-center space-y-0.5">
                          <button
                            onClick={() => {
                              if (notes.length === 0) {
                                triggerNotification('No notes available to export! Please add a note first.');
                                return;
                              }
                              const text = notes.map(n => `[${n.title}]\n${n.content}\n`).join('\n');
                              navigator.clipboard.writeText(text);
                              triggerNotification('Copy success: Placed drafts onto clipboard!');
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 text-white cursor-pointer"
                            style={{
                              background: 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)',
                              border: themeMode === ThemeMode.LIGHT ? '2.5px solid #041E15' : '1.5px solid rgba(255, 255, 255, 0.45)',
                              boxShadow: 'inset 0 1.5px 2px rgba(255, 255, 255, 0.4), inset 0 -1.5px 2px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.2)'
                            }}
                            title="Export Notes to Clipboard"
                          >
                            <Download className={`w-4 h-4 text-white ${themeMode === ThemeMode.LIGHT ? 'p-0.5 border border-white rounded-full' : ''}`} />
                          </button>
                          <span className="text-[8.5px] font-black opacity-80 select-none">Copy</span>
                        </div>

                        {/* Create Shortcut icon button with label below */}
                        <div className="flex flex-col items-center space-y-0.5">
                          <button
                            onClick={() => startCreating()}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 text-white cursor-pointer"
                            style={{
                              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                              border: themeMode === ThemeMode.LIGHT ? '2.5px solid #041E15' : '1.5px solid rgba(255, 255, 255, 0.45)',
                              boxShadow: 'inset 0 1.5px 2px rgba(255, 255, 255, 0.4), inset 0 -1.5px 2px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.2)'
                            }}
                            title="New Note Draft"
                          >
                            <Plus className={`w-4 h-4 text-white ${themeMode === ThemeMode.LIGHT ? 'p-0.5 border border-white rounded-full' : ''}`} />
                          </button>
                          <span className="text-[8.5px] font-black opacity-80 select-none">New Draft</span>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {/* SCREEN: SHOP PAGE PREVIEW */}
                {activeTab === 1 && (
                  <div className="w-full flex flex-col space-y-3.5 select-none text-left">
                    {/* Header */}
                    <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 shadow-xs transition-colors duration-300 ${
                      themeMode === ThemeMode.LIGHT 
                        ? 'bg-slate-50 border-slate-200' 
                        : 'bg-slate-900/30 border-slate-800/60'
                    }`}>
                      <div>
                        <h4 className="text-xs font-black flex items-center gap-1.5" style={{ color: selectedPreset.primaryColorHex }}>
                          <ShoppingBag className="w-4 h-4 animate-bounce" /> CLIP Theme Shop
                        </h4>
                        <p className="text-[8.5px] text-slate-400 mt-0.5">Acquire premium holographic theme colors</p>
                      </div>
                      <div 
                        onClick={() => setIsBuyCoinsOpen(true)}
                        className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border cursor-pointer hover:scale-105 active:scale-95 transition-all shrink-0"
                        style={{
                          background: `${selectedPreset.primaryColorHex}15`,
                          color: selectedPreset.primaryColorHex,
                          borderColor: `${selectedPreset.primaryColorHex}4D`,
                          boxShadow: `0 0 10px ${selectedPreset.primaryColorHex}15`
                        }}
                      >
                        <PremiumPaperclipIcon className="w-3.5 h-3.5 animate-pulse" glowColor={selectedPreset.primaryColorHex} />
                        <span>{userAccount.premiumCoins} CLIP</span>
                      </div>
                    </div>

                    {/* Section Header */}
                    <div className="flex items-center justify-between px-1 shrink-0">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Colour Theme Selection
                      </span>
                      <span className="text-[8px] font-extrabold text-slate-500">
                        ({ownedThemes.length}/{dynamicShopThemes.length} UNLOCKED)
                      </span>
                    </div>

                    {/* Grid of 4 Color Themes */}
                    <div className="grid grid-cols-2 gap-2 overflow-y-auto pb-16 scrollbar-none flex-1">
                      {dynamicShopThemes.map((theme) => {
                        const isOwned = ownedThemes.includes(theme.color);
                        const isActive = selectedPreset.primaryColorHex.toLowerCase() === theme.color.toLowerCase();

                        return (
                          <div
                            key={theme.id}
                            style={{
                              borderColor: isActive 
                                ? theme.color 
                                : themeMode === ThemeMode.LIGHT 
                                  ? '#E2E8F0' 
                                  : '#1E293B',
                              boxShadow: isActive ? `0 0 12px ${theme.color}35` : 'none',
                            }}
                            className={`p-2.5 rounded-2xl border-2 flex flex-col justify-between min-h-[150px] transition-all duration-300 relative overflow-hidden group ${
                              themeMode === ThemeMode.LIGHT 
                                ? 'bg-[#F8FAFC]' 
                                : 'bg-slate-900/40 hover:bg-slate-900/60'
                            }`}
                          >
                            {/* Glow gradient background */}
                            <div 
                              className="absolute -top-12 -right-12 w-24 h-24 rounded-full filter blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none"
                              style={{ backgroundColor: theme.color }}
                            />

                            {/* Card Content */}
                            <div>
                              <div className="flex justify-between items-start mb-1">
                                {/* Color circular sample */}
                                <div 
                                  className="w-4.5 h-4.5 rounded-full border-2 border-slate-950 flex items-center justify-center relative shadow-sm"
                                  style={{ 
                                    backgroundColor: theme.color,
                                    boxShadow: `0 0 8px ${theme.color}A0`
                                  }}
                                >
                                  {isActive && <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3.5px]" />}
                                </div>

                                {isActive ? (
                                  <span 
                                    className="text-[7.5px] font-black uppercase tracking-wider text-slate-950 px-1 py-0.5 rounded-md flex items-center gap-0.5 shadow-sm"
                                    style={{ backgroundColor: theme.color }}
                                  >
                                    ACTIVE
                                  </span>
                                ) : isOwned ? (
                                  <span className="text-[7.5px] font-black uppercase tracking-wider bg-slate-500/20 text-slate-400 px-1 py-0.5 rounded-md">
                                    OWNED
                                  </span>
                                ) : (
                                  <span className="text-[8px] font-bold text-slate-500 bg-slate-800/10 px-1 py-0.5 rounded">
                                    LOCKED
                                  </span>
                                )}
                              </div>
 
                              <h5 className="text-[11px] font-black tracking-tight" style={{ color: theme.color }}>
                                {theme.name}
                              </h5>
                              <p className="text-[7.5px] text-slate-400 font-bold mb-0.5 tracking-wide uppercase">
                                {theme.secondaryName}
                              </p>
 
                              {/* Color palette sample boxes */}
                              <div className="flex space-x-1 my-1.5">
                                <div className="w-3 h-1.5 rounded-sm" style={{ backgroundColor: theme.color }} title="Primary" />
                                <div className="w-3 h-1.5 rounded-sm opacity-70" style={{ backgroundColor: theme.accent }} title="Accent" />
                                <div className="w-3 h-1.5 rounded-sm" style={{ backgroundColor: theme.darkBg }} title="Dark BG" />
                                <div className="w-3 h-1.5 rounded-sm" style={{ backgroundColor: theme.lightBg }} title="Light BG" />
                              </div>
                            </div>
 
                            {/* Action Area */}
                            <div className="mt-1 w-full">
                              {isActive ? (
                                <div 
                                  className="w-full text-center text-[8px] font-black py-1 rounded-lg flex items-center justify-center gap-1 border"
                                  style={{
                                    borderColor: `${theme.color}33`,
                                    color: theme.color,
                                    backgroundColor: `${theme.color}0D`
                                  }}
                                >
                                  Applied & Active
                                </div>
                              ) : isOwned ? (
                                <button
                                  type="button"
                                  onClick={() => applyShopTheme(theme.color)}
                                  className="w-full text-center text-[8.5px] font-black py-1 rounded-lg border-1.5 hover:scale-102 active:scale-98 transition-all hover:shadow-md cursor-pointer"
                                  style={{
                                    backgroundColor: theme.color,
                                    color: '#000000',
                                    borderColor: theme.color,
                                  }}
                                >
                                  Apply Theme
                                </button>
                              ) : (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[8px] px-0.5">
                                    <span className="text-slate-400 font-medium">Price:</span>
                                    <span className="font-extrabold flex items-center gap-0.5 text-amber-500">
                                      <PremiumPaperclipIcon className="w-2.5 h-2.5" glowColor={theme.color} />
                                      {theme.price.toLocaleString()}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => buyThemeColour(theme.id, theme.name, theme.price, theme.color)}
                                    className="w-full text-center text-[8.5px] font-black py-1.5 rounded-lg flex items-center justify-center gap-1 hover:scale-102 active:scale-98 transition-all cursor-pointer text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/60"
                                  >
                                    <Lock className="w-2.5 h-2.5" /> Buy Theme
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SCREEN: SETTINGS PAGE PREVIEW (HIGH FIDELITY GO MINT PROFILE SCREEN) */}
                {activeTab === 2 && (
                  <div className="w-full flex flex-col space-y-3.5 text-left pb-16">
                    {isEditingProfile ? (
                      /* PROFILE DETAILS EDIT FORM VIEW */
                      <form onSubmit={handleSaveProfile} className="space-y-3 pt-1 select-none">
                        <div className={`p-3 rounded-xl border ${
                          themeMode === ThemeMode.LIGHT ? 'bg-[#F8FAFC] border-slate-200' : 'bg-slate-900/40 border-slate-800/80'
                        }`}>
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-[#00C087] mb-2" style={{ color: selectedPreset.primaryColorHex }}>
                            Editing Profile Fields
                          </h4>
                          
                          <div className="space-y-2.5">
                             {/* CHOOSE AVATAR OPTION SECTION */}
                             <div className="border-b border-dashed pb-4 mb-3 flex flex-col items-center justify-center text-center" style={{ borderColor: themeMode === ThemeMode.LIGHT ? '#E2E8F0' : '#1E293B' }}>
                               <label className="text-[9.5px] uppercase font-black tracking-wider text-slate-400 block mb-2 text-center w-full">
                                 Profile Avatar Photo
                               </label>
                               
                               {/* Centered Circle Area for Avatar */}
                               <div className="relative group mb-3">
                                 <button
                                   type="button"
                                   onClick={() => document.getElementById('avatar-file-input')?.click()}
                                   className="w-20 h-20 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer relative shadow-md"
                                   style={{
                                     borderColor: selectedPreset.primaryColorHex,
                                     background: tempProfile.avatarUrl 
                                       ? 'transparent' 
                                       : `linear-gradient(180deg, ${selectedPreset.primaryColorHex} 0%, ${selectedPreset.accentColorHex}E0 100%)`,
                                     boxShadow: `0 4px 12px ${selectedPreset.primaryColorHex}30`
                                   }}
                                 >
                                   {tempProfile.avatarUrl ? (
                                     <img 
                                       src={tempProfile.avatarUrl} 
                                       alt="Avatar Preview" 
                                       className="w-full h-full object-cover" 
                                       referrerPolicy="no-referrer"
                                     />
                                   ) : (
                                     <span className="text-white text-base font-black tracking-tight uppercase">
                                       {getInitials(tempProfile.name)}
                                     </span>
                                   )}
                                   
                                   {/* Hover Overlay */}
                                   <div className="absolute inset-0 bg-slate-950/65 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200">
                                     <Camera className="w-5 h-5 mb-0.5 text-slate-200" />
                                     <span className="text-[7.5px] uppercase font-black tracking-widest text-slate-300">Change</span>
                                   </div>
                                 </button>
                                 
                                 {/* Tiny Indicator */}
                                 <div 
                                   className="absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-md border animate-pulse"
                                   style={{ 
                                     backgroundColor: selectedPreset.primaryColorHex,
                                     borderColor: themeMode === ThemeMode.LIGHT ? '#FFFFFF' : '#0B0F19'
                                   }}
                                 >
                                   <Camera className="w-3 h-3 stroke-[2.5]" />
                                 </div>
                               </div>
                               
                               {/* Hidden File Input */}
                               <input 
                                 id="avatar-file-input"
                                 type="file"
                                 accept="image/*"
                                 className="hidden"
                                 onChange={(e) => {
                                   const file = e.target.files?.[0];
                                   if (!file) return;
                                   if (file.size > 1.5 * 1024 * 1024) {
                                     triggerNotification('Image too large! Please select an image under 1.5MB.');
                                     return;
                                   }
                                   const reader = new FileReader();
                                   reader.onloadend = () => {
                                     setTempProfile(prev => ({
                                       ...prev,
                                       avatarUrl: reader.result as string
                                     }));
                                     triggerNotification('New avatar image loaded from device!');
                                   };
                                   reader.readAsDataURL(file);
                                 }}
                               />

                               {/* Action Buttons for Avatar */}
                               <div className="flex items-center space-x-2">
                                 <button
                                   type="button"
                                   onClick={() => document.getElementById('avatar-file-input')?.click()}
                                   className="px-3 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer border shadow-sm"
                                   style={{
                                     backgroundColor: themeMode === ThemeMode.LIGHT ? '#F1F5F9' : '#111827',
                                     borderColor: themeMode === ThemeMode.LIGHT ? '#CBD5E1' : '#1F2937',
                                     color: themeMode === ThemeMode.LIGHT ? '#334155' : '#D1D5DB'
                                   }}
                                 >
                                   Upload Image
                                 </button>
                                 {tempProfile.avatarUrl && (
                                   <button
                                     type="button"
                                     onClick={() => {
                                       setTempProfile(prev => ({ ...prev, avatarUrl: '' }));
                                       triggerNotification('Avatar reset to default theme color.');
                                     }}
                                     className="px-2.5 py-1 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/45 text-[9.5px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                                   >
                                     Remove
                                   </button>
                                 )}
                               </div>
                             </div>

                            <div>
                              <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Full Name</label>
                              <input 
                                type="text" 
                                value={tempProfile.name}
                                onChange={(e) => setTempProfile(p => ({ ...p, name: e.target.value }))}
                                className="w-full bg-slate-905 border border-slate-705/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:border-[#00C087] outline-none"
                                style={{
                                  backgroundColor: themeMode === ThemeMode.LIGHT ? '#FFFFFF' : '#0B0F19',
                                  color: themeMode === ThemeMode.LIGHT ? '#000000' : '#FFFFFF',
                                  borderColor: themeMode === ThemeMode.LIGHT ? '#E2E8F0' : '#334155'
                                }}
                                required
                              />
                            </div>

                            <div>
                              <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Phone Number</label>
                              <input 
                                type="text" 
                                value={tempProfile.phone || ''}
                                onChange={(e) => setTempProfile(p => ({ ...p, phone: e.target.value }))}
                                className="w-full bg-slate-905 border border-slate-705/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:border-[#00C087] outline-none"
                                style={{
                                  backgroundColor: themeMode === ThemeMode.LIGHT ? '#FFFFFF' : '#0B0F19',
                                  color: themeMode === ThemeMode.LIGHT ? '#000000' : '#FFFFFF',
                                  borderColor: themeMode === ThemeMode.LIGHT ? '#E2E8F0' : '#334155'
                                }}
                              />
                            </div>

                            <div>
                              <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Email Address</label>
                              <input 
                                type="email" 
                                value={tempProfile.email || ''}
                                onChange={(e) => setTempProfile(p => ({ ...p, email: e.target.value }))}
                                className="w-full bg-slate-905 border border-slate-705/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:border-[#00C087] outline-none"
                                style={{
                                  backgroundColor: themeMode === ThemeMode.LIGHT ? '#FFFFFF' : '#0B0F19',
                                  color: themeMode === ThemeMode.LIGHT ? '#000000' : '#FFFFFF',
                                  borderColor: themeMode === ThemeMode.LIGHT ? '#E2E8F0' : '#334155'
                                }}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">ID Code (Unchangeable)</label>
                                <input 
                                  type="text" 
                                  value={tempProfile.idCode || ''}
                                  readOnly
                                  disabled
                                  className="w-full bg-slate-905 border border-slate-705/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 cursor-not-allowed outline-none select-all opacity-80"
                                  style={{
                                    backgroundColor: themeMode === ThemeMode.LIGHT ? '#F1F5F9' : '#070a13',
                                    color: themeMode === ThemeMode.LIGHT ? '#64748B' : '#94A3B8',
                                    borderColor: themeMode === ThemeMode.LIGHT ? '#E2E8F0' : '#1e293b'
                                  }}
                                  title="Your User ID is fixed and deterministic for your account credential."
                                />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Country</label>
                                <input 
                                  type="text" 
                                  value={tempProfile.country || ''}
                                  onChange={(e) => setTempProfile(p => ({ ...p, country: e.target.value }))}
                                  className="w-full bg-slate-905 border border-slate-705/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:border-[#00C087] outline-none"
                                  style={{
                                    backgroundColor: themeMode === ThemeMode.LIGHT ? '#FFFFFF' : '#0B0F19',
                                    color: themeMode === ThemeMode.LIGHT ? '#000000' : '#FFFFFF',
                                    borderColor: themeMode === ThemeMode.LIGHT ? '#E2E8F0' : '#334155'
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2.5 pt-1">
                          <button 
                            type="button" 
                            onClick={() => setIsEditingProfile(false)}
                            className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl border cursor-pointer ${
                              themeMode === ThemeMode.LIGHT 
                                ? 'bg-[#F1F5F9] border-slate-300 text-slate-700 hover:bg-slate-200' 
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                            }`}
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit"
                            className="flex-1 py-2 text-white text-[10px] font-black uppercase rounded-xl cursor-pointer hover:opacity-95 shadow-md active:scale-97"
                            style={{
                              background: `linear-gradient(135deg, ${selectedPreset.primaryColorHex} 0%, ${selectedPreset.accentColorHex}E0 100%)`
                            }}
                          >
                            Save Details
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* PROFILE DISPLAY VIEW MODE */
                      <div className="space-y-3.5 select-none animate-none pb-4">
                        {/* 2. Visual Grid Cards matching exactly the spreadsheet */}
                        <div className="space-y-2">
                          {[
                            { label: 'Full Name', value: userAccount.name || '', icon: User },
                            { label: 'Phone', value: (userAccount.phone === 'N/A' ? '' : (userAccount.phone || '')), icon: Phone },
                            { label: 'Email', value: (userAccount.email === 'N/A' ? '' : (userAccount.email || '')), icon: Mail },
                            { label: 'Country', value: (userAccount.country === 'N/A' ? '' : (userAccount.country || '')), icon: Globe },
                          ].map((field, fidx) => {
                            const IconC = field.icon;
                            return (
                              <div 
                                key={fidx}
                                className={`rounded-xl p-2.5 px-3 flex items-center justify-between border transition-all ${
                                  themeMode === ThemeMode.LIGHT 
                                    ? 'bg-[#F8FAFC] hover:bg-white border-slate-200 shadow-3xs' 
                                    : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/60'
                                }`}
                              >
                                <div className="flex items-center space-x-3.5">
                                  {/* Circular custom colored icon holder */}
                                  <div 
                                    className="w-8.5 h-8.5 rounded-full flex items-center justify-center border transition-all"
                                    style={{
                                      backgroundColor: themeMode === ThemeMode.LIGHT 
                                        ? `${selectedPreset.primaryColorHex}15`
                                        : `${selectedPreset.primaryColorHex}1B`,
                                      borderColor: `${selectedPreset.primaryColorHex}2B`,
                                      color: selectedPreset.primaryColorHex
                                    }}
                                  >
                                    <IconC className="w-4 h-4 stroke-[2]" />
                                  </div>

                                  <div>
                                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider leading-none mb-0.5">
                                      {field.label}
                                    </span>
                                    <span className={`text-[12px] font-bold tracking-tight block ${
                                      themeMode === ThemeMode.LIGHT ? 'text-slate-800' : 'text-slate-100'
                                    }`}>
                                      {field.value}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* 3. Change Password Card widget */}
                        <div 
                          className={`rounded-2xl p-3.5 border ${
                            themeMode === ThemeMode.LIGHT 
                              ? 'bg-[#F8FAFC] border-slate-200' 
                              : 'bg-slate-900/40 border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div 
                              className="w-8.5 h-8.5 rounded-full flex items-center justify-center border shrink-0"
                              style={{
                                backgroundColor: `${selectedPreset.primaryColorHex}18`,
                                borderColor: `${selectedPreset.primaryColorHex}30`,
                                color: selectedPreset.primaryColorHex
                              }}
                            >
                              <Lock className="w-4 h-4 stroke-[2]" />
                            </div>
                            <div>
                              <h4 className={`text-[11px] font-extrabold ${
                                themeMode === ThemeMode.LIGHT ? 'text-slate-800' : 'text-slate-100'
                              }`}>
                                Change Password
                              </h4>
                              <p className="text-[9.5px] text-slate-400 mt-1 leading-normal">
                                Update your password and keep your account secure.
                              </p>
                            </div>
                          </div>

                          <button 
                            type="button"
                            onClick={() => {
                              setIsChangePasswordOpen(true);
                              setCurrentPassword('');
                              setNewPassword('');
                              setConfirmPassword('');
                            }}
                            className="w-full text-[10px] uppercase tracking-wider font-extrabold py-2 text-white mt-3.5 rounded-xl transition-all cursor-pointer hover:opacity-95 active:scale-98 text-center shadow"
                            style={{
                              background: `linear-gradient(135deg, ${selectedPreset.primaryColorHex} 0%, ${selectedPreset.accentColorHex}C0 100%)`,
                            }}
                          >
                            Change Password
                          </button>
                        </div>

                        {/* 3.5 Admin Panel Card option */}
                        {userAccount.role === 'Admin' && (
                          <div 
                            className={`rounded-2xl p-3.5 border ${
                              themeMode === ThemeMode.LIGHT 
                                ? 'bg-[#F8FAFC] border-slate-200' 
                                : 'bg-slate-900/40 border-slate-800/80'
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div 
                                className="w-8.5 h-8.5 rounded-full flex items-center justify-center border shrink-0"
                                style={{
                                  backgroundColor: `rgba(0, 192, 135, 0.15)`,
                                  borderColor: `rgba(0, 192, 135, 0.3)`,
                                  color: '#00C087'
                                }}
                              >
                                <Shield className="w-4 h-4 stroke-[2]" />
                              </div>
                              <div>
                                <h4 className={`text-[11px] font-extrabold ${
                                  themeMode === ThemeMode.LIGHT ? 'text-slate-800' : 'text-slate-100'
                                }`}>
                                  Admin Panel
                                </h4>
                                <p className="text-[9.5px] text-slate-400 mt-1 leading-normal">
                                  Manage real-time Firestore database shop catalog, items & prices.
                                </p>
                              </div>
                            </div>

                            <button 
                              type="button"
                              onClick={() => {
                                setIsAdminPanelOpen(true);
                              }}
                              className="w-full text-[10px] uppercase tracking-wider font-extrabold py-2 text-white mt-3.5 rounded-xl transition-all cursor-pointer hover:opacity-95 active:scale-98 text-center shadow"
                              style={{
                                background: `linear-gradient(135deg, ${selectedPreset.primaryColorHex} 0%, ${selectedPreset.accentColorHex}C0 100%)`,
                              }}
                            >
                              Open Admin Panel
                            </button>
                          </div>
                        )}

                        {/* 4. Delete Account Red outline button */}
                        <div className="pt-2">
                          <button 
                            type="button"
                            onClick={() => {
                              setIsDeleteAccountOpen(true);
                            }}
                            className="w-full text-center py-2.5 border border-red-500/25 text-red-400 hover:bg-red-500/10 active:scale-95 text-[10px] uppercase tracking-wider font-black rounded-xl transition-all cursor-pointer"
                          >
                            Delete Account
                          </button>
                        </div>

                      </div>
                    )}
                  </div>
                )}
                  </motion.div>
                </AnimatePresence>

              </div>

              {/* 4. BOTTOM FLOATING NAVIGATION BAR (Pill shape styled capsule navbar) */}
              <div className="p-4 z-20 mt-auto">
                <div 
                  className="rounded-full flex items-center justify-around h-16 px-4 border transition-all"
                  style={{
                    background: `linear-gradient(180deg, ${selectedPreset.accentColorHex} 0%, ${selectedPreset.accentColorHex}D0 100%)`,
                    borderColor: 'rgba(255, 255, 255, 0.45)',
                    borderWidth: '2.5px',
                    boxShadow: 'inset 0 4px 6px rgba(255, 255, 255, 0.45), inset 0 -4px 6px rgba(0, 0, 0, 0.25), 0 12px 24px rgba(0, 0, 0, 0.6), 0 4px 6px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  
                  {/* TAB: Home */}
                  <button 
                    onClick={() => {
                      logTabChangeWithDirection(0);
                      triggerNotification('Toggled: Home Screen Notes Area');
                    }}
                    className="flex-1 flex items-center justify-center py-3 px-4 rounded-full transition-all duration-300 mx-1 cursor-pointer hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: activeTab === 0 ? 'rgba(0, 0, 0, 0.25)' : 'transparent',
                      color: activeTab === 0 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                      boxShadow: activeTab === 0 
                        ? 'inset 0 3px 6px rgba(0, 0, 0, 0.45), 0 1px 2px rgba(255, 255, 255, 0.15)' 
                        : 'none',
                    }}
                  >
                    <HomeIcon className={`w-5.5 h-5.5 stroke-[2.5] ${themeMode === ThemeMode.LIGHT ? 'p-1 bg-white/25 rounded-md border-2 border-white/45 shadow-xs' : ''}`} />
                  </button>

                  {/* TAB: Shop */}
                  <button 
                    onClick={() => {
                      logTabChangeWithDirection(1);
                      triggerNotification('Toggled: Shop Screen Window');
                    }}
                    className="flex-1 flex items-center justify-center py-3 px-4 rounded-full transition-all duration-300 mx-1 cursor-pointer hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: activeTab === 1 ? 'rgba(0, 0, 0, 0.25)' : 'transparent',
                      color: activeTab === 1 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                      boxShadow: activeTab === 1 
                        ? 'inset 0 3px 6px rgba(0, 0, 0, 0.45), 0 1px 2px rgba(255, 255, 255, 0.15)' 
                        : 'none',
                    }}
                  >
                    <ShoppingBag className={`w-5.5 h-5.5 stroke-[2.5] ${themeMode === ThemeMode.LIGHT ? 'p-1 bg-white/25 rounded-md border-2 border-white/45 shadow-xs' : ''}`} />
                  </button>

                  {/* TAB: Setting */}
                  <button 
                    onClick={() => {
                      logTabChangeWithDirection(2);
                      triggerNotification('Toggled: Quick Config / Settings Window');
                    }}
                    className="flex-1 flex items-center justify-center py-3 px-4 rounded-full transition-all duration-300 mx-1 cursor-pointer hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: activeTab === 2 ? 'rgba(0, 0, 0, 0.25)' : 'transparent',
                      color: activeTab === 2 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                      boxShadow: activeTab === 2 
                        ? 'inset 0 3px 6px rgba(0, 0, 0, 0.45), 0 1px 2px rgba(255, 255, 255, 0.15)' 
                        : 'none',
                    }}
                  >
                    <SettingsIcon className={`w-5.5 h-5.5 stroke-[2.5] ${themeMode === ThemeMode.LIGHT ? 'p-1 bg-white/25 rounded-md border-2 border-white/45 shadow-xs' : ''}`} />
                  </button>

                </div>
              </div>
              </>
              )}

              {/* DELETE CONFIRMATION POP-UP MODAL */}
              {noteIdToDelete && (() => {
                const noteToDelete = notes.find(n => n.id === noteIdToDelete);
                return (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-[280px] shadow-2xl text-center">
                      <div className="w-12 h-12 bg-red-500/10 border border-red-500/25 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Trash2 className="w-6 h-6 stroke-[2]" />
                      </div>
                      
                      <h4 className="text-sm font-black text-white mb-1.5">Delete Note?</h4>
                      <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                        Are you sure you want to delete <span className="text-white font-bold">"{noteToDelete?.title || 'this note'}"</span>? This is permanent.
                      </p>

                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setNoteIdToDelete(null)}
                          className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={executeDeleteNote}
                          className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors shadow-lg shadow-red-950/50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* CHANGE PASSWORD EMULATOR INTERNAL POP-UP */}
              {isChangePasswordOpen && (
                <div className="absolute inset-0 bg-slate-955/85 backdrop-blur-md z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(10, 15, 30, 0.9)' }}>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-[280px] shadow-2xl text-left">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3 animate-pulse" style={{ backgroundColor: `${selectedPreset.primaryColorHex}18`, color: selectedPreset.primaryColorHex }}>
                      <Lock className="w-5 h-5 stroke-[2]" />
                    </div>
                    
                    <h4 className="text-sm font-black text-white mb-1">Change Password</h4>
                    <p className="text-[10px] text-slate-400 mb-3 leading-tight">Enter your current credential passcode to set a new password securely.</p>

                    <div className="space-y-2.5 mb-4">
                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Current Password</label>
                        <input 
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C087] outline-none"
                          style={{ borderColor: `${selectedPreset.primaryColorHex}30` }}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">New Password</label>
                        <input 
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C087] outline-none"
                          style={{ borderColor: `${selectedPreset.primaryColorHex}30` }}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Confirm Password</label>
                        <input 
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00C087] outline-none"
                          style={{ borderColor: `${selectedPreset.primaryColorHex}30` }}
                        />
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsChangePasswordOpen(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] uppercase transition-colors text-center cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!currentPassword) {
                            triggerNotification('Current password is required!');
                            return;
                          }
                          if (!newPassword) {
                            triggerNotification('New password cannot be empty!');
                            return;
                          }
                          if (newPassword.length < 6) {
                            triggerNotification('New password must be at least 6 characters!');
                            return;
                          }
                          if (newPassword !== confirmPassword) {
                            triggerNotification('Passwords do not match!');
                            return;
                          }

                          try {
                            await changeUserPassword(currentPassword, newPassword);
                            triggerNotification('Password updated successfully! 🎉');
                            setIsChangePasswordOpen(false);
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                          } catch (err: any) {
                            triggerNotification(err.message || 'Error updating password. Please verify current password.');
                          }
                        }}
                        className="flex-1 py-1.5 rounded-lg text-slate-950 font-bold text-[10px] uppercase transition-all hover:opacity-90 active:scale-95 text-center cursor-pointer"
                        style={{
                          background: `linear-gradient(135deg, ${selectedPreset.primaryColorHex} 0%, ${selectedPreset.accentColorHex}D0 100%)`
                        }}
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* DELETE ACCOUNT EMULATOR INTERNAL POP-UP */}
              {isDeleteAccountOpen && (
                <div className="absolute inset-0 bg-red-955/85 backdrop-blur-md z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15, 3, 3, 0.95)' }}>
                  <div className="bg-slate-900 border border-red-900/40 rounded-2xl p-5 w-full max-w-[280px] shadow-2xl text-center">
                    <div className="w-12 h-12 bg-red-500/10 border border-red-500/25 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Trash2 className="w-6 h-6 stroke-[2]" />
                    </div>
                    
                    <h4 className="text-sm font-black text-white mb-1.5">Delete Profile &amp; Reset?</h4>
                    <p className="text-[11.5px] text-slate-400 mb-4 leading-relaxed">
                      This will erase your custom profile data <span className="text-white font-bold">"{userAccount.name}"</span> and reset settings to standard defaults.
                    </p>

                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsDeleteAccountOpen(false)}
                        className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] uppercase transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          // Prevent background Firestore auto-sync hooks from firing during deletion
                          setHasInitialProfileLoaded(false);

                          try {
                            if (currentUser) {
                              // Securely scrub data from the cloud Firestore document to guarantee privacy
                              // (this covers cases where backend security rules restrict physical document deletion)
                              await updateDoc(doc(db, 'users', currentUser.uid), {
                                name: 'Deleted Account',
                                email: '',
                                phone: '',
                                premiumCoins: 0,
                                country: '',
                                purchaseHistory: [],
                                deviceSessions: [],
                                deleted: true
                              });
                            }
                          } catch (err: any) {
                            console.log("Pre-delete user data scrub complete or skipped:", err.message || err);
                          }

                          try {
                            if (currentUser) {
                              // Attempt physical doc deletion, catching errors silently (since some dbs restrict physical deletion)
                              await deleteDoc(doc(db, 'users', currentUser.uid));
                            }
                          } catch (err: any) {
                            console.log("Firestore collection clean complete or skipped:", err.message || err);
                          }

                          try {
                            // Call deleteUserAccount (handles standard Firebase Authentication deleteUser)
                            await deleteUserAccount();
                            localStorage.setItem('neote_delete_notice', 'Your profile and cloud credentials have been deleted successfully.');
                          } catch (err: any) {
                            console.log("Authentication credentials delete state:", err.message || err);
                            // If credentials are stale (requires-recent-login), execute a secure log out reset fallback
                            try {
                              await signOut(auth);
                            } catch (signOutErr) {
                              console.log("Session fallback status:", signOutErr);
                            }
                            localStorage.setItem('neote_delete_notice', 'Successfully reset account data. Recent cloud login record required for permanent backend credentials delete.');
                          }

                          // Record flag to open sign-up by default after the reload
                          localStorage.setItem('neote_show_signup_after_delete', 'true');

                          // Clear other user states from local storage
                          localStorage.removeItem('user_account_profile');
                          localStorage.removeItem('neote_selected_preset');
                          localStorage.removeItem('neote_owned_themes');
                          localStorage.removeItem('purchase_history_v2');
                          localStorage.removeItem('neote_device_sessions');
                          localStorage.removeItem('flutter_mockup_notes');
                          localStorage.removeItem('neote_is_guest_mode');
                          localStorage.removeItem('neote_logged_in');
                          localStorage.removeItem('neote_auth_user');

                          // Fully reload page and navigate back to sign up page
                          window.location.reload();
                        }}
                        className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] uppercase transition-colors shadow-lg shadow-red-950/50"
                      >
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SECURE DEVICES LOG POP-UP */}
              {isDevicesOpen && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fadeIn">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 w-full max-w-[310px] shadow-2xl text-left flex flex-col max-h-[90%] overflow-hidden">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h4 className="text-sm font-black text-white">Active Sessions</h4>
                        <p className="text-[10px] text-slate-400">Manage device authorize states</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setIsDevicesOpen(false)}
                        className="text-[10px] font-black px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg uppercase tracking-wider transition-colors active:scale-95"
                      >
                        Close
                      </button>
                    </div>

                    <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 scrollbar-none">
                      {deviceSessions.map((session) => {
                        const isCurrent = session.id === currentDeviceId;
                        return (
                          <div 
                            key={session.id}
                            className={`p-2.5 rounded-xl border transition-all text-xs flex flex-col space-y-1.5 ${
                              session.status === 'online' 
                                ? 'bg-slate-950/40 border-slate-800' 
                                : 'bg-slate-950/20 border-slate-900/60 opacity-60'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-2">
                                <span className="p-1 rounded bg-slate-800 text-purple-400">
                                  {session.type === 'desktop' ? (
                                    <Laptop className="w-3.5 h-3.5" />
                                  ) : session.type === 'tablet' ? (
                                    <Tablet className="w-3.5 h-3.5" />
                                  ) : (
                                    <Smartphone className="w-3.5 h-3.5" />
                                  )}
                                </span>
                                <div className="min-w-0">
                                  <div className="font-extrabold text-white text-[10.5px] truncate max-w-[130px] flex items-center gap-1">
                                    <span className="truncate">{session.name}</span>
                                    {isCurrent && (
                                      <span className="text-[7.5px] bg-teal-500/20 text-[#00C087] px-1 rounded uppercase tracking-wide flex-none">
                                        Current
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[8.5px] text-slate-400 truncate max-w-[155px]">{session.location}</p>
                                </div>
                              </div>

                              <div className="text-right flex-none">
                                {session.status === 'online' ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-black bg-emerald-500/15 text-[#00C087] uppercase tracking-wider">
                                    Online
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-black bg-slate-800 text-slate-400 uppercase tracking-wider">
                                    Offline
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="pt-1.5 border-t border-slate-800/60 flex justify-between items-center text-[9px]">
                              <div className="text-slate-500 space-y-0.5 leading-none">
                                <div><span className="font-bold text-slate-400">Log In:</span> {session.loginTime}</div>
                                {session.status === 'offline' && session.logoutTime && (
                                  <div><span className="font-bold text-red-400/80">Log Out:</span> {session.logoutTime}</div>
                                )}
                              </div>
                              
                              {!isCurrent && session.status === 'online' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeviceSessions(prev => prev.map(dev => {
                                      if (dev.id === session.id) {
                                        return {
                                          ...dev,
                                          status: 'offline',
                                          logoutTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today'
                                        };
                                      }
                                      return dev;
                                    }));
                                    triggerNotification(`Remotely logged out of ${session.name}!`);
                                  }}
                                  className="px-2 py-0.5 bg-red-950/50 border border-red-900/40 text-red-400 font-extrabold text-[9px] uppercase tracking-wide rounded hover:bg-red-900/30 transition-all active:scale-95"
                                >
                                  Log Out
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick Simulation Union Button */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const models = ['iPad Air Pro', 'Samsung S24 Ultra', 'Google Pixel 8', 'Firefox Linux Desktop'];
                          const types: ('mobile' | 'desktop' | 'tablet')[] = ['tablet', 'mobile', 'mobile', 'desktop'];
                          const randIdx = Math.floor(Math.random() * models.length);
                          
                          const targetName = models[randIdx];
                          const targetType = types[randIdx];

                          const newSession: DeviceSession = {
                            id: `dev-${Date.now()}`,
                            name: targetName,
                            type: targetType,
                            status: 'online',
                            loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
                            location: 'Chittagong, BD (IP: 103.145.23.' + Math.floor(Math.random() * 254) + ')'
                          };
                          
                          setDeviceSessions(prev => {
                            // Enforce 1 session per device - check if this simulated device exists
                            const existingIndex = prev.findIndex(s => s.name === targetName && s.type === targetType);
                            if (existingIndex !== -1) {
                              const updated = [...prev];
                              updated[existingIndex] = {
                                ...updated[existingIndex],
                                status: 'online',
                                loginTime: newSession.loginTime,
                                location: newSession.location
                              };
                              return updated;
                            } else {
                              return [newSession, ...prev];
                            }
                          });
                          triggerNotification(`Simulated login for ${targetName}!`);
                        }}
                        className="w-full py-1.5 rounded-lg text-slate-100 font-bold text-[9px] uppercase tracking-wider text-center transition-all bg-gradient-to-r hover:opacity-90 active:scale-97 border border-slate-700/60"
                        style={{
                          background: `linear-gradient(135deg, ${selectedPreset.primaryColorHex}D0 0%, ${selectedPreset.accentColorHex}A0 100%)`
                        }}
                      >
                        + Simulate Login on New Device
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* FLUTTER & FIREBASE DEVELOPER DELIVERABLES MODAL */}
              {isDevCodeModalOpen && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fadeIn">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-lg shadow-2xl text-left flex flex-col max-h-[95%] overflow-hidden">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="p-1 rounded bg-emerald-950/40 text-[#00C087] border border-[#00C087]/20" style={{ color: selectedPreset.primaryColorHex, borderColor: `${selectedPreset.primaryColorHex}30` }}>
                            <FileCode className="w-4 h-4" />
                          </span>
                          <h4 className="text-sm font-black text-white uppercase tracking-wider">Flutter & Firebase integration</h4>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Complete production-ready Dart source files & Security configurations.</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setIsDevCodeModalOpen(false)}
                        className="text-[10px] font-black px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg uppercase tracking-wider transition-colors active:scale-95 cursor-pointer"
                      >
                        Close
                      </button>
                    </div>

                    {/* File Selection Tabs */}
                    <div className="flex border-b border-slate-800 pb-2 space-x-1 mb-3 overflow-x-auto scrollbar-none shrink-0">
                      {(['model', 'service', 'auth', 'rules'] as const).map((tab) => {
                        const labels = {
                          model: 'user_model.dart',
                          service: 'firebase_service.dart',
                          auth: 'auth_integration.dart',
                          rules: 'firestore.rules',
                        };
                        const isActive = selectedDevFileTab === tab;
                        return (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setSelectedDevFileTab(tab)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                              isActive 
                                ? 'text-slate-950 font-black' 
                                : 'text-slate-400 hover:text-slate-200 bg-slate-900'
                            }`}
                            style={isActive ? { backgroundColor: selectedPreset.primaryColorHex } : {}}
                          >
                            {labels[tab]}
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick copy bar */}
                    <div className="flex justify-between items-center bg-slate-950/60 rounded-xl p-2 mb-3 border border-slate-800/80 shrink-0">
                      <span className="text-[9px] font-mono text-slate-400 px-2">
                        {selectedDevFileTab === 'model' && '✓ Serializable User profile state'}
                        {selectedDevFileTab === 'service' && '✓ Robust firestore write service with diagnostics'}
                        {selectedDevFileTab === 'auth' && '✓ Firebase signup & profile mapping block'}
                        {selectedDevFileTab === 'rules' && '✓ Strict requesting UID-matching security rule'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          let textToCopy = '';
                          if (selectedDevFileTab === 'model') {
                            textToCopy = `// user_model.dart\nimport 'package:cloud_firestore/cloud_firestore.dart';\n\nclass UserModel {\n  final String uid;\n  final String accountName;\n  final String email;\n  final String phoneNumber;\n  final String country;\n  final int coinBalance;\n  final List<String> ownedThemes;\n  final String activeTheme;\n  final LoginDeviceInfo loginDevice;\n\n  UserModel({\n    required this.uid,\n    required this.accountName,\n    required this.email,\n    required this.phoneNumber,\n    this.country = 'Bangladesh',\n    this.coinBalance = 343,\n    required this.ownedThemes,\n    required this.activeTheme,\n    required this.loginDevice,\n  });\n\n  Map<String, dynamic> toMap() {\n    return {\n      'uid': uid,\n      'accountName': accountName,\n      'email': email,\n      'phoneNumber': phoneNumber,\n      'country': country,\n      'coinBalance': coinBalance,\n      'ownedThemes': ownedThemes,\n      'activeTheme': activeTheme,\n      'loginDevice': loginDevice.toMap(),\n    };\n  }\n\n  factory UserModel.fromMap(Map<String, dynamic> map) {\n    return UserModel(\n      uid: map['uid'] ?? '',\n      accountName: map['accountName'] ?? '',\n      email: map['email'] ?? '',\n      phoneNumber: map['phoneNumber'] ?? '',\n      country: map['country'] ?? 'Bangladesh',\n      coinBalance: map['coinBalance'] is int ? map['coinBalance'] : (map['coinBalance'] as num?)?.toInt() ?? 0,\n      ownedThemes: List<String>.from(map['ownedThemes'] ?? []),\n      activeTheme: map['activeTheme'] ?? '',\n      loginDevice: LoginDeviceInfo.fromMap(map['loginDevice'] ?? {}),\n    );\n  }\n}`;
                          } else if (selectedDevFileTab === 'service') {
                            textToCopy = `// firebase_service.dart\nimport 'dart:io';\nimport 'package:cloud_firestore/cloud_firestore.dart';\nimport 'package:firebase_auth/firebase_auth.dart';\nimport 'user_model.dart';\n\nclass FirebaseService {\n  final FirebaseFirestore _db = FirebaseFirestore.instance;\n\n  Future<void> createNewUserInFirestore(UserModel user) async {\n    try {\n      print('--- FIRESTORE INITIATION START ---');\n      await _db.collection('users').doc(user.uid).set(\n            user.toMap(),\n            SetOptions(merge: true),\n          );\n      print('SUCCESS: User document created in Firestore!');\n    } on FirebaseException catch (e) {\n      print('DATABASE ERROR: Code: \${e.code}, Message: \${e.message}');\n      rethrow;\n    } catch (e) {\n      print('UNKNOWN ERROR: \$e');\n      rethrow;\n    }\n  }\n}`;
                          } else if (selectedDevFileTab === 'auth') {
                            textToCopy = `// auth_integration_logic.dart\nimport 'package:firebase_auth/firebase_auth.dart';\nimport 'user_model.dart';\nimport 'firebase_service.dart';\n\nclass AuthRepository {\n  final FirebaseAuth _auth = FirebaseAuth.instance;\n  final FirebaseService _dbService = FirebaseService();\n\n  Future<UserCredential?> signUpWithEmailAndPassword({\n    required String accountName,\n    required String email,\n    required String password,\n    required String phoneNumber,\n  }) async {\n    try {\n      UserCredential userCredential = await _auth.createUserWithEmailAndPassword(\n        email: email.trim(),\n        password: password,\n      );\n      final User? firebaseUser = userCredential.user;\n      if (firebaseUser != null) {\n        final LoginDeviceInfo deviceInfo = await _dbService.getDeviceInformation();\n        final UserModel newUser = UserModel(\n          uid: firebaseUser.uid,\n          accountName: accountName.trim(),\n          email: firebaseUser.email ?? email.trim(),\n          phoneNumber: phoneNumber.trim(),\n          country: 'Bangladesh',\n          coinBalance: 343,\n          ownedThemes: ['emerald_green', 'electric_neon_red'],\n          activeTheme: 'emerald_green',\n          loginDevice: deviceInfo,\n        );\n        await _dbService.createNewUserInFirestore(newUser);\n        return userCredential;\n      }\n    } catch (e) {\n      print('Signup/Auth Logic Error: \$e');\n      rethrow;\n    }\n    return null;\n  }\n}`;
                          } else {
                            textToCopy = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /users/{userId} {\n      allow read, create, update, delete: if request.auth != null && request.auth.uid == userId;\n    }\n  }\n}`;
                          }
                          navigator.clipboard.writeText(textToCopy);
                          triggerNotification('Code copied to your clipboard!');
                        }}
                        className="flex items-center space-x-1 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy Code</span>
                      </button>
                    </div>

                    {/* Code Preformatted Container */}
                    <div className="flex-1 overflow-y-auto rounded-xl bg-slate-950 p-3 border border-slate-800 text-left font-mono text-[10.5px] leading-relaxed scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                      {selectedDevFileTab === 'model' && (
                        <pre className="text-emerald-400">
{`// user_model.dart
import 'package:cloud_firestore/cloud_firestore.dart';

class UserModel {
  final String uid;
  final String accountName;
  final String email;
  final String phoneNumber;
  final String country;
  final int coinBalance;
  final List<String> ownedThemes;
  final String activeTheme;
  final LoginDeviceInfo loginDevice;

  UserModel({
    required this.uid,
    required this.accountName,
    required this.email,
    required this.phoneNumber,
    this.country = 'Bangladesh',
    this.coinBalance = 343,
    required this.ownedThemes,
    required this.activeTheme,
    required this.loginDevice,
  });

  Map<String, dynamic> toMap() {
    return {
      'uid': uid,
      'accountName': accountName,
      'email': email,
      'phoneNumber': phoneNumber,
      'country': country,
      'coinBalance': coinBalance,
      'ownedThemes': ownedThemes,
      'activeTheme': activeTheme,
      'loginDevice': loginDevice.toMap(),
    };
  }

  factory UserModel.fromMap(Map<String, dynamic> map) {
    return UserModel(
      uid: map['uid'] ?? '',
      accountName: map['accountName'] ?? '',
      email: map['email'] ?? '',
      phoneNumber: map['phoneNumber'] ?? '',
      country: map['country'] ?? 'Bangladesh',
      coinBalance: map['coinBalance'] is int 
          ? map['coinBalance'] 
          : (map['coinBalance'] as num?)?.toInt() ?? 0,
      ownedThemes: List<String>.from(map['ownedThemes'] ?? []),
      activeTheme: map['activeTheme'] ?? '',
      loginDevice: LoginDeviceInfo.fromMap(map['loginDevice'] ?? {}),
    );
  }
}

class LoginDeviceInfo {
  final String deviceName;
  final String deviceModel;
  final String osVersion;
  final DateTime lastLoginTimestamp;

  LoginDeviceInfo({
    required this.deviceName,
    required this.deviceModel,
    required this.osVersion,
    required this.lastLoginTimestamp,
  });

  Map<String, dynamic> toMap() {
    return {
      'deviceName': deviceName,
      'deviceModel': deviceModel,
      'osVersion': osVersion,
      'lastLoginTimestamp': Timestamp.fromDate(lastLoginTimestamp),
    };
  }

  factory LoginDeviceInfo.fromMap(Map<dynamic, dynamic> map) {
    DateTime parsedTime;
    if (map['lastLoginTimestamp'] is Timestamp) {
      parsedTime = (map['lastLoginTimestamp'] as Timestamp).toDate();
    } else if (map['lastLoginTimestamp'] is String) {
      parsedTime = DateTime.parse(map['lastLoginTimestamp']);
    } else {
      parsedTime = DateTime.now();
    }

    return LoginDeviceInfo(
      deviceName: map['deviceName'] ?? 'Unknown Device',
      deviceModel: map['deviceModel'] ?? 'Unknown Model',
      osVersion: map['osVersion'] ?? 'Unknown OS',
      lastLoginTimestamp: parsedTime,
    );
  }
}`}
                        </pre>
                      )}

                      {selectedDevFileTab === 'service' && (
                        <pre className="text-teal-400">
{`// firebase_service.dart
import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'user_model.dart';

class FirebaseService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  Future<void> createNewUserInFirestore(UserModel user) async {
    try {
      print('--- FIRESTORE INITIATION START ---');
      print('Document Path: users/\${user.uid}');
      
      await _db.collection('users').doc(user.uid).set(
            user.toMap(),
            SetOptions(merge: true),
          );

      print('SUCCESS: User document created in Firestore!');
    } on FirebaseException catch (e) {
      print('DATABASE ERROR: Code: \${e.code}, Message: \${e.message}');
      rethrow;
    } catch (e) {
      print('UNKNOWN ERROR: \$e');
      rethrow;
    }
  }

  Future<LoginDeviceInfo> getDeviceInformation() async {
    return LoginDeviceInfo(
      deviceName: 'Simulator/Web',
      deviceModel: 'Generic Device',
      osVersion: Platform.operatingSystem,
      lastLoginTimestamp: DateTime.now(),
    );
  }
}`}
                        </pre>
                      )}

                      {selectedDevFileTab === 'auth' && (
                        <pre className="text-sky-400">
{`// auth_integration_logic.dart
import 'package:firebase_auth/firebase_auth.dart';
import 'user_model.dart';
import 'firebase_service.dart';

class AuthRepository {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseService _dbService = FirebaseService();

  Future<UserCredential?> signUpWithEmailAndPassword({
    required String accountName,
    required String email,
    required String password,
    required String phoneNumber,
  }) async {
    try {
      print('--- AUTH SIGNUP START ---');
      
      // 1. Authenticate with Firebase Authentication
      UserCredential userCredential = await _auth.createUserWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );

      final User? firebaseUser = userCredential.user;

      if (firebaseUser != null) {
        // 2. Fetch runtime device parameters
        final LoginDeviceInfo deviceInfo = await _dbService.getDeviceInformation();

        // 3. Map values to UserModel
        final UserModel newUser = UserModel(
          uid: firebaseUser.uid,
          accountName: accountName.trim(),
          email: firebaseUser.email ?? email.trim(),
          phoneNumber: phoneNumber.trim(),
          country: 'Bangladesh',
          coinBalance: 343,
          ownedThemes: ['emerald_green', 'electric_neon_red'],
          activeTheme: 'emerald_green',
          loginDevice: deviceInfo,
        );

        // 4. Save directly under users/{uid} document path
        await _dbService.createNewUserInFirestore(newUser);

        print('Full account setup complete for: \$accountName');
        return userCredential;
      }
    } on FirebaseAuthException catch (e) {
      print('AUTHENTICATION ERROR: Code: \${e.code}, Message: \${e.message}');
      rethrow;
    } catch (e) {
      print('GENERAL WORKFLOW ERROR: \$e');
      rethrow;
    }
    return null;
  }
}`}
                        </pre>
                      )}

                      {selectedDevFileTab === 'rules' && (
                        <pre className="text-amber-400">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection rules: User can only read and write their own profile
    match /users/{userId} {
      allow read, create, update, delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}
                        </pre>
                      )}
                    </div>

                    {/* Notice */}
                    <div className="mt-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 text-[9px] text-slate-400 leading-relaxed shrink-0">
                      💡 <strong>Implementation Tip:</strong> Ensure that your <code>FirebaseFirestore</code> instance is initialized correctly in your Flutter entry block before calling any write functions.
                    </div>
                  </div>
                </div>
              )}

              {/* SLIDING PROFILE DRAWER FROM LEFT (MATCHING USER IMAGES IN APP THEME) */}
              <AnimatePresence>
                {isProfileDrawerOpen && (
                  <div className="absolute inset-0 z-50 overflow-hidden flex">
                    {/* Backdrop */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsProfileDrawerOpen(false)}
                      className="absolute inset-0 bg-black/70 backdrop-blur-[2px] cursor-pointer"
                    />

                    {/* Sliding Panel */}
                    <motion.div
                      initial={{ x: '-100%' }}
                      animate={{ x: '0' }}
                      exit={{ x: '-100%' }}
                      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                      style={{
                        backgroundColor: themeMode === ThemeMode.DARK ? '#000000' : '#FFFFFF',
                        color: themeMode === ThemeMode.DARK ? '#FFFFFF' : '#0F172A',
                        borderColor: themeMode === ThemeMode.DARK ? `${selectedPreset.primaryColorHex}33` : undefined
                      }}
                      className="absolute inset-y-0 left-0 w-[84%] flex flex-col h-full shadow-2xl overflow-hidden z-50 border-r"
                    >
                      {/* 1. Header with dynamic app theme and colour (NATURAL FLOW-BASED SIZING, NO STATIC OVERLAPPING HEIGHTS) */}
                      <div 
                        style={{
                          background: `linear-gradient(135deg, ${selectedPreset.accentColorHex}E0 0%, ${themeMode === ThemeMode.DARK ? '#000000' : '#E6F9F3'} 100%)`,
                          borderColor: `${selectedPreset.primaryColorHex}26`
                        }}
                        className="px-4 pb-5 pt-14 flex flex-col items-center text-center relative overflow-hidden shrink-0 border-b w-full"
                      >
                        {/* Upper-left corner: Brand Logo and Title (LOGO REMOVED, VERTICAL THEMED COLOR BAR ADDED) */}
                        <div className="absolute top-4 left-4 flex items-center bg-slate-950/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 shadow-lg overflow-hidden">
                          {/* Premium vertical themed color bar */}
                          <div 
                            className="w-1 h-4.5 rounded-full shrink-0 relative z-20"
                            style={{
                              backgroundColor: selectedPreset.primaryColorHex,
                              boxShadow: `0 0 10px ${selectedPreset.primaryColorHex}`
                            }}
                          />

                          {/* Slide-out hidden mask container */}
                          <div className="overflow-hidden flex items-center h-5 relative z-10 pl-1.5">
                            <motion.span 
                              initial={{ x: "-105%", opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.15, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                              className="text-[10px] font-black tracking-[0.15em] text-white uppercase select-none block"
                            >
                              NEO<span style={{ color: selectedPreset.primaryColorHex }}>TE</span>
                            </motion.span>
                          </div>
                        </div>

                        {/* Dimmed close tab trigger on right side */}
                        <button 
                          onClick={() => setIsProfileDrawerOpen(false)}
                          className="absolute top-3.5 right-3.5 p-1 rounded-full bg-black/10 hover:bg-black/25 text-white transition-all cursor-pointer border border-white/15"
                        >
                          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                        </button>

                        {/* STAGGERED INTRO CONTAINER FOR CORE PROFILE ELEMENTS (MADE MORE PROMINENT AND LARGER) */}
                        <motion.div 
                          className="flex flex-col items-center mt-auto w-full select-none"
                          initial="hidden"
                          animate="show"
                          variants={{
                            hidden: { opacity: 0 },
                            show: {
                              opacity: 1,
                              transition: {
                                staggerChildren: 0.08,
                                delayChildren: 0.1
                              }
                            }
                          }}
                        >
                          {/* 1. Staggered Avatar (Made grander and larger) */}
                          <motion.div 
                            variants={{
                              hidden: { scale: 0.5, opacity: 0, y: 15 },
                              show: { scale: 1, opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
                            }}
                            className="relative mb-2.5"
                          >
                            <div 
                              className="w-18 h-18 rounded-full border-2 p-0.5 flex items-center justify-center transition-transform hover:rotate-6 duration-500"
                              style={{ 
                                borderColor: themeMode === ThemeMode.LIGHT ? '#FFFFFF' : `${selectedPreset.primaryColorHex}BF`,
                                boxShadow: '0 6px 15px rgba(0, 0, 0, 0.35)'
                              }}
                            >
                              <div 
                                style={{ 
                                  background: `linear-gradient(180deg, ${selectedPreset.primaryColorHex} 0%, #011C11 100%)` 
                                }}
                                className="w-full h-full rounded-full flex items-center justify-center border border-white/20 overflow-hidden"
                              >
                                {userAccount.avatarUrl ? (
                                  <img 
                                    src={userAccount.avatarUrl} 
                                    alt="User Avatar" 
                                    className="w-full h-full rounded-full object-cover" 
                                    referrerPolicy="no-referrer" 
                                  />
                                ) : (
                                  <span className="text-white text-xl font-black tracking-tighter uppercase select-none">
                                    {getInitials(userAccount.name)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Live small green check badge */}
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-teal-400 rounded-full ring-2 ring-slate-950"></span>
                          </motion.div>

                          {/* 2. Account Name (Made larger and cleaner) */}
                          <motion.h3 
                            variants={{
                              hidden: { y: 10, opacity: 0 },
                              show: { y: 0, opacity: 1 }
                            }}
                            className="text-sm font-black tracking-wide leading-tight uppercase text-white drop-shadow-md text-ellipsis overflow-hidden max-w-[220px]"
                          >
                            {userAccount.name || 'User Account'}
                          </motion.h3>

                          {/* 3. Joined Date Label */}
                          <motion.p 
                            variants={{
                              hidden: { y: 8, opacity: 0 },
                              show: { y: 0, opacity: 0.75 }
                            }}
                            className="text-[9px] font-bold mt-0.5 text-white/70"
                          >
                            Joined: 01 Apr 2026
                          </motion.p>

                          {/* 4. Copyable Info Cards Container */}
                          <div className="w-full mt-3 space-y-1.5 max-w-[240px]">
                            {/* Phone number */}
                            <motion.div 
                              variants={{
                                hidden: { x: -15, opacity: 0 },
                                show: { x: 0, opacity: 1 }
                              }}
                              className="backdrop-blur-md bg-black/45 border border-white/10 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-left text-white shadow-sm"
                            >
                              <div>
                                <span className="text-[10px] block font-bold uppercase tracking-wider text-white/50">Phone:</span>
                                <span className="text-xs font-mono font-bold tracking-wide text-white">{userAccount.phone || '01XXXXXXXXX'}</span>
                              </div>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(userAccount.phone || '01XXXXXXXXX');
                                  triggerNotification('Phone number copied to clipboard!');
                                }}
                                className="p-1 rounded transition-colors cursor-pointer bg-white/5 hover:bg-white/15 text-white"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </motion.div>

                            {/* USER ID */}
                            <motion.div 
                              variants={{
                                hidden: { x: 15, opacity: 0 },
                                show: { x: 0, opacity: 1 }
                              }}
                              className="backdrop-blur-md bg-black/45 border border-white/10 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-left text-white shadow-sm"
                            >
                              <div>
                                <span className="text-[10px] block font-bold uppercase tracking-wider text-white/50">USER ID:</span>
                                <span className="text-xs font-mono font-bold tracking-wide text-white">{userAccount.idCode || '#UNKNOWN'}</span>
                              </div>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(userAccount.idCode || '#UNKNOWN');
                                  triggerNotification('User ID copied to clipboard!');
                                }}
                                className="p-1 rounded transition-colors cursor-pointer bg-white/5 hover:bg-white/15 text-white"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </motion.div>
                          </div>
                        </motion.div>

                      </div>

                      {/* 2. Action Menu list, styled precisely like the image */}
                      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-2 scrollbar-none">
                        <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest pl-1 block mb-1.5">
                          Actions
                        </span>



                        {/* Action: Devices */}
                        <button 
                          onClick={() => setIsDevicesOpen(true)}
                          className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200 hover:scale-[1.02] active:scale-98 cursor-pointer text-left"
                          style={{
                            backgroundColor: themeMode === ThemeMode.DARK ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.9)',
                            border: `1.5px solid ${themeMode === ThemeMode.DARK ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0,0,0,0.08)'}`,
                            boxShadow: themeMode === ThemeMode.DARK ? '0 4px 10px rgba(0, 0, 0, 0.35)' : '0 2px 6px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <div 
                              className="p-1.5 rounded-lg flex items-center justify-center border transition-all animate-none"
                              style={{
                                color: selectedPreset.primaryColorHex,
                                backgroundColor: `${selectedPreset.primaryColorHex}15`,
                                borderColor: `${selectedPreset.primaryColorHex}35`,
                              }}
                            >
                              <Smartphone className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-wider opacity-95">Devices</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60" style={{ color: selectedPreset.primaryColorHex }} />
                        </button>

                        {/* Action: Privacy Policy */}
                        <button 
                          onClick={() => triggerNotification('Privacy Policy: All mock notes data are client-side only and securely isolated.')}
                          className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200 hover:scale-[1.02] active:scale-98 cursor-pointer text-left"
                          style={{
                            backgroundColor: themeMode === ThemeMode.DARK ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.9)',
                            border: `1.5px solid ${themeMode === ThemeMode.DARK ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0,0,0,0.08)'}`,
                            boxShadow: themeMode === ThemeMode.DARK ? '0 4px 10px rgba(0, 0, 0, 0.35)' : '0 2px 6px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <div 
                              className="p-1.5 rounded-lg flex items-center justify-center border transition-all animate-none"
                              style={{
                                color: selectedPreset.primaryColorHex,
                                backgroundColor: `${selectedPreset.primaryColorHex}15`,
                                borderColor: `${selectedPreset.primaryColorHex}35`,
                              }}
                            >
                              <Shield className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-wider opacity-95">Privacy Policy</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60" style={{ color: selectedPreset.primaryColorHex }} />
                        </button>

                        {/* Action: Terms & Conditions */}
                        <button 
                          onClick={() => triggerNotification('Terms & Conditions: Notes playground serves as mockup prototyping tool.')}
                          className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200 hover:scale-[1.02] active:scale-98 cursor-pointer text-left"
                          style={{
                            backgroundColor: themeMode === ThemeMode.DARK ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.9)',
                            border: `1.5px solid ${themeMode === ThemeMode.DARK ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0,0,0,0.08)'}`,
                            boxShadow: themeMode === ThemeMode.DARK ? '0 4px 10px rgba(0, 0, 0, 0.35)' : '0 2px 6px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <div 
                              className="p-1.5 rounded-lg flex items-center justify-center border transition-all animate-none"
                              style={{
                                color: selectedPreset.primaryColorHex,
                                backgroundColor: `${selectedPreset.primaryColorHex}15`,
                                borderColor: `${selectedPreset.primaryColorHex}35`,
                              }}
                            >
                              <FileText className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-wider opacity-95">Terms & Condition</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60" style={{ color: selectedPreset.primaryColorHex }} />
                        </button>

                        {/* Action: Developer */}
                        <button 
                          onClick={() => {
                            setIsDevCodeModalOpen(true);
                            setIsProfileDrawerOpen(false);
                          }}
                          className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200 hover:scale-[1.02] active:scale-98 cursor-pointer text-left"
                          style={{
                            backgroundColor: themeMode === ThemeMode.DARK ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.9)',
                            border: `1.5px solid ${themeMode === ThemeMode.DARK ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0,0,0,0.08)'}`,
                            boxShadow: themeMode === ThemeMode.DARK ? '0 4px 10px rgba(0, 0, 0, 0.35)' : '0 2px 6px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <div 
                              className="p-1.5 rounded-lg flex items-center justify-center border transition-all animate-none"
                              style={{
                                color: selectedPreset.primaryColorHex,
                                backgroundColor: `${selectedPreset.primaryColorHex}15`,
                                borderColor: `${selectedPreset.primaryColorHex}35`,
                              }}
                            >
                              <FileCode className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-wider opacity-95">Developer</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60" style={{ color: selectedPreset.primaryColorHex }} />
                        </button>

                      </div>

                      {/* 3. Bottom: Log out button */}
                      <div className="p-4 shrink-0 border-t border-[#00C087]/15">
                        <button 
                          type="button"
                          onClick={async () => {
                            setIsProfileDrawerOpen(false);
                            try {
                              await signOut(auth);
                            } catch (e) {
                              console.error("Firebase SignOut failed:", e);
                            }
                            setIsLoggedIn(false);
                            localStorage.removeItem('neote_logged_in');
                            localStorage.removeItem('neote_is_guest_mode');
                            resetAllData();
                            triggerNotification('You have logged out from Neote. See you soon!');
                          }}
                          className={`w-full py-2.5 rounded-xl border font-extrabold text-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer ${
                            themeMode === ThemeMode.LIGHT
                              ? 'bg-red-50 border-red-600 text-red-700 hover:bg-red-100'
                              : 'bg-red-950/20 hover:bg-red-950/40 border-red-500/20 hover:border-red-500/40 text-red-400'
                          }`}
                        >
                          <LogOut className={`w-3.5 h-3.5 ${themeMode === ThemeMode.LIGHT ? 'p-0.5 border border-red-600 rounded-sm bg-white' : ''}`} />
                          <span>Log Out</span>
                        </button>
                      </div>

                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* SLIDING BUY PREMIUM COINS STORE DRAWER FROM RIGHT */}
              <AnimatePresence>
                {isBuyCoinsOpen && (
                  <div className="absolute inset-0 z-50 overflow-hidden flex justify-end">
                    {/* Backdrop */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => {
                        setIsBuyCoinsOpen(false);
                        setShowHistoryList(false);
                      }}
                      className="absolute inset-0 bg-black/75 backdrop-blur-[2px] cursor-pointer"
                    />

                    {/* Sliding Panel */}
                    <motion.div
                      initial={{ x: '100%' }}
                      animate={{ x: '0' }}
                      exit={{ x: '100%' }}
                      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                      style={{
                        backgroundColor: themeMode === ThemeMode.DARK ? '#000000' : '#FFFFFF',
                        color: themeMode === ThemeMode.DARK ? '#FFFFFF' : '#0F172A',
                        borderColor: themeMode === ThemeMode.DARK ? `${selectedPreset.primaryColorHex}33` : undefined,
                      }}
                      className="absolute inset-y-0 right-0 w-full flex flex-col h-full shadow-2xl overflow-hidden z-50 border-l"
                    >
                      {/* 1. Header showing Back, Title, and History toggles */}
                      <div 
                        style={{
                          borderColor: themeMode === ThemeMode.DARK ? `${selectedPreset.primaryColorHex}26` : undefined
                        }}
                        className="flex items-center justify-between p-4 shrink-0 border-b relative"
                      >
                        <button 
                          onClick={() => {
                            setIsBuyCoinsOpen(false);
                            setShowHistoryList(false);
                          }}
                          className={`p-1 px-2 text-xs bg-black/10 hover:bg-black/20 rounded-full flex items-center gap-1 cursor-pointer ${
                            themeMode === ThemeMode.LIGHT ? 'text-slate-900 bg-slate-100 hover:bg-slate-200' : 'text-white bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: selectedPreset.primaryColorHex }}>
                            Buy CLIP
                          </span>
                          <div 
                            className="flex items-center justify-center space-x-1.5 px-3 py-0.5 mt-1 rounded-full text-[9px] font-black border-[1.5px] shadow-xs select-none animate-none shrink-0 min-w-[54px] whitespace-nowrap"
                            style={{
                              background: themeMode === ThemeMode.LIGHT 
                                ? '#F1F5F9' 
                                : `linear-gradient(180deg, ${selectedPreset.primaryColorHex}20 0%, ${selectedPreset.primaryColorHex}05 100%)`,
                              color: themeMode === ThemeMode.LIGHT ? '#0F172A' : '#FFFFFF',
                              borderColor: selectedPreset.primaryColorHex,
                              boxShadow: `inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 0 10px ${selectedPreset.primaryColorHex}66`,
                            }}
                          >
                            <PremiumPaperclipIcon 
                              className="w-3 h-3 animate-pulse shrink-0" 
                              glowColor={selectedPreset.primaryColorHex} 
                            />
                            <span className={`drop-shadow-[0_1px_1px_rgba(0,0,0,0.75)] uppercase tracking-widest font-black leading-none ${themeMode === ThemeMode.LIGHT ? 'text-slate-905' : 'text-teal-100'}`}>
                              +{userAccount.premiumCoins}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowHistoryList(prev => !prev)}
                          className="p-1.5 rounded-full transition-all cursor-pointer"
                          style={{
                            backgroundColor: showHistoryList 
                              ? `${selectedPreset.primaryColorHex}33` 
                              : (themeMode === ThemeMode.LIGHT ? '#F1F5F9' : 'rgba(255,255,255,0.05)'),
                            color: showHistoryList 
                              ? selectedPreset.primaryColorHex 
                              : (themeMode === ThemeMode.LIGHT ? '#64748B' : '#94A3B8'),
                          }}
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Store main scroll body container */}
                      <div className="flex-1 overflow-y-auto pb-6 scrollbar-none">
                        
                        {/* Title of packages list */}
                        <div className="px-3.5 pt-5 pb-1.5 text-left">
                          <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Buy Premium CLIP
                          </h3>
                        </div>

                        {/* Country Changing Option (Non-slidable selector) */}
                        <div className="px-3 mb-4">
                          <div className={`p-1 rounded-xl border flex ${
                            themeMode === ThemeMode.LIGHT 
                              ? 'bg-slate-100 border-slate-200' 
                              : 'bg-slate-950/80 border-slate-800'
                          }`}>
                            <button
                              type="button"
                              onClick={() => setBuyClipRegion('USA')}
                              className="flex-1 py-1 px-3 text-[10px] uppercase font-bold tracking-widest rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                              style={{
                                backgroundColor: buyClipRegion === 'USA' ? selectedPreset.primaryColorHex : 'transparent',
                                color: buyClipRegion === 'USA' ? '#000000' : (themeMode === ThemeMode.LIGHT ? '#475569' : '#94A3B8'),
                                fontWeight: buyClipRegion === 'USA' ? '900' : '700'
                              }}
                            >
                              <span>USA Store</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setBuyClipRegion('HK')}
                              className="flex-1 py-1 px-3 text-[10px] uppercase font-bold tracking-widest rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                              style={{
                                backgroundColor: buyClipRegion === 'HK' ? selectedPreset.primaryColorHex : 'transparent',
                                color: buyClipRegion === 'HK' ? '#000000' : (themeMode === ThemeMode.LIGHT ? '#475569' : '#94A3B8'),
                                fontWeight: buyClipRegion === 'HK' ? '900' : '700'
                              }}
                            >
                              <span>HK Store</span>
                            </button>
                          </div>
                        </div>

                        {/* Active Region Header Title */}
                        <div className="px-3.5 pb-2 text-left animate-fade-in flex items-center justify-between">
                          <span className="text-[9px] uppercase font-extrabold tracking-widest" style={{ color: selectedPreset.primaryColorHex }}>
                            {buyClipRegion === 'USA' ? 'United States Division (USD)' : 'Hong Kong Division (HKD)'}
                          </span>
                          <span className="text-[8px] text-slate-500 font-mono">
                            {buyClipRegion === 'USA' ? 'Region Ref: USA' : 'Region Ref: HK'}
                          </span>
                        </div>

                        {/* 3. Double-Column grid of packages */}
                        <div className="grid grid-cols-2 gap-2.5 px-3">
                          
                          {/* Render Package Option Plans based on the selected region (divided page content) */}
                          {dynamicClipPackages.filter(p => (p.region || 'USA') === buyClipRegion).map((plan, ridx) => (
                            <div 
                              key={plan.id || ridx}
                              onClick={() => setSelectedPlanId(plan.id)}
                              className={`p-4 pt-5 pb-4 min-h-[165px] rounded-xl border transition-all flex flex-col items-center justify-between text-center relative overflow-hidden group/plan cursor-pointer ${
                                themeMode === ThemeMode.LIGHT 
                                  ? (selectedPlanId === plan.id ? 'bg-white' : 'bg-[#F8FAFC] hover:bg-white border-slate-200 shadow-2xs') 
                                  : (selectedPlanId === plan.id ? 'bg-slate-950/80' : 'bg-black/35 border-slate-850/60')
                              }`}
                              style={{
                                borderColor: selectedPlanId === plan.id 
                                  ? selectedPreset.primaryColorHex 
                                  : (themeMode === ThemeMode.DARK ? 'rgba(255,255,255,0.08)' : undefined),
                                boxShadow: selectedPlanId === plan.id 
                                  ? `0 0 16px ${selectedPreset.primaryColorHex}aa` 
                                  : undefined
                              }}
                            >
                              {plan.isHot && (
                                <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden pointer-events-none z-10">
                                  <div 
                                    className="absolute top-[8px] -right-[15px] w-[64px] text-center rotate-45 text-[7px] font-black py-0.5 tracking-wider uppercase shadow-xs"
                                    style={{ 
                                      backgroundColor: selectedPreset.primaryColorHex,
                                      color: '#000000'
                                    }}
                                  >
                                    HOT
                                  </div>
                                </div>
                              )}
                              
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-all group-hover/plan:scale-110 relative shrink-0"
                                style={{
                                  backgroundColor: `${selectedPreset.primaryColorHex}15`,
                                  color: selectedPreset.primaryColorHex,
                                }}
                              >
                                <PremiumPaperclipIcon className="w-5 h-5" glowColor={selectedPreset.primaryColorHex} />
                                
                                {selectedPlanId === plan.id && (
                                  <span 
                                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-black tracking-wide px-2 py-0.5 rounded-full shadow-lg border border-transparent animate-bounce z-10 font-sans"
                                    style={{
                                      backgroundColor: selectedPreset.primaryColorHex,
                                      color: '#000000',
                                    }}
                                  >
                                    {plan.labelText || '( 4$ 95%)'}
                                  </span>
                                )}
                              </div>

                              <span className="text-base font-black tracking-tight block">
                                {plan.numCoins}
                              </span>
                              <span className="text-[8px] text-slate-400 font-bold block mb-2">
                                Premium CLIP
                              </span>

                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPlanId(plan.id);
                                  handlePurchaseCoins(plan.numCoins, plan.priceString);
                                }}
                                className="w-full text-[9px] py-1 font-black rounded-lg transition-all cursor-pointer active:scale-95 shadow-sm hover:opacity-90 animate-none"
                                style={{
                                  background: `linear-gradient(135deg, ${selectedPreset.primaryColorHex} 0%, ${selectedPreset.accentColorHex}B0 100%)`,
                                  color: '#FFFFFF'
                                }}
                              >
                                {plan.priceString}
                              </button>
                            </div>
                          ))}

                        </div>

                      </div>

                      {/* 4. Overlay Purchase History View */}
                      {showHistoryList && (
                        <div className="absolute inset-0 bg-black/98 z-50 flex flex-col p-4">
                          <div 
                            style={{ borderColor: `${selectedPreset.primaryColorHex}26` }}
                            className="flex justify-between items-center pb-2 border-b"
                          >
                            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1" style={{ color: selectedPreset.primaryColorHex }}>
                              <History className="w-3.5 h-3.5 animate-pulse" /> Purchase History
                            </span>
                            <button 
                              onClick={() => setShowHistoryList(false)}
                              className="text-slate-400 hover:text-white text-[9px] px-2 py-0.5 bg-slate-800 rounded font-bold cursor-pointer"
                            >
                              Close
                            </button>
                          </div>

                          <div className="flex-1 overflow-y-auto space-y-2 mt-3 text-left">
                            {purchaseHistory.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                <PremiumPaperclipIcon className="w-8 h-8 text-slate-600 mb-1.5 animate-bounce" glowColor="#475569" />
                                <p className="text-[10px] text-slate-400">No simulated purchases yet</p>
                                <p className="text-[8px] text-slate-500 mt-1">Acquire packages to view transaction receipts.</p>
                              </div>
                            ) : (
                              purchaseHistory.map(tx => (
                                <div key={tx.id} className="p-2 bg-slate-900 rounded-lg border border-slate-800/80 flex items-center justify-between">
                                  <div>
                                    <span className="text-[10px] font-black text-white block font-sans">Bought {tx.amount} CLIP</span>
                                    <span className="text-[8px] text-slate-500 font-mono italic">{tx.date}</span>
                                  </div>
                                  <span className="text-[9px] font-mono font-extrabold" style={{ color: selectedPreset.primaryColorHex }}>{tx.price}</span>
                                </div>
                              ))
                            )}
                          </div>

                          {purchaseHistory.length > 0 && (
                            <button
                              onClick={() => {
                                setPurchaseHistory([]);
                                triggerNotification('Transaction receipts cleared!');
                              }}
                              className="w-full py-1.5 bg-red-950/60 hover:bg-red-900/40 text-red-400 text-[9px] font-bold rounded-lg mt-3"
                            >
                              Clear Logs
                            </button>
                          )}
                        </div>
                      )}

                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {isAdminPanelOpen && (
                  <AdminPanel
                    isOpen={isAdminPanelOpen}
                    onClose={() => setIsAdminPanelOpen(false)}
                    selectedPreset={selectedPreset}
                    themeMode={themeMode}
                    triggerNotification={triggerNotification}
                    adminUser={currentUser ? { uid: currentUser.uid, email: currentUser.email || undefined, name: userAccount?.name || undefined } : null}
                  />
                )}
              </AnimatePresence>

              {/* Native Modern Android Gesture swipe block indicator */}
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 bg-current opacity-25 rounded-full z-40 pointer-events-none"></div>

            </div>
          </div>
        </div>
      </div>

      </main>

      {/* FLOATING GENERAL TOAST NOTIFIER */}
      {alertNotification && (
        <div className="fixed bottom-4 right-4 bg-slate-950/95 border-2 border-[#00C087] text-white px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center space-x-3 backdrop-blur-md animate-slide-in">
          <div className="w-2 h-2 rounded-full bg-[#00C087]" style={{ backgroundColor: selectedPreset.primaryColorHex }} />
          <span className="text-xs font-black tracking-wide font-mono uppercase">{alertNotification}</span>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-black py-6 text-center text-xs text-slate-500 font-mono mt-auto">
        <span>© 2026 NeoTe Notes App • Secure Offline Personal Diary</span>
      </footer>

    </div>
  );
}
