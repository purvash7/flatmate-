import React from 'react';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { DiscoverFilters } from '../types.js';
import { SelectableChip } from './SelectableChip.js';

interface DiscoverFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: DiscoverFilters;
  defaultFilters?: DiscoverFilters;
  onApplyFilters: (newFilters: DiscoverFilters) => void;
  onResetFilters: () => void;
  onResetToDefaults?: () => void;
}

const BANGALORE_LOCALITIES = [
  'All',
  'Indiranagar',
  'Koramangala',
  'HSR Layout',
  'Bellandur',
  'Whitefield',
  'Hennur',
  'Marathahalli',
  'Hebbal',
  'BTM Layout',
  'JP Nagar',
  'Electronic City',
  'Yelahanka'
];

const COMMON_NON_NEGOTIABLES = [
  'Strictly non-smoking flat',
  'Pure vegetarian kitchen only',
  'Attached private washroom',
  'Quiet hours after 11 PM',
  'Pet friendly space',
  'No late night parties'
];

export const DiscoverFiltersModal: React.FC<DiscoverFiltersModalProps> = ({
  isOpen,
  onClose,
  filters,
  defaultFilters,
  onApplyFilters,
  onResetFilters,
  onResetToDefaults
}) => {
  const [localFilters, setLocalFilters] = React.useState<DiscoverFilters>({ ...filters });

  React.useEffect(() => {
    setLocalFilters({ ...filters });
  }, [filters, isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const toggleNonNegotiable = (opt: string) => {
    const current = localFilters.non_negotiables || [];
    if (current.includes(opt)) {
      const updated = current.filter(item => item !== opt);
      setLocalFilters({ ...localFilters, non_negotiables: updated.length > 0 ? updated : undefined });
    } else {
      setLocalFilters({ ...localFilters, non_negotiables: [...current, opt] });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-[#E6E3DE] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E6E3DE] flex items-center justify-between bg-[#FAF8F4]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E07A5F]/15 flex items-center justify-center text-[#E07A5F]">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-[#2B2D42]">Discover Filters</h3>
              <p className="text-xs text-[#7A7D87]">Filter compatible flatmates in Bangalore</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-[#E6E3DE] flex items-center justify-center text-[#7A7D87] hover:text-[#2B2D42]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Options */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Locality */}
          <div>
            <label className="label-caps text-[#7A7D87] block mb-2.5">Locality</label>
            <div className="flex flex-wrap gap-2">
              {BANGALORE_LOCALITIES.map(loc => (
                <SelectableChip
                  key={loc}
                  label={loc}
                  size="sm"
                  selected={(localFilters.locality || 'All') === loc}
                  onClick={() => setLocalFilters({ ...localFilters, locality: loc === 'All' ? undefined : loc })}
                />
              ))}
            </div>
          </div>

          {/* Housing Intent */}
          <div>
            <label className="label-caps text-[#7A7D87] block mb-2.5">Housing Goal</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'All', label: 'All Goals' },
                { id: 'has_house', label: 'Has a House (Looking for Roommate)' },
                { id: 'co_search', label: 'Looking to Co-Search' },
                { id: 'vacancy', label: 'Seeking Vacancy' }
              ].map(item => (
                <SelectableChip
                  key={item.id}
                  label={item.label}
                  size="sm"
                  selected={(localFilters.housing_intent || 'All') === item.id}
                  onClick={() => setLocalFilters({ ...localFilters, housing_intent: item.id === 'All' ? undefined : item.id })}
                />
              ))}
            </div>
          </div>

          {/* Gender Preference */}
          <div>
            <label className="label-caps text-[#7A7D87] block mb-2.5">Flatmate Gender</label>
            <div className="flex flex-wrap gap-2">
              {['Any', 'Women only', 'Men only'].map(g => (
                <SelectableChip
                  key={g}
                  label={g}
                  size="sm"
                  selected={(localFilters.gender_preference || 'Any') === g}
                  onClick={() => setLocalFilters({ ...localFilters, gender_preference: g === 'Any' ? undefined : g })}
                />
              ))}
            </div>
          </div>

          {/* Rent Range (Editable fields, Requirement #14) */}
          <div>
            <label className="label-caps text-[#7A7D87] block mb-2.5">Monthly Rent Range (₹)</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-[#7A7D87] mb-1 block">Min Rent (₹)</span>
                <input
                  type="number"
                  value={localFilters.min_rent ?? ''}
                  placeholder="₹ 5,000"
                  onChange={e => setLocalFilters({ ...localFilters, min_rent: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E3DE] text-sm focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/40"
                />
              </div>
              <div>
                <span className="text-xs text-[#7A7D87] mb-1 block">Max Rent (₹)</span>
                <input
                  type="number"
                  value={localFilters.max_rent ?? ''}
                  placeholder="₹ 35,000"
                  onChange={e => setLocalFilters({ ...localFilters, max_rent: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E3DE] text-sm focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/40"
                />
              </div>
            </div>
          </div>

          {/* Food Preference */}
          <div>
            <label className="label-caps text-[#7A7D87] block mb-2.5">Food Preference</label>
            <div className="flex flex-wrap gap-2">
              {['Any', 'Vegetarian', 'Non-vegetarian', 'Eggetarian', 'Vegan'].map(f => (
                <SelectableChip
                  key={f}
                  label={f}
                  size="sm"
                  selected={(localFilters.food_preference || 'Any') === f}
                  onClick={() => setLocalFilters({ ...localFilters, food_preference: f === 'Any' ? undefined : f })}
                />
              ))}
            </div>
          </div>

          {/* Smoking */}
          <div>
            <label className="label-caps text-[#7A7D87] block mb-2.5">Smoking Habit</label>
            <div className="flex flex-wrap gap-2">
              {['Any', 'No', 'Occasionally', 'Yes'].map(s => (
                <SelectableChip
                  key={s}
                  label={s}
                  size="sm"
                  selected={(localFilters.smoking || 'Any') === s}
                  onClick={() => setLocalFilters({ ...localFilters, smoking: s === 'Any' ? undefined : s })}
                />
              ))}
            </div>
          </div>

          {/* Cleanliness */}
          <div>
            <label className="label-caps text-[#7A7D87] block mb-2.5">Cleanliness Standard</label>
            <div className="flex flex-wrap gap-2">
              {['Any', 'Strict', 'Moderate', 'Relaxed'].map(c => (
                <SelectableChip
                  key={c}
                  label={c}
                  size="sm"
                  selected={(localFilters.cleanliness || 'Any') === c}
                  onClick={() => setLocalFilters({ ...localFilters, cleanliness: c === 'Any' ? undefined : c })}
                />
              ))}
            </div>
          </div>

          {/* Sleep Schedule */}
          <div>
            <label className="label-caps text-[#7A7D87] block mb-2.5">Sleep Schedule</label>
            <div className="flex flex-wrap gap-2">
              {['Any', 'Early bird', 'Flexible', 'Night owl'].map(sl => (
                <SelectableChip
                  key={sl}
                  label={sl}
                  size="sm"
                  selected={(localFilters.sleep_schedule || 'Any') === sl}
                  onClick={() => setLocalFilters({ ...localFilters, sleep_schedule: sl === 'Any' ? undefined : sl })}
                />
              ))}
            </div>
          </div>

          {/* Non-negotiables / Dealbreakers */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="label-caps text-[#7A7D87]">Dealbreakers & Non-negotiables</label>
              {(localFilters.non_negotiables?.length || 0) > 0 && (
                <button
                  type="button"
                  onClick={() => setLocalFilters({ ...localFilters, non_negotiables: undefined })}
                  className="text-[11px] text-[#E07A5F] hover:underline font-semibold"
                >
                  Clear dealbreakers
                </button>
              )}
            </div>
            <p className="text-xs text-[#7A7D87] mb-2.5">Only show flatmates who strictly respect these non-negotiables:</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_NON_NEGOTIABLES.map(nn => {
                const isSelected = (localFilters.non_negotiables || []).includes(nn);
                return (
                  <SelectableChip
                    key={nn}
                    label={nn}
                    size="sm"
                    selected={isSelected}
                    onClick={() => toggleNonNegotiable(nn)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E6E3DE] bg-[#FAF8F4] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {defaultFilters && onResetToDefaults && (
              <button
                type="button"
                onClick={() => {
                  setLocalFilters({ ...defaultFilters });
                  onResetToDefaults();
                  onClose();
                }}
                className="px-3 py-2 rounded-xl border border-[#E07A5F]/40 bg-[#E07A5F]/10 text-[#E07A5F] hover:bg-[#E07A5F]/20 font-bold text-xs"
              >
                Reset to My Defaults
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setLocalFilters({});
                onResetFilters();
                onClose();
              }}
              className="px-3 py-2 rounded-xl border border-[#E6E3DE] text-[#7A7D87] hover:text-[#2B2D42] font-bold text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 min-w-[140px] py-2.5 px-4 rounded-xl bg-[#E07A5F] text-white font-bold text-sm hover:bg-[#D4694E] shadow-sm text-center"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
