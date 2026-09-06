import React, { useState } from 'react';
import { ShieldAlert, Ban, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api.js';

interface BlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName: string;
  onBlocked: () => void;
}

export const BlockModal: React.FC<BlockModalProps> = ({
  isOpen,
  onClose,
  targetUserId,
  targetUserName,
  onBlocked
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBlock = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.blockUser(targetUserId);
      onBlocked();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not block user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-[#E6E3DE] p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#D64545]/10 text-[#D64545] flex items-center justify-center mx-auto mb-4">
          <Ban className="w-6 h-6" />
        </div>
        <h3 className="font-display font-bold text-xl text-[#2B2D42]">
          Block {targetUserName}?
        </h3>
        <p className="text-sm text-[#7A7D87] mt-2 max-w-sm mx-auto">
          They will no longer be able to message you, match with you, or see your profile on FlatMate+. This takes effect across all devices.
        </p>

        {error && (
          <p className="text-xs text-[#D64545] mt-3 font-semibold">{error}</p>
        )}

        <div className="flex items-center gap-3 mt-6">
          <button
            id="cancel-block-btn"
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-[#E6E3DE] font-bold text-sm text-[#2B2D42] hover:bg-[#FAF8F4] min-h-[44px]"
          >
            Cancel
          </button>
          <button
            id="confirm-block-btn"
            type="button"
            disabled={loading}
            onClick={handleBlock}
            className="flex-1 py-3 rounded-xl bg-[#D64545] text-white font-bold text-sm hover:bg-[#c03838] shadow-sm min-h-[44px] disabled:opacity-50"
          >
            {loading ? 'Blocking...' : 'Block User'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetUserId,
  targetUserName
}) => {
  const [reason, setReason] = useState('Fake profile');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const reasons = [
    'Fake profile',
    'Harassment',
    'Inappropriate content',
    'Scam',
    'Suspicious behaviour',
    'Other'
  ];

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.reportUser(targetUserId, reason, details);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Could not submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-[#E6E3DE] p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E6E3DE] mb-4">
          <div className="flex items-center gap-2 text-[#D64545]">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-display font-bold text-lg text-[#2B2D42]">
              Report {targetUserName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF8F4] flex items-center justify-center text-[#7A7D87]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-[#4F8A6D] mx-auto mb-2" />
            <h4 className="font-display font-bold text-lg text-[#2B2D42]">Report Submitted</h4>
            <p className="text-xs text-[#7A7D87] mt-1">Thank you. Our safety team will review this shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleReport} className="space-y-4">
            <div>
              <label className="label-caps text-[#7A7D87] block mb-2">Reason</label>
              <div className="grid grid-cols-2 gap-2">
                {reasons.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border text-left transition-all ${
                      reason === r
                        ? '!bg-[#E07A5F] !text-white !border-[#E07A5F]'
                        : 'bg-white text-[#2B2D42] border-[#E6E3DE]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label-caps text-[#7A7D87] block mb-1.5">Additional Details (Optional)</label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Tell us what happened..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E3DE] text-sm focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/40"
              />
            </div>

            {error && <p className="text-xs text-[#D64545] font-semibold">{error}</p>}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-[#E6E3DE] font-bold text-sm text-[#2B2D42]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-[#D64545] text-white font-bold text-sm hover:bg-[#c03838] shadow-sm disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
