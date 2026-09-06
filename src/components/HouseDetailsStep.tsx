import React, { useState, useRef } from 'react';
import { Home, Upload, Trash2, Check, AlertCircle, Plus, Sparkles, Image as ImageIcon, ArrowLeft, ArrowRight } from 'lucide-react';
import { BHKType, BalconyType, HouseDetails, PhotoItem } from '../types.js';
import { api } from '../services/api.js';

interface HouseDetailsStepProps {
  initialDetails?: HouseDetails;
  onSave: (details: HouseDetails) => void;
  onBack?: () => void;
  loading?: boolean;
}

const BHK_OPTIONS: BHKType[] = ['1 BHK', '2 BHK', '3 BHK', '4+ BHK'];
const BALCONY_OPTIONS: BalconyType[] = [
  'Attached to vacant room',
  'Common balcony',
  'Multiple balconies',
  'No balcony'
];

const AMENITY_OPTIONS = [
  'Bed & Mattress',
  'Wardrobe',
  'Air Conditioner (AC)',
  'Study Desk & Chair',
  'Geyser / Hot Water',
  'High-Speed WiFi',
  'Power Backup / Inverter',
  'Maid / Cook Available',
  'Washing Machine',
  'Refrigerator',
  'Modular Kitchen / Chimney',
  'RO Water Purifier',
  'Sofa & Living Setup',
  'Gated Society & Lift',
  'Gym & Swimming Pool'
];

