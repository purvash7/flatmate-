import React from 'react';
import { X, Sparkles, CheckCircle2, ShieldCheck, Heart } from 'lucide-react';
import { MatchScoreResult, UserProfile } from '../types.js';

interface MatchReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  otherUser: UserProfile;
  matchScore: number;
  matchBreakdown?: MatchScoreResult;
}

export const MatchReportModal: React.FC<MatchReportModalProps> = ({
  isOpen,
  onClose,
  otherUser,
  matchScore,
  matchBreakdown
}) => {
  if (!isOpen) return null;

  const categories = matchBreakdown?.categories || [
    { category: 'Location', score: 85, weight: 15, label: `Both around ${otherUser.locality}` },
    { category: 'Housing Intent', score: 90, weight: 15, label: 'Compatible search goals' },
    { category: 'Rent Budget', score: 75, weight: 10, label: 'Budgets overlap well' },
    { category: 'Cleanliness', score: 80, weight: 8, label: `${otherUser.cleanliness} standards` },
    { category: 'Food', score: 90, weight: 8, label: `${otherUser.food_preference}` },
    { category: 'Sleep Schedule', score: 80, weight: 6, label: `${otherUser.sleep_schedule}` },
    { category: 'Social Style', score: 70, weight: 5, label: `${otherUser.social_level}` }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-[#E6E3DE] max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#E6E3DE] flex items-center justify-between bg-[#FAF8F4]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E07A5F]/15 flex items-center justify-center text-[#E07A5F]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-[#2B2D42]">
                Compatibility Report
              </h3>
              <p className="text-xs text-[#7A7D87]">
                With {otherUser.name}
              </p>
            </div>
          </div>
          <button
            id="close-match-report-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-[#E6E3DE] flex items-center justify-center text-[#7A7D87] hover:text-[#2B2D42] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Score Banner */}
          <div className="bg-[#FAF8F4] border border-[#E6E3DE] rounded-2xl p-5 text-center relative overflow-hidden">
            <div className="relative z-10">
              <span className="label-caps text-[#E07A5F] block mb-1">
                Overall Compatibility
              </span>
              <div className="font-display font-extrabold text-5xl text-[#2B2D42] tracking-tight flex items-center justify-center gap-1">
                <span>{matchScore}</span>
                <span className="text-2xl text-[#E07A5F] font-bold">%</span>
              </div>
              <p className="text-xs text-[#7A7D87] mt-2 max-w-xs mx-auto">
                Based on lifestyle habits, budget overlap, food choices, cleanliness, and housing intent.
              </p>
            </div>
          </div>

          {/* Highlights */}
          {matchBreakdown?.highlights && matchBreakdown.highlights.length > 0 && (
            <div>
              <h4 className="label-caps text-[#7A7D87] mb-2.5">Key Highlights</h4>
              <div className="space-y-2">
                {matchBreakdown.highlights.map((highlight, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 bg-white border border-[#E6E3DE] rounded-xl p-3 text-sm text-[#2B2D42]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#4F8A6D] flex-shrink-0 mt-0.5" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Progress Bars */}
          <div>
            <h4 className="label-caps text-[#7A7D87] mb-3">Compatibility Breakdown</h4>
            <div className="space-y-4">
              {categories.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#2B2D42]">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#7A7D87] text-[11px]">{cat.label}</span>
                      <span className="font-bold text-[#E07A5F]">{cat.score}%</span>
                    </div>
                  </div>
                  {/* Small horizontal progress bar in Coral */}
                  <div className="w-full h-2.5 bg-[#F1EEE8] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#E07A5F] rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.max(8, Math.min(100, cat.score))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Safety & Trust Note */}
          <div className="bg-[#4F8A6D]/10 border border-[#4F8A6D]/20 rounded-2xl p-4 flex items-start gap-3 text-xs text-[#2B2D42]">
            <ShieldCheck className="w-5 h-5 text-[#4F8A6D] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#4F8A6D]">Verified Flatmate Profile</p>
              <p className="text-[#7A7D87] mt-0.5">
                {otherUser.name}'s phone number and photo have passed authenticity checks.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E6E3DE] bg-[#FAF8F4] flex justify-end">
          <button
            id="close-match-report-action-btn"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#E07A5F] text-white font-bold text-sm hover:bg-[#D4694E] transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
