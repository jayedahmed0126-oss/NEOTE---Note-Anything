// --- Hybrid Firebase Manager (Dual Real / Offline Mock Capability) ---
// This file detects if a valid custom Firebase configuration is provided in firebase-applet-config.json.
// If valid config is detected, it connects to live Google Firebase Cloud.
// If disconnected or using placeholder templates, it falls back seamlessly to the offline-ready, high-fidelity LocalStorage mockup.

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword as realSignInWithEmailAndPassword, 
  createUserWithEmailAndPassword as realCreateUserWithEmailAndPassword, 
  signInWithPopup as realSignInWithPopup, 
  GoogleAuthProvider as RealGoogleAuthProvider, 
  signOut as realSignOut, 
  onAuthStateChanged as realOnAuthStateChanged,
  updatePassword as realUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser as realDeleteUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc as realDoc, 
  collection as realCollection, 
  query as realQuery, 
  where as realWhere, 
  getDoc as realGetDoc, 
  getDocs as realGetDocs, 
  setDoc as realSetDoc, 
  updateDoc as realUpdateDoc, 
  deleteDoc as realDeleteDoc,
  getDocFromServer as realGetDocFromServer,
  onSnapshot as realOnSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Detect whether the configuration is real or placeholder/empty
const isConfigValid = 
  firebaseConfig && 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== '' && 
  !firebaseConfig.apiKey.includes('YOUR_') && 
  firebaseConfig.projectId && 
  !firebaseConfig.projectId.includes('YOUR_');

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email
    },
    operationType,
    path
  };
  console.error('Firestore Error Detailed Info: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  tenantId: string | null;
  providerData: any[];
}

// Global references
let firebaseApp: any = null;
let realDb: any = null;
let realAuth: any = null;

if (isConfigValid) {
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    realDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || undefined);
    realAuth = getAuth(firebaseApp);
    console.log("🔥 Successfully connected to live, custom Firebase project:", firebaseConfig.projectId);
  } catch (e) {
    console.error("❌ Failed to initialize real Firebase with the provided config. Falling back to Mock.", e);
  }
} else {
  console.log("ℹ️ Running in Offline Mock mode. Fill in 'firebase-applet-config.json' with actual credentials to connect to a live Firebase account.");
}

