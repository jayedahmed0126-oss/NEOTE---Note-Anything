import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, FileText, Smartphone } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  primaryColor: string;
  durationMs?: number;
  isThemeChange?: boolean;
}

export default function SplashScreen({ onComplete, primaryColor, durationMs, isThemeChange }: SplashScreenProps) {
  const [showName, setShowName] = useState(false);

  // If it's a theme change, run the drawing sequence at normal elegance (speedRatio = 1) but dismiss directly after 1400ms (no idle delay).
  const totalDuration = isThemeChange ? 1400 : (durationMs ?? 2550);
  const speedRatio = 1; // Always preserve the gorgeous hand-written opening stroke speeds!

  useEffect(() => {
    // Show application name under logo after logo animation sequence starts
    const textTimer = setTimeout(() => {
      setShowName(true);
    }, 550);

    // Stay for total duration
    const completeTimer = setTimeout(() => {
      onComplete();
    }, totalDuration);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, totalDuration]);

  // Path drawing presets for high-end SVG handwriting effect
  const drawTransition = {
    duration: 0.8 * speedRatio,
    ease: "easeInOut"
  };

  return (
    <div className="absolute inset-0 z-[100] rounded-[34px] flex flex-col items-center justify-center bg-[#020617] text-white overflow-hidden select-none">
      {/* Background radial gradient glow representing gate.io theme */}
      <div 
        className="absolute w-[240px] h-[240px] rounded-full filter blur-[80px] opacity-20 pointer-events-none transition-all duration-[3000ms] animate-pulse"
        style={{
          background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)`
        }}
      />

      <div className="flex flex-col items-center">
        {/* Animated Custom Vector Logo */}
        <div className="relative mb-5">
          {/* Pulsing light aura */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute -inset-4 rounded-full blur-xl pointer-events-none"
            style={{ backgroundColor: `${primaryColor}25` }}
          />

          <svg 
            width="100" 
            height="100" 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="relative z-10"
          >
            {/* 1. Outer Glowing Circle - draws itself clockwise */}
            <motion.circle 
              cx="50" 
              cy="50" 
              r="42" 
              stroke={primaryColor} 
              strokeWidth="2.5" 
              strokeLinecap="round"
              initial={{ pathLength: 0, rotate: -90 }}
              animate={{ pathLength: 1, rotate: 270 }}
              transition={{ duration: 0.8 * speedRatio, ease: "easeInOut" }}
              style={{ filter: `drop-shadow(0 0 8px ${primaryColor})` }}
            />

            {/* 2. Inner Notepad Pad Container */}
            <motion.rect 
              x="28" 
              y="28" 
              width="44" 
              height="44" 
              rx="8" 
              stroke={primaryColor} 
              strokeWidth="2" 
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.3 * speedRatio, duration: 0.6 * speedRatio, ease: "easeInOut" }}
              style={{ filter: `drop-shadow(0 0 5px ${primaryColor}80)` }}
            />

            {/* 3. Notebook lines matching handwriting timing */}
            <motion.line 
              x1="38" 
              y1="41" 
              x2="55" 
              y2="41" 
              stroke={primaryColor} 
              strokeWidth="2.2" 
              strokeLinecap="round" 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.6 * speedRatio, duration: 0.25 * speedRatio, ease: "easeOut" }}
            />
            <motion.line 
              x1="38" 
              y1="47" 
              x2="51" 
              y2="47" 
              stroke={primaryColor} 
              strokeWidth="2.2" 
              strokeLinecap="round" 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.75 * speedRatio, duration: 0.25 * speedRatio, ease: "easeOut" }}
            />
            <motion.line 
              x1="38" 
              y1="53" 
              x2="47" 
              y2="53" 
              stroke={primaryColor} 
              strokeWidth="2.2" 
              strokeLinecap="round" 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.9 * speedRatio, duration: 0.25 * speedRatio, ease: "easeOut" }}
            />

            {/* 4. Handwriting Scribble design representing "Note Anything" */}
            <motion.path 
              d="M 38 60 Q 43 59 47 62 T 53 60" 
              stroke={primaryColor} 
              strokeWidth="1.8" 
              strokeLinecap="round" 
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1.05 * speedRatio, duration: 0.3 * speedRatio, ease: "easeOut" }}
            />

            {/* 5. Animated signature Pencil Tool writing notes */}
            <motion.g 
              initial={{ opacity: 0, x: 15, y: -15, rotate: -30 }}
              animate={{ opacity: [0, 1, 1], x: [15, 10, -5], y: [-15, -12, 10], rotate: [-30, 0, 18] }}
              transition={{ delay: 0.4 * speedRatio, duration: 0.8 * speedRatio, ease: "easeInOut" }}
            >
              {/* Pencil tip pointing near bottom-right of workspace */}
              <g transform="translate(49, 31)">
                {/* Pencil Cone wood tip */}
                <path d="M 6 12 L 8 16 L 10 12 Z" fill={primaryColor} />
                {/* Pencil lead body structure */}
                <rect x="6" y="2" width="4" height="10" rx="0.5" fill="none" stroke={primaryColor} strokeWidth="1.5" />
                {/* Pencil top eraser tip */}
                <rect x="6.5" y="0.5" width="3" height="1.5" fill={primaryColor} />
              </g>
            </motion.g>
          </svg>
        </div>

        {/* Dynamic Name & Slogan Reveal Block */}
        <AnimatePresence>
          {showName && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-center"
            >
              <h1 className="text-3xl font-black tracking-[0.2em] mb-1.5 font-sans text-white uppercase">
                NEO<span style={{ color: primaryColor }}>TE</span>
              </h1>
              
              <div className="flex items-center justify-center space-x-2 text-slate-400">
                <span className="h-[1.5px] w-6 bg-slate-800"></span>
                <span className="text-[10px] font-black tracking-[0.3em] uppercase animate-pulse" style={{ color: primaryColor }}>
                  Note Anything
                </span>
                <span className="h-[1.5px] w-6 bg-slate-800"></span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>


    </div>
  );
}
