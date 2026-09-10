import React from 'react';

interface SelectableChipProps {
  id?: string;
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  subLabel?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SelectableChip: React.FC<SelectableChipProps> = ({
  id,
  label,
  selected,
  onClick,
  icon,
  subLabel,
  disabled = false,
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-medium min-h-[36px]',
    md: 'px-4 py-2 text-sm font-medium min-h-[44px]',
    lg: 'px-5 py-3 text-base font-semibold min-h-[50px]'
  }[size];

  return (
    <button
      id={id}
      type="button"
      disabled={disabled}
      onClick={onClick}
      data-selected={selected}
      className={`chip-selectable relative inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-150 border focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/40 max-w-full min-w-0 ${sizeClasses} ${
        selected
          ? '!bg-[#E07A5F] !text-white !border-[#E07A5F] shadow-sm font-semibold'
          : 'bg-white text-[#2B2D42] border-[#E6E3DE] hover:border-[#E07A5F]/60 hover:bg-[#FAF8F4]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {icon && <span className={`flex-shrink-0 ${selected ? 'text-white' : 'text-[#7A7D87]'}`}>{icon}</span>}
      <span className="whitespace-normal break-words text-center leading-tight select-none min-w-0">{label}</span>
      {subLabel && (
        <span className={`text-xs ml-1 whitespace-normal break-words ${selected ? 'text-white/90' : 'text-[#7A7D87]'}`}>
          ({subLabel})
        </span>
      )}
    </button>
  );
};