// AUTHENTICATION EXPORTS
export const auth = {
  get currentUser(): User | null {
    if (isConfigValid && realAuth) {
      const realUser = realAuth.currentUser;
      if (realUser) {
        return {
          uid: realUser.uid,
          email: realUser.email,
          displayName: realUser.displayName,
          photoURL: realUser.photoURL,
          phoneNumber: realUser.phoneNumber,
          emailVerified: realUser.emailVerified,
          isAnonymous: realUser.isAnonymous,
          tenantId: realUser.tenantId,
          providerData: realUser.providerData
        };
      }
      return null;
    }
    
    // Mock user fallback
    const stored = localStorage.getItem('neote_auth_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return null;
  },
  set currentUser(user: User | null) {
    if (!isConfigValid) {
      if (user) {
        localStorage.setItem('neote_auth_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('neote_auth_user');
      }
    }
  }
};

type AuthCallback = (user: User | null) => void;
const mockAuthListeners: AuthCallback[] = [];

export function onAuthStateChanged(authObj: any, callback: AuthCallback) {
  if (isConfigValid && realAuth) {
    return realOnAuthStateChanged(realAuth, (realUser) => {
      if (realUser) {
        callback({
          uid: realUser.uid,
          email: realUser.email,
          displayName: realUser.displayName,
          photoURL: realUser.photoURL,
          phoneNumber: realUser.phoneNumber,
          emailVerified: realUser.emailVerified,
          isAnonymous: realUser.isAnonymous,
          tenantId: realUser.tenantId,
          providerData: realUser.providerData
        });
      } else {
        callback(null);
      }
    });
  }

  // Mock implementation
  mockAuthListeners.push(callback);
  setTimeout(() => {
    callback(auth.currentUser);
  }, 10);
  
  return () => {
    const index = mockAuthListeners.indexOf(callback);
    if (index !== -1) {
      mockAuthListeners.splice(index, 1);
    }
  };
}

function notifyAuthStateChanged() {
  const user = auth.currentUser;
  for (const listener of mockAuthListeners) {
    try {
      listener(user);
    } catch (e) {
      console.error(e);
    }
  }
}

export function signOut(authObj: any): Promise<void> {
  if (isConfigValid && realAuth) {
    return realSignOut(realAuth);
  }
  
  // Mock implementations
  return new Promise((resolve) => {
    auth.currentUser = null;
    localStorage.removeItem('neote_is_guest_mode');
    localStorage.removeItem('neote_logged_in');
    notifyAuthStateChanged();
    resolve();
  });
}

export function signInWithEmailAndPassword(authObj: any, email: string, password: string): Promise<{ user: User }> {
  if (isConfigValid && realAuth) {
    return realSignInWithEmailAndPassword(realAuth, email, password).then((cred) => {
      const realUser = cred.user;
      return {
        user: {
          uid: realUser.uid,
          email: realUser.email,
          displayName: realUser.displayName,
          photoURL: realUser.photoURL,
          phoneNumber: realUser.phoneNumber,
          emailVerified: realUser.emailVerified,
          isAnonymous: realUser.isAnonymous,
          tenantId: realUser.tenantId,
          providerData: realUser.providerData
        }
      };
    });
  }

  // Mock implementation
  return new Promise((resolve, reject) => {
    const mockUsersStr = localStorage.getItem('neote_mock_users');
    let mockUsers = [];
    if (mockUsersStr) {
      try {
        mockUsers = JSON.parse(mockUsersStr);
      } catch (e) {}
    }

    const demoEmail = 'demo@example.com';
    const demoPassword = 'securepass123';
    
    let matchedUser = mockUsers.find((u: any) => u.email === email && u.password === password);
    
    if (!matchedUser && email === demoEmail && password === demoPassword) {
      matchedUser = {
        uid: 'demo-uid',
        email: demoEmail,
        name: 'Demo User',
        phone: '01XXXXXXXXX'
      };
      mockUsers.push({ ...matchedUser, password });
      localStorage.setItem('neote_mock_users', JSON.stringify(mockUsers));
    }

    if (matchedUser) {
      const user: User = {
        uid: matchedUser.uid,
        email: matchedUser.email,
        displayName: matchedUser.name,
        photoURL: '',
        phoneNumber: matchedUser.phone || 'N/A',
        emailVerified: true,
        isAnonymous: false,
        tenantId: null,
        providerData: []
      };
      
      auth.currentUser = user;
      localStorage.setItem('neote_logged_in', 'true');
      notifyAuthStateChanged();
      resolve({ user });
    } else {
      const error: any = new Error('Incorrect credentials/passcode. Account not found.');
      error.code = 'auth/invalid-credential';
      reject(error);
    }
  });
}

export function createUserWithEmailAndPassword(authObj: any, email: string, password: string): Promise<{ user: User }> {
  if (isConfigValid && realAuth) {
    return realCreateUserWithEmailAndPassword(realAuth, email, password).then((cred) => {
      const realUser = cred.user;
      return {
        user: {
          uid: realUser.uid,
          email: realUser.email,
          displayName: realUser.displayName,
          photoURL: realUser.photoURL,
          phoneNumber: realUser.phoneNumber,
          emailVerified: realUser.emailVerified,
          isAnonymous: realUser.isAnonymous,
          tenantId: realUser.tenantId,
          providerData: realUser.providerData
        }
      };
    });
  }

  // Mock implementation
  return new Promise((resolve, reject) => {
    const mockUsersStr = localStorage.getItem('neote_mock_users') || '[]';
    let mockUsers = [];
    try {
      mockUsers = JSON.parse(mockUsersStr);
    } catch (e) {}

    const alreadyExists = mockUsers.some((u: any) => u.email === email);
    if (alreadyExists) {
      const error: any = new Error('Email address already registered.');
      error.code = 'auth/email-already-in-use';
      return reject(error);
    }

    if (password.length < 6) {
      const error: any = new Error('Password must be at least 6 characters.');
      error.code = 'auth/weak-password';
      return reject(error);
    }

    const newUser = {
      uid: 'user-' + Date.now(),
      email,
      name: email.split('@')[0],
      phone: '',
      password
    };
    
    mockUsers.push(newUser);
    localStorage.setItem('neote_mock_users', JSON.stringify(mockUsers));

    const user: User = {
      uid: newUser.uid,
      email: newUser.email,
      displayName: newUser.name,
      photoURL: '',
      phoneNumber: newUser.phone || '',
      emailVerified: true,
      isAnonymous: false,
      tenantId: null,
      providerData: []
    };

    auth.currentUser = user;
    localStorage.setItem('neote_logged_in', 'true');
    notifyAuthStateChanged();
    resolve({ user });
  });
}

export function signInWithPopup(authObj: any, provider: any): Promise<{ user: User }> {
  if (isConfigValid && realAuth) {
    return realSignInWithPopup(realAuth, provider).then((cred) => {
      const realUser = cred.user;
      return {
        user: {
          uid: realUser.uid,
          email: realUser.email,
          displayName: realUser.displayName,
          photoURL: realUser.photoURL,
          phoneNumber: realUser.phoneNumber,
          emailVerified: realUser.emailVerified,
          isAnonymous: realUser.isAnonymous,
          tenantId: realUser.tenantId,
          providerData: realUser.providerData
        }
      };
    });
  }

  // Mock implementation
  return new Promise((resolve) => {
    const user: User = {
      uid: 'google-uid-' + Date.now(),
      email: 'demo@example.com',
      displayName: 'Demo User (Google)',
      photoURL: '',
      phoneNumber: 'N/A',
      emailVerified: true,
      isAnonymous: false,
      tenantId: null,
      providerData: []
    };
    
    auth.currentUser = user;
    localStorage.setItem('neote_logged_in', 'true');
    notifyAuthStateChanged();
    resolve({ user });
  });
}

export class GoogleAuthProvider {
  static PROVIDER_ID = 'google.com';
  constructor() {
    if (isConfigValid) {
      return new RealGoogleAuthProvider() as any;
    }
  }
}

export function changeUserPassword(currentPass: string, newPass: string): Promise<void> {
  if (isConfigValid && realAuth && realAuth.currentUser) {
    const user = realAuth.currentUser;
    if (!user.email) {
      return Promise.reject(new Error("No associated email found for the active user."));
    }
    const credential = EmailAuthProvider.credential(user.email, currentPass);
    return reauthenticateWithCredential(user, credential)
      .then(() => {
        return realUpdatePassword(user, newPass);
      });
  }

  // Mock implementation
  return new Promise((resolve, reject) => {
    const mockUsersStr = localStorage.getItem('neote_mock_users');
    let mockUsers: any[] = [];
    if (mockUsersStr) {
      try {
        mockUsers = JSON.parse(mockUsersStr);
      } catch (e) {}
    }

    const activeUser = auth.currentUser;
    if (!activeUser) {
      return reject(new Error("No logged in user found in sandbox database."));
    }

    // Find user in mock users
    const matchedUserIndex = mockUsers.findIndex((u: any) => u.uid === activeUser.uid || u.email === activeUser.email);
    if (matchedUserIndex !== -1) {
      const matchedUser = mockUsers[matchedUserIndex];
      // Check current password (our fallback demo account password is 'securepass123')
      const expectedPass = matchedUser.password || 'securepass123';
      if (currentPass !== expectedPass) {
        return reject(new Error("The Current Password you entered is incorrect."));
      }
      // Update password
      mockUsers[matchedUserIndex].password = newPass;
      localStorage.setItem('neote_mock_users', JSON.stringify(mockUsers));
      resolve();
    } else {
      // If demo-uid (the pre-seeded workspace) and password is securepass123
      if (activeUser.uid === 'demo-uid' && currentPass === 'securepass123') {
        mockUsers.push({
          uid: 'demo-uid',
          email: activeUser.email || 'demo@example.com',
          name: activeUser.displayName || 'Demo User',
          phone: activeUser.phoneNumber || '01XXXXXXXXX',
          password: newPass
        });
        localStorage.setItem('neote_mock_users', JSON.stringify(mockUsers));
        resolve();
      } else {
        reject(new Error("Check Current Password. Account reference mismatch."));
      }
    }
  });
}

export function deleteUserAccount(): Promise<void> {
  if (isConfigValid && realAuth && realAuth.currentUser) {
    return realDeleteUser(realAuth.currentUser);
  }
  
  // Mock implementations
  return new Promise((resolve) => {
    // Delete from mockUsers in localStorage
    const mockUsersStr = localStorage.getItem('neote_mock_users');
    const currUser = auth.currentUser;
    if (mockUsersStr && currUser) {
      try {
        let mockUsers = JSON.parse(mockUsersStr);
        mockUsers = mockUsers.filter((u: any) => u.uid !== currUser.uid || u.email !== currUser.email);
        localStorage.setItem('neote_mock_users', JSON.stringify(mockUsers));
      } catch (e) {}
    }
    
    auth.currentUser = null;
    localStorage.removeItem('neote_is_guest_mode');
    localStorage.removeItem('neote_logged_in');
    localStorage.removeItem('neote_auth_user');
    notifyAuthStateChanged();
    resolve();
  });
}

// FIRESTORE EXPORTS
export const db = realDb || {};

export function doc(dbObj: any, collectionName: string, id: string) {
  if (isConfigValid && realDb) {
    return realDoc(realDb, collectionName, id);
  }
  return { collectionName, id, isMockRef: true };
}

export function collection(dbObj: any, collectionName: string) {
  if (isConfigValid && realDb) {
    return realCollection(realDb, collectionName);
  }
  return { collectionName, isMockRef: true };
}

export function query(colRef: any, ...filters: any[]) {
  if (isConfigValid && realDb) {
    return realQuery(colRef, ...filters);
  }
  return { ...colRef, filters };
}

export function where(field: string, op: any, value: any) {
  if (isConfigValid && realDb) {
    return realWhere(field, op, value);
  }
  return { field, op, value };
}

// Low-level helper to view/save dynamic documents safely in localStorage (Mock engine Only)
function getMockDoc(collectionName: string, id: string) {
  const key = `neote_mock_doc_${collectionName}_${id}`;
  const dataStr = localStorage.getItem(key);
  if (dataStr) {
    try {
      return JSON.parse(dataStr);
    } catch (e) {}
  }
  return null;
}

function setMockDoc(collectionName: string, id: string, data: any, merge = false) {
  const key = `neote_mock_doc_${collectionName}_${id}`;
  let finalData = data;
  if (merge) {
    const existing = getMockDoc(collectionName, id);
    if (existing) {
      finalData = { ...existing, ...data };
    }
  }
  localStorage.setItem(key, JSON.stringify(finalData));
}

function deleteMockDoc(collectionName: string, id: string) {
  const key = `neote_mock_doc_${collectionName}_${id}`;
  localStorage.removeItem(key);
}

function getCollectionName(docRef: any): string {
  if (docRef && docRef.collectionName) return docRef.collectionName;
  if (docRef && docRef.parent && docRef.parent.id) return docRef.parent.id;
  return 'users';
}

const mockSnapshotListeners: { [colName: string]: Array<(snapshot: any) => void> } = {};

function triggerMockSnapshot(colName: string) {
  if (!mockSnapshotListeners[colName]) return;

  let docs: any[] = [];
  if (colName === 'shop_items') {
    const seededKey = 'neote_mock_shop_items_seeded';
    if (!localStorage.getItem(seededKey)) {
      const defaultShopItems = [
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
          category: 'Themes',
          createdAt: new Date().toISOString()
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
          category: 'Themes',
          createdAt: new Date().toISOString()
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
          category: 'Themes',
          createdAt: new Date().toISOString()
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
          category: 'Themes',
          createdAt: new Date().toISOString()
        }
      ];
      defaultShopItems.forEach(item => {
        localStorage.setItem(`neote_mock_doc_shop_items_${item.id}`, JSON.stringify(item));
      });
      localStorage.setItem(seededKey, 'true');
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('neote_mock_doc_shop_items_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item && item.id) {
            docs.push({
              id: item.id,
              data: () => ({ ...item })
            });
          }
        } catch (e) {}
      }
    }
    docs.sort((a, b) => a.id.localeCompare(b.id));
  } else if (colName === 'clip_packages') {
    const seededKey = 'neote_mock_clip_packages_seeded_v4';
    if (!localStorage.getItem(seededKey)) {
      // Clean up legacy mock package keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('neote_mock_doc_clip_packages_')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      const defaultClipPackages = [
        { id: 'usa_pkg_1', numCoins: 100, priceString: '$0.99', region: 'USA', isHot: false, labelText: '0.99$ gpc', createdAt: new Date().toISOString() },
        { id: 'usa_pkg_2', numCoins: 50, priceString: '$0.51', region: 'USA', isHot: false, labelText: '0.5$', createdAt: new Date().toISOString() },
        { id: 'usa_pkg_3', numCoins: 100, priceString: '$1.01', region: 'USA', isHot: false, labelText: '1$', createdAt: new Date().toISOString() },
        { id: 'usa_pkg_4', numCoins: 200, priceString: '$2.01', region: 'USA', isHot: false, labelText: '2$', createdAt: new Date().toISOString() },
        { id: 'usa_pkg_5', numCoins: 300, priceString: '$3.01', region: 'USA', isHot: false, labelText: '3$', createdAt: new Date().toISOString() },
        { id: 'usa_pkg_6', numCoins: 400, priceString: '$4.01', region: 'USA', isHot: false, labelText: '4$', createdAt: new Date().toISOString() },
        { id: 'usa_pkg_7', numCoins: 500, priceString: '$5.01', region: 'USA', isHot: false, labelText: '5$', createdAt: new Date().toISOString() },
        { id: 'usa_pkg_8', numCoins: 600, priceString: '$6.01', region: 'USA', isHot: false, labelText: '6$', createdAt: new Date().toISOString() },
        { id: 'usa_pkg_9', numCoins: 1000, priceString: '$10.01', region: 'USA', isHot: false, labelText: '10$', createdAt: new Date().toISOString() },
        { id: 'usa_pkg_10', numCoins: 445, priceString: '$4.45', region: 'USA', isHot: false, labelText: '90% 4$', createdAt: new Date().toISOString() },
        { id: 'usa_pkg_11', numCoins: 420, priceString: '$4.20', region: 'USA', isHot: false, labelText: '95% 4$', createdAt: new Date().toISOString() },
        { id: 'usa_pkg_12', numCoins: 535, priceString: '$5.34', region: 'USA', isHot: false, labelText: '75% 4$', createdAt: new Date().toISOString() },
        { id: 'usa_pkg_13', numCoins: 1100, priceString: '$10.55', region: 'USA', isHot: false, labelText: '95% 10$', createdAt: new Date().toISOString() },
        
        { id: 'hk_pkg_1', numCoins: 135, priceString: '10.10 HKD', region: 'HK', isHot: false, labelText: '10 HK$', createdAt: new Date().toISOString() },
        { id: 'hk_pkg_2', numCoins: 270, priceString: '20.10 HKD', region: 'HK', isHot: false, labelText: '20 HK$', createdAt: new Date().toISOString() },
        { id: 'hk_pkg_3', numCoins: 540, priceString: '40.10 HKD', region: 'HK', isHot: false, labelText: '40 HK$', createdAt: new Date().toISOString() },
        { id: 'hk_pkg_4', numCoins: 675, priceString: '50.10 HKD', region: 'HK', isHot: false, labelText: '50 HK$', createdAt: new Date().toISOString() },
        { id: 'hk_pkg_5', numCoins: 145, priceString: '10.60 HKD', region: 'HK', isHot: false, labelText: '95% 10 HK$', createdAt: new Date().toISOString() },
        { id: 'hk_pkg_6', numCoins: 285, priceString: '20.10 HKD', region: 'HK', isHot: false, labelText: '95% 20 HK$', createdAt: new Date().toISOString() },
        { id: 'hk_pkg_7', numCoins: 565, priceString: '42.10 HKD', region: 'HK', isHot: false, labelText: '95% 40 HK$', createdAt: new Date().toISOString() },
        { id: 'hk_pkg_8', numCoins: 710, priceString: '52.70 HKD', region: 'HK', isHot: false, labelText: '95% 50 HK$', createdAt: new Date().toISOString() }
      ];
      defaultClipPackages.forEach(item => {
        localStorage.setItem(`neote_mock_doc_clip_packages_${item.id}`, JSON.stringify(item));
      });
      localStorage.setItem(seededKey, 'true');
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('neote_mock_doc_clip_packages_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item && item.id) {
            docs.push({
              id: item.id,
              data: () => ({ ...item })
            });
          }
        } catch (e) {}
      }
    }
    docs.sort((a, b) => {
      // sort by region then by coin count
      const regComp = a.data().region.localeCompare(b.data().region);
      if (regComp !== 0) return regComp;
      return a.data().numCoins - b.data().numCoins;
    });
  } else if (colName === 'users') {
    let mockUsers: any[] = [];
    const mockUsersStr = localStorage.getItem('neote_mock_users');
    if (mockUsersStr) {
      try { mockUsers = JSON.parse(mockUsersStr); } catch (e) {}
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('neote_mock_doc_users_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          const uid = key.replace('neote_mock_doc_users_', '');
          if (data && !mockUsers.some(u => u.uid === uid)) {
            mockUsers.push({ uid, ...data });
          }
        } catch (e) {}
      }
    }
    docs = mockUsers.map(u => ({
      id: u.uid || 'unknown-uid',
      data: () => ({ ...u })
    }));
  } else if (colName === 'admin_logs') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('neote_mock_doc_admin_logs_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item && item.id) {
            docs.push({
              id: item.id,
              data: () => ({ ...item })
            });
          }
        } catch (e) {}
      }
    }
    // Sort logs descending by timestamp
    docs.sort((a, b) => {
      const tsA = a.data().timestamp || '';
      const tsB = b.data().timestamp || '';
      return tsB.localeCompare(tsA);
    });
  } else {
    let notes: any[] = [];
    const localNotesStr = localStorage.getItem('flutter_mockup_notes');
    if (localNotesStr) {
      try { notes = JSON.parse(localNotesStr); } catch (e) {}
    }
    docs = notes.map(note => ({
      id: note.id,
      data: () => ({
        userId: auth.currentUser?.uid || 'guest-user',
        title: note.title,
        content: note.content,
        category: note.category,
        updatedAt: note.updatedAt,
        color: note.color
      })
    }));
  }

  const snapshot = {
    docs,
    forEach: (cb: (doc: any) => void) => {
      docs.forEach(cb);
    },
    empty: docs.length === 0,
    size: docs.length
  };

  const listeners = mockSnapshotListeners[colName] || [];
  listeners.forEach(cb => {
    try {
      cb(snapshot);
    } catch (e) {
      console.error(e);
    }
  });
}

