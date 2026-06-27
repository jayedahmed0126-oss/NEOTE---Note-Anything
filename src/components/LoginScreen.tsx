import React, { useState } from 'react';
import { Mail, Phone, Lock, User, Smartphone, Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { ThemeMode, FlutterCodePreset } from '../types';
import { auth, db, handleFirestoreError, OperationType, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, doc, setDoc, getDoc, collection, query, where, getDocs } from '../lib/firebase';

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

        // Check if account already exists in Firestore public_users or Mock
        let accountAlreadyExists = false;
        try {
          const publicUserRef = doc(db, 'public_users', safeId);
          const publicUserSnap = await getDoc(publicUserRef);
          if (publicUserSnap.exists()) {
            accountAlreadyExists = true;
          }
        } catch (e) {
          console.warn("Error reading public_users on signup:", e);
        }

        if (!accountAlreadyExists) {
          // Fallback to check localStorage mock users
          const mockUsersStr = localStorage.getItem('neote_mock_users') || '[]';
          try {
            const mockUsers = JSON.parse(mockUsersStr);
            const found = mockUsers.find((u: any) => 
              activeMode === 'email' ? u.email === userEmail : (u.phone && u.phone === userPhone)
            );
            if (found) {
              accountAlreadyExists = true;
            }
          } catch (err) {}
        }

        if (accountAlreadyExists) {
          setErrorFeedback('already have an account');
          setIsLoading(false);
          return;
        }

        try {
          // Create user in Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(auth, userEmail, userPassword);
          const user = userCredential.user;

          // Set the user profile in Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const initialIdCode = name.trim().replace(/\s+/g, '').slice(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
          const initialProfile = {
            name: name.trim(),
            email: activeMode === 'email' ? userEmail : '',
            phone: activeMode === 'phone' ? userPhone : '',
            avatarUrl: '',
            premiumCoins: 0,
            country: 'Bangladesh',
            idCode: initialIdCode,
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
      if (err.code === 'auth/operation-not-allowed') {
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
      setErrorFeedback(err.message || 'Google sign-in failed. Please verify configuration settings or try again.');
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
            <rect x="28" y="28" width="44" height="44" rx="8" fill="none" stroke={primaryColor} strokeWidth="2" style={{ filter: `drop-shadow(0 0 4px ${primaryColor}A0)` }} />
            
            {/* Horizontal lines */}
            <line x1="38" y1="41" x2="55" y2="41" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
            <line x1="38" y1="47" x2="51" y2="47" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
            <line x1="38" y1="53" x2="47" y2="53" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
            
            {/* Scribble line at bottom left */}
            <path d="M 38 60 Q 43 59 47 62 T 53 60" fill="none" stroke={primaryColor} strokeWidth="1.5" strokeLinecap="round" />
            
            {/* Diagonal Pencil tool pointing to signature */}
            <g transform="translate(49, 31) rotate(18)">
              {/* Pencil tip */}
              <path d="M 6 12 L 8 16 L 10 12 Z" fill={primaryColor} />
              {/* Pencil lead body */}
              <rect x="6" y="2" width="4" height="10" rx="0.5" fill="none" stroke={primaryColor} strokeWidth="1.5" />
              {/* Pencil top eraser tip */}
              <rect x="6.5" y="0.5" width="3" height="1.5" fill={primaryColor} />
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

            {/* Separator */}
            <div className="flex items-center justify-center space-x-2 my-2 opacity-50">
              <div className="h-[1px] bg-slate-800 flex-1"></div>
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">or</span>
              <div className="h-[1px] bg-slate-800 flex-1"></div>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl font-bold bg-slate-900 border border-slate-850 text-xs text-slate-100 uppercase tracking-wider flex items-center justify-center space-x-2 hover:bg-slate-850 active:scale-98 transition-all disabled:opacity-60 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.75 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              <span>Sign In with Google</span>
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
    </div>
  );
}
