import React, { useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface NewMessageBannerProps {
  onOpenMatch: (matchId: string) => void;
}

export const NewMessageBanner: React.FC<NewMessageBannerProps> = ({ onOpenMatch }) => {
  const { activeBanner, dismissBanner, settings } = useAuth();

  useEffect(() => {
    if (activeBanner) {
      const timer = setTimeout(() => {
        dismissBanner();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activeBanner, dismissBanner]);

  if (!activeBanner || !settings.new_message_banner) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-in slide-in-from-top-4 duration-200">
      <div className="bg-white border border-[#E07A5F]/40 shadow-lg rounded-2xl p-3.5 flex items-center justify-between gap-3 text-[#2B2D42]">
        <div
          id="banner-content"
          onClick={() => {
            onOpenMatch(activeBanner.matchId);
            dismissBanner();
          }}
          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
        >
          {activeBanner.senderPhoto ? (
            <img
              src={activeBanner.senderPhoto}
              alt={activeBanner.senderName}
              className="w-10 h-10 rounded-full object-cover border border-[#E6E3DE] flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#FAF8F4] border border-[#E6E3DE] flex items-center justify-center text-[#E07A5F] flex-shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#E07A5F] tracking-wide uppercase">
              New Message from {activeBanner.senderName}
            </p>
            <p className="text-sm text-[#2B2D42] truncate font-medium mt-0.5">
              "{activeBanner.content}"
            </p>
          </div>
        </div>
        <button
          id="banner-dismiss-btn"
          onClick={dismissBanner}
          className="text-[#7A7D87] hover:text-[#2B2D42] p-1.5 rounded-lg hover:bg-[#FAF8F4] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