function executeLocalSetDoc(colName: string, id: string, data: any, options?: { merge?: boolean }): void {
  const isMerge = options?.merge === true;
  setMockDoc(colName, id, data, isMerge);

  // Dynamic synchronize local states
  if (colName === 'users') {
    const mergedUser = getMockDoc('users', id);
    if (mergedUser) {
      localStorage.setItem('user_account_profile', JSON.stringify(mergedUser));
      if (mergedUser.selectedPreset) {
        localStorage.setItem('neote_selected_preset', JSON.stringify(mergedUser.selectedPreset));
      }
      if (mergedUser.ownedThemes) {
        localStorage.setItem('neote_owned_themes', JSON.stringify(mergedUser.ownedThemes));
      }
    }
  } else if (colName === 'notes') {
    let notes: any[] = [];
    const localNotesStr = localStorage.getItem('flutter_mockup_notes');
    if (localNotesStr) {
      try {
        notes = JSON.parse(localNotesStr);
      } catch (e) {}
    }

    const existingIndex = notes.findIndex(n => n.id === id);
    const noteData = {
      id: id,
      title: data.title || '',
      content: data.content || '',
      category: data.category || 'General',
      updatedAt: data.updatedAt || 'Just now',
      color: data.color || '#00C087'
    };

    if (existingIndex !== -1) {
      notes[existingIndex] = { ...notes[existingIndex], ...noteData };
    } else {
      notes.push(noteData);
    }
    localStorage.setItem('flutter_mockup_notes', JSON.stringify(notes));
  }

  // Trigger mock snapshot stream
  setTimeout(() => triggerMockSnapshot(colName), 0);
}

