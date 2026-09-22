'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LandingView } from '@/components/LandingView';
import { DashboardView } from '@/components/DashboardView';
import { DiscoverView } from '@/components/DiscoverView';
import { PeerProfileView, PeerDetail } from '@/components/PeerProfileView';
import { MySkillsView } from '@/components/MySkillsView';
import { SessionsView } from '@/components/SessionsView';
import { CreditsView } from '@/components/CreditsView';
import { SkillExtractionModal } from '@/components/SkillExtractionModal';
import { VideoRoomModal } from '@/components/VideoRoomModal';
import { AuthModal } from '@/components/AuthModal';
import {
  apiClient,
  AuthUser,
  SessionResponse,
  UserSkillResponse,
  UserSkillRequest,
  ParsedBioResult,
  UserSkillRole,
  ProficiencyLevel,
} from '@/lib/apiClient';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAiScanOpen, setIsAiScanOpen] = useState(false);
  const [activeMeetingSession, setActiveMeetingSession] = useState<SessionResponse | null>(null);
  const [selectedPeer, setSelectedPeer] = useState<PeerDetail | null>(null);

  // App Central State
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkillResponse[]>([]);

  // Toast Notification State
  const [toast, setToast] = useState<{
    id: number;
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToast({ id, text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 4000);
  }, []);

  // Strict in-flight guard and timestamp throttle
  const isPollingRef = useRef(false);
  const lastFetchedRef = useRef(0);

  // Fetch real data from backend with caching & overlap protection
  const loadData = useCallback(async (force = false) => {
    if (!apiClient.isAuthenticated()) {
      setWalletBalance(0);
      setSessions([]);
      setUserSkills([]);
      return;
    }

    if (isPollingRef.current) return;
    isPollingRef.current = true;

    try {
      const [balanceRes, sessionsRes, skillsRes] = await Promise.allSettled([
        apiClient.ledger.getBalance(force),
        apiClient.sessions.getMySessions(force),
        apiClient.userSkills.getMySkills(force),
      ]);
      lastFetchedRef.current = Date.now();

      if (balanceRes.status === 'fulfilled' && balanceRes.value) {
        const newBal = balanceRes.value.balance;
        setWalletBalance((prev) => (prev === newBal ? prev : newBal));
      }
      if (sessionsRes.status === 'fulfilled' && sessionsRes.value) {
        const newSessions = sessionsRes.value;
        setSessions((prev) => {
          if (prev.length !== newSessions.length) return newSessions;
          const isSame = prev.every((s, i) => {
            const n = newSessions[i];
            return (
              s.id === n.id &&
              s.status === n.status &&
              s.meetingLink === n.meetingLink &&
              s.creditAmount === n.creditAmount
            );
          });
          return isSame ? prev : newSessions;
        });
      }
      if (skillsRes.status === 'fulfilled' && skillsRes.value) {
        const newSkills = skillsRes.value;
        setUserSkills((prev) => {
          if (prev.length !== newSkills.length) return newSkills;
          const isSame = prev.every((s, i) => {
            const n = newSkills[i];
            return (
              s.id === n.id &&
              s.role === n.role &&
              s.proficiency === n.proficiency &&
              s.skillName === n.skillName
            );
          });
          return isSame ? prev : newSkills;
        });
      }
    } catch {
      // Ignore background load errors
    } finally {
      isPollingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const user = apiClient.getCurrentUser();
    setCurrentUser(user);
    if (user) {
      setActiveTab('dashboard');
    }
    setIsAuthReady(true);
    const unsubscribe = apiClient.subscribeAuth((updatedUser) => {
      setCurrentUser(updatedUser);
      if (updatedUser) {
        setActiveTab('dashboard');
      } else {
        setActiveTab('landing');
      }
      loadData(true);
    });
    loadData(false);

    // Optimized background polling: every 30s (not 6s), strictly guarded against overlap
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (apiClient.isAuthenticated() && !isPollingRef.current) {
        loadData(false);
      }
    }, 30000);

    // Throttle focus and visibility events so we don't spam calls when switching windows
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden && apiClient.isAuthenticated()) {
        if (Date.now() - lastFetchedRef.current > 15000) {
          loadData(false);
        }
      }
    };
    const handleFocus = () => {
      if (apiClient.isAuthenticated()) {
        if (Date.now() - lastFetchedRef.current > 15000) {
          loadData(false);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribe();
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadData]);

  // Discovery pre-filter state
  const [discoverInitialSkill, setDiscoverInitialSkill] = useState<string | undefined>(undefined);
  const [discoverInitialRole, setDiscoverInitialRole] = useState<UserSkillRole | undefined>(undefined);

  const handleNavigate = (tab: string) => {
    if (!currentUser && tab !== 'landing') {
      setIsAuthOpen(true);
      return;
    }
    setActiveTab(tab);
    setSelectedPeer(null);
    if (tab !== 'discover') {
      setDiscoverInitialSkill(undefined);
      setDiscoverInitialRole(undefined);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFindPeersForSkill = (skillName: string, role: UserSkillRole = 'OFFERED') => {
    setDiscoverInitialSkill(skillName);
    setDiscoverInitialRole(role);
    setSelectedPeer(null);
    setActiveTab('discover');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPeerProfile = (peer: PeerDetail) => {
    setSelectedPeer(peer);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenMeeting = (session: SessionResponse) => {
    setActiveMeetingSession(session);
  };

  // Session State Transitions
  const handleAcceptSession = async (sessionId: string, meetingLink: string) => {
    try {
      const updated = await apiClient.sessions.acceptSession(sessionId, { meetingLink });
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
      showToast('Session accepted! Google Meet link attached.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to accept session';
      showToast(msg, 'error');
    }
  };

  const handleRejectSession = async (sessionId: string) => {
    try {
      const updated = await apiClient.sessions.rejectSession(sessionId);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
      showToast('Session request declined.', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reject session';
      showToast(msg, 'error');
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    try {
      const updated = await apiClient.sessions.cancelSession(sessionId);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
      showToast('Session cancelled.', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel session';
      showToast(msg, 'error');
    }
  };

  const handleDisputeSession = async (sessionId: string) => {
    try {
      const updated = await apiClient.sessions.disputeSession(sessionId);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
      showToast('Session marked as disputed.', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to dispute session';
      showToast(msg, 'error');
    }
  };

  const handleCompleteSession = async (sessionId: string) => {
    try {
      const updated = await apiClient.sessions.completeSession(sessionId);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
      if (activeMeetingSession?.id === sessionId) {
        setActiveMeetingSession(null);
      }
      showToast('Session completed! Credits successfully transferred.');
      // Refresh ledger balance
      const balanceRes = await apiClient.ledger.getBalance();
      if (balanceRes) setWalletBalance(balanceRes.balance);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to complete session';
      showToast(msg, 'error');
    }
  };

  // Add User Skill
  const handleAddSkill = async (skill: UserSkillRequest) => {
    if (!apiClient.isAuthenticated()) {
      setIsAuthOpen(true);
      return;
    }
    const cleanName = skill.skillName.trim();
    const lowerName = cleanName.toLowerCase();
    const alreadyExists = userSkills.some(
      (s) => s.skillName.toLowerCase() === lowerName && s.role === skill.role
    );
    if (alreadyExists) {
      showToast(
        `Skill "${cleanName}" is already in your ${skill.role === 'OFFERED' ? 'offered' : 'wanted'} skills.`,
        'error'
      );
      return;
    }

    const oppositeRoleExists = userSkills.some(
      (s) => s.skillName.toLowerCase() === lowerName && s.role !== skill.role
    );
    if (oppositeRoleExists) {
      showToast(
        skill.role === 'OFFERED'
          ? `Skill "${cleanName}" is already in your Wanted Skills (to learn). You cannot teach a skill you want to learn.`
          : `Skill "${cleanName}" is already in your Offered Skills (to teach). You cannot add a skill you teach to your wanted skills.`,
        'error'
      );
      return;
    }

    try {
      const saved = await apiClient.userSkills.addSkill({
        ...skill,
        skillName: cleanName,
      });
      setUserSkills((prev) => [...prev, saved]);
      showToast(`Skill "${cleanName}" saved to your profile.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add skill';
      showToast(msg, 'error');
    }
  };

  // Update User Skill Proficiency
  const handleUpdateSkillProficiency = async (id: string, proficiency: ProficiencyLevel) => {
    if (!apiClient.isAuthenticated()) {
      setIsAuthOpen(true);
      return;
    }
    try {
      const updated = await apiClient.userSkills.updateProficiency(id, proficiency);
      setUserSkills((prev) => prev.map((s) => (s.id === id ? updated : s)));
      showToast(`Proficiency updated to ${proficiency.toLowerCase()}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update proficiency';
      showToast(msg, 'error');
      throw err;
    }
  };

  // Delete User Skill
  const handleDeleteUserSkill = async (id: string, skillName: string) => {
    if (!apiClient.isAuthenticated()) {
      setIsAuthOpen(true);
      return;
    }
    try {
      await apiClient.userSkills.deleteSkill(id);
      setUserSkills((prev) => prev.filter((s) => s.id !== id));
      showToast(`"${skillName}" removed from your skills.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove skill';
      showToast(msg, 'error');
      throw err;
    }
  };

  // Spring AI Skill Scan Callback
  const handleSaveExtractedSkills = async (confirmed: ParsedBioResult, bioText: string) => {
    if (!apiClient.isAuthenticated()) {
      setIsAuthOpen(true);
      return;
    }
    try {
      // Deduplicate extracted skills against existing profile skills to avoid unique constraint error
      const newOffered = (confirmed.offered || []).filter(
        (o) =>
          !userSkills.some(
            (s) => s.skillName.toLowerCase() === o.name.trim().toLowerCase()
          )
      );
      const newWanted = (confirmed.wanted || []).filter(
        (w) =>
          !userSkills.some(
            (s) => s.skillName.toLowerCase() === w.trim().toLowerCase()
          ) &&
          !newOffered.some(
            (o) => o.name.trim().toLowerCase() === w.trim().toLowerCase()
          )
      );

      let savedSkills: UserSkillResponse[] = [];
      if (newOffered.length > 0 || newWanted.length > 0) {
        // 1. Confirm new skills in backend
        savedSkills = await apiClient.userSkills.confirmBio({
          offered: newOffered,
          wanted: newWanted,
        });
        setUserSkills((prev) => [...prev, ...savedSkills]);
      }

      // 2. Update bio & re-index pgvector
      await apiClient.user.updateBio(bioText);

      const count = savedSkills.length;
      if (count > 0) {
        showToast(`Saved ${count} new skill${count > 1 ? 's' : ''} and updated bio vector index!`);
      } else {
        showToast('Bio updated and re-indexed. Existing skills retained.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save extracted skills';
      showToast(msg, 'error');
    }
  };

  // Request session proposal
  const handleSubmitExchangeRequest = async (req: {
    providerId: string;
    skillId: string;
    creditAmount: number;
  }) => {
    if (!apiClient.isAuthenticated()) {
      setIsAuthOpen(true);
      return;
    }
    try {
      const newSession = await apiClient.sessions.requestSession(req);
      setSessions((prev) => [newSession, ...prev]);
      showToast('Session request successfully proposed to peer!');
      // Refresh wallet balance for escrow deduction
      apiClient.ledger.getBalance(true).then((b) => {
        if (b) setWalletBalance(b.balance);
      }).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to request session';
      showToast(msg, 'error');
    }
  };

  const handleLogout = () => {
    apiClient.auth.logout();
    setActiveTab('landing');
    setSelectedPeer(null);
    showToast('Signed out successfully.', 'info');
  };

  const pendingCount = sessions.filter((s) => s.status === 'REQUESTED').length;

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-200">
          <div className="relative flex items-center justify-center">
            {/* Ambient emerald glow */}
            <div className="absolute w-20 h-20 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
            {/* Official SkillSwap Logo */}
            <div className="relative w-14 h-14 rounded-2xl bg-neutral-900 border border-emerald-500/40 flex items-center justify-center p-2.5 shadow-2xl shadow-emerald-500/10">
              <img src="/logo.png" alt="SkillSwap" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-sm font-bold text-white tracking-tight">SkillSwap</span>
            <span className="text-[11px] text-neutral-400 font-medium">Loading your peer workspace...</span>
          </div>

          {/* Sleek animated progress line */}
          <div className="w-36 h-1 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800 mt-1">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full animate-pulse" style={{ width: '70%' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-neutral-950">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-24 lg:bottom-6 left-3 right-3 sm:left-auto sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl text-xs font-medium max-w-md mx-auto sm:mx-0 ${
              toast.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200 shadow-emerald-950/50'
                : toast.type === 'error'
                ? 'bg-red-950/95 border-red-500/40 text-red-200 shadow-red-950/50'
                : 'bg-neutral-900/95 border-neutral-800 text-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              )}
              <span className="leading-snug">{toast.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-neutral-400 hover:text-white ml-2 p-1 -mr-1 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Top Navigation */}
      <Navbar
        activeTab={activeTab}
        walletBalance={walletBalance}
        pendingSessionsCount={pendingCount}
        currentUser={currentUser}
        onNavigate={handleNavigate}
        onOpenBioScan={() => {
          if (!currentUser) setIsAuthOpen(true);
          else setIsAiScanOpen(true);
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {/* App Body Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-28 lg:pb-12">
        {selectedPeer ? (
          <PeerProfileView
            peer={selectedPeer}
            walletBalance={walletBalance}
            onBack={() => setSelectedPeer(null)}
            onSubmitExchangeRequest={handleSubmitExchangeRequest}
          />
        ) : (
          <>
            {activeTab === 'landing' && (
              <LandingView
                onEnterApp={() => setActiveTab('dashboard')}
                onStartBioScan={() => {
                  if (!currentUser) setIsAuthOpen(true);
                  else setIsAiScanOpen(true);
                }}
                onExploreCatalog={() => {
                  if (!currentUser) setIsAuthOpen(true);
                  else setActiveTab('discover');
                }}
                onOpenAuth={() => setIsAuthOpen(true)}
                isAuthenticated={!!currentUser}
              />
            )}

            {activeTab === 'dashboard' && (
              <DashboardView
                walletBalance={walletBalance}
                sessions={sessions}
                userSkills={userSkills}
                currentUserId={currentUser?.userId}
                currentUserDisplayName={currentUser?.displayName}
                onNavigate={handleNavigate}
                onJoinMeeting={handleOpenMeeting}
                onAcceptSession={handleAcceptSession}
                onDeclineSession={handleRejectSession}
                onCompleteSession={handleCompleteSession}
                onOpenAddSkill={() => setActiveTab('my-skills')}
                onOpenBioScan={() => {
                  if (!currentUser) setIsAuthOpen(true);
                  else setIsAiScanOpen(true);
                }}
                onFindPeersForSkill={handleFindPeersForSkill}
              />
            )}

            {activeTab === 'discover' && (
              <DiscoverView
                onOpenPeerProfile={handleOpenPeerProfile}
                initialSkillName={discoverInitialSkill}
                initialRole={discoverInitialRole}
                userSkills={userSkills}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            )}

            {activeTab === 'my-skills' && (
              <MySkillsView
                userSkills={userSkills}
                onAddSkill={handleAddSkill}
                onUpdateProficiency={handleUpdateSkillProficiency}
                onDeleteSkill={handleDeleteUserSkill}
                onOpenSkillScan={() => {
                  if (!currentUser) setIsAuthOpen(true);
                  else setIsAiScanOpen(true);
                }}
                onFindPeersForSkill={handleFindPeersForSkill}
                onFindTutorsForSkill={(skillName) => handleFindPeersForSkill(skillName, 'OFFERED')}
              />
            )}

            {activeTab === 'sessions' && (
              <SessionsView
                sessions={sessions}
                currentUserId={currentUser?.userId}
                onJoinVideoRoom={handleOpenMeeting}
                onAcceptSession={handleAcceptSession}
                onRejectSession={handleRejectSession}
                onCancelSession={handleCancelSession}
                onDisputeSession={handleDisputeSession}
                onCompleteSession={handleCompleteSession}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'credits' && (
              <CreditsView
                walletBalance={walletBalance}
                onRefreshBalance={loadData}
                onToast={showToast}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Spring AI Skill Extraction Modal */}
      <SkillExtractionModal
        isOpen={isAiScanOpen}
        onClose={() => setIsAiScanOpen(false)}
        onSaveSkills={handleSaveExtractedSkills}
      />

      {/* Meeting Link & Completion Modal */}
      <VideoRoomModal
        session={activeMeetingSession}
        currentUserId={currentUser?.userId}
        isOpen={!!activeMeetingSession}
        onClose={() => setActiveMeetingSession(null)}
        onCompleteAndRelease={handleCompleteSession}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          showToast('Authenticated successfully!');
          loadData();
        }}
      />
    </div>
  );
}
