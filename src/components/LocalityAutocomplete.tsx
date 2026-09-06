import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, X, Check, Plus } from 'lucide-react';

export const BANGALORE_LOCALITIES = [
  'Indiranagar',
  'Koramangala',
  'HSR Layout',
  'Bellandur',
  'Whitefield',
  'Marathahalli',
  'Sarjapur Road',
  'Electronic City',
  'JP Nagar',
  'Jayanagar',
  'BTM Layout',
  'Hebbal',
  'Malleshwaram',
  'Banashankari',
  'Kalyan Nagar',
  'Domlur',
  'CV Raman Nagar',
  'Richmond Town',
  'Yelahanka',
  'Green Glen Layout',
  'Kasavanahalli',
  'Brookefield',
  'AECS Layout',
  'Kadubeesanahalli',
  'Panathur',
  'Mahadevapura',
  'Kundalahalli',
  'Munnekollal',
  'Haralur Road',
  'Singasandra',
  'Kudlu Gate',
  'Harlur',
  'Basavanagudi',
  'Frazer Town',
  'Cooke Town',
  'Sadashivanagar',
  'Vasanth Nagar',
  'Ulsoor',
  'Ejipura',
  'Tavarekere',
  'Bilekahalli',
  'Arekere',
  'Bannerghatta Road',
  'Kengeri',
  'Nagarbhavi',
  'Rajajinagar',
  'Yeshwanthpur',
  'Mathikere',
  'RT Nagar',
  'Thanisandra',
  'Hennur Road',
  'Sahakara Nagar',
  'Vidyaranyapura',
  'HBR Layout',
  'Kammanahalli',
  'KR Puram',
  'Hoodi',
  'Varthur',
  'Gunjur',
  'Channasandra'
];

interface LocalityAutocompleteProps {
  value: string | string[];
  onChange: (val: any) => void;
  multiple?: boolean;
  maxSelections?: number;
  placeholder?: string;
  label?: string;
  helperText?: string;
  id?: string;
  required?: boolean;
}

export const LocalityAutocomplete: React.FC<LocalityAutocompleteProps> = ({
  value,
  onChange,
  multiple = false,
  maxSelections = 5,
  placeholder = 'Type to search locality (e.g. Indiranagar, HSR, Koramangala)...',
  label,
  helperText,
  id = 'locality-autocomplete',
  required = false
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedValues: string[] = multiple
    ? (Array.isArray(value) ? value : (value ? [value] : []))
    : (typeof value === 'string' && value ? [value] : []);

  // Filter localities based on query
  const filteredLocalities = BANGALORE_LOCALITIES.filter(loc =>
    loc.toLowerCase().includes(query.trim().toLowerCase())
  );

  const isExactMatch = BANGALORE_LOCALITIES.some(
    loc => loc.toLowerCase() === query.trim().toLowerCase()
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (loc: string) => {
    if (multiple) {
      if (selectedValues.includes(loc)) {
        onChange(selectedValues.filter(v => v !== loc));
      } else {
        if (selectedValues.length < maxSelections) {
          onChange([...selectedValues, loc]);
        }
      }
      setQuery('');
      inputRef.current?.focus();
    } else {
      onChange(loc);
      setQuery('');
      setIsOpen(false);
    }
  };

  const handleRemove = (loc: string) => {
    if (multiple) {
      onChange(selectedValues.filter(v => v !== loc));
    } else {
      onChange('');
    }
  };

  const handleAddCustom = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    handleSelect(trimmed);
  };

  return (
    <div ref={wrapperRef} className="relative w-full text-left" id={`${id}-wrapper`}>
      {label && (
        <label htmlFor={`${id}-input`} className="block label-caps text-[#2B2D42] mb-1.5 font-bold">
          {label} {required && <span className="text-[#E07A5F]">*</span>}
        </label>
      )}

      {/* Selected chips in multiple mode */}
      {multiple && selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2.5">
          {selectedValues.map(item => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FAF8F4] border border-[#E6E3DE] text-xs font-bold text-[#2B2D42] shadow-2xs group hover:border-[#E07A5F] transition-colors"
            >
              <MapPin className="w-3 h-3 text-[#E07A5F]" />
              <span>{item}</span>
              <button
                type="button"
                onClick={() => handleRemove(item)}
                className="text-[#7A7D87] hover:text-[#E07A5F] transition-colors ml-0.5"
                title={`Remove ${item}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Main Search Input Box */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-[#7A7D87] pointer-events-none">
          <Search className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          id={`${id}-input`}
          type="text"
          value={!multiple && !isOpen && selectedValues.length > 0 ? selectedValues[0] : query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            if (!multiple && selectedValues.length > 0 && e.target.value === '') {
              onChange('');
            }
          }}
          onFocus={() => {
            setIsOpen(true);
            if (!multiple && selectedValues.length > 0) {
              setQuery(selectedValues[0]);
            }
          }}
          placeholder={multiple && selectedValues.length > 0 ? `Add more localities (up to ${maxSelections})...` : placeholder}
          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white border border-[#E6E3DE] text-sm text-[#2B2D42] placeholder-[#7A7D87]/70 focus:outline-none focus:border-[#E07A5F] focus:ring-2 focus:ring-[#E07A5F]/20 transition-all font-medium"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              if (!multiple) onChange('');
            }}
            className="absolute right-3 text-[#7A7D87] hover:text-[#2B2D42]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {helperText && (
        <p className="text-xs text-[#7A7D87] mt-1.5">{helperText}</p>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-white rounded-2xl border border-[#E6E3DE] shadow-xl py-2 space-y-0.5">
          {filteredLocalities.length > 0 ? (
            filteredLocalities.map((loc) => {
              const isSelected = selectedValues.includes(loc);
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handleSelect(loc)}
                  className={`w-full px-4 py-2.5 text-left text-xs sm:text-sm font-medium flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-[#E07A5F]/10 text-[#E07A5F] font-bold'
                      : 'text-[#2B2D42] hover:bg-[#FAF8F4]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-[#E07A5F]' : 'text-[#7A7D87]'}`} />
                    <span>{loc}</span>
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-[#E07A5F]" />}
                </button>
              );
            })
          ) : (
            <div className="p-3 text-center text-xs text-[#7A7D87]">
              No predefined locality found for "{query}"
            </div>
          )}

          {/* Add custom locality button if query doesn't match predefined */}
          {query.trim().length > 2 && !isExactMatch && (
            <div className="p-2 border-t border-[#E6E3DE]">
              <button
                type="button"
                onClick={handleAddCustom}
                className="w-full px-3 py-2 rounded-xl bg-[#FAF8F4] hover:bg-[#E07A5F]/10 text-xs font-bold text-[#E07A5F] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add "{query.trim()}" as custom locality</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Popular quick-select suggestions for Bangalore */}
      {selectedValues.length === 0 && !isOpen && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-[#7A7D87]">Popular:</span>
          {['Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'Bellandur'].map((pLoc) => (
            <button
              key={pLoc}
              type="button"
              onClick={() => handleSelect(pLoc)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-[#FAF8F4] border border-[#E6E3DE] text-[#2B2D42] hover:border-[#E07A5F] hover:text-[#E07A5F] font-medium transition-colors"
            >
              + {pLoc}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