function executeLocalDeleteDoc(colName: string, id: string): void {
  deleteMockDoc(colName, id);

  if (colName === 'notes') {
    let notes: any[] = [];
    const localNotesStr = localStorage.getItem('flutter_mockup_notes');
    if (localNotesStr) {
      try {
        notes = JSON.parse(localNotesStr);
      } catch (e) {}
    }
    const filtered = notes.filter(n => n.id !== id);
    localStorage.setItem('flutter_mockup_notes', JSON.stringify(filtered));
  }

  // Trigger mock snapshot stream
  setTimeout(() => triggerMockSnapshot(colName), 0);
}

function getLocalDocsFallback(queryObj: any): Promise<any> {
  return new Promise((resolve) => {
    const colName = queryObj?.collectionName || queryObj?.id || 'notes';

    if (colName === 'users') {
      let mockUsers: any[] = [];
      const mockUsersStr = localStorage.getItem('neote_mock_users');
      if (mockUsersStr) {
        try {
          mockUsers = JSON.parse(mockUsersStr);
        } catch (e) {}
      }

      // Also gather from individual document keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('neote_mock_doc_users_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            const uid = key.replace('neote_mock_doc_users_', '');
            if (data && !mockUsers.some(u => u.uid === uid)) {
              mockUsers.push({ uid, ...data });
            }
          } catch (e) {}
        }
      }

      let filteredUsers = [...mockUsers];
      if (queryObj && queryObj.filters) {
        for (const filter of queryObj.filters) {
          const { field, op, value } = filter;
          filteredUsers = filteredUsers.filter((u) => {
            const uValue = u[field];
            if (op === '==') {
              return String(uValue || '').trim().toLowerCase() === String(value || '').trim().toLowerCase();
            }
            if (op === 'array-contains') {
              return Array.isArray(uValue) && uValue.includes(value);
            }
            return true;
          });
        }
      }

      const docs = filteredUsers.map((u) => {
        return {
          id: u.uid || 'unknown-uid',
          data: () => ({ ...u })
        };
      });

      resolve({
        forEach: (callback: (doc: any) => void) => {
          docs.forEach(callback);
        },
        docs: docs,
        empty: docs.length === 0
      });
      return;
    }

    let userIdFilter: string | null = null;
    if (queryObj && queryObj.filters) {
      const uIdFilterObj = queryObj.filters.find((f: any) => f.field === 'userId');
      if (uIdFilterObj) {
        userIdFilter = uIdFilterObj.value;
      }
    }

    let notes: any[] = [];
    const localNotesStr = localStorage.getItem('flutter_mockup_notes');
    if (localNotesStr) {
      try {
        notes = JSON.parse(localNotesStr);
      } catch (e) {}
    }

    const docs = notes.map((note) => {
      return {
        id: note.id,
        data: () => ({
          userId: userIdFilter || auth.currentUser?.uid || 'guest-user',
          title: note.title,
          content: note.content,
          category: note.category,
          updatedAt: note.updatedAt,
          color: note.color
        })
      };
    });

    resolve({
      forEach: (callback: (doc: any) => void) => {
        docs.forEach(callback);
      },
      docs: docs,
      empty: docs.length === 0
    });
  });
}

