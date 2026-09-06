import React from 'react';

interface FlatMateLogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

/** Brand mark based on the supplied FlatMate+ circular logo. */
export const FlatMateLogo: React.FC<FlatMateLogoProps> = ({
  size = 44,
  showWordmark = false,
  className = ''
}) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <div
      className="shrink-0 rounded-full bg-[#EEE6DC] flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-label="FlatMate+ logo"
    >
      <svg viewBox="0 0 100 100" width={size * 0.68} height={size * 0.68} aria-hidden="true">
        <g fill="none" stroke="#242323" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="32" cy="30" r="9" />
          <circle cx="68" cy="30" r="9" />
          <path d="M13 78V62c0-12 8-19 19-19 8 0 14 4 18 10" />
          <path d="M87 78V62c0-12-8-19-19-19-8 0-14 4-18 10" />
          <path d="M50 53c-5 6-11 11-11 17 0 6 5 11 11 11s11-5 11-11c0-6-6-11-11-17Z" />
          <path d="M84 22v20M74 32h20" />
        </g>
      </svg>
    </div>
    {showWordmark && (
      <span className="font-display font-black text-xl tracking-tight text-[#2B2D42]">
        FLATMATE<span className="text-[#E07A5F]">+</span>
      </span>
    )}
  </div>
);
