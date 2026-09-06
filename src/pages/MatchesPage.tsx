import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircleHeart,
  Send,
  MoreVertical,
  Home,
  Ban,
  ShieldAlert,
  Sparkles,
  ChevronLeft,
  CheckCheck,
  Check,
  MapPin,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { wsService } from '../services/websocket.js';
import { MatchItem, MessageItem, UserProfile } from '../types.js';
import { MatchReportModal } from '../components/MatchReportModal.js';
import { BlockModal, ReportModal } from '../components/SafetyModals.js';

interface MatchesPageProps {
  selectedMatchId?: string | null;
  onSelectMatchId?: (id: string | null) => void;
}

export const MatchesPage: React.FC<MatchesPageProps> = ({
  selectedMatchId,
  onSelectMatchId
}) => {
  const { user, profile } = useAuth();

  const [matchesList, setMatchesList] = useState<MatchItem[]>([]);
  const [activeMatch, setActiveMatch] = useState<MatchItem | null>(null);
  const [messagesList, setMessagesList] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Modals & Menus
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest message at bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  }, []);

  // Fetch all matches
  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getMatches();
      setMatchesList(res.matches);

      if (selectedMatchId) {
        const found = res.matches.find(m => m.id === selectedMatchId);
        if (found) {
          selectConversation(found);
        }
      } else if (res.matches.length > 0 && window.innerWidth >= 1024 && !activeMatch) {
        selectConversation(res.matches[0]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedMatchId]);

  // Select Conversation
  const selectConversation = async (match: MatchItem) => {
    setActiveMatch(match);
    onSelectMatchId?.(match.id);
    try {
      const res = await api.getMatchDetail(match.id);
      setMessagesList(res.messages);

      // Mark read via API and WebSocket
      api.markMessagesRead(match.id);
      wsService.markAsRead(match.id);

      // Clear unread indicator in matches list
      setMatchesList(prev =>
        prev.map(m => (m.id === match.id ? { ...m, unread_count: 0 } : m))
      );

      // Open at the newest message (scroll to bottom immediately)
      setTimeout(() => scrollToBottom(false), 50);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Real-time WebSocket Listeners for Instant Message Delivery
  useEffect(() => {
    const handleWsMessage = (data: any) => {
      const incomingMsg: MessageItem = data.message;
      const matchId = data.match_id || incomingMsg?.match_id;

      if (!incomingMsg || !matchId) return;

      if (activeMatch && activeMatch.id === matchId) {
        // Append to active conversation if not already added
        setMessagesList(prev => {
          if (prev.some(m => m.id === incomingMsg.id)) return prev;
          return [...prev, incomingMsg];
        });

        // Mark as read immediately since user is actively viewing this conversation
        wsService.markAsRead(matchId);
        api.markMessagesRead(matchId);

        // Auto-scroll to bottom on new message
        setTimeout(() => scrollToBottom(true), 60);
      }

      // Update the matches list with latest message and unread badge if other conversation
      setMatchesList(prev =>
        prev.map(m => {
          if (m.id === matchId) {
            const isCurrentlyActive = activeMatch?.id === matchId;
            return {
              ...m,
              last_message: incomingMsg,
              unread_count: isCurrentlyActive ? 0 : (m.unread_count || 0) + 1
            };
          }
          return m;
        })
      );
    };

    const handleWsRead = (data: any) => {
      const matchId = data.match_id;
      if (activeMatch && activeMatch.id === matchId) {
        setMessagesList(prev => prev.map(m => ({ ...m, read: true })));
      }
    };

    const unsubMsg = wsService.on('chat:message', handleWsMessage);
    const unsubNewMsg = wsService.on('new_message', handleWsMessage);
    const unsubRead = wsService.on('chat:read', handleWsRead);

    return () => {
      unsubMsg();
      unsubNewMsg();
      unsubRead();
    };
  }, [activeMatch, scrollToBottom]);

  // Periodic polling fallback (every 4s) to ensure synchronization
  useEffect(() => {
    if (!activeMatch) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.getMatchDetail(activeMatch.id);
        if (res.messages && res.messages.length !== messagesList.length) {
          setMessagesList(res.messages);
          scrollToBottom(true);
        }
      } catch {
        // silent
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeMatch?.id, messagesList.length, scrollToBottom]);

  // Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeMatch || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      // Send via REST API (and WebSocket will also broadcast)
      const res = await api.sendMessage(activeMatch.id, textToSend);
      setMessagesList(prev => {
        if (prev.some(m => m.id === res.message.id)) return prev;
        return [...prev, res.message];
      });

      setTimeout(() => scrollToBottom(true), 50);

      // Update last message in matches list
      setMatchesList(prev =>
        prev.map(m =>
          m.id === activeMatch.id ? { ...m, last_message: res.message } : m
        )
      );
    } catch {
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  // Moving In Action (Two-sided state)
  const handleMovingIn = async () => {
    if (!activeMatch) return;
    try {
      const res = await api.requestMovingIn(activeMatch.id);
      setActiveMatch(res.match);
      setIsMenuOpen(false);
    } catch {
      // ignore
    }
  };

  const handleUserBlocked = () => {
    if (!activeMatch) return;
    setMatchesList(prev => prev.filter(m => m.id !== activeMatch.id));
    setActiveMatch(null);
    onSelectMatchId?.(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
      <div className="bg-white rounded-3xl border border-[#E6E3DE] shadow-xl overflow-hidden min-h-[75vh] grid grid-cols-1 lg:grid-cols-12">
        {/* Left: Matches List */}
        <div
          className={`lg:col-span-4 border-r border-[#E6E3DE] flex flex-col bg-[#FAF8F4] ${
            activeMatch ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-5 border-b border-[#E6E3DE] bg-white">
            <h2 className="font-display font-black text-2xl text-[#2B2D42]">
              Matches & Messages
            </h2>
            <p className="text-xs text-[#7A7D87] mt-0.5">
              People who share your compatibility
            </p>
          </div>

          {/* List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E6E3DE]">
            {loading && matchesList.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#7A7D87]">
                Loading your matches...
              </div>
            ) : matchesList.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#E6E3DE] flex items-center justify-center text-[#E07A5F] mx-auto mb-3">
                  <MessageCircleHeart className="w-6 h-6" />
                </div>
                <h4 className="font-display font-bold text-base text-[#2B2D42]">No matches yet</h4>
                <p className="text-xs text-[#7A7D87] mt-1 max-w-xs mx-auto">
                  Start liking flatmates in Discover. When you both connect, you'll be able to chat here!
                </p>
              </div>
            ) : (
              matchesList.map(m => {
                const isSelected = activeMatch?.id === m.id;
                const hasUnread = (m.unread_count || 0) > 0;
                return (
                  <div
                    key={m.id}
                    id={`match-item-${m.id}`}
                    onClick={() => selectConversation(m)}
                    className={`p-4 flex items-center gap-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-white border-l-4 border-l-[#E07A5F]'
                        : 'hover:bg-white/80'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={m.other_user?.main_photo || m.other_user?.photos?.[0]?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80'}
                        alt={m.other_user?.name}
                        className="w-12 h-12 rounded-full object-cover border border-[#E6E3DE]"
                      />
                      {/* Unread indicator (red/coral dot) */}
                      {hasUnread && (
                        <span
                          id={`unread-dot-${m.id}`}
                          className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#E07A5F] ring-2 ring-white animate-pulse"
                        />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-display font-bold text-sm text-[#2B2D42] truncate">
                          {m.other_user?.name}
                        </h4>
                        <span className="text-[11px] font-bold text-[#E07A5F] px-2 py-0.5 rounded-md bg-[#E07A5F]/10">
                          {m.match_score}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <p
                          className={`text-xs truncate ${
                            hasUnread ? 'font-bold text-[#2B2D42]' : 'text-[#7A7D87]'
                          }`}
                        >
                          {m.last_message?.content || `${m.other_user?.locality} • New connection`}
                        </p>
                        {m.status === 'moved_in' && (
                          <span className="text-[10px] bg-[#4F8A6D]/15 text-[#4F8A6D] font-bold px-1.5 py-0.5 rounded">
                            Moving In 🏠
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat Area */}
        <div
          className={`lg:col-span-8 flex flex-col bg-white ${
            !activeMatch ? 'hidden lg:flex items-center justify-center' : 'flex'
          }`}
        >
          {activeMatch ? (
            <>
              {/* Chat Header */}
              <div className="px-5 py-4 border-b border-[#E6E3DE] bg-[#FAF8F4] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setActiveMatch(null);
                      onSelectMatchId?.(null);
                    }}
                    className="lg:hidden p-1.5 rounded-lg text-[#7A7D87] hover:bg-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div
                    onClick={() => setIsProfileModalOpen(true)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <img
                      src={activeMatch.other_user?.main_photo || activeMatch.other_user?.photos?.[0]?.url}
                      alt={activeMatch.other_user?.name}
                      className="w-10 h-10 rounded-full object-cover border border-[#E6E3DE] group-hover:ring-2 group-hover:ring-[#E07A5F]"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-display font-bold text-base text-[#2B2D42]">
                          {activeMatch.other_user?.name}
                        </h3>
                        <span className="text-xs text-[#7A7D87]">
                          ({activeMatch.other_user?.age})
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7A7D87]">
                        {activeMatch.other_user?.locality}, Bangalore • Tap to view profile
                      </p>
                    </div>
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-2 relative">
                  <button
                    id="open-match-report-btn"
                    onClick={() => setIsReportModalOpen(true)}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E6E3DE] text-xs font-bold text-[#E07A5F] hover:bg-[#FAF8F4] shadow-sm transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{activeMatch.match_score}% Match Report</span>
                  </button>

                  {/* Menu Toggle */}
                  <button
                    id="chat-options-menu-btn"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="w-9 h-9 rounded-full bg-white border border-[#E6E3DE] flex items-center justify-center text-[#7A7D87] hover:text-[#2B2D42]"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Menu Dropdown */}
                  {isMenuOpen && (
                    <div className="absolute right-0 top-11 z-30 w-56 bg-white rounded-2xl border border-[#E6E3DE] shadow-xl p-2 space-y-1 animate-in fade-in">
                      <button
                        id="moving-in-action-btn"
                        onClick={handleMovingIn}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#2B2D42] hover:bg-[#FAF8F4] flex items-center gap-2"
                      >
                        <Home className="w-4 h-4 text-[#E07A5F]" />
                        <span>
                          {activeMatch.status === 'moved_in'
                            ? 'Moving in confirmed 🏠'
                            : activeMatch.moving_in_requested_by?.includes(user?.id || '')
                            ? 'Waiting for flatmate...'
                            : 'Mark as Moving In'}
                        </span>
                      </button>

                      <button
                        id="view-profile-menu-btn"
                        onClick={() => {
                          setIsProfileModalOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#2B2D42] hover:bg-[#FAF8F4] flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-[#7A7D87]" />
                        <span>View Full Profile</span>
                      </button>

                      <div className="border-t border-[#E6E3DE] my-1" />

                      <button
                        id="report-user-menu-btn"
                        onClick={() => {
                          setIsReportOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#7A7D87] hover:bg-[#FAF8F4] flex items-center gap-2"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        <span>Report Flatmate</span>
                      </button>

                      <button
                        id="block-user-menu-btn"
                        onClick={() => {
                          setIsBlockOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[#D64545] hover:bg-[#D64545]/10 flex items-center gap-2"
                      >
                        <Ban className="w-4 h-4" />
                        <span>Block User</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Moving in Banner */}
              {activeMatch.status === 'moved_in' ? (
                <div className="bg-[#4F8A6D]/15 border-b border-[#4F8A6D]/30 px-5 py-3 flex items-center justify-between text-xs text-[#4F8A6D] font-bold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>You two are moving in together 🏠</span>
                  </div>
                  <span className="text-[11px] font-medium text-[#2B2D42]">Discovery disabled</span>
                </div>
              ) : activeMatch.moving_in_requested_by?.includes(user?.id || '') ? (
                <div className="bg-[#FAF8F4] border-b border-[#E6E3DE] px-5 py-2.5 text-xs text-[#7A7D87] flex items-center justify-between">
                  <span>You've marked this match as moving in. Waiting for your flatmate's confirmation.</span>
                </div>
              ) : null}

              {/* Message Feed */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-white"
              >
                {messagesList.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-12 h-12 rounded-2xl bg-[#FAF8F4] border border-[#E6E3DE] flex items-center justify-center text-[#E07A5F] mb-3">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h4 className="font-display font-bold text-base text-[#2B2D42]">
                      Say hello to {activeMatch.other_user?.name?.split(' ')[0]}!
                    </h4>
                    <p className="text-xs text-[#7A7D87] mt-1 max-w-xs mx-auto">
                      Break the ice with a shared interest, or talk about flat hunting in {activeMatch.other_user?.locality}.
                    </p>

                    {/* Quick Icebreakers */}
                    <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-md">
                      {[
                        `Hi ${activeMatch.other_user?.name?.split(' ')[0]}! Are you looking around ${activeMatch.other_user?.locality}?`,
                        'Hey! I noticed we both have similar sleep rhythms.',
                        'Hi! Are you looking for a 2BHK or 3BHK to share?'
                      ].map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setInputText(prompt)}
                          className="px-3 py-1.5 bg-[#FAF8F4] hover:bg-[#FAF8F4]/80 text-[#2B2D42] border border-[#E6E3DE] rounded-xl text-xs text-left"
                        >
                          "{prompt}"
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messagesList.map(msg => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMe
                              ? 'bg-[#E07A5F] text-white rounded-br-xs'
                              : 'bg-[#FAF8F4] text-[#2B2D42] border border-[#E6E3DE] rounded-bl-xs'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[#7A7D87] mt-1 px-1">
                          <span>
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {isMe && (
                            <span>
                              {msg.read ? (
                                <CheckCheck className="w-3.5 h-3.5 text-[#E07A5F]" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-[#7A7D87]" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-[#E6E3DE] bg-[#FAF8F4] flex items-center gap-3"
              >
                <input
                  id="chat-message-input"
                  type="text"
                  placeholder={`Message ${activeMatch.other_user?.name?.split(' ')[0]}...`}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-white border border-[#E6E3DE] text-sm focus:outline-none focus:ring-2 focus:ring-[#E07A5F]/40"
                />
                <button
                  id="send-message-btn"
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="w-12 h-12 rounded-2xl bg-[#E07A5F] hover:bg-[#D4694E] text-white flex items-center justify-center shadow-sm disabled:opacity-50 transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-3xl bg-[#FAF8F4] border border-[#E6E3DE] flex items-center justify-center text-[#E07A5F] mx-auto mb-4">
                <MessageCircleHeart className="w-8 h-8" />
              </div>
              <h3 className="font-display font-bold text-xl text-[#2B2D42]">Select a conversation</h3>
              <p className="text-xs text-[#7A7D87] mt-1 max-w-xs mx-auto">
                Pick a flatmate from the left column to view messages and compatibility reports.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Compatibility Report Modal */}
      {isReportModalOpen && activeMatch?.other_user && (
        <MatchReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          otherUser={activeMatch.other_user}
          matchScore={activeMatch.match_score}
          matchBreakdown={activeMatch.match_breakdown}
        />
      )}

      {/* Safety Modals */}
      {activeMatch?.other_user && (
        <>
          <BlockModal
            isOpen={isBlockOpen}
            onClose={() => setIsBlockOpen(false)}
            targetUserId={activeMatch.other_user.user_id}
            targetUserName={activeMatch.other_user.name}
            onBlocked={handleUserBlocked}
          />

          <ReportModal
            isOpen={isReportOpen}
            onClose={() => setIsReportOpen(false)}
            targetUserId={activeMatch.other_user.user_id}
            targetUserName={activeMatch.other_user.name}
          />
        </>
      )}

      {/* Full Match Profile Modal */}
      {isProfileModalOpen && activeMatch?.other_user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E6E3DE] p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E6E3DE]">
              <div className="flex items-center gap-3">
                <img
                  src={activeMatch.other_user.main_photo || activeMatch.other_user.photos?.[0]?.url}
                  alt={activeMatch.other_user.name}
                  className="w-12 h-12 rounded-full object-cover border border-[#E6E3DE]"
                />
                <div>
                  <h3 className="font-display font-bold text-xl text-[#2B2D42]">
                    {activeMatch.other_user.name}, {activeMatch.other_user.age}
                  </h3>
                  <p className="text-xs text-[#7A7D87]">
                    {activeMatch.other_user.locality}, Bangalore
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF8F4] flex items-center justify-center text-[#7A7D87]"
              >
                ✕
              </button>
            </div>

            {/* Profile Gallery */}
            {activeMatch.other_user.photos && activeMatch.other_user.photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden">
                {activeMatch.other_user.photos.map((p, idx) => (
                  <div key={idx} className="aspect-[4/3] rounded-xl overflow-hidden border border-[#E6E3DE]">
                    <img src={p.url} alt="Photo" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Bio */}
            {activeMatch.other_user.bio && (
              <div>
                <h4 className="label-caps text-[#7A7D87] mb-1">About</h4>
                <p className="text-sm text-[#2B2D42] font-medium leading-relaxed">
                  "{activeMatch.other_user.bio}"
                </p>
              </div>
            )}

            {/* Living Habits */}
            <div>
              <h4 className="label-caps text-[#7A7D87] mb-2">Living Habits</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#FAF8F4] p-3 rounded-xl border border-[#E6E3DE]">
                  <span className="text-[#7A7D87] block">Food</span>
                  <span className="font-bold text-[#2B2D42]">{activeMatch.other_user.food_preference}</span>
                </div>
                <div className="bg-[#FAF8F4] p-3 rounded-xl border border-[#E6E3DE]">
                  <span className="text-[#7A7D87] block">Cleanliness</span>
                  <span className="font-bold text-[#2B2D42]">{activeMatch.other_user.cleanliness} Standard</span>
                </div>
                <div className="bg-[#FAF8F4] p-3 rounded-xl border border-[#E6E3DE]">
                  <span className="text-[#7A7D87] block">Sleep Schedule</span>
                  <span className="font-bold text-[#2B2D42]">{activeMatch.other_user.sleep_schedule}</span>
                </div>
                <div className="bg-[#FAF8F4] p-3 rounded-xl border border-[#E6E3DE]">
                  <span className="text-[#7A7D87] block">Budget</span>
                  <span className="font-bold text-[#E07A5F]">₹{activeMatch.other_user.rent_min} - ₹{activeMatch.other_user.rent_max}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setIsProfileModalOpen(false);
                setIsReportModalOpen(true);
              }}
              className="w-full py-3 rounded-xl bg-[#E07A5F] text-white font-bold text-xs hover:bg-[#D4694E]"
            >
              View Compatibility Report ({activeMatch.match_score}%)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