export function getDoc(docRef: any): Promise<any> {
  if (isConfigValid && realDb && !docRef.isMockRef) {
    return realGetDoc(docRef).catch((err: any) => {
      console.warn("Firestore live getDoc error - checking local fallback:", err);
      const colName = getCollectionName(docRef);
      const data = getMockDoc(colName, docRef.id);
      return {
        exists: () => data !== null,
        data: () => data
      };
    });
  }

  return new Promise((resolve) => {
    const colName = getCollectionName(docRef);
    const data = getMockDoc(colName, docRef.id);
    resolve({
      exists: () => data !== null,
      data: () => data
    });
  });
}

export function getDocFromServer(docRef: any): Promise<any> {
  if (isConfigValid && realDb && !docRef.isMockRef) {
    return realGetDocFromServer(docRef).catch((err: any) => {
      console.warn("Firestore live getDocFromServer error - checking local fallback:", err);
      return getDoc(docRef);
    });
  }
  return getDoc(docRef);
}

export function getDocs(queryObj: any): Promise<any> {
  if (isConfigValid && realDb && !queryObj.isMockRef) {
    return realGetDocs(queryObj).catch((err: any) => {
      console.warn("Firestore live getDocs error - fallback to local notes:", err);
      return getLocalDocsFallback(queryObj);
    });
  }

  return getLocalDocsFallback(queryObj);
}

