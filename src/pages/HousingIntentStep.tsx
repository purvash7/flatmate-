import React, { useState } from 'react';
import { Home, Users, Search, Check, ArrowRight } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';

interface HousingIntentStepProps {
  onComplete: () => void;
}

export const HousingIntentStep: React.FC<HousingIntentStepProps> = ({ onComplete }) => {
  const { profile, updateProfileState } = useAuth();

  const [hasHouse, setHasHouse] = useState(profile?.housing_intent?.has_house || false);
  const [coSearch, setCoSearch] = useState(profile?.housing_intent?.looking_to_co_search ?? true);
  const [vacancy, setVacancy] = useState(profile?.housing_intent?.looking_for_vacancy ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectHasHouse = () => {
    if (!hasHouse) {
      setHasHouse(true);
      setCoSearch(false);
      setVacancy(false);
    } else {
      setHasHouse(false);
      setCoSearch(true);
    }
  };

  const handleToggleCoSearch = () => {
    setHasHouse(false);
    setCoSearch(!coSearch);
  };

  const handleToggleVacancy = () => {
    setHasHouse(false);
    setVacancy(!vacancy);
  };

  const handleSubmit = async () => {
    if (!hasHouse && !coSearch && !vacancy) {
      setError('Please select at least one option to continue.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.updateIntent({
        has_house: hasHouse,
        looking_to_co_search: coSearch,
        looking_for_vacancy: vacancy
      });
      updateProfileState(res.profile);
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Could not save housing intent.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl border border-[#E6E3DE] shadow-xl p-6 sm:p-10">
        <div className="text-center mb-8">
          <span className="label-caps text-[#E07A5F] block mb-1">Step 1 of FlatMate+</span>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-[#2B2D42]">
            What are you looking for?
          </h2>
          <p className="text-sm text-[#7A7D87] mt-2 max-w-md mx-auto">
            Choose what best describes your current flat-hunting situation in Bangalore.
          </p>
        </div>

        <div className="space-y-4">
          {/* Option 1: Have a flat (looking for a flatmate) */}
          <div
            id="intent-has-house-card"
            onClick={handleSelectHasHouse}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
              hasHouse
                ? '!bg-[#E07A5F] !text-white !border-[#E07A5F] shadow-md'
                : 'bg-[#FAF8F4] text-[#2B2D42] border-[#E6E3DE] hover:border-[#E07A5F]/60'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                hasHouse ? 'bg-white/20 text-white' : 'bg-white text-[#E07A5F] shadow-sm'
              }`}
            >
              <Home className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-bold text-base">Have a flat (looking for a flatmate)</h4>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    hasHouse ? 'bg-white text-[#E07A5F]' : 'border-2 border-[#E6E3DE] bg-white'
                  }`}
                >
                  {hasHouse && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>
              <p className={`text-xs mt-1 ${hasHouse ? 'text-white/90' : 'text-[#7A7D87]'}`}>
                I currently have a flat/house and want a flatmate to occupy a vacant bedroom.
              </p>
            </div>
          </div>

          <div className="flex items-center my-2">
            <div className="flex-1 border-t border-[#E6E3DE]" />
            <span className="px-3 text-[11px] font-bold tracking-wider text-[#7A7D87] uppercase">
              or (select one or both)
            </span>
            <div className="flex-1 border-t border-[#E6E3DE]" />
          </div>

          {/* Option 2: Looking for a vacant room in a flat */}
          <div
            id="intent-vacancy-card"
            onClick={handleToggleVacancy}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
              vacancy
                ? '!bg-[#E07A5F] !text-white !border-[#E07A5F] shadow-md'
                : 'bg-[#FAF8F4] text-[#2B2D42] border-[#E6E3DE] hover:border-[#E07A5F]/60'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                vacancy ? 'bg-white/20 text-white' : 'bg-white text-[#E07A5F] shadow-sm'
              }`}
            >
              <Search className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-bold text-base">Looking for a vacant room in a flat</h4>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    vacancy ? 'bg-white text-[#E07A5F]' : 'border-2 border-[#E6E3DE] bg-white'
                  }`}
                >
                  {vacancy && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>
              <p className={`text-xs mt-1 ${vacancy ? 'text-white/90' : 'text-[#7A7D87]'}`}>
                I want to move into an already established flat with someone who has an open room.
              </p>
            </div>
          </div>

          {/* Option 3: Looking for a flatmate to co-search */}
          <div
            id="intent-co-search-card"
            onClick={handleToggleCoSearch}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
              coSearch
                ? '!bg-[#E07A5F] !text-white !border-[#E07A5F] shadow-md'
                : 'bg-[#FAF8F4] text-[#2B2D42] border-[#E6E3DE] hover:border-[#E07A5F]/60'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                coSearch ? 'bg-white/20 text-white' : 'bg-white text-[#E07A5F] shadow-sm'
              }`}
            >
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-bold text-base">Looking for a flatmate to co-search</h4>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    coSearch ? 'bg-white text-[#E07A5F]' : 'border-2 border-[#E6E3DE] bg-white'
                  }`}
                >
                  {coSearch && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>
              <p className={`text-xs mt-1 ${coSearch ? 'text-white/90' : 'text-[#7A7D87]'}`}>
                I want to connect with compatible flatmates first and find a new flat together in Bangalore.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs text-[#D64545] font-semibold mt-4 text-center">{error}</p>
        )}

        <div className="mt-8">
          <button
            id="confirm-intent-btn"
            type="button"
            disabled={loading || (!hasHouse && !coSearch && !vacancy)}
            onClick={handleSubmit}
            className="w-full py-3.5 rounded-2xl bg-[#E07A5F] text-white font-bold text-base hover:bg-[#D4694E] shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 min-h-[48px]"
          >
            <span>{loading ? 'Saving...' : 'Continue to Profile'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
