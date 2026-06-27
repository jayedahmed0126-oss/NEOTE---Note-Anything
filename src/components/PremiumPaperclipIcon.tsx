import React from 'react';

interface PremiumPaperclipIconProps {
  className?: string;
  glowColor?: string;
  strokeWidth?: number;
}

export default function PremiumPaperclipIcon({ 
  className = "w-4 h-4", 
  glowColor = "#00C087", 
  strokeWidth = 5 
}: PremiumPaperclipIconProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={`${className} overflow-visible`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: `drop-shadow(0 0 4px ${glowColor}A0)` }}
    >
      <g transform="translate(50,50) rotate(-45) translate(-50,-50)">
        {/* Double-stroke neon glowing outline */}
        <path
          d="M 32 40 L 32 62 C 32 72 40 80 50 80 C 60 80 68 72 68 62 L 68 31 C 68 21 60 13 50 13 C 40 13 32 21 32 31 L 32 56 C 32 59 34 61 37.5 61 C 41 61 43 59 43 56 L 43 31 C 43 27 46 24 50 24 C 54 24 57 27 57 31 L 57 56"
          stroke={glowColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Inner bright core stroke to mimic real neon tube glow! */}
        <path
          d="M 32 40 L 32 62 C 32 72 40 80 50 80 C 60 80 68 72 68 62 L 68 31 C 68 21 60 13 50 13 C 40 13 32 21 32 31 L 32 56 C 32 59 34 61 37.5 61 C 41 61 43 59 43 56 L 43 31 C 43 27 46 24 50 24 C 54 24 57 27 57 31 L 57 56"
          stroke="#EBFDFC"
          strokeWidth={strokeWidth * 0.35}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
      </g>
    </svg>
  );
}
