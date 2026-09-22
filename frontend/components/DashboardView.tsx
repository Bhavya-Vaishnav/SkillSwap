'use client';

import React from 'react';
import {
  Coins,
  BookOpen,
  Compass,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  Video,
  User,
  CheckCircle2,
} from 'lucide-react';
import {
  SessionResponse,
  UserSkillResponse,
  UserSkillRole,
} from '@/lib/apiClient';

interface DashboardViewProps {
  walletBalance: number;
  sessions: SessionResponse[];
  userSkills?: UserSkillResponse[];
  currentUserId?: string;
  currentUserDisplayName?: string;
  onNavigate: (tab: string) => void;
  onJoinMeeting?: (session: SessionResponse) => void;
  onAcceptSession: (sessionId: string, meetingLink: string) => Promise<void>;
  onDeclineSession: (sessionId: string) => Promise<void>;
  onCompleteSession: (sessionId: string) => Promise<void>;
  onOpenAddSkill: () => void;
  onOpenBioScan?: () => void;
  onFindPeersForSkill?: (skillName: string, role: UserSkillRole) => void;
}

export function DashboardView({
  walletBalance,
  sessions,
  userSkills = [],
  currentUserId,
  currentUserDisplayName,
  onNavigate,
  onJoinMeeting,
  onAcceptSession,
  onDeclineSession,
  onCompleteSession,
  onOpenAddSkill,
  onOpenBioScan,
  onFindPeersForSkill,
}: DashboardViewProps) {
  const offeredSkills = userSkills.filter((s) => s.role === 'OFFERED');
  const wantedSkills = userSkills.filter((s) => s.role === 'WANTED');
  const offeredCount = offeredSkills.length;
  const wantedCount = wantedSkills.length;

  const upcomingSessions = sessions.filter(
    (s) => s.status === 'ACCEPTED' || s.status === 'REQUESTED'
  );
  const activeSessionsCount = upcomingSessions.length;

  return (
    <div className="space-y-6 sm:space-y-8 pb-8 sm:pb-12">
      {/* Welcome Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5 sm:pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
            {currentUserDisplayName ? `Welcome back, ${currentUserDisplayName}` : 'Welcome to SkillSwap'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Peer-to-peer engineering skill exchange with AI semantic matching and verified ledger settlements.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onOpenBioScan && (
            <button
              type="button"
              onClick={onOpenBioScan}
              className="btn-secondary flex-1 sm:flex-initial"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI Skill Scan</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate('discover')}
            className="btn-primary flex-1 sm:flex-initial"
          >
            <span>Find Matches</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Credits Card */}
        <div className="card-base-hover p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider truncate">
              Ledger Balance
            </span>
            <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
              {walletBalance} <span className="text-xs font-normal text-neutral-400 font-sans">credits</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-neutral-400 mt-1 truncate">
              Available for session escrow
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('credits')}
            className="mt-3 text-[11px] sm:text-xs text-neutral-400 hover:text-emerald-400 flex items-center gap-1 transition-colors min-h-[32px] cursor-pointer"
          >
            <span>View Ledger Details</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Skills Offered Card */}
        <div className="card-base-hover p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider truncate">
              Skills I Offer
            </span>
            <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
              {offeredCount}
            </div>
            <div className="text-[10px] sm:text-[11px] text-neutral-400 mt-1 truncate">
              {offeredSkills.slice(0, 3).map((s) => s.skillName).join(', ') || 'No skills offered yet'}
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAddSkill}
            className="mt-3 text-[11px] sm:text-xs text-neutral-400 hover:text-emerald-400 flex items-center gap-1 transition-colors min-h-[32px] cursor-pointer"
          >
            <span>Manage Skills</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Skills Wanted Card */}
        <div className="card-base-hover p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider truncate">
              Skills I Want
            </span>
            <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
              {wantedCount}
            </div>
            <div className="text-[10px] sm:text-[11px] text-neutral-400 mt-1 truncate">
              {wantedSkills.slice(0, 3).map((s) => s.skillName).join(', ') || 'No skills wanted yet'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('discover')}
            className="mt-3 text-[11px] sm:text-xs text-neutral-400 hover:text-cyan-400 flex items-center gap-1 transition-colors min-h-[32px] cursor-pointer"
          >
            <span>Search Teachers</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Active Sessions Card */}
        <div className="card-base-hover p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider truncate">
              Active Sessions
            </span>
            <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
              {activeSessionsCount}
            </div>
            <div className="text-[10px] sm:text-[11px] text-neutral-400 mt-1 truncate">
              {sessions.filter((s) => s.status === 'REQUESTED').length} pending acceptance
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('sessions')}
            className="mt-3 text-[11px] sm:text-xs text-neutral-400 hover:text-amber-400 flex items-center gap-1 transition-colors min-h-[32px] cursor-pointer"
          >
            <span>View Sessions</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Grid: My Skills Summary + Upcoming Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Profile Skills Summary */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white tracking-tight">
                My Skills Profile
              </h2>
              <span className="badge-emerald text-[10px]">
                Active
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('my-skills')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
            >
              Manage all →
            </button>
          </div>

          <div className="card-base p-5 space-y-4">
            <div>
              <span className="text-xs font-semibold text-emerald-400 block mb-2">
                Offered Skills (Teaching)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {offeredSkills.length === 0 ? (
                  <span className="text-xs text-neutral-500">No offered skills configured.</span>
                ) : (
                  offeredSkills.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onFindPeersForSkill && onFindPeersForSkill(s.skillName, 'WANTED')}
                      title="Click to find peers wanting to learn this skill"
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 hover:border-emerald-500/50 transition-colors text-left cursor-pointer"
                    >
                      {s.skillName} {s.proficiency ? `(${s.proficiency.toLowerCase()})` : ''}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800/80">
              <span className="text-xs font-semibold text-cyan-400 block mb-2">
                Wanted Skills (Learning)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {wantedSkills.length === 0 ? (
                  <span className="text-xs text-neutral-500">No learning targets added.</span>
                ) : (
                  wantedSkills.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onFindPeersForSkill && onFindPeersForSkill(s.skillName, 'OFFERED')}
                      title="Click to find peers offering to teach this skill"
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/25 hover:border-cyan-500/50 transition-colors text-left cursor-pointer"
                    >
                      {s.skillName}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigate('discover')}
                className="btn-primary w-full text-xs"
              >
                <span>Find Matched Peers in Discover</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Upcoming / Active Sessions */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white tracking-tight">
              Upcoming Sessions
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('sessions')}
              className="text-xs text-neutral-400 hover:text-white cursor-pointer"
            >
              See all ({sessions.length})
            </button>
          </div>

          <div className="space-y-3">
            {upcomingSessions.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-neutral-900/40 border border-dashed border-neutral-800">
                <Calendar className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <p className="text-xs text-neutral-400">No active or pending sessions.</p>
                <button
                  type="button"
                  onClick={() => onNavigate('discover')}
                  className="mt-3 text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                >
                  Find peers on Discover →
                </button>
              </div>
            ) : (
              upcomingSessions.slice(0, 3).map((session) => {
                const isProvider = currentUserId
                  ? session.providerId.toLowerCase() === currentUserId.toLowerCase()
                  : false;
                const isRequester = currentUserId
                  ? session.requesterId.toLowerCase() === currentUserId.toLowerCase()
                  : false;

                return (
                  <div
                    key={session.id}
                    className="card-base p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-neutral-500">
                            ID: {session.id.substring(0, 8)}...
                          </span>
                          <span
                            className={
                              session.status === 'ACCEPTED'
                                ? 'badge-emerald text-[10px]'
                                : 'badge-amber text-[10px]'
                            }
                          >
                            {session.status}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 mt-1.5">
                          Provider:{' '}
                          <strong className="text-white">
                            {session.providerName || session.providerId.substring(0, 8)}
                          </strong>
                          {isProvider && (
                            <span className="ml-1.5 badge-cyan text-[9px] py-0">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Requester:{' '}
                          <strong className="text-neutral-200">
                            {session.requesterName || session.requesterId.substring(0, 8)}
                          </strong>
                          {isRequester && (
                            <span className="ml-1.5 badge-emerald text-[9px] py-0">
                              You
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-emerald-400 font-mono">
                          {session.creditAmount} cr
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2.5 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2">
                      {session.status === 'REQUESTED' ? (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {isProvider ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onAcceptSession(session.id, 'https://meet.google.com/new')}
                                className="btn-primary text-xs py-1.5 px-3 min-h-[36px]"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeclineSession(session.id)}
                                className="btn-ghost text-xs py-1.5 px-3 hover:text-red-400"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-amber-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Waiting for provider acceptance</span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {session.meetingLink && onJoinMeeting && (
                            <button
                              type="button"
                              onClick={() => onJoinMeeting(session)}
                              className="btn-secondary text-xs py-1.5 px-3 min-h-[36px]"
                            >
                              <Video className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Meeting Link</span>
                            </button>
                          )}
                          {isRequester ? (
                            <button
                              type="button"
                              onClick={() => onCompleteSession(session.id)}
                              className="btn-primary text-xs py-1.5 px-3 min-h-[36px]"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Complete & Pay</span>
                            </button>
                          ) : isProvider ? (
                            <span className="text-xs text-emerald-400 italic">
                              Accepted & Active
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
