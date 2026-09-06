import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Home, Compass } from 'lucide-react';
import { AuthModal } from './AuthModal.js';
import { FlatMateLogo } from '../components/FlatMateLogo.js';

interface LandingPageProps { onExploreDemo: () => void; }

export const LandingPage: React.FC<LandingPageProps> = ({ onExploreDemo }) => {
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | null>(null);

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#2B2D42] flex flex-col">
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center">
        <div className="flex justify-center mb-8"><FlatMateLogo size={72} showWordmark /></div>
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E6E3DE] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#E07A5F] animate-pulse" />
            <span className="label-caps text-[#E07A5F] text-[11px]">Bangalore's First Compatibility Matcher</span>
          </div>
          <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl text-[#2B2D42] tracking-tight leading-[1.1]">Live with people <br className="hidden sm:inline" /><span className="text-[#E07A5F]">who get you.</span></h1>
          <p className="text-base sm:text-xl text-[#7A7D87] max-w-xl mx-auto font-medium leading-relaxed">India's smart flatmate matcher — swipe, match on compatibility, chat, move in.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 max-w-md mx-auto">
            <button id="hero-create-account-btn" onClick={() => setAuthModalMode('signup')} className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#E07A5F] hover:bg-[#D4694E] text-white font-bold text-base shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 min-h-[50px]">CREATE ACCOUNT <ArrowRight className="w-4 h-4" /></button>
            <button id="hero-login-btn" onClick={() => setAuthModalMode('login')} className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white border-2 border-[#E6E3DE] hover:border-[#E07A5F] text-[#2B2D42] font-bold text-base hover:bg-[#FAF8F4] transition-all min-h-[50px]">LOGIN</button>
          </div>
          <div className="pt-2"><button id="hero-explore-demo-btn" onClick={onExploreDemo} className="text-xs font-bold text-[#7A7D87] hover:text-[#E07A5F] flex items-center justify-center gap-1.5 mx-auto transition-colors"><Compass className="w-3.5 h-3.5 text-[#E07A5F]" /><span>Or explore live Bangalore flatmates first</span></button></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 sm:mt-24">
          <div className="bg-white rounded-3xl border border-[#E6E3DE] p-6 shadow-sm"><div className="w-12 h-12 rounded-2xl bg-[#E07A5F]/15 text-[#E07A5F] flex items-center justify-center mb-4"><Sparkles className="w-6 h-6" /></div><h3 className="font-display font-bold text-lg">Real Compatibility Scoring</h3><p className="text-xs text-[#7A7D87] mt-1.5 leading-relaxed">We match sleep cycles, cleanliness habits, non-veg cooking boundaries, and budget overlaps — not just random photos.</p></div>
          <div className="bg-white rounded-3xl border border-[#E6E3DE] p-6 shadow-sm"><div className="w-12 h-12 rounded-2xl bg-[#4F8A6D]/15 text-[#4F8A6D] flex items-center justify-center mb-4"><ShieldCheck className="w-6 h-6" /></div><h3 className="font-display font-bold text-lg">Verified Indian Profiles</h3><p className="text-xs text-[#7A7D87] mt-1.5 leading-relaxed">Indian mobile number verification and photo authenticity checks ensure genuine flatmates across Indiranagar, Koramangala & beyond.</p></div>
          <div className="bg-white rounded-3xl border border-[#E6E3DE] p-6 shadow-sm"><div className="w-12 h-12 rounded-2xl bg-[#F2C078]/25 text-[#2B2D42] flex items-center justify-center mb-4"><Home className="w-6 h-6" /></div><h3 className="font-display font-bold text-lg">Two-Sided Move In</h3><p className="text-xs text-[#7A7D87] mt-1.5 leading-relaxed">Lock in your room when you both confirm moving in together. Seamlessly coordinates flat sharing without ghosting.</p></div>
        </div>
      </section>
      <footer className="bg-white border-t border-[#E6E3DE] py-8 px-4 text-center"><div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4"><div className="flex items-center gap-3"><FlatMateLogo size={34} /><div><span className="font-display font-black text-lg">FLATMATE<span className="text-[#E07A5F]">+</span></span><span className="text-xs text-[#7A7D87] ml-2">© 2026 Bangalore, India</span></div></div><p className="text-xs text-[#7A7D87]">Live with people who get you.</p></div></footer>
      {authModalMode && <AuthModal isOpen={!!authModalMode} initialMode={authModalMode} onClose={() => setAuthModalMode(null)} onSuccess={() => setAuthModalMode(null)} />}
    </div>
  );
};
