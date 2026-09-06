import React from 'react';
import { Compass, MessageCircleHeart, User, Settings, Sparkles, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface NavbarProps {
  activeTab: 'discover' | 'matches' | 'profile' | 'settings';
  setActiveTab: (tab: 'discover' | 'matches' | 'profile' | 'settings') => void;
  onOpenAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenAuth }) => {
  const { user, profile, unreadTotal } = useAuth();

  return (
    <>
      {/* Top Header - Both Mobile and Desktop */}
      <header className="sticky top-0 z-40 bg-[#FAF8F4]/90 backdrop-blur-md border-b border-[#E6E3DE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Tagline */}
          <div
            id="brand-logo"
            onClick={() => setActiveTab('discover')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#E07A5F] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-xl tracking-tight text-[#2B2D42]">
                  FLATMATE<span className="text-[#E07A5F]">+</span>
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold bg-[#F2C078]/30 text-[#2B2D42] rounded-md uppercase tracking-wider">
                  India
                </span>
              </div>
              <p className="text-[10px] font-bold tracking-[0.14em] text-[#7A7D87] uppercase leading-none">
                Find Your People
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          {user ? (
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              <button
                id="nav-btn-discover"
                onClick={() => setActiveTab('discover')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all min-h-[44px] ${
                  activeTab === 'discover'
                    ? 'bg-[#E07A5F] text-white shadow-sm'
                    : 'text-[#7A7D87] hover:text-[#2B2D42] hover:bg-white/80'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Discover</span>
              </button>

              <button
                id="nav-btn-matches"
                onClick={() => setActiveTab('matches')}
                className={`relative px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all min-h-[44px] ${
                  activeTab === 'matches'
                    ? 'bg-[#E07A5F] text-white shadow-sm'
                    : 'text-[#7A7D87] hover:text-[#2B2D42] hover:bg-white/80'
                }`}
              >
                <MessageCircleHeart className="w-4 h-4" />
                <span>Matches & Chat</span>
                {unreadTotal > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E07A5F] ring-2 ring-white animate-pulse" />
                )}
              </button>

              <button
                id="nav-btn-profile"
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all min-h-[44px] ${
                  activeTab === 'profile'
                    ? 'bg-[#E07A5F] text-white shadow-sm'
                    : 'text-[#7A7D87] hover:text-[#2B2D42] hover:bg-white/80'
                }`}
              >
                <User className="w-4 h-4" />
                <span>{profile?.name ? profile.name.split(' ')[0] : 'Profile'}</span>
              </button>

              <button
                id="nav-btn-settings"
                onClick={() => setActiveTab('settings')}
                className={`p-2 rounded-xl text-sm transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  activeTab === 'settings'
                    ? 'bg-[#E07A5F] text-white'
                    : 'text-[#7A7D87] hover:text-[#2B2D42] hover:bg-white/80'
                }`}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </nav>
          ) : (
            <div className="flex items-center gap-3">
              <button
                id="header-login-btn"
                onClick={onOpenAuth}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#E07A5F] hover:bg-[#D4694E] shadow-sm transition-all min-h-[44px]"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation (Requirement #52: Clean mobile bottom bar, never floating in the middle of desktop) */}
      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#E6E3DE] px-3 py-2 pb-safe">
          <div className="flex items-center justify-around max-w-md mx-auto">
            <button
              id="mobile-nav-discover"
              onClick={() => setActiveTab('discover')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[56px] min-h-[48px] ${
                activeTab === 'discover' ? 'text-[#E07A5F] font-bold' : 'text-[#7A7D87]'
              }`}
            >
              <Compass className={`w-5 h-5 ${activeTab === 'discover' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[11px] mt-0.5">Discover</span>
            </button>

            <button
              id="mobile-nav-matches"
              onClick={() => setActiveTab('matches')}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[56px] min-h-[48px] ${
                activeTab === 'matches' ? 'text-[#E07A5F] font-bold' : 'text-[#7A7D87]'
              }`}
            >
              <div className="relative">
                <MessageCircleHeart className={`w-5 h-5 ${activeTab === 'matches' ? 'stroke-[2.5]' : ''}`} />
                {unreadTotal > 0 && (
                  <span className="absolute -top-0.5 -right-1 w-2.5 h-2.5 rounded-full bg-[#E07A5F] ring-2 ring-white" />
                )}
              </div>
              <span className="text-[11px] mt-0.5">Matches</span>
            </button>

            <button
              id="mobile-nav-profile"
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[56px] min-h-[48px] ${
                activeTab === 'profile' ? 'text-[#E07A5F] font-bold' : 'text-[#7A7D87]'
              }`}
            >
              <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[11px] mt-0.5">Profile</span>
            </button>

            <button
              id="mobile-nav-settings"
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all min-w-[56px] min-h-[48px] ${
                activeTab === 'settings' ? 'text-[#E07A5F] font-bold' : 'text-[#7A7D87]'
              }`}
            >
              <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[11px] mt-0.5">Settings</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