export function setDoc(docRef: any, data: any, options?: { merge?: boolean }): Promise<void> {
  const colName = getCollectionName(docRef);
  if (isConfigValid && realDb && !docRef.isMockRef) {
    return realSetDoc(docRef, data, options).catch((err: any) => {
      console.warn("Firestore live setDoc failed - using resilient LocalStorage fallback:", err);
      executeLocalSetDoc(colName, docRef.id, data, options);
    });
  }

  return new Promise((resolve) => {
    executeLocalSetDoc(colName, docRef.id, data, options);
    resolve();
  });
}

export function updateDoc(docRef: any, data: any): Promise<void> {
  const colName = getCollectionName(docRef);
  if (isConfigValid && realDb && !docRef.isMockRef) {
    return realUpdateDoc(docRef, data).catch((err: any) => {
      console.warn("Firestore live updateDoc failed - checking LocalStorage fallback:", err);
      executeLocalSetDoc(colName, docRef.id, data, { merge: true });
    });
  }
  return setDoc(docRef, data, { merge: true });
}

export function deleteDoc(docRef: any): Promise<void> {
  const colName = getCollectionName(docRef);
  if (isConfigValid && realDb && !docRef.isMockRef) {
    return realDeleteDoc(docRef).catch((err: any) => {
      console.warn("Firestore live deleteDoc failed - checking LocalStorage fallback:", err);
      executeLocalDeleteDoc(colName, docRef.id);
    });
  }

  return new Promise((resolve) => {
    executeLocalDeleteDoc(colName, docRef.id);
    resolve();
  });
}

export function onSnapshot(ref: any, callback: (snapshot: any) => void, errCallback?: (error: any) => void) {
  if (isConfigValid && realDb && !ref.isMockRef) {
    return realOnSnapshot(ref, callback, errCallback);
  }

  const colName = ref.collectionName || ref.id || 'notes';
  if (!mockSnapshotListeners[colName]) {
    mockSnapshotListeners[colName] = [];
  }
  mockSnapshotListeners[colName].push(callback);

  // Trigger once immediately
  setTimeout(() => triggerMockSnapshot(colName), 0);

  return () => {
    if (mockSnapshotListeners[colName]) {
      mockSnapshotListeners[colName] = mockSnapshotListeners[colName].filter(cb => cb !== callback);
    }
  };
}
