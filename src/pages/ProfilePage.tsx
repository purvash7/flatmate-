import React, { useState, useEffect } from 'react';
import { MapPin, IndianRupee, ShieldCheck, Edit3, RotateCcw, CheckCircle2, Home, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { SelectableChip } from '../components/SelectableChip.js';

const MIN_RENT=3000;
const MAX_RENT=80000;

export const ProfilePage: React.FC = () => {
  const { user, profile, updateProfileState } = useAuth();
  const [isEditing,setIsEditing]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [name,setName]=useState(profile?.name||'');
  const [locality,setLocality]=useState(profile?.locality||'Indiranagar');
  const [rentMin,setRentMin]=useState(profile?.rent_min||10000);
  const [rentMax,setRentMax]=useState(profile?.rent_max||22000);
  const [bio,setBio]=useState(profile?.bio||'');
  const [foodPref,setFoodPref]=useState(profile?.food_preference||'Vegetarian');
  const [cleanliness,setCleanliness]=useState(profile?.cleanliness||'Strict');
  const [sleepSchedule,setSleepSchedule]=useState(profile?.sleep_schedule||'Flexible');
  const [smoking,setSmoking]=useState(profile?.smoking||'No');
  const [drinking,setDrinking]=useState(profile?.drinking||'Occasionally');

  useEffect(()=>{
    if(profile){
      setName(profile.name||'');setLocality(profile.locality||'Indiranagar');
      setRentMin(profile.rent_min||10000);setRentMax(profile.rent_max||22000);
      setBio(profile.bio||'');setFoodPref(profile.food_preference||'Vegetarian');
      setCleanliness(profile.cleanliness||'Strict');setSleepSchedule(profile.sleep_schedule||'Flexible');
      setSmoking(profile.smoking||'No');setDrinking(profile.drinking||'Occasionally');
    }
  },[profile]);

  if(!profile)return <div className="p-8 text-center text-xs text-[#7A7D87]">Loading your profile...</div>;

  const handleReactivateDiscover=async()=>{
    setLoading(true);try{const res=await api.reactivateDiscover();updateProfileState(res.profile);}catch{}finally{setLoading(false);}
  };

  const handleSaveProfile=async(e:React.FormEvent)=>{
    e.preventDefault();setLoading(true);setError(null);
    try{
      if(rentMin<MIN_RENT||rentMax>MAX_RENT||rentMax<rentMin){setError('Rent range must be between ₹3,000 and ₹80,000, with the maximum at or above the minimum.');setLoading(false);return;}
      const res=await api.updateProfile({name,locality,rent_min:Number(rentMin),rent_max:Number(rentMax),bio,food_preference:foodPref as any,cleanliness:cleanliness as any,sleep_schedule:sleepSchedule as any,smoking:smoking as any,drinking:drinking as any});
      updateProfileState(res.profile);setIsEditing(false);
    }catch(err:any){setError(err.message||'Could not update profile.');}finally{setLoading(false);}
  };

  return <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 space-y-6">
    {profile.moved_in_status==='moved_in'&&<div className="bg-[#4F8A6D]/15 border border-[#4F8A6D]/30 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3 text-center sm:text-left"><div className="w-12 h-12 rounded-2xl bg-[#4F8A6D] text-white flex items-center justify-center shrink-0"><Home className="w-6 h-6"/></div><div><h4 className="font-display font-bold text-base text-[#2B2D42]">You're marked as Moved In! 🏠</h4><p className="text-xs text-[#7A7D87] mt-0.5">Your profile is currently hidden from Discover.</p></div></div>
      <button id="reactivate-discover-btn" disabled={loading} onClick={handleReactivateDiscover} className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#E07A5F] text-white font-bold text-xs hover:bg-[#D4694E] shadow-sm flex items-center justify-center gap-2"><RotateCcw className="w-4 h-4"/><span>Looking for a flatmate again?</span></button>
    </div>}

    <div className="bg-white rounded-3xl border border-[#E6E3DE] shadow-xl overflow-hidden">
      <div className="relative h-48 sm:h-60 bg-[#FAF8F4] border-b border-[#E6E3DE] overflow-hidden"><div className="absolute inset-0 bg-gradient-to-tr from-[#E07A5F]/20 to-[#F2C078]/20"/><div className="absolute top-4 right-4"><button id="edit-profile-btn" onClick={()=>setIsEditing(true)} className="px-4 py-2 rounded-xl bg-white/90 backdrop-blur-sm border border-[#E6E3DE] text-[#2B2D42] text-xs font-bold hover:bg-white shadow-sm flex items-center gap-1.5"><Edit3 className="w-3.5 h-3.5"/><span>Edit Profile</span></button></div></div>

      <div className="px-6 sm:px-10 pb-10">
        <div className="relative flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 sm:-mt-20 mb-6 gap-4 text-center sm:text-left">
          <div className="relative"><img src={profile.main_photo||profile.photos?.[0]?.url||'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80'} alt={profile.name} className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl object-cover border-4 border-white shadow-lg bg-[#FAF8F4]"/>{profile.is_verified&&<div className="absolute -bottom-2 -right-2 bg-[#4F8A6D] text-white p-1.5 rounded-full border-2 border-white shadow-sm" title="Verified Photo & Phone"><ShieldCheck className="w-5 h-5"/></div>}</div>
          <div className="flex-1 sm:pl-4 min-w-0"><h2 className="font-display font-black text-2xl sm:text-3xl text-[#2B2D42] flex items-center justify-center sm:justify-start gap-2"><span>{profile.name}</span><span className="text-xl font-bold text-[#7A7D87]">, {profile.age}</span></h2><div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[#7A7D87] mt-1.5 font-medium"><span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#E07A5F]"/><span>{profile.locality}, Bangalore</span></span><span>•</span><span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5 text-[#E07A5F]"/><span>₹{profile.rent_min?.toLocaleString()} - ₹{profile.rent_max?.toLocaleString()} / mo</span></span></div></div>
        </div>

        <div className="mb-6 p-4 rounded-2xl bg-[#FAF8F4] border border-[#E6E3DE]"><div className="flex items-center justify-between mb-1"><h4 className="label-caps text-[#7A7D87]">Account Email</h4>{user?.email_verified&&<span className="text-[11px] font-bold text-[#4F8A6D] flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/>Verified</span>}</div><p className="text-sm font-semibold text-[#2B2D42] break-all flex items-center gap-2"><Mail className="w-4 h-4 text-[#E07A5F] shrink-0"/>{user?.email||'Email unavailable'}</p></div>

        <div className="mb-6 p-4 rounded-2xl bg-[#FAF8F4] border border-[#E6E3DE]"><div className="flex items-center justify-between mb-1"><h4 className="label-caps text-[#7A7D87]">About Me</h4>{!profile.bio&&<button type="button" onClick={()=>setIsEditing(true)} className="text-xs font-bold text-[#E07A5F] hover:underline">+ Write Bio</button>}</div>{profile.bio?<p className="text-sm text-[#2B2D42] leading-relaxed">"{profile.bio}"</p>:<p className="text-xs text-[#7A7D87] italic">No bio added yet. Tell potential flatmates a bit about yourself!</p>}</div>

        <div className="space-y-6"><div><h4 className="label-caps text-[#7A7D87] mb-2.5">Daily Life & Preferences</h4><div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><div className="bg-[#FAF8F4] border border-[#E6E3DE] rounded-2xl p-3.5"><span className="text-[10px] uppercase font-bold text-[#7A7D87] block">Diet</span><span className="text-xs font-bold text-[#2B2D42] mt-0.5 block break-words">{profile.food_preference}</span></div><div className="bg-[#FAF8F4] border border-[#E6E3DE] rounded-2xl p-3.5"><span className="text-[10px] uppercase font-bold text-[#7A7D87] block">Cleanliness</span><span className="text-xs font-bold text-[#2B2D42] mt-0.5 block break-words">{profile.cleanliness} Standard</span></div><div className="bg-[#FAF8F4] border border-[#E6E3DE] rounded-2xl p-3.5"><span className="text-[10px] uppercase font-bold text-[#7A7D87] block">Sleep</span><span className="text-xs font-bold text-[#2B2D42] mt-0.5 block break-words">{profile.sleep_schedule}</span></div><div className="bg-[#FAF8F4] border border-[#E6E3DE] rounded-2xl p-3.5"><span className="text-[10px] uppercase font-bold text-[#7A7D87] block">Smoking</span><span className="text-xs font-bold text-[#2B2D42] mt-0.5 block break-words">{profile.smoking}</span></div></div></div>

          {profile.non_negotiables&&profile.non_negotiables.length>0&&<div><h4 className="label-caps text-[#7A7D87] mb-2">My Non-Negotiables</h4><div className="flex flex-wrap gap-2">{profile.non_negotiables.map((nn,idx)=><span key={idx} className="max-w-full px-3 py-1.5 rounded-xl bg-[#E07A5F]/10 border border-[#E07A5F]/30 text-xs font-bold text-[#E07A5F] break-words">⚡ {nn}</span>)}</div></div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><h4 className="label-caps text-[#7A7D87] mb-2">Hobbies & Interests</h4><div className="flex flex-wrap gap-1.5">{profile.hobbies?.map(h=><span key={h} className="max-w-full px-2.5 py-1 rounded-lg bg-white border border-[#E6E3DE] text-xs font-medium text-[#2B2D42] break-words">{h}</span>)}</div></div><div><h4 className="label-caps text-[#7A7D87] mb-2">Languages</h4><div className="flex flex-wrap gap-1.5">{profile.languages?.map(l=><span key={l} className="max-w-full px-2.5 py-1 rounded-lg bg-white border border-[#E6E3DE] text-xs font-medium text-[#2B2D42] break-words">{l}</span>)}</div></div></div>
        </div>
      </div>
    </div>

    {isEditing&&<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"><div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E6E3DE] p-6 sm:p-8"><div className="flex items-center justify-between pb-4 border-b border-[#E6E3DE] mb-6"><h3 className="font-display font-bold text-xl text-[#2B2D42]">Edit Your Profile</h3><button onClick={()=>setIsEditing(false)} className="w-8 h-8 rounded-full bg-[#FAF8F4] flex items-center justify-center text-[#7A7D87]">✕</button></div><form onSubmit={handleSaveProfile} className="space-y-4">
      <div><label className="label-caps text-[#7A7D87] block mb-1">Full Name</label><input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E3DE] text-sm focus:ring-2 focus:ring-[#E07A5F]/40"/></div>
      <div><label className="label-caps text-[#7A7D87] block mb-1">Locality in Bangalore</label><input type="text" value={locality} onChange={e=>setLocality(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E3DE] text-sm focus:ring-2 focus:ring-[#E07A5F]/40"/></div>
      <div className="grid grid-cols-2 gap-3"><div><label className="label-caps text-[#7A7D87] block mb-1">Min Rent (₹)</label><input type="number" min={MIN_RENT} max={MAX_RENT} step={1000} value={rentMin} onChange={e=>setRentMin(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E3DE] text-sm focus:ring-2 focus:ring-[#E07A5F]/40"/></div><div><label className="label-caps text-[#7A7D87] block mb-1">Max Rent (₹)</label><input type="number" min={MIN_RENT} max={MAX_RENT} step={1000} value={rentMax} onChange={e=>setRentMax(Number(e.target.value))} className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E3DE] text-sm focus:ring-2 focus:ring-[#E07A5F]/40"/></div></div>
      <div><label className="label-caps text-[#7A7D87] block mb-1">Bio</label><textarea rows={3} value={bio} placeholder="Tell potential flatmates what you do, your daily habits, and what you're looking for..." onChange={e=>setBio(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E3DE] text-sm focus:ring-2 focus:ring-[#E07A5F]/40"/></div>
      <div><label className="label-caps text-[#7A7D87] block mb-1.5">Dietary Preference</label><div className="grid grid-cols-2 gap-2">{['Vegetarian','Non-vegetarian','Eggetarian','Vegan'].map(f=><SelectableChip key={f} label={f} selected={foodPref===f} onClick={()=>setFoodPref(f)} size="sm"/>)}</div></div>
      {error&&<p className="text-xs text-[#D64545] font-semibold">{error}</p>}
      <div className="flex items-center gap-3 pt-4 border-t border-[#E6E3DE]"><button type="button" onClick={()=>setIsEditing(false)} className="flex-1 py-3 rounded-xl border border-[#E6E3DE] font-bold text-sm text-[#2B2D42]">Cancel</button><button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-[#E07A5F] text-white font-bold text-sm hover:bg-[#D4694E] shadow-sm disabled:opacity-50">{loading?'Saving...':'Save Changes'}</button></div>
    </form></div></div>}
  </div>;
};
