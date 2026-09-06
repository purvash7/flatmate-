import React from 'react';

interface FlatMateLogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

/** Consistent FlatMate+ brand mark using the supplied circular logo asset. */
export const FlatMateLogo: React.FC<FlatMateLogoProps> = ({
  size = 44,
  showWordmark = false,
  className = ''
}) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <img
      src="/flatmate-logo.svg"
      alt="FlatMate+"
      width={size}
      height={size}
      draggable={false}
      className="shrink-0 block"
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
    {showWordmark && (
      <span className="font-display font-black text-xl tracking-tight text-[#242323] whitespace-nowrap">
        FlatMate+
      </span>
    )}
  </div>
);
