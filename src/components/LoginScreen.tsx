import React, { useState } from 'react';
import { Mail, Phone, Lock, User, Smartphone, Sparkles, ArrowRight, Eye, EyeOff, AlertTriangle, Copy, Check, ExternalLink } from 'lucide-react';
import { ThemeMode, FlutterCodePreset } from '../types';
import { auth, db, handleFirestoreError, OperationType, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, doc, setDoc, getDoc, collection, query, where, getDocs } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';

interface LoginScreenProps {
  selectedPreset: FlutterCodePreset;
  themeMode: ThemeMode;
  onLogin: (userInfo: { name: string; email: string; phone: string }) => void;
}

export default function LoginScreen({ selectedPreset, themeMode, onLogin }: LoginScreenProps) {
  const [activeMode, setActiveMode] = useState<'email' | 'phone'>('email');
  const [isSignUp, setIsSignUp] = useState(() => {
    const shouldSignUp = localStorage.getItem('neote_show_signup_after_delete') === 'true';
    if (shouldSignUp) {
      localStorage.removeItem('neote_show_signup_after_delete');
      return true;
    }
    return false;
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Validation alerts/feedbacks
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorFeedback(null);
    setIsLoading(true);
    let accountExists = false;

    try {
      if (isSignUp) {
        if (!name.trim()) {
          setErrorFeedback('Full Name is mandatory! You cannot sign up without entering your full name.');
          setIsLoading(false);
          return;
        }

        let userEmail = '';
        let userPassword = password;
        let userPhone = '';

        if (activeMode === 'email') {
          if (!email.trim() || !password.trim()) {
            setErrorFeedback('Email and passcode are required');
            setIsLoading(false);
            return;
          }
          userEmail = email.trim();
          userPhone = '';
        } else {
          if (!phone.trim() || !password.trim()) {
            setErrorFeedback('Phone number and passcode are required');
            setIsLoading(false);
            return;
          }
          userEmail = `${phone.trim()}@neote.app`;
          userPhone = phone.trim();
        }

        const getSafeIdentifier = (val: string): string => {
          return val.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
        };

        const safeId = getSafeIdentifier(activeMode === 'email' ? userEmail : userPhone);

        try {
          // Create user in Firebase Auth (source of truth). If the account exists in Auth, it will throw 'auth/email-already-in-use'.
          const userCredential = await createUserWithEmailAndPassword(auth, userEmail, userPassword);
          const user = userCredential.user;

          // Set the user profile in Firestore
          const userDocRef = doc(db, 'users', user.uid);
          
          // Generate a unique, random ID starting with # followed by 7 alphanumeric characters (26 alphabets + 0-9)
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          let initialIdCode = '#';
          for (let i = 0; i < 7; i++) {
            initialIdCode += chars.charAt(Math.floor(Math.random() * chars.length));
          }

          const initialProfile = {
            name: name.trim(),
            email: activeMode === 'email' ? userEmail : '',
            phone: activeMode === 'phone' ? userPhone : '',
            avatarUrl: '',
            premiumCoins: 0,
            country: 'Bangladesh',
            idCode: initialIdCode,
            "USER ID": initialIdCode,
            "User ID": initialIdCode,
            userId: initialIdCode,
            ownedThemes: ['#00C087'],
            selectedPreset: {
              primaryColorHex: selectedPreset.primaryColorHex,
              accentColorHex: selectedPreset.accentColorHex,
              darkBgColorHex: selectedPreset.darkBgColorHex,
              lightBgColorHex: selectedPreset.lightBgColorHex
            },
            purchaseHistory: [],
            deviceSessions: [],
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
          };
          try {
            await setDoc(userDocRef, initialProfile);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
          }

          // Register in public_users for public checks and name lookups
          try {
            const publicUserRef = doc(db, 'public_users', safeId);
            await setDoc(publicUserRef, {
              uid: user.uid,
              name: name.trim(),
              email: activeMode === 'email' ? userEmail : '',
              phone: activeMode === 'phone' ? userPhone : ''
            });
          } catch (err) {
            console.warn("Could not register in public_users collection:", err);
          }

          onLogin({
            name: name.trim(),
            email: activeMode === 'email' ? userEmail : '',
            phone: activeMode === 'phone' ? userPhone : ''
          });
        } catch (signUpErr: any) {
          if (signUpErr.code === 'auth/email-already-in-use') {
            setErrorFeedback('already have an account');
          } else {
            throw signUpErr;
          }
        }

      } else {
        // Sign In Flow (Strictly log in, do not auto-register new users)
        let userEmail = '';
        let userPassword = password;
        let userPhone = '';

        if (activeMode === 'email') {
          if (!email.trim() || !password.trim()) {
            setErrorFeedback('Email and passcode are required');
            setIsLoading(false);
            return;
          }
          userEmail = email.trim();
          userPhone = '';
        } else {
          if (!phone.trim() || !password.trim()) {
            setErrorFeedback('Phone number and passcode are required');
            setIsLoading(false);
            return;
          }
          userEmail = `${phone.trim()}@neote.app`;
          userPhone = phone.trim();
        }

        const getSafeIdentifier = (val: string): string => {
          return val.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
        };

        const safeId = getSafeIdentifier(activeMode === 'email' ? userEmail : userPhone);

        // Check if user account actually exists in public_users, users collection, or Mock
        accountExists = false;
        let previousName = '';
        try {
          const publicUserRef = doc(db, 'public_users', safeId);
          const publicUserSnap = await getDoc(publicUserRef);
          if (publicUserSnap.exists()) {
            accountExists = true;
            previousName = publicUserSnap.data().name || '';
          }
        } catch (e) {
          console.warn("Error reading public_users on login check:", e);
        }

        if (!accountExists) {
          try {
            const usersQuery = query(
              collection(db, 'users'), 
              where(activeMode === 'email' ? 'email' : 'phone', '==', activeMode === 'email' ? userEmail : userPhone)
            );
            const usersSnap = await getDocs(usersQuery);
            if (!usersSnap.empty) {
              accountExists = true;
              previousName = usersSnap.docs[0].data().name || '';
            }
          } catch (e) {
            console.warn("Error reading users collection on login check:", e);
          }
        }

        if (!accountExists) {
          // Fallback to check localStorage mock users
          const mockUsersStr = localStorage.getItem('neote_mock_users') || '[]';
          try {
            const mockUsers = JSON.parse(mockUsersStr);
            const found = mockUsers.find((u: any) => 
              activeMode === 'email' ? u.email === userEmail : (u.phone && u.phone === userPhone)
            );
            if (found) {
              accountExists = true;
              previousName = found.name || '';
            }
          } catch (err) {}
        }

        try {
          // Attempt sign in with email/phone format & password
          const userCredential = await signInWithEmailAndPassword(auth, userEmail, userPassword);
          const user = userCredential.user;

          // If a custom full name was specified on the sign-in screen, let's persist it to Firestore
          let finalName = name.trim() || previousName;
          if (name.trim()) {
            try {
              const userDocRef = doc(db, 'users', user.uid);
              await setDoc(userDocRef, {
                name: name.trim()
              }, { merge: true });
              finalName = name.trim();
            } catch (err) {
              console.warn("Could not update user name in Firestore during sign-in", err);
            }
          } else {
            // Check if there is already a name in Firestore or fallback to email prefix
            try {
              const userDocRef = doc(db, 'users', user.uid);
              const userSnap = await getDoc(userDocRef);
              if (userSnap.exists()) {
                const data = userSnap.data();
                finalName = data.name || data.accountName || user.displayName || user.email?.split('@')[0] || 'User Profile';
              }
            } catch (e) {
              // Ignore
            }
          }

          if (!finalName) {
            finalName = user.email?.split('@')[0] || 'User Profile';
          }

          // Store in public_users for fast checks next time
          try {
            const publicUserRef = doc(db, 'public_users', safeId);
            await setDoc(publicUserRef, {
              uid: user.uid,
              name: finalName,
              email: activeMode === 'email' ? userEmail : '',
              phone: activeMode === 'phone' ? userPhone : ''
            });
          } catch (err) {
            console.warn("Could not register safeId in public_users on login", err);
          }

          onLogin({
            name: finalName,
            email: activeMode === 'email' ? userEmail : '',
            phone: activeMode === 'phone' ? userPhone : ''
          });
        } catch (signInErr: any) {
          if (accountExists) {
            setErrorFeedback("Incorrect password");
          } else {
            if (signInErr.code === 'auth/user-not-found') {
              setErrorFeedback("Don't have an account in this mail/number");
            } else if (signInErr.code === 'auth/wrong-password') {
              setErrorFeedback("Incorrect password");
            } else if (signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/invalid-login-credentials') {
              setErrorFeedback("Don't have an account in this mail/number");
            } else {
              setErrorFeedback("Don't have an account in this mail/number");
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain' || (err.message && (err.message.includes('unauthorized-domain') || err.message.includes('unauthorized domain')))) {
        setUnauthorizedDomain(window.location.hostname);
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorFeedback('Email/Password credentials are not enabled yet in your Firebase project. Please enable Email/Password provider in the Firebase Console under Authentication > Sign-in method, or use "Sign in with Google" below!');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorFeedback('already have an account');
      } else if (err.code === 'auth/weak-password') {
        setErrorFeedback('Password must be at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorFeedback('Please enter a valid structure.');
      } else if (err.code === 'auth/user-not-found') {
        setErrorFeedback("Don't have an account in this mail/number");
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
        if (accountExists) {
          setErrorFeedback("Incorrect password");
        } else {
          setErrorFeedback("Don't have an account in this mail/number");
        }
      } else {
        setErrorFeedback(err.message || 'Authentication error. Please check and retry.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorFeedback(null);
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Set/update standard user profile in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const initialProfile = {
        name: user.displayName || 'Google User',
        email: user.email || '',
        phone: user.phoneNumber || '',
        avatarUrl: user.photoURL || '',
        premiumCoins: 0,
        ownedThemes: ['#00C087'],
        selectedPreset: {
          primaryColorHex: selectedPreset.primaryColorHex,
          accentColorHex: selectedPreset.accentColorHex,
          darkBgColorHex: selectedPreset.darkBgColorHex,
          lightBgColorHex: selectedPreset.lightBgColorHex
        }
      };
      try {
        await setDoc(userDocRef, initialProfile, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }

      onLogin({
        name: user.displayName || 'Google User',
        email: user.email || '',
        phone: user.phoneNumber || ''
      });
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain' || (err.message && (err.message.includes('unauthorized-domain') || err.message.includes('unauthorized domain')))) {
        setUnauthorizedDomain(window.location.hostname);
      } else {
        setErrorFeedback(err.message || 'Google sign-in failed. Please verify configuration settings or try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const primaryColor = selectedPreset.primaryColorHex;

  return (
    <div 
      className="absolute inset-0 z-50 flex flex-col justify-between overflow-y-auto px-5 py-7 select-none animate-fadeIn"
      style={{
        backgroundColor: '#030712', // Dark glow container matching black canvas
        color: '#E2E8F0'
      }}
    >
      {/* Top Graphic Logo Area */}
      <div className="flex flex-col items-center text-center mt-3">
        {/* Neon Glowing Custom SVG Logo matching original image */}
        <div className="relative group cursor-pointer mb-3">
          {/* External ambient pulse ring */}
          <div 
            className="absolute -inset-1 rounded-full blur-lg opacity-40 group-hover:opacity-75 transition duration-1000 animate-pulse"
            style={{ backgroundColor: primaryColor }}
          />
          <svg 
            viewBox="0 0 100 100" 
            className="w-20 h-20 relative z-10 transition-all duration-300 transform group-hover:scale-105"
          >
            {/* Outer Glowing Circle */}
            <circle cx="50" cy="50" r="42" fill="none" stroke={primaryColor} strokeWidth="2.5" style={{ filter: `drop-shadow(0 0 6px ${primaryColor})` }} />
            
            {/* Rounded Square Inner Note Pad Container */}
            <rect x="29" y="29" width="42" height="42" rx="10" fill="none" stroke={primaryColor} strokeWidth="2" style={{ filter: `drop-shadow(0 0 4px ${primaryColor}A0)` }} />
            
            {/* Horizontal lines */}
            <line x1="38" y1="41" x2="57" y2="41" stroke={primaryColor} strokeWidth="2.2" strokeLinecap="round" />
            <line x1="38" y1="47" x2="55" y2="47" stroke={primaryColor} strokeWidth="2.2" strokeLinecap="round" />
            <line x1="38" y1="53" x2="50" y2="53" stroke={primaryColor} strokeWidth="2.2" strokeLinecap="round" />
            
            {/* Scribble line at bottom left */}
            <path d="M 38 59 Q 43 56 47 60 T 54 58" fill="none" stroke={primaryColor} strokeWidth="1.8" strokeLinecap="round" />
            
            {/* Diagonal Pencil tool pointing to signature */}
            <g transform="translate(54, 58) rotate(28)">
              {/* Pencil body outline */}
              <path 
                d="M -2.5 -5 L -2.5 -22 C -2.5 -24 2.5 -24 2.5 -22 L 2.5 -5" 
                stroke={primaryColor} 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                fill="none" 
              />
              {/* Pencil cone wood tip */}
              <path 
                d="M -2.5 -5 L 0 0 L 2.5 -5 Z" 
                stroke={primaryColor} 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                fill="none" 
              />
              {/* Lead divider line */}
              <line 
                x1="-1" 
                y1="-2" 
                x2="1" 
                y2="-2" 
                stroke={primaryColor} 
                strokeWidth="2" 
                strokeLinecap="round" 
              />
              {/* Pencil eraser band */}
              <line 
                x1="-2.5" 
                y1="-18" 
                x2="2.5" 
                y2="-18" 
                stroke={primaryColor} 
                strokeWidth="2" 
                strokeLinecap="round" 
              />
            </g>
          </svg>
        </div>

        {/* Brand Typography */}
        <h1 className="text-3xl font-black tracking-[0.2em] mb-1.5 font-sans text-white uppercase">
          NEO<span style={{ color: primaryColor }}>TE</span>
        </h1>
        
        <div className="flex items-center justify-center space-x-2 text-slate-400">
          <span className="h-[1.5px] w-6 bg-slate-800"></span>
          <span className="text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: primaryColor }}>
            Note Anything
          </span>
          <span className="h-[1.5px] w-6 bg-slate-800"></span>
        </div>
      </div>

      {unauthorizedDomain ? (
        <div className="flex-1 flex flex-col justify-center my-4 overflow-y-auto scrollbar-none animate-slide-in">
          <div className="bg-red-950/40 border border-red-500/25 p-5 rounded-2xl text-left space-y-4">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
              <h2 className="text-sm font-black uppercase tracking-wider">Domain Not Authorized</h2>
            </div>
            
            <p className="text-[11px] text-slate-300 leading-relaxed">
              This application's preview domain is not authorized under your live Firebase Authentication settings. To permit signs-ins on this domain, please follow these simple steps:
            </p>

            <div className="space-y-3 bg-black/40 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-start space-x-2">
                <span className="bg-slate-800 text-[9px] font-bold px-1.5 py-0.5 rounded text-slate-300 mt-0.5 animate-pulse">1</span>
                <span className="text-[11px] text-slate-300">
                  Go to your <a href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`} target="_blank" rel="noopener noreferrer" className="font-bold underline text-amber-400 hover:text-amber-300 inline-flex items-center gap-0.5">Firebase Console <ExternalLink className="w-3 h-3" /></a> and navigate to <strong className="text-white">Authentication &gt; Settings</strong>.
                </span>
              </div>

              <div className="flex items-start space-x-2">
                <span className="bg-slate-800 text-[9px] font-bold px-1.5 py-0.5 rounded text-slate-300 mt-0.5">2</span>
                <span className="text-[11px] text-slate-300">
                  Scroll down to the <strong className="text-white">Authorized domains</strong> section.
                </span>
              </div>

              <div className="flex items-start space-x-2">
                <span className="bg-slate-800 text-[9px] font-bold px-1.5 py-0.5 rounded text-slate-300 mt-0.5">3</span>
                <span className="text-[11px] text-slate-300">
                  Click <strong className="text-white">Add domain</strong> and add the current hostname:
                </span>
              </div>

              {/* Display current host & copy button */}
              <div className="ml-5 flex items-center justify-between bg-slate-950/80 border border-slate-800 rounded-lg p-2 mt-1">
                <code className="font-mono text-[10px] text-emerald-400 truncate pr-2 select-all">{unauthorizedDomain}</code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(unauthorizedDomain);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[9px] text-slate-300 px-2 py-1 rounded flex items-center space-x-1 active:scale-95 transition-all cursor-pointer select-none shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-2.5 h-2.5 text-slate-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <a
                href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 rounded-xl text-center font-bold text-slate-950 text-xs uppercase tracking-wider transition-all duration-150 active:scale-98 cursor-pointer select-none flex items-center justify-center space-x-1"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${selectedPreset.accentColorHex}DE 100%)`
                }}
              >
                <span>Go to Settings</span>
                <ExternalLink className="w-3 h-3 stroke-[2.5]" />
              </a>
              <button
                type="button"
                onClick={() => setUnauthorizedDomain(null)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs rounded-xl font-bold uppercase tracking-wider active:scale-98 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Interactive Form Board */}
          <div className="flex-1 flex flex-col justify-center my-4 max-h-[450px] overflow-y-auto scrollbar-none">
            {/* Main form body */}
            <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
              {errorFeedback && (
                <div className="mb-2">
                  <div className="text-[10.5px] text-red-400 bg-red-950/60 border border-red-900/60 py-2 px-3 rounded-xl font-bold leading-normal shadow-sm">
                    <p className="flex items-start gap-1.5 break-words">
                      <span className="shrink-0">⚠️</span>
                      <span>{errorFeedback}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* FIRST FIELD: ONLY ASK FOR FULL NAME WHEN SIGNING UP */}
              {isSignUp && (
                <div className="space-y-1 animate-slide-in">
                  <label className="text-[9.5px] uppercase font-black text-slate-400 block px-1">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                      <User className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder=""
                      className="w-full bg-slate-950/90 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-100 focus:outline-none focus:ring-1 transition-all"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                      required={isSignUp}
                    />
                  </div>
                </div>
              )}

              {/* SECOND CONTAINER: TOGGLE BETWEEN EMAIL & PHONE (Always visible in both states) */}
              <div className="space-y-1">
                <span className="text-[11px] uppercase font-black block px-1 text-center tracking-widest" style={{ color: primaryColor }}>
                  {isSignUp ? 'Sign Up' : 'Log in'}
                </span>
                <div className="flex bg-slate-900/90 rounded-full p-1 border border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMode('email');
                      setErrorFeedback(null);
                    }}
                    className={`flex-1 py-1.5 rounded-full text-[10.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-1 ${
                      activeMode === 'email' 
                        ? 'text-slate-950 font-black' 
                        : 'text-slate-400 hover:text-slate-100'
                    }`}
                    style={activeMode === 'email' ? { backgroundColor: primaryColor } : {}}
                  >
                    <Mail className="w-3 h-3" />
                    <span>Email</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMode('phone');
                      setErrorFeedback(null);
                    }}
                    className={`flex-1 py-1.5 rounded-full text-[10.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-1 ${
                      activeMode === 'phone' 
                        ? 'text-slate-950 font-black' 
                        : 'text-slate-400 hover:text-slate-100'
                    }`}
                    style={activeMode === 'phone' ? { backgroundColor: primaryColor } : {}}
                  >
                    <Phone className="w-3 h-3" />
                    <span>Phone</span>
                  </button>
                </div>
              </div>

              {activeMode === 'email' ? (
                /* EMAIL INPUT */
                <div className="space-y-1">
                  <label className="text-[9.5px] uppercase font-black text-slate-400 block px-1">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                      <Mail className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-slate-950/90 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-100 focus:outline-none focus:ring-1 transition-all"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                      required
                    />
                  </div>
                </div>
              ) : (
                /* PHONE INPUT */
                <div className="space-y-1">
                  <label className="text-[9.5px] uppercase font-black text-slate-400 block px-1">Phone Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                      <Smartphone className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 01XXXXXXXXX"
                      className="w-full bg-slate-950/90 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-100 focus:outline-none focus:ring-1 transition-all"
                      style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                      required
                    />
                  </div>
                </div>
              )}

              {/* PASSCODE / PASSWORD INPUT (COMMON FOR BOTH MODES) */}
              <div className="space-y-1">
                <label className="text-[9.5px] uppercase font-black text-slate-400 block px-1">Passcode</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl py-2 pl-9 pr-10 text-xs text-slate-100 focus:outline-none focus:ring-1 transition-all"
                    style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl font-black text-slate-950 text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all duration-150 active:scale-98 cursor-pointer shadow-md hover:opacity-90 disabled:opacity-60"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${selectedPreset.accentColorHex}DE 100%)`
                  }}
                >
                  {isLoading ? (
                    <div className="w-4.5 h-4.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isSignUp ? 'Establish Account' : 'Authorized Sign In'}</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                    </>
                  )}
                </button>


              </div>
            </form>
          </div>

          {/* Bottom Area: Sign-up toggler */}
          <div className="space-y-3.5 text-center mb-1">
            {/* Sign up / Sign in toggle with subtle themed neon glow */}
            <button
              type="button"
              onClick={() => {
                const nextSignUp = !isSignUp;
                setIsSignUp(nextSignUp);
                setName('');
                setErrorFeedback(null);
              }}
              className="text-[8.5px] text-slate-500 hover:text-white transition-all font-black uppercase tracking-widest block mx-auto cursor-pointer underline underline-offset-4 whitespace-nowrap py-1"
            >
              {isSignUp 
                ? 'Already have an account? Log In' 
                : 'Do not have an account? Sign Up for free'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