export const HouseDetailsStep: React.FC<HouseDetailsStepProps> = ({
  initialDetails,
  onSave,
  onBack,
  loading = false
}) => {
  const [bhk, setBhk] = useState<BHKType>(initialDetails?.bhk || '2 BHK');
  const [totalWashrooms, setTotalWashrooms] = useState<number>(initialDetails?.total_washrooms || 2);
  const [attachedWashroom, setAttachedWashroom] = useState<boolean>(
    initialDetails?.attached_washroom_in_vacant_room ?? true
  );
  const [balconyType, setBalconyType] = useState<BalconyType>(
    initialDetails?.balcony_type || 'Common balcony'
  );
  const [amenities, setAmenities] = useState<string[]>(
    initialDetails?.vacant_room_amenities || ['Bed & Mattress', 'Wardrobe', 'WiFi', 'Geyser / Hot Water']
  );
  const [housePhotos, setHousePhotos] = useState<PhotoItem[]>(initialDetails?.house_photos || []);
  const [rent, setRent] = useState<number>(initialDetails?.rent_for_vacant_room || 18000);
  const [deposit, setDeposit] = useState<number>(initialDetails?.deposit_amount || 45000);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggleAmenity = (item: string) => {
    if (amenities.includes(item)) {
      setAmenities(amenities.filter(a => a !== item));
    } else {
      setAmenities([...amenities, item]);
    }
  };

  const handleHousePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('House photo exceeds 8MB limit.');
      return;
    }

    setUploadingPhoto(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await api.uploadHousePhoto({
          photo_base64: base64,
          mime_type: file.type,
          caption: housePhotos.length === 0 ? 'Living Room' : `Photo ${housePhotos.length + 1}`
        });
        setHousePhotos([...housePhotos, res.photo]);
      } catch (err: any) {
        setError(err.message || 'Could not upload house photo.');
      } finally {
        setUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (id: string) => {
    setHousePhotos(housePhotos.filter(p => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (housePhotos.length === 0) {
      setError('Compulsory: Please upload at least 1 photo of your house / vacant room.');
      return;
    }
    if (amenities.length === 0) {
      setError('Please select at least 1 amenity provided in the flat or vacant room.');
      return;
    }

    setError(null);
    onSave({
      bhk,
      total_washrooms: Number(totalWashrooms),
      attached_washroom_in_vacant_room: attachedWashroom,
      balcony_type: balconyType,
      vacant_room_amenities: amenities,
      house_photos: housePhotos,
      rent_for_vacant_room: Number(rent),
      deposit_amount: Number(deposit)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left" id="house-details-form">
      {/* Header text */}
      <div className="text-center space-y-1">
        <span className="label-caps text-[#E07A5F] block font-bold">House & Flatmate Requirements</span>
        <h3 className="font-display font-black text-2xl text-[#2B2D42]">
          Tell us about your flat & vacant room
        </h3>
        <p className="text-xs text-[#7A7D87] max-w-md mx-auto">
          Since you already have a flat, flatmates will see your house amenities, room photos, and rent breakdown.
        </p>
      </div>

      {/* 1. Compulsory House Photos Section */}
      <div className="bg-white rounded-3xl border border-[#E6E3DE] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-display font-bold text-base text-[#2B2D42] flex items-center gap-2">
              <Home className="w-4 h-4 text-[#E07A5F]" />
              <span>House & Room Photos (Compulsory)</span>
              <span className="text-[#E07A5F] text-xs font-bold">*</span>
            </h4>
            <p className="text-xs text-[#7A7D87] mt-0.5">
              Upload photos of the vacant bedroom, living room, balcony, or kitchen.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#FAF8F4] border border-[#E6E3DE] text-[#2B2D42]">
            {housePhotos.length} {housePhotos.length === 1 ? 'photo' : 'photos'} added
          </span>
        </div>

        {/* Hidden input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleHousePhotoUpload}
          className="hidden"
        />

        {/* Photos Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {housePhotos.map((photo, idx) => (
            <div key={photo.id} className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-[#E6E3DE] bg-[#FAF8F4] group">
              <img src={photo.url} alt={photo.caption || `House ${idx + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between p-2">
                <span className="text-[10px] text-white font-bold bg-black/60 px-2 py-0.5 rounded-md truncate max-w-[80%]">
                  {photo.caption || `Photo ${idx + 1}`}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(photo.id)}
                  className="w-7 h-7 rounded-full bg-[#D64545] text-white flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add photo button */}
          <button
            type="button"
            disabled={uploadingPhoto}
            onClick={() => fileInputRef.current?.click()}
            className="aspect-[4/3] rounded-2xl border-2 border-dashed border-[#E6E3DE] hover:border-[#E07A5F] bg-[#FAF8F4] flex flex-col items-center justify-center gap-1 text-[#7A7D87] hover:text-[#E07A5F] transition-all p-3"
          >
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-[#E07A5F] shadow-2xs">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold">{uploadingPhoto ? 'Uploading...' : 'Add House Photo'}</span>
            <span className="text-[10px] text-[#7A7D87]">JPG, PNG up to 8MB</span>
          </button>
        </div>
      </div>

      {/* 2. BHK & Structural Layout */}
      <div className="bg-white rounded-3xl border border-[#E6E3DE] p-6 space-y-4">
        <h4 className="font-display font-bold text-base text-[#2B2D42]">Flat Structure & Layout</h4>

        <div className="space-y-3">
          <label className="block label-caps text-[#2B2D42] font-bold">
            Apartment BHK <span className="text-[#E07A5F]">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {BHK_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setBhk(opt)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  bhk === opt
                    ? 'bg-[#E07A5F] text-white border-[#E07A5F] shadow-2xs'
                    : 'bg-[#FAF8F4] text-[#2B2D42] border-[#E6E3DE] hover:border-[#E07A5F]/50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Washrooms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block label-caps text-[#2B2D42] font-bold mb-1.5">
              Total Washrooms in Flat <span className="text-[#E07A5F]">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setTotalWashrooms(num)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                    totalWashrooms === num
                      ? 'bg-[#E07A5F] text-white border-[#E07A5F]'
                      : 'bg-[#FAF8F4] text-[#2B2D42] border-[#E6E3DE]'
                  }`}
                >
                  {num} {num === 4 ? '+' : ''}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block label-caps text-[#2B2D42] font-bold mb-1.5">
              Vacant Room Washroom <span className="text-[#E07A5F]">*</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAttachedWashroom(true)}
                className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                  attachedWashroom
                    ? 'bg-[#4F8A6D] text-white border-[#4F8A6D]'
                    : 'bg-[#FAF8F4] text-[#2B2D42] border-[#E6E3DE]'
                }`}
              >
                Attached Private
              </button>
              <button
                type="button"
                onClick={() => setAttachedWashroom(false)}
                className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                  !attachedWashroom
                    ? 'bg-[#2B2D42] text-white border-[#2B2D42]'
                    : 'bg-[#FAF8F4] text-[#2B2D42] border-[#E6E3DE]'
                }`}
              >
                Shared Washroom
              </button>
            </div>
          </div>
        </div>

        {/* Balcony */}
        <div className="pt-2">
          <label className="block label-caps text-[#2B2D42] font-bold mb-1.5">
            Balcony Setup <span className="text-[#E07A5F]">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {BALCONY_OPTIONS.map((balc) => (
              <button
                key={balc}
                type="button"
                onClick={() => setBalconyType(balc)}
                className={`py-2 px-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                  balconyType === balc
                    ? 'bg-[#E07A5F] text-white font-bold border-[#E07A5F]'
                    : 'bg-[#FAF8F4] text-[#2B2D42] border-[#E6E3DE] hover:border-[#E07A5F]/50'
                }`}
              >
                {balc}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Amenities Checklist */}
      <div className="bg-white rounded-3xl border border-[#E6E3DE] p-6 space-y-3">
        <div>
          <h4 className="font-display font-bold text-base text-[#2B2D42]">
            Included House & Vacant Room Amenities
          </h4>
          <p className="text-xs text-[#7A7D87] mt-0.5">
            Select everything already available in the flat or room.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {AMENITY_OPTIONS.map((item) => {
            const isSelected = amenities.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => handleToggleAmenity(item)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-[#E07A5F]/15 border-[#E07A5F] text-[#E07A5F] font-bold shadow-2xs'
                    : 'bg-[#FAF8F4] border-[#E6E3DE] text-[#2B2D42] hover:border-[#E07A5F]/40'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 text-[#E07A5F]" />}
                <span>{item}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Financials for Vacant Room */}
      <div className="bg-white rounded-3xl border border-[#E6E3DE] p-6 space-y-4">
        <h4 className="font-display font-bold text-base text-[#2B2D42]">
          Room Rent & Deposit
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block label-caps text-[#2B2D42] font-bold mb-1.5">
              Monthly Rent for Room (₹)
            </label>
            <input
              type="number"
              min={3000}
              max={80000}
              step={500}
              value={rent}
              onChange={(e) => setRent(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E6E3DE] bg-[#FAF8F4] text-sm text-[#2B2D42] font-bold focus:border-[#E07A5F] focus:outline-none"
            />
          </div>

          <div>
            <label className="block label-caps text-[#2B2D42] font-bold mb-1.5">
              Security Deposit (₹)
            </label>
            <input
              type="number"
              min={5000}
              max={300000}
              step={1000}
              value={deposit}
              onChange={(e) => setDeposit(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E6E3DE] bg-[#FAF8F4] text-sm text-[#2B2D42] font-bold focus:border-[#E07A5F] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-[#D64545]/10 border border-[#D64545]/20 rounded-xl p-3 flex items-center gap-2 text-xs text-[#D64545] font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Save Button */}
      <div className="pt-2 flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-3.5 rounded-2xl border border-[#E6E3DE] text-[#7A7D87] hover:text-[#2B2D42] hover:bg-[#FAF8F4] font-bold text-sm transition-all flex items-center gap-2 min-h-[48px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        )}
        <button
          id="save-house-details-btn"
          type="submit"
          disabled={loading || uploadingPhoto}
          className="flex-1 py-3.5 rounded-2xl bg-[#E07A5F] text-white font-bold text-base hover:bg-[#D4694E] shadow-sm transition-all disabled:opacity-50 min-h-[48px] flex items-center justify-center gap-2"
        >
          <span>{loading ? 'Saving House Details...' : 'Save House Details & Continue'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};
