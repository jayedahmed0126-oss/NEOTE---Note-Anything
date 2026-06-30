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
  Instagram,
  Save,
  MessageSquare, 
  MessageCircle,
  Send,
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
  Wifi,
  Maximize2,
  Minimize2
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

const getDeviceDetails = () => {
  const ua = navigator.userAgent;
  let os = 'Unknown OS';
  if (/android/i.test(ua)) {
    os = 'Android';
  } else if (/iPad|iPhone|iPod/.test(ua)) {
    os = 'iOS';
  } else if (/Macintosh/i.test(ua)) {
    os = 'macOS';
  } else if (/Windows/i.test(ua)) {
    os = 'Windows';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  let browser = 'Web';
  if (/chrome|crios/i.test(ua) && !/edge|edg/i.test(ua) && !/opr/i.test(ua)) {
    browser = 'Chrome';
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = 'Safari';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  } else if (/edge|edg/i.test(ua)) {
    browser = 'Edge';
  } else if (/opr/i.test(ua)) {
    browser = 'Opera';
  }

  const isWebView = /wv|webview|Version\/4.0/i.test(ua) || (window as any).Android !== undefined;
  const appLabel = isWebView ? 'APK App' : 'Browser';

  return `${os} (${browser} ${appLabel})`;
};

const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone|ipod/i.test(ua)) return 'mobile';
  return 'desktop';
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
          idCode: parsed.idCode || generateUniqueIdCode(emailVal || phoneVal),
          role: parsed.role || 'user',
          createdAt: parsed.createdAt || new Date().toISOString()
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
      role: 'user',
      createdAt: new Date().toISOString()
    };
  });

  const [hasInitialProfileLoaded, setHasInitialProfileLoaded] = useState(false);

  useEffect(() => {
    localStorage.setItem('user_account_profile', JSON.stringify(userAccount));
  }, [userAccount]);

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
  }, [selectedPreset]);

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
  }, [ownedThemes]);

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
    { id: 'usa_pkg_1', numCoins: 100, priceString: '$0.99', region: 'USA', isHot: false, labelText: '0.99$ gpc' },
    { id: 'usa_pkg_2', numCoins: 50, priceString: '$0.51', region: 'USA', isHot: false, labelText: '0.5$' },
    { id: 'usa_pkg_3', numCoins: 100, priceString: '$1.01', region: 'USA', isHot: false, labelText: '1$' },
    { id: 'usa_pkg_4', numCoins: 200, priceString: '$2.01', region: 'USA', isHot: false, labelText: '2$' },
    { id: 'usa_pkg_5', numCoins: 300, priceString: '$3.01', region: 'USA', isHot: false, labelText: '3$' },
    { id: 'usa_pkg_6', numCoins: 400, priceString: '$4.01', region: 'USA', isHot: false, labelText: '4$' },
    { id: 'usa_pkg_7', numCoins: 500, priceString: '$5.01', region: 'USA', isHot: false, labelText: '5$' },
    { id: 'usa_pkg_8', numCoins: 600, priceString: '$6.01', region: 'USA', isHot: false, labelText: '6$' },
    { id: 'usa_pkg_9', numCoins: 1000, priceString: '$10.01', region: 'USA', isHot: false, labelText: '10$' },
    { id: 'usa_pkg_10', numCoins: 445, priceString: '$4.45', region: 'USA', isHot: false, labelText: '90% 4$' },
    { id: 'usa_pkg_11', numCoins: 420, priceString: '$4.20', region: 'USA', isHot: false, labelText: '95% 4$' },
    { id: 'usa_pkg_12', numCoins: 535, priceString: '$5.34', region: 'USA', isHot: false, labelText: '75% 4$' },
    { id: 'usa_pkg_13', numCoins: 1100, priceString: '$10.55', region: 'USA', isHot: false, labelText: '95% 10$' },
    
    { id: 'hk_pkg_1', numCoins: 135, priceString: '10.10 HKD', region: 'HK', isHot: false, labelText: '10 HK$' },
    { id: 'hk_pkg_2', numCoins: 270, priceString: '20.10 HKD', region: 'HK', isHot: false, labelText: '20 HK$' },
    { id: 'hk_pkg_3', numCoins: 540, priceString: '40.10 HKD', region: 'HK', isHot: false, labelText: '40 HK$' },
    { id: 'hk_pkg_4', numCoins: 675, priceString: '50.10 HKD', region: 'HK', isHot: false, labelText: '50 HK$' },
    { id: 'hk_pkg_5', numCoins: 145, priceString: '10.60 HKD', region: 'HK', isHot: false, labelText: '95% 10 HK$' },
    { id: 'hk_pkg_6', numCoins: 285, priceString: '20.10 HKD', region: 'HK', isHot: false, labelText: '95% 20 HK$' },
    { id: 'hk_pkg_7', numCoins: 565, priceString: '42.10 HKD', region: 'HK', isHot: false, labelText: '95% 40 HK$' },
    { id: 'hk_pkg_8', numCoins: 710, priceString: '52.70 HKD', region: 'HK', isHot: false, labelText: '95% 50 HK$' }
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
          // Sort packages by region then numCoins then priceString
          items.sort((a, b) => {
            const reg = (a.region || '').localeCompare(b.region || '');
            if (reg !== 0) return reg;
            const coinDiff = (a.numCoins || 0) - (b.numCoins || 0);
            if (coinDiff !== 0) return coinDiff;
            return (a.priceString || '').localeCompare(b.priceString || '');
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

    // One-time check/sync for real Firestore packages to ensure the user's DB has the new list
    const syncRealFirestorePackages = async () => {
      const syncKey = 'neote_packages_synced_v5';
      if (localStorage.getItem(syncKey)) {
        return; // Already synchronized, skip to load instantly
      }
      try {
        const oldIds = [
          'usa_100', 'usa_500', 'usa_1200', 'usa_2500', 'usa_5000', 'usa_10000',
          'hk_100', 'hk_500', 'hk_1200', 'hk_2500', 'hk_5000', 'hk_10000'
        ];
        
        // Execute deletions in parallel
        await Promise.all(
          oldIds.map(oldId => {
            const docRef = doc(db, 'clip_packages', oldId);
            return deleteDoc(docRef).catch(() => {});
          })
        );

        const newPackages = [
          { id: 'usa_pkg_1', numCoins: 100, priceString: '$0.99', region: 'USA', isHot: false, labelText: '0.99$ gpc' },
          { id: 'usa_pkg_2', numCoins: 50, priceString: '$0.51', region: 'USA', isHot: false, labelText: '0.5$' },
          { id: 'usa_pkg_3', numCoins: 100, priceString: '$1.01', region: 'USA', isHot: false, labelText: '1$' },
          { id: 'usa_pkg_4', numCoins: 200, priceString: '$2.01', region: 'USA', isHot: false, labelText: '2$' },
          { id: 'usa_pkg_5', numCoins: 300, priceString: '$3.01', region: 'USA', isHot: false, labelText: '3$' },
          { id: 'usa_pkg_6', numCoins: 400, priceString: '$4.01', region: 'USA', isHot: false, labelText: '4$' },
          { id: 'usa_pkg_7', numCoins: 500, priceString: '$5.01', region: 'USA', isHot: false, labelText: '5$' },
          { id: 'usa_pkg_8', numCoins: 600, priceString: '$6.01', region: 'USA', isHot: false, labelText: '6$' },
          { id: 'usa_pkg_9', numCoins: 1000, priceString: '$10.01', region: 'USA', isHot: false, labelText: '10$' },
          { id: 'usa_pkg_10', numCoins: 445, priceString: '$4.45', region: 'USA', isHot: false, labelText: '90% 4$' },
          { id: 'usa_pkg_11', numCoins: 420, priceString: '$4.20', region: 'USA', isHot: false, labelText: '95% 4$' },
          { id: 'usa_pkg_12', numCoins: 535, priceString: '$5.34', region: 'USA', isHot: false, labelText: '75% 4$' },
          { id: 'usa_pkg_13', numCoins: 1100, priceString: '$10.55', region: 'USA', isHot: false, labelText: '95% 10$' },
          
          { id: 'hk_pkg_1', numCoins: 135, priceString: '10.10 HKD', region: 'HK', isHot: false, labelText: '10 HK$' },
          { id: 'hk_pkg_2', numCoins: 270, priceString: '20.10 HKD', region: 'HK', isHot: false, labelText: '20 HK$' },
          { id: 'hk_pkg_3', numCoins: 540, priceString: '40.10 HKD', region: 'HK', isHot: false, labelText: '40 HK$' },
          { id: 'hk_pkg_4', numCoins: 675, priceString: '50.10 HKD', region: 'HK', isHot: false, labelText: '50 HK$' },
          { id: 'hk_pkg_5', numCoins: 145, priceString: '10.60 HKD', region: 'HK', isHot: false, labelText: '95% 10 HK$' },
          { id: 'hk_pkg_6', numCoins: 285, priceString: '20.10 HKD', region: 'HK', isHot: false, labelText: '95% 20 HK$' },
          { id: 'hk_pkg_7', numCoins: 565, priceString: '42.10 HKD', region: 'HK', isHot: false, labelText: '95% 40 HK$' },
          { id: 'hk_pkg_8', numCoins: 710, priceString: '52.70 HKD', region: 'HK', isHot: false, labelText: '95% 50 HK$' }
        ];

        // Execute additions in parallel
        await Promise.all(
          newPackages.map(pkg => {
            const docRef = doc(db, 'clip_packages', pkg.id);
            return setDoc(docRef, {
              ...pkg,
              createdAt: new Date().toISOString()
            }, { merge: true }).catch(() => {});
          })
        );

        localStorage.setItem(syncKey, 'true');
      } catch (err) {
        console.warn("Real firestore package sync ignored or failed:", err);
      }
    };

    syncRealFirestorePackages();

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
  }, [purchaseHistory]);

  const [currentDeviceId] = useState<string>(() => {
    let id = localStorage.getItem('neote_device_id_v1');
    if (!id) {
      const randomPart = Math.random().toString(36).substring(2, 11);
      const timestampPart = Date.now().toString(36);
      id = `dev-${randomPart}-${timestampPart}`;
      localStorage.setItem('neote_device_id_v1', id);
    }
    return id;
  });

  const [isDevicesOpen, setIsDevicesOpen] = useState(false);
  const [isDevCodeModalOpen, setIsDevCodeModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  
  // Admin password states
  const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState('');
  
  // Jayed Ahmed Developer Profile details
  const [devFacebookId, setDevFacebookId] = useState(() => localStorage.getItem('neote_dev_fb') || 'jayedahmed.dev');
  const [devWhatsappNumber, setDevWhatsappNumber] = useState(() => localStorage.getItem('neote_dev_wp') || '+8801700000000');
  const [devInstagramId, setDevInstagramId] = useState(() => localStorage.getItem('neote_dev_insta') || 'jayedahmed_dev');
  const [isEditingDevLinks, setIsEditingDevLinks] = useState(false);

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
  }, [deviceSessions]);

  // Consolidated and Debounced Firestore Sync to avoid multiple overlapping writes
  // and guarantee smooth, lag-free performance during state updates & tab switching.
  useEffect(() => {
    if (!currentUser || !hasInitialProfileLoaded) return;

    const delayDebounceId = setTimeout(() => {
      setDoc(doc(db, 'users', currentUser.uid), {
        name: userAccount.name,
        avatarUrl: userAccount.avatarUrl || '',
        premiumCoins: userAccount.premiumCoins,
        phone: userAccount.phone || '',
        email: userAccount.email || '',
        country: userAccount.country || '',
        idCode: userAccount.idCode || '',
        "USER ID": userAccount.idCode || '',
        "User ID": userAccount.idCode || '',
        userId: userAccount.idCode || '',
        role: userAccount.role || 'user',
        createdAt: userAccount.createdAt || new Date().toISOString(),
        selectedPreset: selectedPreset,
        ownedThemes: ownedThemes,
        purchaseHistory: purchaseHistory,
        deviceSessions: deviceSessions
      }, { merge: true }).catch(err => {
        console.warn("Could not save unified user profile to firestore", err);
        setFirebaseError(err instanceof Error ? err.message : String(err));
      });
    }, 1000); // 1-second debounce is perfect to batched updates

    return () => clearTimeout(delayDebounceId);
  }, [
    userAccount,
    selectedPreset,
    ownedThemes,
    purchaseHistory,
    deviceSessions,
    currentUser,
    hasInitialProfileLoaded
  ]);

  // Active navigation tab *inside* the phone emulator (Default is Home / 0)
  const [activeTab, setActiveTab] = useState<number>(0); 
  const [emulatorRatio, setEmulatorRatio] = useState<'9/16' | '9/19.5' | 'free'>('9/16');
  const [showDeviceFrame, setShowDeviceFrame] = useState<boolean>(true);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    const docEl = document.documentElement;
    if (!document.fullscreenElement) {
      const requestFS = docEl.requestFullscreen || 
                        (docEl as any).webkitRequestFullscreen || 
                        (docEl as any).mozRequestFullScreen || 
                        (docEl as any).msRequestFullscreen;
      if (requestFS) {
        requestFS.call(docEl).then(() => {
          triggerNotification('Immersive Fullscreen Enabled! 📱');
        }).catch((err: any) => {
          console.warn(`Error attempting to enable fullscreen: ${err.message}`);
          triggerNotification('Fullscreen blocked or unsupported by browser.');
        });
      } else {
        triggerNotification('Fullscreen is not supported on this browser.');
      }
    } else {
      const exitFS = document.exitFullscreen || 
                     (document as any).webkitExitFullscreen || 
                     (document as any).mozCancelFullScreen || 
                     (document as any).msExitFullscreen;
      if (exitFS) {
        exitFS.call(document).then(() => {
          triggerNotification('Exited Fullscreen Mode');
        }).catch((err: any) => {
          console.warn(err);
        });
      }
    }
  };

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
            const conformingId = data.idCode || generateUniqueIdCode(data.email || data.phone || user.email || user.phoneNumber || 'guest-user');

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
              role: data.role || 'user',
              createdAt: data.createdAt || new Date().toISOString()
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
              name: getDeviceDetails(),
              type: getDeviceType(),
              status: 'online',
              loginTime: new Date().toLocaleString(),
              location: 'Dhaka, Bangladesh (IP: 103.145.22.8)'
            } : {
              id: deviceId,
              name: getDeviceDetails(),
              type: getDeviceType(),
              status: 'online',
              loginTime: new Date().toLocaleString(),
              location: 'Dhaka, Bangladesh (IP: 103.145.22.8)'
            };

            // Deduplicate all sessions strictly by unique device ID to guarantee multiple distinct devices can coexist!
            const uniqueSessionsMap = new Map<string, DeviceSession>();
            uniqueSessionsMap.set(deviceId, currentSessionObj);

            currentSessions.forEach((s: any) => {
              if (s.id === deviceId) return; // current device is already added and prioritized
              
              if (!uniqueSessionsMap.has(s.id)) {
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
                name: getDeviceDetails(),
                type: getDeviceType(),
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
                "USER ID": initialId,
                "User ID": initialId,
                userId: initialId,
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
    
    // Generate a realistic Google Play Console Transaction ID (TRX)
    const segment1 = Math.floor(1000 + Math.random() * 9000);
    const segment2 = Math.floor(1000 + Math.random() * 9000);
    const segment3 = Math.floor(1000 + Math.random() * 9000);
    const segment4 = Math.floor(10000 + Math.random() * 90000);
    const generatedTrxCode = `GPA.${segment1}-${segment2}-${segment3}-${segment4}`;

    const newTx = {
      id: Math.random().toString(),
      amount,
      price: priceStr,
      date: dateStr,
      trxCode: generatedTrxCode
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
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUserAccount(prev => {
      const isPhoneUser = currentUser?.email?.endsWith('@neote.app') || (prev.phone && !prev.email);
      const emailVal = isPhoneUser ? '' : (tempProfile.email || '');
      const phoneVal = isPhoneUser ? (tempProfile.phone || '') : '';
      const derivedId = prev.idCode || tempProfile.idCode || generateUniqueIdCode(emailVal || phoneVal || prev.email || prev.phone);
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
      style={{
        ...dynamicStyles,
        backgroundColor: themeMode === ThemeMode.DARK ? selectedPreset.darkBgColorHex : selectedPreset.lightBgColorHex,
        color: themeMode === ThemeMode.DARK ? '#F1F5F9' : '#0F172A',
        fontFamily: 'Inter, sans-serif'
      }}
      className="fixed inset-0 w-screen h-[100dvh] flex flex-col overflow-hidden relative select-none bg-slate-950 text-slate-100 font-sans selection:bg-[#00C087]/30"
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

        /* Safe Area Padding Support when in Immersive Fullscreen */
        .safe-top-padding {
          padding-top: calc(0.75rem + env(safe-area-inset-top));
        }
        .safe-bottom-padding {
          padding-bottom: calc(1rem + env(safe-area-inset-bottom));
        }
      `}</style>
      
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
                <div className="px-4 py-2 safe-top-padding flex justify-between items-center z-10">
                  
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
                <div className="safe-top-padding"></div>
              )}

              {/* Central Top Dynamic Header Label */}
              <div className="px-5 py-1 text-center z-10">
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
                      <div className="grid grid-cols-3 gap-2 bg-slate-900/10 dark:bg-black/20 p-2 rounded-xl border border-slate-500/5">
                        
                        {/* Facebook icon button with label below */}
                        <div className="flex flex-col items-center space-y-0.5">
                          <button
                            onClick={() => {
                              triggerNotification('Opening NeoTe Facebook Page...');
                              window.open('https://www.facebook.com/profile.php?id=61591134643806', '_blank');
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 text-white cursor-pointer"
                            style={{
                              background: 'linear-gradient(135deg, #1877F2 0%, #166FE5 100%)',
                              border: themeMode === ThemeMode.LIGHT ? '2.5px solid #041E15' : '1.5px solid rgba(255, 255, 255, 0.45)',
                              boxShadow: 'inset 0 1.5px 2px rgba(255, 255, 255, 0.4), inset 0 -1.5px 2px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.2)'
                            }}
                            title="Facebook"
                          >
                            <Facebook className={`w-4 h-4 fill-current stroke-none ${themeMode === ThemeMode.LIGHT ? 'p-0.5 border border-white rounded-full' : ''}`} />
                          </button>
                          <span className="text-[8.5px] font-black opacity-80 select-none">Facebook</span>
                        </div>

                        {/* WhatsApp icon button with label below */}
                        <div className="flex flex-col items-center space-y-0.5">
                          <button
                            onClick={() => {
                              window.open('https://wa.me/qr/TFGIWIPOGFMRN1', '_blank');
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 text-white cursor-pointer"
                            style={{
                              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                              border: themeMode === ThemeMode.LIGHT ? '2.5px solid #041E15' : '1.5px solid rgba(255, 255, 255, 0.45)',
                              boxShadow: 'inset 0 1.5px 2px rgba(255, 255, 255, 0.4), inset 0 -1.5px 2px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.2)'
                            }}
                            title="WhatsApp"
                          >
                            <MessageCircle className={`w-4 h-4 text-white fill-current ${themeMode === ThemeMode.LIGHT ? 'p-0.5 border border-white rounded-full' : ''}`} />
                          </button>
                          <span className="text-[8.5px] font-black opacity-80 select-none">WhatsApp</span>
                        </div>

                        {/* Telegram icon button with label below */}
                        <div className="flex flex-col items-center space-y-0.5">
                          <button
                            onClick={() => {
                              triggerNotification('Opening NeoTe Telegram Channel...');
                              window.open('https://t.me/neoteexbd', '_blank');
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 text-white cursor-pointer"
                            style={{
                              background: 'linear-gradient(135deg, #0088CC 0%, #0077B5 100%)',
                              border: themeMode === ThemeMode.LIGHT ? '2.5px solid #041E15' : '1.5px solid rgba(255, 255, 255, 0.45)',
                              boxShadow: 'inset 0 1.5px 2px rgba(255, 255, 255, 0.4), inset 0 -1.5px 2px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.2)'
                            }}
                            title="Telegram"
                          >
                            <Send className={`w-4 h-4 text-white pl-0.5 ${themeMode === ThemeMode.LIGHT ? 'p-0.5 border border-white rounded-full' : ''}`} />
                          </button>
                          <span className="text-[8.5px] font-black opacity-80 select-none">Telegram</span>
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
                              <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">USER ID (Unchangeable)</label>
                              <input 
                                type="text" 
                                value={tempProfile.idCode || ''}
                                readOnly
                                disabled
                                className="w-full bg-slate-905 border border-slate-705/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 cursor-not-allowed outline-none select-all opacity-80 font-mono"
                                style={{
                                  backgroundColor: themeMode === ThemeMode.LIGHT ? '#F1F5F9' : '#070a13',
                                  color: themeMode === ThemeMode.LIGHT ? '#64748B' : '#94A3B8',
                                  borderColor: themeMode === ThemeMode.LIGHT ? '#E2E8F0' : '#1e293b'
                                }}
                                title="This ID can only be changed by an admin from the Firebase database."
                              />
                              <span className="text-[8px] text-slate-400 mt-1 block leading-tight">
                                This ID is fixed. Only an administrator can modify it from the backend Firestore database.
                              </span>
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
                            { label: 'USER ID', value: userAccount.idCode || '', icon: Lock, isUserId: true },
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
                                <div className="flex items-center space-x-3.5 w-full">
                                  {/* Circular custom colored icon holder */}
                                  <div 
                                    className="w-8.5 h-8.5 rounded-full flex items-center justify-center border transition-all shrink-0"
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

                                  <div className="flex-1 min-w-0">
                                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider leading-none mb-0.5">
                                      {field.label}
                                    </span>
                                    <span className={`text-[12px] font-bold tracking-tight block truncate ${
                                      field.isUserId ? 'font-mono text-slate-400' : ''
                                    } ${
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
                                setAdminPasswordInput('');
                                setAdminPasswordError('');
                                setIsAdminPasswordModalOpen(true);
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
              <div className="p-4 safe-bottom-padding z-20 mt-auto">
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
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-[280px] shadow-2xl text-center animate-slide-in">
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
                <div className="absolute inset-0 bg-slate-955/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" style={{ backgroundColor: 'rgba(10, 15, 30, 0.9)' }}>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-[280px] shadow-2xl text-left animate-slide-in">
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
                <div className="absolute inset-0 bg-red-955/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in" style={{ backgroundColor: 'rgba(15, 3, 3, 0.95)' }}>
                  <div className="bg-slate-900 border border-red-900/40 rounded-2xl p-5 w-full max-w-[280px] shadow-2xl text-center animate-slide-in">
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
                <div className="absolute inset-0 bg-slate-955/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 w-full max-w-[310px] shadow-2xl text-left flex flex-col max-h-[90%] overflow-hidden animate-slide-in">
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
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN PASSWORD VERIFICATION MODAL */}
              {isAdminPasswordModalOpen && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xs shadow-2xl flex flex-col relative overflow-hidden animate-slide-in">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center mb-5 shrink-0">
                      <div className="flex items-center space-x-2">
                        <span className="p-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          <Shield className="w-3.5 h-3.5 text-amber-500" />
                        </span>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">Security Access</h4>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setIsAdminPasswordModalOpen(false);
                          setAdminPasswordInput('');
                          setAdminPasswordError('');
                        }}
                        className="text-[10px] font-mono px-2 py-0.5 border border-slate-700 bg-slate-950/40 hover:bg-slate-800 text-slate-300 rounded uppercase tracking-wider transition-colors active:scale-95 cursor-pointer"
                      >
                        [cancel]
                      </button>
                    </div>

                    {/* Centered Lock Icon & Info */}
                    <div className="text-center mt-3 mb-4 shrink-0 flex flex-col items-center">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center mb-3 border-2 animate-pulse"
                        style={{
                          backgroundColor: `${selectedPreset.primaryColorHex}15`,
                          borderColor: selectedPreset.primaryColorHex,
                          boxShadow: `0 0 15px ${selectedPreset.primaryColorHex}40`
                        }}
                      >
                        <Lock className="w-5 h-5 text-amber-500" />
                      </div>
                      <h2 
                        className="text-lg font-black tracking-wide text-white uppercase"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        Admin Credentials
                      </h2>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                        To access the admin panel, please provide the master administrator password.
                      </p>
                    </div>

                    {/* Input & Form */}
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (adminPasswordInput === 'P@sSwoRdadmins') {
                          setIsAdminPasswordModalOpen(false);
                          setIsAdminPanelOpen(true);
                          setAdminPasswordInput('');
                          setAdminPasswordError('');
                          triggerNotification("Admin access verified!");
                        } else {
                          setAdminPasswordError("Access Denied. Incorrect Password.");
                          triggerNotification("Incorrect admin password!");
                        }
                      }}
                      className="space-y-4"
                    >
                      <div className="flex flex-col space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Admin Password:
                        </label>
                        <input
                          type="password"
                          value={adminPasswordInput}
                          onChange={(e) => setAdminPasswordInput(e.target.value)}
                          placeholder="••••••••••••••"
                          autoFocus
                          className="w-full bg-slate-950/60 border border-slate-800 focus:border-amber-500 text-xs text-center text-slate-100 py-2.5 px-3 rounded-xl transition-all focus:outline-none placeholder-slate-700 tracking-widest font-mono"
                        />
                      </div>

                      {adminPasswordError && (
                        <div className="flex items-center justify-center space-x-1.5 p-2 bg-red-950/30 border border-red-500/20 rounded-xl text-[10px] text-red-400 font-extrabold">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{adminPasswordError}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl text-white font-black text-xs uppercase tracking-wider text-center transition-all bg-gradient-to-r hover:opacity-95 active:scale-97 shadow"
                        style={{
                          background: `linear-gradient(135deg, ${selectedPreset.primaryColorHex} 0%, ${selectedPreset.accentColorHex}C0 100%)`
                        }}
                      >
                        Verify & Unlock
                      </button>
                    </form>

                  </div>
                </div>
              )}

              {/* PRIVACY POLICY MODAL */}
              {isPrivacyModalOpen && (
                <div className="absolute inset-0 bg-slate-900 z-[100] flex flex-col p-6 animate-fadeIn">
                  
                  {/* Header */}
                  <div className="flex justify-between items-center mb-5 shrink-0 border-b border-slate-800 pb-3.5">
                    <div className="flex items-center space-x-2">
                      <span className="p-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        <Shield className="w-3.5 h-3.5" />
                      </span>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Privacy Policy</h4>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setIsPrivacyModalOpen(false);
                      }}
                      className="text-[10px] font-mono px-2.5 py-1.5 border border-slate-700 bg-slate-950/40 hover:bg-slate-800 text-slate-300 rounded-xl uppercase tracking-wider transition-colors active:scale-95 cursor-pointer"
                    >
                      [close]
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto liquid-bubble-scroll text-slate-300 space-y-5 text-left font-sans text-xs pb-10">
                    <h2 className="text-sm font-black text-white border-b border-slate-800 pb-1 uppercase tracking-wide">
                      PRIVACY POLICY
                    </h2>
                    <p className="text-[10px] text-slate-500 italic">Effective Date: June 29, 2026</p>
                    
                    <p className="leading-relaxed text-slate-300">
                      Welcome to NEOTE ("we," "our," or "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
                    </p>

                    <div className="space-y-2">
                      <h3 className="font-bold text-white uppercase text-[11px] tracking-wide text-indigo-400">
                        Information We Collect
                      </h3>
                      <ul className="list-disc pl-4 space-y-1 text-slate-300 leading-relaxed">
                        <li>
                          <strong className="text-slate-100">User Content:</strong> We store the notes, texts, and media you create within the app. Depending on your settings, these are stored locally on your device or synced via secure cloud servers.
                        </li>
                        <li>
                          <strong className="text-slate-100">In-App Purchases:</strong> We do not collect or store your payment card details. All financial transactions are processed securely by third-party services (such as Google Play Billing or Apple App Store). They provide us only with transaction confirmations.
                        </li>
                        <li>
                          <strong className="text-slate-100">Device Information:</strong> We may collect basic diagnostic data, such as device type, OS version, and crash logs, to improve app performance.
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-bold text-white uppercase text-[11px] tracking-wide text-indigo-400">
                        How We Use Your Information
                      </h3>
                      <ul className="list-disc pl-4 space-y-1 text-slate-300 leading-relaxed">
                        <li>To provide, maintain, and improve the features of NEOTE.</li>
                        <li>To process your in-app purchases and subscriptions.</li>
                        <li>To troubleshoot bugs and protect against security fraud.</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-bold text-white uppercase text-[11px] tracking-wide text-indigo-400">
                        Data Security & Sharing
                      </h3>
                      <ul className="list-disc pl-4 space-y-1 text-slate-300 leading-relaxed">
                        <li>Your data is yours. We do not sell your personal information or note contents to third parties.</li>
                        <li>We use industry-standard encryption to protect your synced data.</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-bold text-white uppercase text-[11px] tracking-wide text-indigo-400">
                        Your Rights
                      </h3>
                      <p className="leading-relaxed">
                        You can delete your account or clear your data at any time directly through the app settings.
                      </p>
                    </div>
                  </div>

                </div>
              )}

              {/* TERMS & CONDITIONS MODAL */}
              {isTermsModalOpen && (
                <div className="absolute inset-0 bg-slate-900 z-[100] flex flex-col p-6 animate-fadeIn">
                  
                  {/* Header */}
                  <div className="flex justify-between items-center mb-5 shrink-0 border-b border-slate-800 pb-3.5">
                    <div className="flex items-center space-x-2">
                      <span className="p-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        <FileText className="w-3.5 h-3.5" />
                      </span>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Terms & Conditions</h4>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        setIsTermsModalOpen(false);
                      }}
                      className="text-[10px] font-mono px-2.5 py-1.5 border border-slate-700 bg-slate-950/40 hover:bg-slate-800 text-slate-300 rounded-xl uppercase tracking-wider transition-colors active:scale-95 cursor-pointer"
                    >
                      [close]
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto liquid-bubble-scroll text-slate-300 space-y-5 text-left font-sans text-xs pb-10">
                    <h2 className="text-sm font-black text-white border-b border-slate-800 pb-1 uppercase tracking-wide">
                      TERMS AND CONDITIONS
                    </h2>
                    <p className="text-[10px] text-slate-500 italic">Last Updated: June 29, 2026</p>
                    
                    <p className="leading-relaxed text-slate-300">
                      Please read these Terms and Conditions ("Terms") carefully before using the NEOTE mobile application operated by us.
                    </p>

                    <div className="space-y-2">
                      <h3 className="font-bold text-white uppercase text-[11px] tracking-wide text-indigo-400">
                        1. Acceptance of Terms
                      </h3>
                      <p className="leading-relaxed">
                        By downloading or using the app, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-bold text-white uppercase text-[11px] tracking-wide text-indigo-400">
                        2. User Accounts & Content
                      </h3>
                      <ul className="list-disc pl-4 space-y-1 text-slate-300 leading-relaxed">
                        <li>You are responsible for maintaining the confidentiality of your device and account.</li>
                        <li>You retain full ownership of the content (notes) you create. However, you are solely responsible for ensuring your content does not violate any laws or third-party rights.</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-bold text-white uppercase text-[11px] tracking-wide text-indigo-400">
                        3. In-App Purchases and Subscriptions
                      </h3>
                      <ul className="list-disc pl-4 space-y-1 text-slate-300 leading-relaxed">
                        <li>NEOTE offers premium features via in-app purchases or subscriptions.</li>
                        <li>All purchases are handled via the respective app store (Google Play Store / Apple App Store).</li>
                        <li><strong className="text-slate-100">Refunds:</strong> Payments are generally non-refundable, and refunds are subject to the terms and conditions of the respective app store platform.</li>
                        <li>We reserve the right to change our pricing or subscription models at any time with prior notice.</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-bold text-white uppercase text-[11px] tracking-wide text-indigo-400">
                        4. Limitation of Liability
                      </h3>
                      <p className="leading-relaxed">
                        The app is provided on an "AS IS" and "AS AVAILABLE" basis. While we strive to protect your data, we are not liable for any data loss, app downtime, or unexpected bugs. Please keep backups of critical notes.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-bold text-white uppercase text-[11px] tracking-wide text-indigo-400">
                        5. Termination
                      </h3>
                      <p className="leading-relaxed">
                        We reserve the right to terminate or suspend access to our app immediately, without prior notice, for conduct that we believe violates these Terms.
                      </p>
                    </div>
                  </div>

                </div>
              )}

              {/* JAYED AHMED DEVELOPER PROFILE MODAL */}
              {isDevCodeModalOpen && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xs shadow-2xl flex flex-col max-h-[85%] overflow-hidden relative animate-slide-in">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6 shrink-0">
                      <div className="flex items-center space-x-2">
                        <span className="p-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          <User className="w-3.5 h-3.5" />
                        </span>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">Developer</h4>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setIsDevCodeModalOpen(false);
                        }}
                        className="text-[10px] font-mono px-2 py-0.5 border border-slate-700 bg-slate-950/40 hover:bg-slate-800 text-slate-300 rounded uppercase tracking-wider transition-colors active:scale-95 cursor-pointer"
                      >
                        [close]
                      </button>
                    </div>

                    {/* Centered Name (Jayed Ahmed) */}
                    <div className="text-center mt-4 mb-2 shrink-0">
                      <h2 
                        className="text-xl font-black tracking-wide text-white"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        Jayed Ahmed
                      </h2>
                    </div>

                    {/* Elegant Divider Line under Name */}
                    <div className="w-4/5 mx-auto h-[1.5px] bg-slate-700 mb-6 shrink-0"></div>

                    {/* Facebook, WhatsApp, Instagram rows - Same line inline layout matching the sketch */}
                    <div className="space-y-4 flex-1 overflow-y-auto px-1 pb-4">
                      
                      {/* Facebook Row */}
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold text-slate-400 w-20 shrink-0">Facebook:</span>
                        <input
                          type="text"
                          value={devFacebookId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDevFacebookId(val);
                            localStorage.setItem('neote_dev_fb', val);
                          }}
                          placeholder="fb.com/username"
                          className="flex-1 bg-transparent border-b border-slate-800 focus:border-indigo-500 text-[11px] text-slate-100 py-0.5 transition-all focus:outline-none placeholder-slate-600"
                        />
                      </div>

                      {/* WhatsApp Row */}
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold text-slate-400 w-20 shrink-0">WhatsApp:</span>
                        <input
                          type="text"
                          value={devWhatsappNumber}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDevWhatsappNumber(val);
                            localStorage.setItem('neote_dev_wp', val);
                          }}
                          placeholder="+8801700000000"
                          className="flex-1 bg-transparent border-b border-slate-800 focus:border-indigo-500 text-[11px] text-slate-100 py-0.5 transition-all focus:outline-none placeholder-slate-600"
                        />
                      </div>

                      {/* Instagram Row */}
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold text-slate-400 w-20 shrink-0">Instagram:</span>
                        <input
                          type="text"
                          value={devInstagramId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDevInstagramId(val);
                            localStorage.setItem('neote_dev_insta', val);
                          }}
                          placeholder="@username"
                          className="flex-1 bg-transparent border-b border-slate-800 focus:border-indigo-500 text-[11px] text-slate-100 py-0.5 transition-all focus:outline-none placeholder-slate-600"
                        />
                      </div>

                    </div>

                  </div>
                </div>
              )}

              {/* SLIDING PROFILE DRAWER FROM LEFT (MATCHING USER IMAGES IN APP THEME) */}
              <AnimatePresence>
                {isProfileDrawerOpen && (
                  <div className="absolute inset-0 z-50 overflow-hidden flex">
                    {/* Backdrop - optimized without expensive backdrop-blur for butter smooth frame-rates on APK/Android */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsProfileDrawerOpen(false)}
                      className="absolute inset-0 bg-black/60 cursor-pointer"
                    />

                    {/* Sliding Panel - optimized with high performance cubic-bezier transition & hardware acceleration will-change hint */}
                    <motion.div
                      initial={{ x: '-100%' }}
                      animate={{ x: '0' }}
                      exit={{ x: '-100%' }}
                      transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.35 }}
                      style={{
                        backgroundColor: themeMode === ThemeMode.DARK ? '#000000' : '#FFFFFF',
                        color: themeMode === ThemeMode.DARK ? '#FFFFFF' : '#0F172A',
                        borderColor: themeMode === ThemeMode.DARK ? `${selectedPreset.primaryColorHex}33` : undefined,
                        willChange: 'transform'
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
                        <div className="absolute top-4 left-4 flex items-center bg-slate-950/60 px-2.5 py-1 rounded-lg border border-white/10 shadow-lg overflow-hidden">
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

                        {/* STAGGERED INTRO CONTAINER FOR CORE PROFILE ELEMENTS (FULLY OPTIMIZED WITH HIGH-PERFORMANCE GPU-ACCELERATED TRANSITIONS) */}
                        <motion.div 
                          className="flex flex-col items-center mt-auto w-full select-none"
                          initial="hidden"
                          animate="show"
                          variants={{
                            hidden: { opacity: 0 },
                            show: {
                              opacity: 1,
                              transition: {
                                staggerChildren: 0.05,
                                delayChildren: 0.08
                              }
                            }
                          }}
                        >
                          {/* 1. Profile Avatar with lightweight scale & slide up */}
                          <motion.div 
                            variants={{
                              hidden: { scale: 0.9, opacity: 0, y: 10 },
                              show: { scale: 1, opacity: 1, y: 0, transition: { ease: [0.34, 1.56, 0.64, 1], duration: 0.35 } }
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
 
                           {/* 2. Account Name with lightweight slide up */}
                          <motion.h3 
                            variants={{
                              hidden: { y: 8, opacity: 0 },
                              show: { y: 0, opacity: 1, transition: { ease: "easeOut", duration: 0.25 } }
                            }}
                            className="text-sm font-black tracking-wide leading-tight uppercase text-white drop-shadow-md text-ellipsis overflow-hidden max-w-[220px]"
                          >
                            {userAccount.name || 'User Account'}
                          </motion.h3>
 
                           {/* 3. Joined Date Label with lightweight slide up */}
                          <motion.p 
                            variants={{
                              hidden: { y: 6, opacity: 0 },
                              show: { y: 0, opacity: 0.75, transition: { ease: "easeOut", duration: 0.25 } }
                            }}
                            className="text-[9px] font-bold mt-0.5 text-white/70"
                          >
                            Joined: {(() => {
                              if (!userAccount.createdAt) return '01 Apr 2026';
                              try {
                                const d = new Date(userAccount.createdAt);
                                if (isNaN(d.getTime())) return '01 Apr 2026';
                                return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                              } catch (e) {
                                return '01 Apr 2026';
                              }
                            })()}
                          </motion.p>
 
                           {/* 4. Copyable Info Cards Container */}
                          <div className="w-full mt-3 space-y-1.5 max-w-[240px]">
                            {/* USER ID */}
                            <motion.div 
                              variants={{
                                hidden: { x: -8, opacity: 0 },
                                show: { x: 0, opacity: 1, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.3 } }
                              }}
                              className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-left text-white shadow-sm"
                            >
                              <div>
                                <span className="text-[10px] block font-bold uppercase tracking-wider text-white/50 mb-0.5">USER ID:</span>
                                <span className="text-xs font-mono font-bold tracking-wide text-white">{userAccount.idCode || '#UNKNOWN'}</span>
                              </div>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(userAccount.idCode || '#UNKNOWN');
                                }}
                                className="p-1 rounded transition-colors cursor-pointer bg-white/5 hover:bg-white/15 text-white"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </motion.div>
 
                            {/* Phone number */}
                            <motion.div 
                              variants={{
                                hidden: { x: 8, opacity: 0 },
                                show: { x: 0, opacity: 1, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.3 } }
                              }}
                              className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-left text-white shadow-sm"
                            >
                              <div>
                                <span className="text-[10px] block font-bold uppercase tracking-wider text-white/50">Phone:</span>
                                <span className="text-xs font-mono font-bold tracking-wide text-white">{userAccount.phone || '01XXXXXXXXX'}</span>
                              </div>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(userAccount.phone || '01XXXXXXXXX');
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
                          onClick={() => {
                            setIsPrivacyModalOpen(true);
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
                              <Shield className="w-4 h-4" />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-wider opacity-95">Privacy Policy</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60" style={{ color: selectedPreset.primaryColorHex }} />
                        </button>

                        {/* Action: Terms & Conditions */}
                        <button 
                          onClick={() => {
                            setIsTermsModalOpen(true);
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
                            if (currentUser) {
                              try {
                                const userDocRef = doc(db, 'users', currentUser.uid);
                                const deviceId = localStorage.getItem('neote_device_id_v1') || 'dev-1';
                                const updatedSessions = deviceSessions.map(s => {
                                  if (s.id === deviceId) {
                                    return {
                                      ...s,
                                      status: 'offline' as const,
                                      logoutTime: new Date().toLocaleString()
                                    };
                                  }
                                  return s;
                                });
                                await setDoc(userDocRef, {
                                  deviceSessions: updatedSessions
                                }, { merge: true });
                              } catch (dbErr) {
                                console.warn("Failed to update logout session status:", dbErr);
                              }
                            }
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
                              onClick={() => {
                                if (selectedPlanId === plan.id) {
                                  setSelectedPlanId(null);
                                } else {
                                  setSelectedPlanId(plan.id);
                                }
                              }}
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

                              {selectedPlanId === plan.id && (
                                <span 
                                  className="absolute top-2 left-0 right-0 mx-auto w-max whitespace-nowrap text-[8px] font-black tracking-wide px-2 py-0.5 rounded-full shadow-lg border border-transparent animate-bounce z-20 font-sans"
                                  style={{
                                    backgroundColor: selectedPreset.primaryColorHex,
                                    color: '#000000',
                                  }}
                                >
                                  {plan.labelText || 'PROMO'}
                                </span>
                              )}
                              
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-all group-hover/plan:scale-110 relative shrink-0 border-2"
                                style={{
                                  backgroundColor: `${selectedPreset.primaryColorHex}15`,
                                  color: selectedPreset.primaryColorHex,
                                  borderColor: selectedPreset.primaryColorHex,
                                  boxShadow: `0 0 10px ${selectedPreset.primaryColorHex}80, inset 0 0 6px ${selectedPreset.primaryColorHex}40`
                                }}
                              >
                                <PremiumPaperclipIcon className="w-5 h-5" glowColor={selectedPreset.primaryColorHex} />
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
                              purchaseHistory.map(tx => {
                                const trxCode = tx.trxCode || `GPA.3312-4981-0023-${Math.floor(10000 + Math.random() * 90000)}`;
                                return (
                                  <div 
                                    key={tx.id} 
                                    className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col space-y-2 text-left hover:border-slate-700/80 hover:bg-slate-950/90 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group relative overflow-hidden"
                                  >
                                    {/* Left accent strip that highlights on hover */}
                                    <div 
                                      className="absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-200 opacity-0 group-hover:opacity-100" 
                                      style={{ backgroundColor: selectedPreset.primaryColorHex }}
                                    />
                                    
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="flex items-center gap-1">
                                          <span className="text-[7px] uppercase font-black px-1 py-0.5 rounded bg-slate-800/80 text-slate-400 font-mono">GOOGLE PLAY PURCHASE</span>
                                        </div>
                                        <span className="text-[11px] font-black text-white block font-sans mt-0.5">Bought {tx.amount} CLIP</span>
                                        <span className="text-[8px] text-slate-400 font-mono">{tx.date}</span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-[10.5px] font-mono font-black block" style={{ color: selectedPreset.primaryColorHex }}>{tx.price}</span>
                                        <span className="text-[7.5px] text-emerald-400 font-extrabold uppercase tracking-widest font-mono">SUCCESSFUL</span>
                                      </div>
                                    </div>

                                    {/* Receipt style dashed divider */}
                                    <div className="border-t border-dashed border-slate-800/60 my-1"></div>

                                    <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg border border-slate-800/30 transition-all duration-200 group-hover:bg-slate-900/80">
                                      <div className="flex flex-col">
                                        <span className="text-[7.5px] uppercase font-bold text-slate-500 tracking-wider font-mono">Reference Code (GPA)</span>
                                        <span className="text-[8.5px] font-mono font-semibold text-slate-300 select-all">{trxCode}</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(trxCode);
                                          triggerNotification('TRX Code Copied! 📋');
                                        }}
                                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-all cursor-pointer active:scale-90"
                                        title="Copy Transaction ID"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

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



              {/* FLOATING GENERAL TOAST NOTIFIER */}
              {alertNotification && (
                <div className="fixed bottom-4 right-4 bg-slate-950/95 border-2 border-[#00C087] text-white px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center space-x-3 backdrop-blur-md animate-slide-in">
                  <div className="w-2 h-2 rounded-full bg-[#00C087]" style={{ backgroundColor: selectedPreset.primaryColorHex }} />
                  <span className="text-xs font-black tracking-wide font-mono uppercase">{alertNotification}</span>
                </div>
              )}

    </div>
  );
}
