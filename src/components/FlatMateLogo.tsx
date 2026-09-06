import React from 'react';

interface FlatMateLogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

/** Exact reusable FlatMate+ brand mark: transparent outside the warm circular badge. */
export const FlatMateLogo: React.FC<FlatMateLogoProps> = ({
  size = 44,
  showWordmark = false,
  className = ''
}) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <img
      src="/flatmate-logo.svg"
      width={size}
      height={size}
      alt="FlatMate+"
      className="shrink-0 block"
      style={{ width: size, height: size }}
    />
    {showWordmark && (
      <span className="font-display font-black text-xl tracking-tight text-[#242323]">
        FlatMate<span className="text-[#242323]">+</span>
      </span>
    )}
  </div>
);
