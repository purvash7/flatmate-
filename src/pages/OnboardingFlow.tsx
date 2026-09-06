import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Calendar,
  MapPin,
  IndianRupee,
  Utensils,
  Clock,
  Heart,
  Globe,
  Sparkle,
  ShieldCheck,
  Home,
  Users,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { SelectableChip } from '../components/SelectableChip.js';
import { PhotoVerificationFlow } from '../components/PhotoVerificationFlow.js';
import { LocalityAutocomplete } from '../components/LocalityAutocomplete.js';
import { HouseDetailsStep } from '../components/HouseDetailsStep.js';
import { HouseDetails, UserProfile } from '../types.js';

interface OnboardingFlowProps {
  onFinish: () => void;
}

const ALL_LANGUAGES = [
  'English',
  'Hindi',
  'Kannada',
  'Tamil',
  'Telugu',
  'Marathi',
  'Bengali',
  'Gujarati',
  'Punjabi',
  'Malayalam'
];

const ALL_HOBBIES = [
  'Cooking',
  'Fitness / Gym',
  'Gaming',
  'Reading',
  'Movies & Shows',
  'Music',
  'Travel',
  'Startups & Tech',
  'Art & Design',
  'Yoga',
  'Hiking & Trekking',
  'Coffee & Food',
  'Photography'
];

