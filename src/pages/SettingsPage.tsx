import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Trash2,
  LogOut,
  UserX,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Phone,
  Mail,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { BlockRecord } from '../types.js';

export const SettingsPage: React.FC = () => {
  const { user, profile, settings, updateSettingsState, logout } = useAuth();

  const [messageBanner, setMessageBanner] = useState(settings?.new_message_banner ?? true);
  const [emailNotifs, setEmailNotifs] = useState(settings?.email_notifications ?? true);

  const [blockedUsers, setBlockedUsers] = useState<BlockRecord[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  // Delete Account Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [savedToast, setSavedToast] = useState(false);

  const fetchBlocked = async () => {
    try {
      setLoadingBlocked(true);
      const res = await api.getBlockedUsers();
      setBlockedUsers(res.blocked_users);
    } catch {
      // ignore
    } finally {
      setLoadingBlocked(false);
    }
  };

  useEffect(() => {
    fetchBlocked();
  }, []);

  const handleToggleBanner = async () => {
    const nextVal = !messageBanner;
    setMessageBanner(nextVal);
    await updateSettingsState({ new_message_banner: nextVal });
    showToast();
  };

  const handleToggleEmail = async () => {
    const nextVal = !emailNotifs;
    setEmailNotifs(nextVal);
    await updateSettingsState({ email_notifications: nextVal });
    showToast();
  };

  const handleUnblock = async (targetUserId: string) => {
    try {
      await api.unblockUser(targetUserId);
      setBlockedUsers(prev => prev.filter(b => b.blocked_id !== targetUserId));
    } catch {
      // ignore
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE in capital letters to confirm.');
      return;
    }

    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteAccount('DELETE');
      logout();
      window.location.reload();
    } catch (err: any) {
      setDeleteError(err.message || 'Could not delete account.');
    } finally {
      setDeleting(false);
    }
  };

  const showToast = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display font-black text-2xl sm:text-3xl text-[#2B2D42]">
          Settings & Privacy
        </h2>
        <p className="text-xs text-[#7A7D87] mt-0.5">
          Manage your account, notifications, and safety preferences
        </p>
      </div>

      {savedToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#4F8A6D] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Preferences updated</span>
        </div>
      )}

      {/* Account Info Card */}
      <div className="bg-white rounded-3xl border border-[#E6E3DE] p-6 shadow-sm space-y-4">
        <h3 className="font-display font-bold text-base text-[#2B2D42] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#E07A5F]" />
          <span>Account Credentials</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-[#FAF8F4] border border-[#E6E3DE] rounded-2xl p-4 flex items-center gap-3">
            <Mail className="w-5 h-5 text-[#7A7D87]" />
            <div className="min-w-0 flex-1">
              <span className="text-[#7A7D87] block font-medium">Email Address</span>
              <span className="font-bold text-[#2B2D42] truncate block mt-0.5">{user?.email || 'N/A'}</span>
            </div>
          </div>

          <div className="bg-[#FAF8F4] border border-[#E6E3DE] rounded-2xl p-4 flex items-center gap-3">
            <Phone className="w-5 h-5 text-[#7A7D87]" />
            <div className="min-w-0 flex-1">
              <span className="text-[#7A7D87] block font-medium">Verified Phone</span>
              <span className="font-bold text-[#2B2D42] truncate block mt-0.5">
                {user?.phone || 'Verified in Bangalore'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings (Requirement #33) */}
      <div className="bg-white rounded-3xl border border-[#E6E3DE] p-6 shadow-sm space-y-4">
        <h3 className="font-display font-bold text-base text-[#2B2D42] flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#E07A5F]" />
          <span>Notification Preferences</span>
        </h3>

        <div className="space-y-3 divide-y divide-[#E6E3DE]">
          {/* New Message Banner Toggle */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-bold text-[#2B2D42]">In-App New Message Banners</p>
              <p className="text-xs text-[#7A7D87] mt-0.5">
                Show top alerts when matched flatmates send you messages
              </p>
            </div>
            <button
              id="toggle-message-banner-btn"
              type="button"
              onClick={handleToggleBanner}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                messageBanner ? 'bg-[#E07A5F]' : 'bg-[#E6E3DE]'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  messageBanner ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Email Notifications Toggle */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <p className="text-sm font-bold text-[#2B2D42]">Email Alerts</p>
              <p className="text-xs text-[#7A7D87] mt-0.5">
                Receive weekly summaries of new compatible flatmates in your area
              </p>
            </div>
            <button
              id="toggle-email-notif-btn"
              type="button"
              onClick={handleToggleEmail}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                emailNotifs ? 'bg-[#E07A5F]' : 'bg-[#E6E3DE]'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  emailNotifs ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Blocked Users Section (Requirement #35) */}
      <div className="bg-white rounded-3xl border border-[#E6E3DE] p-6 shadow-sm space-y-4">
        <h3 className="font-display font-bold text-base text-[#2B2D42] flex items-center gap-2">
          <UserX className="w-4 h-4 text-[#D64545]" />
          <span>Blocked Flatmates</span>
        </h3>
        <p className="text-xs text-[#7A7D87]">
          Blocked users cannot discover your profile, match, or message you.
        </p>

        {loadingBlocked ? (
          <p className="text-xs text-[#7A7D87]">Loading...</p>
        ) : blockedUsers.length === 0 ? (
          <div className="p-4 bg-[#FAF8F4] border border-[#E6E3DE] rounded-2xl text-xs text-[#7A7D87] text-center">
            You haven't blocked any users.
          </div>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map(b => (
              <div
                key={b.id}
                className="flex items-center justify-between p-3 bg-[#FAF8F4] border border-[#E6E3DE] rounded-2xl text-xs"
              >
                <div>
                  <span className="font-bold text-[#2B2D42] block">
                    {b.blocked_user?.name || 'Blocked User'}
                  </span>
                  <span className="text-[11px] text-[#7A7D87]">
                    {b.blocked_user?.locality || 'Bangalore'}
                  </span>
                </div>
                <button
                  onClick={() => handleUnblock(b.blocked_id)}
                  className="px-3 py-1.5 rounded-lg border border-[#E6E3DE] font-bold text-xs text-[#2B2D42] hover:bg-white"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout & Account Deletion */}
      <div className="bg-white rounded-3xl border border-[#E6E3DE] p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            id="logout-btn"
            type="button"
            onClick={logout}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#E6E3DE] text-[#2B2D42] font-bold text-xs hover:bg-[#FAF8F4] flex items-center justify-center gap-2 min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>

          <button
            id="open-delete-account-btn"
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#D64545]/10 text-[#D64545] hover:bg-[#D64545] hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Account Deletion Modal (Requirement #39: Must type 'DELETE' in capital letters) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-[#E6E3DE] p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#E6E3DE] mb-4">
              <div className="flex items-center gap-2 text-[#D64545]">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-display font-bold text-lg text-[#2B2D42]">
                  Delete Account Permanently?
                </h3>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF8F4] flex items-center justify-center text-[#7A7D87]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#7A7D87] leading-relaxed mb-4">
              This action is permanent and irreversible. All your profile data, photos, swipes, matches, and message conversations will be permanently wiped from the database.
            </p>

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="label-caps text-[#D64545] block mb-1.5">
                  Type <span className="font-mono font-bold">DELETE</span> to confirm:
                </label>
                <input
                  id="delete-confirmation-input"
                  type="text"
                  required
                  placeholder="DELETE"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#D64545]/40 text-sm font-mono tracking-wider focus:outline-none focus:border-[#D64545]"
                />
              </div>

              {deleteError && (
                <p className="text-xs text-[#D64545] font-semibold">{deleteError}</p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E6E3DE] font-bold text-xs text-[#2B2D42]"
                >
                  Cancel
                </button>
                <button
                  id="confirm-delete-account-btn"
                  type="submit"
                  disabled={deleteConfirmText !== 'DELETE' || deleting}
                  className="flex-1 py-2.5 rounded-xl bg-[#D64545] text-white font-bold text-xs hover:bg-[#b53434] shadow-sm disabled:opacity-40"
                >
                  {deleting ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
