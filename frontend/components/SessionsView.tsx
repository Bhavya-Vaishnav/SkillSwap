'use client';

import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Video,
  Plus,
  AlertTriangle,
  Ban,
  User,
  ExternalLink,
  Clock,
  ArrowUpDown,
} from 'lucide-react';
import { SessionResponse, SessionStatus } from '@/lib/apiClient';

export type SessionSortOption =
  | 'ACTION_REQUIRED'
  | 'NEWEST_FIRST'
  | 'RECENTLY_UPDATED'
  | 'CREDITS_HIGH'
  | 'CREDITS_LOW';

function formatSessionDate(isoString?: string | null): string | null {
  if (!isoString) return null;
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return null;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface SessionsViewProps {
  sessions: SessionResponse[];
  currentUserId?: string;
  onJoinVideoRoom: (session: SessionResponse) => void;
  onAcceptSession: (sessionId: string, meetingLink: string) => Promise<void>;
  onRejectSession: (sessionId: string) => Promise<void>;
  onCancelSession: (sessionId: string) => Promise<void>;
  onDisputeSession: (sessionId: string) => Promise<void>;
  onCompleteSession: (sessionId: string) => Promise<void>;
  onNavigate: (tab: string) => void;
}

export function SessionsView({
  sessions,
  currentUserId,
  onJoinVideoRoom,
  onAcceptSession,
  onRejectSession,
  onCancelSession,
  onDisputeSession,
  onCompleteSession,
  onNavigate,
}: SessionsViewProps) {
  const [filter, setFilter] = useState<'ALL' | SessionStatus>('ALL');
  const [sortOption, setSortOption] = useState<SessionSortOption>('ACTION_REQUIRED');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [customMeetingLink, setCustomMeetingLink] = useState('https://meet.google.com/new');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const sortedSessions = React.useMemo(() => {
    const parseTime = (iso?: string | null): number => {
      if (!iso) return 0;
      const t = new Date(iso).getTime();
      return isNaN(t) ? 0 : t;
    };

    const tieBreak = (a: SessionResponse, b: SessionResponse): number => {
      const timeA = parseTime(a.createdAt);
      const timeB = parseTime(b.createdAt);
      if (timeB !== timeA) {
        return timeB - timeA; // createdAt DESC
      }
      return b.id.localeCompare(a.id); // sessionId DESC
    };

    const statusWeight: Record<SessionStatus, number> = {
      REQUESTED: 5,
      ACCEPTED: 4,
      DISPUTED: 3,
      COMPLETED: 1,
      CANCELLED: 0,
      REJECTED: 0,
    };

    return [...sessions].sort((a, b) => {
      switch (sortOption) {
        case 'ACTION_REQUIRED': {
          const diff = (statusWeight[b.status] ?? 0) - (statusWeight[a.status] ?? 0);
          if (diff !== 0) return diff;
          return tieBreak(a, b);
        }
        case 'NEWEST_FIRST': {
          return tieBreak(a, b);
        }
        case 'RECENTLY_UPDATED': {
          const timeA = parseTime(a.updatedAt || a.createdAt);
          const timeB = parseTime(b.updatedAt || b.createdAt);
          if (timeB !== timeA) {
            return timeB - timeA; // updatedAt DESC
          }
          return tieBreak(a, b);
        }
        case 'CREDITS_HIGH': {
          const creditsA = typeof a.creditAmount === 'number' ? a.creditAmount : Number(a.creditAmount) || 0;
          const creditsB = typeof b.creditAmount === 'number' ? b.creditAmount : Number(b.creditAmount) || 0;
          const diff = creditsB - creditsA;
          if (diff !== 0) return diff;
          return tieBreak(a, b);
        }
        case 'CREDITS_LOW': {
          const creditsA = typeof a.creditAmount === 'number' ? a.creditAmount : Number(a.creditAmount) || 0;
          const creditsB = typeof b.creditAmount === 'number' ? b.creditAmount : Number(b.creditAmount) || 0;
          const diff = creditsA - creditsB;
          if (diff !== 0) return diff;
          return tieBreak(a, b);
        }
        default:
          return tieBreak(a, b);
      }
    });
  }, [sessions, sortOption]);

  const filteredSessions = React.useMemo(() => {
    return sortedSessions.filter((s) => {
      if (filter === 'ALL') return true;
      return s.status === filter;
    });
  }, [sortedSessions, filter]);

  const getStatusBadge = (status: SessionStatus) => {
    switch (status) {
      case 'REQUESTED':
        return 'badge-amber';
      case 'ACCEPTED':
        return 'badge-emerald';
      case 'COMPLETED':
        return 'badge-neutral';
      case 'DISPUTED':
        return 'badge-purple';
      case 'REJECTED':
      case 'CANCELLED':
        return 'badge-rose';
      default:
        return 'badge-neutral';
    }
  };

  const requestedCount = sessions.filter((s) => s.status === 'REQUESTED').length;
  const acceptedCount = sessions.filter((s) => s.status === 'ACCEPTED').length;
  const completedCount = sessions.filter((s) => s.status === 'COMPLETED').length;

  const handleAcceptSubmit = async (sessionId: string) => {
    setActionLoading(sessionId);
    try {
      await onAcceptSession(sessionId, customMeetingLink.trim() || 'https://meet.google.com/new');
      setAcceptingId(null);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5 sm:pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            My Sessions
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Track and manage your incoming requests, accepted sessions, and completed exchanges.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('discover')}
          className="btn-primary w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Find Peers to Exchange</span>
        </button>
      </div>

      {/* State Machine Overview Bar */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setFilter('REQUESTED')}
          className={`card-base p-3 sm:p-4 text-left transition-all cursor-pointer ${
            filter === 'REQUESTED'
              ? 'border-amber-500/50 bg-amber-950/20'
              : 'hover:border-neutral-700'
          }`}
        >
          <div className="text-[10px] sm:text-[11px] font-medium text-neutral-400 uppercase tracking-wider truncate">
            1. Requested
          </div>
          <div className="text-lg sm:text-2xl font-bold text-amber-400 font-mono mt-0.5">
            {requestedCount}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilter('ACCEPTED')}
          className={`card-base p-3 sm:p-4 text-left transition-all cursor-pointer ${
            filter === 'ACCEPTED'
              ? 'border-emerald-500/50 bg-emerald-950/20'
              : 'hover:border-neutral-700'
          }`}
        >
          <div className="text-[10px] sm:text-[11px] font-medium text-neutral-400 uppercase tracking-wider truncate">
            2. Accepted
          </div>
          <div className="text-lg sm:text-2xl font-bold text-emerald-400 font-mono mt-0.5">
            {acceptedCount}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilter('COMPLETED')}
          className={`card-base p-3 sm:p-4 text-left transition-all cursor-pointer ${
            filter === 'COMPLETED'
              ? 'border-neutral-600 bg-neutral-800/40'
              : 'hover:border-neutral-700'
          }`}
        >
          <div className="text-[10px] sm:text-[11px] font-medium text-neutral-400 uppercase tracking-wider truncate">
            3. Completed
          </div>
          <div className="text-lg sm:text-2xl font-bold text-neutral-200 font-mono mt-0.5">
            {completedCount}
          </div>
        </button>
      </div>

      {/* Filter Tabs & Sort Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {(['ALL', 'REQUESTED', 'ACCEPTED', 'COMPLETED', 'DISPUTED', 'CANCELLED', 'REJECTED'] as const).map(
            (tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 min-h-[34px] cursor-pointer ${
                  filter === tab
                    ? 'bg-neutral-800 text-white font-semibold'
                    : 'text-neutral-400 hover:text-white bg-neutral-900/40'
                }`}
              >
                {tab === 'ALL' ? 'All Sessions' : tab}
              </button>
            )
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <label htmlFor="session-sort" className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
            <span>Sort:</span>
          </label>
          <select
            id="session-sort"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SessionSortOption)}
            className="input-base text-xs py-1.5 px-3 bg-neutral-900 border-neutral-700 text-neutral-200 rounded-lg cursor-pointer focus:border-emerald-500"
          >
            <option value="ACTION_REQUIRED">Action Required First</option>
            <option value="NEWEST_FIRST">Newest Created First</option>
            <option value="RECENTLY_UPDATED">Recently Updated</option>
            <option value="CREDITS_HIGH">Credits: High to Low</option>
            <option value="CREDITS_LOW">Credits: Low to High</option>
          </select>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-3.5 sm:space-y-4">
        {filteredSessions.length === 0 ? (
          <div className="card-base p-10 sm:p-12 text-center border-dashed space-y-3">
            <Calendar className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-sm text-neutral-400">
              No sessions found with status &quot;{filter}&quot;.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('discover')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center cursor-pointer"
            >
              Browse skill matches in Discover →
            </button>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isRequester = currentUserId
              ? session.requesterId.toLowerCase() === currentUserId.toLowerCase()
              : false;
            const isProvider = currentUserId
              ? session.providerId.toLowerCase() === currentUserId.toLowerCase()
              : false;
            const sessionDate = formatSessionDate(session.createdAt);

            return (
              <div
                key={session.id}
                className="card-base-hover p-4 sm:p-5 space-y-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-neutral-500">
                          ID: {session.id.substring(0, 8)}...
                        </span>
                        <span className={getStatusBadge(session.status)}>
                          {session.status}
                        </span>
                        {sessionDate && (
                          <span
                            title={session.createdAt ? new Date(session.createdAt).toLocaleString() : undefined}
                            className="inline-flex items-center gap-1 text-[11px] text-neutral-400 font-medium"
                          >
                            <Clock className="w-3 h-3 text-neutral-500 shrink-0" />
                            <span>{sessionDate}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-300 mt-1 truncate">
                        Provider:{' '}
                        <strong className="text-white">
                          {session.providerName || session.providerId.substring(0, 8)}
                        </strong>
                        {session.providerEmail && (
                          <span className="text-neutral-500 ml-1">({session.providerEmail})</span>
                        )}
                        {isProvider && (
                          <span className="ml-1.5 badge-cyan text-[9px] py-0">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-neutral-400 truncate">
                        Requester:{' '}
                        <strong className="text-neutral-200">
                          {session.requesterName || session.requesterId.substring(0, 8)}
                        </strong>
                        {session.requesterEmail && (
                          <span className="text-neutral-500 ml-1">({session.requesterEmail})</span>
                        )}
                        {isRequester && (
                          <span className="ml-1.5 badge-emerald text-[9px] py-0">
                            You
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-1 sm:pt-0 border-t sm:border-t-0 border-neutral-800/40">
                    <div className="text-right shrink-0">
                      <div className="text-base font-bold text-emerald-400 font-mono">
                        {session.creditAmount} credits
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        Skill: {session.skillId.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meeting link display if available */}
                {session.meetingLink && (
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <Video className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-neutral-400">Meeting:</span>
                      <a
                        href={session.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:underline font-mono truncate"
                      >
                        {session.meetingLink}
                      </a>
                    </div>
                    <a
                      href={session.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors"
                    >
                      <span>Join</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* In-row accept meeting link form */}
                {acceptingId === session.id && (
                  <div className="p-3.5 rounded-xl bg-neutral-950 border border-emerald-500/30 space-y-3 animate-in fade-in duration-150">
                    <label className="block text-xs font-medium text-neutral-300">
                      Provide Google Meet or video link:
                    </label>
                    <input
                      type="url"
                      required
                      value={customMeetingLink}
                      onChange={(e) => setCustomMeetingLink(e.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="input-base font-mono"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setAcceptingId(null)}
                        className="btn-secondary text-xs py-1.5 px-3 min-h-[34px]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading === session.id}
                        onClick={() => handleAcceptSubmit(session.id)}
                        className="btn-primary text-xs py-1.5 px-3.5 min-h-[34px]"
                      >
                        {actionLoading === session.id ? 'Confirming...' : 'Confirm Acceptance'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions per role and status */}
                <div className="pt-3 border-t border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="text-neutral-500 font-mono text-[11px]">
                    Role: {isProvider ? 'Provider (Teacher)' : isRequester ? 'Requester (Learner)' : 'Participant'}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* REQUESTED STATUS */}
                    {session.status === 'REQUESTED' && (
                      <>
                        {isProvider ? (
                          <>
                            <button
                              type="button"
                              disabled={actionLoading === session.id}
                              onClick={() => setAcceptingId(session.id)}
                              className="btn-primary text-xs py-1.5 px-3.5 min-h-[34px]"
                            >
                              Accept Request
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading === session.id}
                              onClick={async () => {
                                setActionLoading(session.id);
                                try {
                                  await onRejectSession(session.id);
                                } finally {
                                  setActionLoading(null);
                                }
                              }}
                              className="btn-ghost text-xs hover:text-red-400 py-1.5 px-3 min-h-[34px]"
                            >
                              Reject
                            </button>
                          </>
                        ) : (isRequester || !isProvider) ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-amber-400 text-xs flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Waiting for provider acceptance</span>
                            </span>
                            <button
                              type="button"
                              disabled={actionLoading === session.id}
                              onClick={async () => {
                                setActionLoading(session.id);
                                try {
                                  await onCancelSession(session.id);
                                } finally {
                                  setActionLoading(null);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-medium text-red-300 bg-red-950/40 border border-red-500/30 hover:bg-red-900/50 hover:text-white transition-colors cursor-pointer min-h-[34px]"
                            >
                              <Ban className="w-3.5 h-3.5 text-red-400" />
                              <span>Cancel Request</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-neutral-500 text-xs">Awaiting provider response</span>
                        )}
                      </>
                    )}

                    {/* ACCEPTED STATUS */}
                    {session.status === 'ACCEPTED' && (
                      <>
                        {session.meetingLink && (
                          <button
                            type="button"
                            onClick={() => onJoinVideoRoom(session)}
                            className="btn-secondary text-xs py-1.5 px-3 min-h-[34px]"
                          >
                            <Video className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Meeting Details</span>
                          </button>
                        )}

                        {isRequester ? (
                          <button
                            type="button"
                            disabled={actionLoading === session.id}
                            onClick={async () => {
                              setActionLoading(session.id);
                              try {
                                await onCompleteSession(session.id);
                              } finally {
                                setActionLoading(null);
                              }
                            }}
                            className="btn-primary text-xs py-1.5 px-3.5 min-h-[34px]"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Complete & Pay</span>
                          </button>
                        ) : isProvider ? (
                          <span className="text-emerald-400/90 text-xs italic py-1">
                            Accepted & Active (Learner confirms completion)
                          </span>
                        ) : null}

                        {(isRequester || isProvider) && (
                          <>
                            <button
                              type="button"
                              disabled={actionLoading === session.id}
                              onClick={async () => {
                                setActionLoading(session.id);
                                try {
                                  await onDisputeSession(session.id);
                                } finally {
                                  setActionLoading(null);
                                }
                              }}
                              className="btn-ghost text-xs text-purple-400 hover:text-purple-300 py-1.5 px-3 min-h-[34px]"
                            >
                              Dispute
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading === session.id}
                              onClick={async () => {
                                setActionLoading(session.id);
                                try {
                                  await onCancelSession(session.id);
                                } finally {
                                  setActionLoading(null);
                                }
                              }}
                              className="btn-ghost text-xs text-red-400 hover:text-red-300 py-1.5 px-3 min-h-[34px]"
                            >
                              Cancel Session
                            </button>
                          </>
                        )}
                      </>
                    )}

                    {/* COMPLETED STATUS */}
                    {session.status === 'COMPLETED' && (
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs py-1">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Completed & Credits Settled</span>
                      </div>
                    )}

                    {/* DISPUTED STATUS */}
                    {session.status === 'DISPUTED' && (
                      <div className="flex items-center gap-1.5 text-purple-400 text-xs py-1">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Session Disputed</span>
                      </div>
                    )}

                    {/* CANCELLED STATUS */}
                    {session.status === 'CANCELLED' && (
                      <div className="flex items-center gap-1.5 text-neutral-500 text-xs py-1">
                        <Ban className="w-4 h-4 shrink-0" />
                        <span>Cancelled</span>
                      </div>
                    )}

                    {/* REJECTED STATUS */}
                    {session.status === 'REJECTED' && (
                      <span className="text-neutral-500 text-xs py-1">Request Declined</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