const NON_NEGOTIABLE_OPTIONS = [
  'Strictly non-smoking flat',
  'Pure vegetarian kitchen only',
  'No late night parties',
  'Pet friendly space',
  'Attached private washroom',
  'Quiet hours after 11 PM',
  'Equal chore distribution',
  'Gated society security'
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onFinish }) => {
  const { profile, updateProfileState } = useAuth();

  // Step 1: Housing Intent
  const [hasHouse, setHasHouse] = useState(profile?.housing_intent?.has_house ?? false);
  const [coSearch, setCoSearch] = useState(profile?.housing_intent?.looking_to_co_search ?? true);
  const [vacancy, setVacancy] = useState(profile?.housing_intent?.looking_for_vacancy ?? true);

  // Both flows have 13 intuitive steps:
  // When hasHouse = true:
  // Step 1: Housing Goal ("Have a flat")
  // Step 2: About You
  // Step 3: Flat Location (Where the flat is located in Bangalore)
  // Step 4: Current House Details (BHK, room washroom, balcony, amenities, room rent, deposit, photos - no search budget!)
  // Step 5: Food Habits & Kitchen
  // Step 6: Lifestyle Habits
  // Step 7: Living Vibe (Social style, work schedule - house preferences skipped)
  // Step 8: Languages
  // Step 9: Hobbies
  // Step 10: Bio & Prompts
  // Step 11: Flatmate Dealbreakers (Lifestyle only)
  // Step 12: Photo Verification
  // Step 13: Final Review & Launch
  const totalSteps = 13;

  const [step, setStep] = useState(1);

  // Form State
  const [name, setName] = useState(profile?.name || '');
  const [dob, setDob] = useState(profile?.date_of_birth || '1998-05-15');
  const [gender, setGender] = useState<any>(profile?.gender || 'Woman');
  const [genderPref, setGenderPref] = useState<any>(profile?.flatmate_gender_preference || 'Any');

  const [locality, setLocality] = useState(profile?.locality || 'Indiranagar');
  const [preferredLocalities, setPreferredLocalities] = useState<string[]>(
    profile?.preferred_localities || ['Indiranagar', 'Koramangala', 'HSR Layout']
  );

  const [rentMin, setRentMin] = useState(profile?.rent_min || 12000);
  const [rentMax, setRentMax] = useState(profile?.rent_max || 25000);

  const [foodPref, setFoodPref] = useState<any>(profile?.food_preference || 'Vegetarian');
  const [okayNonVeg, setOkayNonVeg] = useState(profile?.okay_with_nonveg_cooking ?? true);

  const [smoking, setSmoking] = useState<any>(profile?.smoking || 'No');
  const [drinking, setDrinking] = useState<any>(profile?.drinking || 'Occasionally');
  const [cleanliness, setCleanliness] = useState<any>(profile?.cleanliness || 'Strict');
  const [sleepSchedule, setSleepSchedule] = useState<any>(profile?.sleep_schedule || 'Flexible');
  const [socialLevel, setSocialLevel] = useState<any>(profile?.social_level || 'Balanced');
  const [guests, setGuests] = useState<any>(profile?.guests || 'Weekends only');
  const [parties, setParties] = useState<any>(profile?.parties || 'Occasionally');
  const [pets, setPets] = useState<any>(profile?.pets || 'Pet lover / Open to pets');
  const [workSchedule, setWorkSchedule] = useState<any>(profile?.work_schedule || 'Hybrid');

  const [attachedWashroom, setAttachedWashroom] = useState<any>(profile?.attached_washroom || 'Must have');
  const [furnishing, setFurnishing] = useState<any>(profile?.furnishing || 'Fully furnished');
  const [gatedSociety, setGatedSociety] = useState(profile?.gated_society ?? true);

  const [languages, setLanguages] = useState<string[]>(profile?.languages || ['English', 'Hindi']);
  const [hobbies, setHobbies] = useState<string[]>(profile?.hobbies || ['Reading', 'Cooking', 'Travel']);

  const [bio, setBio] = useState(profile?.bio || '');
  const [promptQ1, setPromptQ1] = useState(profile?.prompts?.[0]?.answer || '');
  const [promptQ2, setPromptQ2] = useState(profile?.prompts?.[1]?.answer || '');

  const [nonNegotiables, setNonNegotiables] = useState<string[]>(profile?.non_negotiables || []);
  const [photoUrl, setPhotoUrl] = useState(profile?.main_photo || profile?.photos?.[0]?.url || '');
  
  // House details state (for hasHouse = true)
  const [houseDetails, setHouseDetails] = useState<HouseDetails | undefined>(profile?.house_details);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper multi-toggle
  const toggleArrayItem = (list: string[], item: string, max?: number) => {
    if (list.includes(item)) {
      return list.filter(i => i !== item);
    } else {
      if (max && list.length >= max) {
        return list;
      }
      return [...list, item];
    }
  };

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

  const handleNext = async () => {
    setError(null);

    // STEP 1: Housing Intent Validation
    if (step === 1) {
      if (!hasHouse && !coSearch && !vacancy) {
        setError('Please select at least one housing option to continue.');
        return;
      }
      // Save intent immediately to backend
      try {
        await api.updateIntent({
          has_house: hasHouse,
          looking_to_co_search: coSearch,
          looking_for_vacancy: vacancy
        });
      } catch (err: any) {
        console.warn('Intent background save:', err);
      }
    }

    // STEP 2: Basic Info
    if (step === 2) {
      if (!name.trim()) {
        setError('Please enter your name.');
        return;
      }
      const birthDate = new Date(dob);
      const ageDifMs = Date.now() - birthDate.getTime();
      const ageDate = new Date(ageDifMs);
      const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (calculatedAge < 18) {
        setError('You must be at least 18 years old to join FlatMate+.');
        return;
      }
    }

    // STEP 3: Locality
    if (step === 3) {
      if (!locality.trim()) {
        setError('Please select or enter your primary locality.');
        return;
      }
    }

    // STEP 4: Budget (only validated if !hasHouse, since hasHouse uses HouseDetailsStep with rent/deposit)
    if (step === 4 && !hasHouse) {
      if (rentMin < 3000) {
        setError('Minimum rent is ₹3,000.');
        return;
      }
      if (rentMax > 80000) {
        setError('Maximum rent is ₹80,000.');
        return;
      }
      if (rentMax < rentMin) {
        setError('Maximum rent cannot be less than minimum rent.');
        return;
      }
    }

    // STEP 11: Non-negotiables
    if (step === 11 && nonNegotiables.length > 4) {
      setError('Choose up to 4 non-negotiables.');
      return;
    }

    // STEP 12: Photo Verification
    if (step === 12 && !photoUrl) {
      setError('Please complete the peace sign verification and upload your verified profile photo.');
      return;
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Final step submit
      await handleSaveAndFinish();
    }
  };

  const handleSaveAndFinish = async () => {
    setLoading(true);
    setError(null);
    try {
      const updates: Partial<UserProfile> = {
        name,
        date_of_birth: dob,
        gender,
        flatmate_gender_preference: genderPref,
        city: 'Bangalore',
        locality,
        preferred_localities: hasHouse ? [locality] : (preferredLocalities.length > 0 ? preferredLocalities : [locality]),
        housing_intent: {
          has_house: hasHouse,
          looking_to_co_search: coSearch,
          looking_for_vacancy: vacancy
        },
        rent_min: hasHouse && houseDetails?.rent_for_vacant_room ? houseDetails.rent_for_vacant_room : Number(rentMin),
        rent_max: hasHouse && houseDetails?.rent_for_vacant_room ? houseDetails.rent_for_vacant_room : Number(rentMax),
        food_preference: foodPref,
        okay_with_nonveg_cooking: okayNonVeg,
        smoking,
        drinking,
        cleanliness,
        sleep_schedule: sleepSchedule,
        social_level: socialLevel,
        guests,
        parties,
        pets,
        work_schedule: workSchedule,
        attached_washroom: hasHouse
          ? (houseDetails?.attached_washroom_in_vacant_room ? 'Must have' : "Doesn't matter")
          : attachedWashroom,
        furnishing: hasHouse
          ? ((houseDetails?.vacant_room_amenities?.some(a => a.toLowerCase().includes('bed') || a.toLowerCase().includes('wardrobe'))) ? 'Fully furnished' : 'Semi-furnished')
          : furnishing,
        gated_society: hasHouse
          ? Boolean(houseDetails?.vacant_room_amenities?.some(a => a.toLowerCase().includes('gated') || a.toLowerCase().includes('society')))
          : gatedSociety,
        languages,
        hobbies,
        bio,
        prompts: [
          { question: 'A typical Sunday for me looks like...', answer: promptQ1 },
          { question: 'My housemate green flag is...', answer: promptQ2 }
        ],
        non_negotiables: nonNegotiables,
        house_details: hasHouse ? houseDetails : undefined,
        is_profile_complete: true,
        onboarding_step: totalSteps
      };

      const res = await api.updateProfile(updates);
      updateProfileState(res.profile);
      onFinish();
    } catch (err: any) {
      setError(err.message || 'Could not complete profile setup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] py-6 sm:py-10 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-[#E6E3DE] shadow-xl overflow-hidden min-w-0">
        {/* Progress Bar */}
        <div className="bg-[#FAF8F4] px-5 sm:px-6 py-3.5 border-b border-[#E6E3DE] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-sm text-[#E07A5F]">Step {step}</span>
            <span className="text-xs text-[#7A7D87]">of {totalSteps}</span>
          </div>
          <div className="w-32 sm:w-40 h-2 bg-[#E6E3DE] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E07A5F] rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-8">
          {/* ========================================================= */}
          {/* STEP 1: HOUSING INTENT (Requirement #1 & #5) */}
          {/* ========================================================= */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in" id="onboarding-step-housing-intent">
              <div>
                <span className="label-caps text-[#E07A5F] block mb-1">Step 1 • Housing Goal</span>
                <h3 className="font-display font-bold text-2xl text-[#2B2D42]">
                  What are you looking for?
                </h3>
                <p className="text-xs text-[#7A7D87] mt-1">
                  Select what best describes your current flat-hunting situation in Bangalore.
                </p>
              </div>

              <div className="space-y-3.5 pt-2">
                {/* Option 1: Have a flat (looking for a flatmate) */}
                <div
                  id="intent-has-house-option"
                  onClick={handleSelectHasHouse}
                  className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                    hasHouse
                      ? '!bg-[#E07A5F] !text-white !border-[#E07A5F] shadow-sm'
                      : 'bg-[#FAF8F4] text-[#2B2D42] border-[#E6E3DE] hover:border-[#E07A5F]/60'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      hasHouse ? 'bg-white/20 text-white' : 'bg-white text-[#E07A5F] shadow-xs'
                    }`}
                  >
                    <Home className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-display font-bold text-sm sm:text-base leading-snug">
                        Have a flat (looking for a flatmate)
                      </h4>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          hasHouse ? 'bg-white text-[#E07A5F]' : 'border-2 border-[#E6E3DE] bg-white'
                        }`}
                      >
                        {hasHouse && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${hasHouse ? 'text-white/90' : 'text-[#7A7D87]'}`}>
                      I have an existing flat/house and need a compatible flatmate for an open bedroom.
                    </p>
                  </div>
                </div>

                <div className="flex items-center my-2">
                  <div className="flex-1 border-t border-[#E6E3DE]" />
                  <span className="px-3 text-[10px] font-bold tracking-wider text-[#7A7D87] uppercase">
                    or (choose one or both)
                  </span>
                  <div className="flex-1 border-t border-[#E6E3DE]" />
                </div>

                {/* Option 2: Looking for a vacant room in a flat */}
                <div
                  id="intent-vacancy-option"
                  onClick={handleToggleVacancy}
                  className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                    vacancy
                      ? '!bg-[#E07A5F] !text-white !border-[#E07A5F] shadow-sm'
                      : 'bg-[#FAF8F4] text-[#2B2D42] border-[#E6E3DE] hover:border-[#E07A5F]/60'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      vacancy ? 'bg-white/20 text-white' : 'bg-white text-[#E07A5F] shadow-xs'
                    }`}
                  >
                    <Search className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-display font-bold text-sm sm:text-base leading-snug">
                        Looking for a vacant room in a flat
                      </h4>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          vacancy ? 'bg-white text-[#E07A5F]' : 'border-2 border-[#E6E3DE] bg-white'
                        }`}
                      >
                        {vacancy && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${vacancy ? 'text-white/90' : 'text-[#7A7D87]'}`}>
                      I want to move into an already established flat with someone who has a vacant room.
                    </p>
                  </div>
                </div>

                {/* Option 3: Looking for a flatmate to co-search */}
                <div
                  id="intent-co-search-option"
                  onClick={handleToggleCoSearch}
                  className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                    coSearch
                      ? '!bg-[#E07A5F] !text-white !border-[#E07A5F] shadow-sm'
                      : 'bg-[#FAF8F4] text-[#2B2D42] border-[#E6E3DE] hover:border-[#E07A5F]/60'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      coSearch ? 'bg-white/20 text-white' : 'bg-white text-[#E07A5F] shadow-xs'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-display font-bold text-sm sm:text-base leading-snug">
                        Looking for a flatmate to co-search
                      </h4>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          coSearch ? 'bg-white text-[#E07A5F]' : 'border-2 border-[#E6E3DE] bg-white'
                        }`}
                      >
                        {coSearch && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${coSearch ? 'text-white/90' : 'text-[#7A7D87]'}`}>
                      I want to connect with compatible flatmates first and find a new flat together.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Basic Info */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <span className="label-caps text-[#E07A5F] block mb-1">About You</span>
                <h3 className="font-display font-bold text-2xl text-[#2B2D42]">
                  Let's start with the basics
                </h3>
                <p className="text-xs text-[#7A7D87] mt-1">
                  Tell us your name and identity so flatmates know who they're matching with.
                </p>
              </div>

              <div>
                <label className="label-caps text-[#7A7D87] block mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ananya Rao"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E6E3DE] text-sm focus:ring-2 focus:ring-[#E07A5F]/40"
                />
              </div>

              <div>
                <label className="label-caps text-[#7A7D87] block mb-1.5">Date of Birth (Must be 18+)</label>
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E6E3DE] text-sm focus:ring-2 focus:ring-[#E07A5F]/40"
                />
              </div>

              <div>
                <label className="label-caps text-[#7A7D87] block mb-1.5">Your Gender</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Woman', 'Man', 'Non-binary', 'Other'].map(g => (
                    <SelectableChip
                      key={g}
                      label={g}
                      selected={gender === g}
                      onClick={() => setGender(g)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="label-caps text-[#7A7D87] block mb-1.5">Flatmate Gender Preference</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Women only', 'Men only', 'Any'].map(p => (
                    <SelectableChip
                      key={p}
                      label={p}
                      selected={genderPref === p}
                      onClick={() => setGenderPref(p)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Locality with Autocomplete (Requirement #6) */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <span className="label-caps text-[#E07A5F] block mb-1">
                  {hasHouse ? 'Flat Location' : 'Location Preferences'}
                </span>
                <h3 className="font-display font-bold text-2xl text-[#2B2D42]">
                  {hasHouse ? 'Where is your flat located in Bangalore?' : 'Where in Bangalore are you looking?'}
                </h3>
                <p className="text-xs text-[#7A7D87] mt-1">
                  {hasHouse
                    ? 'Select the primary locality where your current flat and open room are located.'
                    : 'Search and select your primary hub and any secondary areas.'}
                </p>
              </div>

              <div>
                <LocalityAutocomplete
                  id="primary-locality"
                  label={hasHouse ? 'Current Flat Locality' : 'Primary Locality'}
                  value={locality}
                  onChange={(val) => setLocality(val)}
                  placeholder="Type primary locality (e.g. Indiranagar, HSR Layout)..."
                  required
                />
              </div>

              {!hasHouse && (
                <div>
                  <LocalityAutocomplete
                    id="preferred-localities"
                    label="Other Preferred Localities"
                    value={preferredLocalities}
                    onChange={(val) => setPreferredLocalities(val)}
                    multiple={true}
                    maxSelections={5}
                    placeholder="Type to search and add more preferred areas..."
                    helperText="Choose up to 5 additional Bangalore areas you'd be happy living in."
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Current House Details (for hasHouse) OR Rent Budget (for !hasHouse) */}
          {step === 4 && hasHouse && (
            <div className="space-y-5 animate-in fade-in">
              <HouseDetailsStep
                initialDetails={houseDetails}
                onBack={() => setStep(3)}
                onSave={(details) => {
                  setHouseDetails(details);
                  setRentMin(details.rent_for_vacant_room || 15000);
                  setRentMax(details.rent_for_vacant_room || 25000);
                  setStep(5);
                }}
              />
            </div>
          )}

          {step === 4 && !hasHouse && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <span className="label-caps text-[#E07A5F] block mb-1">Budget</span>
                <h3 className="font-display font-bold text-2xl text-[#2B2D42]">
                  What is your monthly rent budget?
                </h3>
                <p className="text-xs text-[#7A7D87] mt-1">
                  Per person rent budget in INR (₹3,000 to ₹80,000).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#FAF8F4] border border-[#E6E3DE] rounded-2xl p-4">
                  <span className="label-caps text-[#7A7D87] block mb-1">Minimum Rent</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#E07A5F]">₹</span>
                    <input
                      type="number"
                      min={3000}
                      max={80000}
                      step={1000}
                      value={rentMin}
                      onChange={e => setRentMin(Number(e.target.value))}
                      className="w-full bg-transparent font-display font-bold text-xl text-[#2B2D42] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="bg-[#FAF8F4] border border-[#E6E3DE] rounded-2xl p-4">
                  <span className="label-caps text-[#7A7D87] block mb-1">Maximum Rent</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#E07A5F]">₹</span>
                    <input
                      type="number"
                      min={3000}
                      max={80000}
                      step={1000}
                      value={rentMax}
                      onChange={e => setRentMax(Number(e.target.value))}
                      className="w-full bg-transparent font-display font-bold text-xl text-[#2B2D42] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {[
                  { min: 8000, max: 15000, label: '₹8k - ₹15k' },
                  { min: 12000, max: 22000, label: '₹12k - ₹22k' },
                  { min: 18000, max: 32000, label: '₹18k - ₹32k' },
                  { min: 25000, max: 45000, label: '₹25k - ₹45k' }
                ].map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setRentMin(preset.min);
                      setRentMax(preset.max);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-[#E6E3DE] text-xs font-semibold text-[#7A7D87] hover:border-[#E07A5F] hover:text-[#E07A5F] bg-white"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Food Preference */}
          {step === 5 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <span className="label-caps text-[#E07A5F] block mb-1">Food Habits</span>
                <h3 className="font-display font-bold text-2xl text-[#2B2D42]">
                  What are your dietary preferences?
                </h3>
                <p className="text-xs text-[#7A7D87] mt-1">
                  Food habits are one of the biggest factors in flatmate harmony.
                </p>
              </div>

              <div>
                <label className="label-caps text-[#7A7D87] block mb-2">Dietary Preference</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Vegetarian', 'Non-vegetarian', 'Eggetarian', 'Vegan'].map(f => (
                    <SelectableChip
                      key={f}
                      label={f}
                      selected={foodPref === f}
                      onClick={() => setFoodPref(f)}
                    />
                  ))}
                </div>
              </div>

              {/* Requirement: Vegetarian but okay with non-veg cooking */}
              <div
                onClick={() => setOkayNonVeg(!okayNonVeg)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  okayNonVeg
                    ? '!bg-[#E07A5F] !text-white !border-[#E07A5F]'
                    : 'bg-[#FAF8F4] text-[#2B2D42] border-[#E6E3DE]'
                }`}
              >
                <div>
                  <p className="font-bold text-sm">Okay with non-veg being cooked in the house</p>
                  <p className={`text-xs mt-0.5 ${okayNonVeg ? 'text-white/90' : 'text-[#7A7D87]'}`}>
                    Even if you don't eat meat yourself
                  </p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    okayNonVeg ? 'bg-white text-[#E07A5F]' : 'border-2 border-[#E6E3DE] bg-white'
                  }`}
                >
                  {okayNonVeg && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Lifestyle Habits */}
          {step === 6 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <span className="label-caps text-[#E07A5F] block mb-1">Daily Life</span>
                <h3 className="font-display font-bold text-2xl text-[#2B2D42]">
                  How do you live day-to-day?
                </h3>
              </div>

              <div>
                <label className="label-caps text-[#7A7D87] block mb-1.5">Smoking Habit</label>
                <div className="grid grid-cols-3 gap-2">
                  {['No', 'Occasionally', 'Yes'].map(s => (
                    <SelectableChip key={s} label={s} selected={smoking === s} onClick={() => setSmoking(s)} />
                  ))}
                </div>
              </div>

              <div>
                <label className="label-caps text-[#7A7D87] block mb-1.5">Drinking Habit</label>
                <div className="grid grid-cols-3 gap-2">
                  {['No', 'Occasionally', 'Yes'].map(d => (
                    <SelectableChip key={d} label={d} selected={drinking === d} onClick={() => setDrinking(d)} />
                  ))}
                </div>
              </div>

              <div>
                <label className="label-caps text-[#7A7D87] block mb-1.5">Cleanliness Standard</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Strict', 'Moderate', 'Relaxed'].map(c => (
                    <SelectableChip key={c} label={c} selected={cleanliness === c} onClick={() => setCleanliness(c)} />
                  ))}
                </div>
              </div>

              <div>
                <label className="label-caps text-[#7A7D87] block mb-1.5">Sleep Schedule</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Early bird', 'Flexible', 'Night owl'].map(sl => (
                    <SelectableChip key={sl} label={sl} selected={sleepSchedule === sl} onClick={() => setSleepSchedule(sl)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Social & Flat Preferences */}
          {step === 7 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <span className="label-caps text-[#E07A5F] block mb-1">
                  {hasHouse ? 'Living Vibe' : 'Social Style & Space'}
                </span>
                <h3 className="font-display font-bold text-2xl text-[#2B2D42]">
                  {hasHouse ? 'Daily rhythm & vibe' : 'House rules & vibe'}
                </h3>
              </div>

              <div>
                <label className="label-caps text-[#7A7D87] block mb-1.5">Social Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Quiet / Introvert', 'Balanced', 'Extroverted'].map(soc => (
                    <SelectableChip key={soc} label={soc} selected={socialLevel === soc} onClick={() => setSocialLevel(soc)} />
                  ))}
                </div>
              </div>

              {!hasHouse && (
                <>
                  <div>
                    <label className="label-caps text-[#7A7D87] block mb-1.5">Attached Washroom</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Must have', 'Nice to have', "Doesn't matter"].map(w => (
                        <SelectableChip key={w} label={w} selected={attachedWashroom === w} onClick={() => setAttachedWashroom(w)} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label-caps text-[#7A7D87] block mb-1.5">Furnishing Preference</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Fully furnished', 'Semi-furnished', 'Unfurnished'].map(furn => (
                        <SelectableChip key={furn} label={furn} selected={furnishing === furn} onClick={() => setFurnishing(furn)} />
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="label-caps text-[#7A7D87] block mb-1.5">Work Schedule</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Remote (WFH)', 'Hybrid', 'In-office'].map(ws => (
                    <SelectableChip key={ws} label={ws} selected={workSchedule === ws} onClick={() => setWorkSchedule(ws)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Languages */}
          {step === 8 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <span className="label-caps text-[#E07A5F] block mb-1">Communication</span>
                <h3 className="font-display font-bold text-2xl text-[#2B2D42]">
                  Languages you speak
                </h3>
                <p className="text-xs text-[#7A7D87] mt-1">
                  Select all languages you feel comfortable chatting in.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {ALL_LANGUAGES.map(lang => (
                  <SelectableChip
                    key={lang}
                    label={lang}
                    selected={languages.includes(lang)}
                    onClick={() => setLanguages(toggleArrayItem(languages, lang))}
                  />
                ))}
              </div>
            </div>
          )}

          {/* STEP 9: Hobbies */}
          {step === 9 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <span className="label-caps text-[#E07A5F] block mb-1">Interests</span>
                <h3 className="font-display font-bold text-2xl text-[#2B2D42]">
                  What do you enjoy in your free time?
                </h3>
                <p className="text-xs text-[#7A7D87] mt-1">
                  Find flatmates who share your passions and weekend vibes.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {ALL_HOBBIES.map(hob => (
                  <SelectableChip
                    key={hob}
                    label={hob}
                    selected={hobbies.includes(hob)}
                    onClick={() => setHobbies(toggleArrayItem(hobbies, hob))}
                  />
                ))}
              </div>
            </div>
          )}

          {/* STEP 10: Bio & Prompts */}
          {step === 10 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <span className="label-caps text-[#E07A5F] block mb-1">Personality</span>
                <h3 className="font-display font-bold text-2xl text-[#2B2D42]">
                  Introduce yourself
                </h3>
              </div>

              <div>
                <label className="label-caps text-[#7A7D87] block mb-1.5">Short Bio</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={3}
                  placeholder="Tell potential flatmates what you do, what you value in a house..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E6E3DE] text-sm focus:ring-2 focus:ring-[#E07A5F]/40"
                />
              </div>

              <div>
                <label className="label-caps text-[#7A7D87] block mb-1.5">A typical Sunday for me looks like...</label>
                <input
                  type="text"
                  value={promptQ1}
                  placeholder="e.g. Filter coffee, exploring spots, or quiet reading..."
                  onChange={e => setPromptQ1(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E6E3DE] text-sm focus:ring-2 focus:ring-[#E07A5F]/40"
                />
              </div>

              <div>
                <label className="label-caps text-[#7A7D87] block mb-1.5">My housemate green flag is...</label>
                <input
                  type="text"
                  value={promptQ2}
                  placeholder="e.g. Keeping the sink clean, respectful communication..."
                  onChange={e => setPromptQ2(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E6E3DE] text-sm focus:ring-2 focus:ring-[#E07A5F]/40"
                />
              </div>
            </div>
          )}

          {/* STEP 11: Non-negotiables */}
          {step === 11 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <span className="label-caps text-[#E07A5F] block mb-1">Dealbreakers</span>
                <h3 className="font-display font-bold text-2xl text-[#2B2D42]">
                  {hasHouse ? 'Choose up to 4 flatmate dealbreakers' : 'Choose up to 4 non-negotiables'}
                </h3>
                <p className="text-xs text-[#7A7D87] mt-1">
                  Optional. Select what matters most to you. ({nonNegotiables.length}/4 selected)
                </p>
              </div>

              <div className="space-y-2">
                {(hasHouse
                  ? NON_NEGOTIABLE_OPTIONS.filter(opt => opt !== 'Attached private washroom' && opt !== 'Gated society security')
                  : NON_NEGOTIABLE_OPTIONS
                ).map(opt => {
                  const isSelected = nonNegotiables.includes(opt);
                  return (
                    <div
                      key={opt}
                      onClick={() => setNonNegotiables(toggleArrayItem(nonNegotiables, opt, 4))}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? '!bg-[#E07A5F] !text-white !border-[#E07A5F]'
                          : 'bg-[#FAF8F4] text-[#2B2D42] border-[#E6E3DE] hover:border-[#E07A5F]/60'
                      }`}
                    >
                      <span className="text-sm font-semibold">{opt}</span>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-white text-[#E07A5F]' : 'border border-[#E6E3DE] bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 12: Photo & Biometric Peace Sign Verification Flow (Requirements #2 & #3) */}
          {step === 12 && (
            <div className="space-y-5 animate-in fade-in">
              <PhotoVerificationFlow
                existingUrl={photoUrl}
                onPhotoUploaded={(url) => setPhotoUrl(url)}
                isMain={true}
              />
            </div>
          )}

          {/* FINAL REVIEW STEP (Step 13) */}
          {step === 13 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#4F8A6D]/15 text-[#4F8A6D] flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-2xl text-[#2B2D42]">
                  You're all set, {name.split(' ')[0]}!
                </h3>
                <p className="text-xs text-[#7A7D87] mt-1">
                  Here is a quick summary before we show you compatible flatmates in Bangalore.
                </p>
              </div>

              <div className="bg-[#FAF8F4] border border-[#E6E3DE] rounded-2xl p-5 space-y-3 text-xs">
                <div className="flex justify-between pb-2 border-b border-[#E6E3DE]">
                  <span className="text-[#7A7D87]">Housing Goal</span>
                  <span className="font-bold text-[#2B2D42]">
                    {hasHouse
                      ? 'Have a flat (looking for flatmate)'
                      : vacancy && coSearch
                      ? 'Room in flat & Co-search'
                      : vacancy
                      ? 'Room in flat'
                      : 'Co-search'}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-[#E6E3DE]">
                  <span className="text-[#7A7D87]">{hasHouse ? 'Flat Location' : 'Primary Location'}</span>
                  <span className="font-bold text-[#2B2D42]">{locality}, Bangalore</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-[#E6E3DE]">
                  <span className="text-[#7A7D87]">{hasHouse ? 'Vacant Room Rent' : 'Rent Budget'}</span>
                  <span className="font-bold text-[#E07A5F]">
                    {hasHouse && houseDetails?.rent_for_vacant_room
                      ? `₹${houseDetails.rent_for_vacant_room.toLocaleString()} / mo`
                      : `₹${rentMin.toLocaleString()} - ₹${rentMax.toLocaleString()} / mo`}
                  </span>
                </div>
                {hasHouse && houseDetails?.deposit_amount && (
                  <div className="flex justify-between pb-2 border-b border-[#E6E3DE]">
                    <span className="text-[#7A7D87]">Security Deposit</span>
                    <span className="font-bold text-[#2B2D42]">₹{houseDetails.deposit_amount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pb-2 border-b border-[#E6E3DE]">
                  <span className="text-[#7A7D87]">Food & Diet</span>
                  <span className="font-bold text-[#2B2D42]">{foodPref}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-[#E6E3DE]">
                  <span className="text-[#7A7D87]">Lifestyle</span>
                  <span className="font-bold text-[#2B2D42]">{cleanliness} cleanliness • {sleepSchedule}</span>
                </div>
                {hasHouse && houseDetails && (
                  <div className="flex justify-between pb-2 border-b border-[#E6E3DE]">
                    <span className="text-[#7A7D87]">Current Flat</span>
                    <span className="font-bold text-[#4F8A6D]">
                      {houseDetails.bhk} • {houseDetails.attached_washroom_in_vacant_room ? 'Attached washroom' : 'Common washroom'} • {houseDetails.house_photos?.length || 0} photos
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#7A7D87]">Verification Status</span>
                  <span className="font-bold text-[#4F8A6D] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> ✌️ Biometrically Verified
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-[#D64545] font-semibold mt-4 text-center">{error}</p>
          )}

          {/* Navigation Buttons (hide standard next button on House Details step since it has its own form submit) */}
          {!(hasHouse && step === 4) && (
            <div className="flex items-center gap-3 mt-8 pt-4 border-t border-[#E6E3DE]">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="py-3 px-5 rounded-2xl border border-[#E6E3DE] text-[#2B2D42] font-bold text-sm hover:bg-[#FAF8F4] flex items-center gap-2 min-h-[46px]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}

              <button
                id="onboarding-next-btn"
                type="button"
                disabled={loading}
                onClick={handleNext}
                className="flex-1 py-3 px-6 rounded-2xl bg-[#E07A5F] text-white font-bold text-sm hover:bg-[#D4694E] shadow-sm flex items-center justify-center gap-2 min-h-[46px] disabled:opacity-50"
              >
                <span>{loading ? 'Saving...' : step === totalSteps ? 'Start Finding Flatmates' : 'Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
