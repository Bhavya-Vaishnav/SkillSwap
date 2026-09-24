'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Coins,
  Calendar,
  BookOpen,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';
import {
  apiClient,
  AuthUser,
  SessionResponse,
  UserSkillResponse,
} from '@/lib/apiClient';

interface ProfileViewProps {
  currentUser: AuthUser | null;
  walletBalance: number;
  sessions: SessionResponse[];
  userSkills: UserSkillResponse[];
  onNavigate: (tab: string) => void;
  onToast?: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export function ProfileView({
  currentUser,
  walletBalance,
  sessions,
  userSkills,
  onNavigate,
  onToast,
}: ProfileViewProps) {
  // Bio state (read-only)
  const [bio, setBio] = useState<string>('');

  // Copy ID state
  const [copiedId, setCopiedId] = useState(false);

  // Password change form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Fetch initial profile / bio
  useEffect(() => {
    if (!currentUser?.userId) return;

    apiClient.user
      .getPublicProfile(currentUser.userId)
      .then((profile) => {
        if (profile?.bio) {
          setBio(profile.bio);
        }
      })
      .catch(() => {});
  }, [currentUser?.userId]);

  const handleCopyId = () => {
    if (!currentUser?.userId) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentUser.userId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from your current password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await apiClient.auth.updatePassword({
        currentPassword,
        newPassword,
      });

      setPasswordSuccess('Your password has been changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onToast?.('Password updated successfully!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change password. Please check your current password.';
      setPasswordError(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const offeredSkills = userSkills.filter((s) => s.role === 'OFFERED');
  const wantedSkills = userSkills.filter((s) => s.role === 'WANTED');
  const completedSessionsCount = sessions.filter((s) => s.status === 'COMPLETED').length;
  const activeSessionsCount = sessions.filter(
    (s) => s.status === 'REQUESTED' || s.status === 'ACCEPTED'
  ).length;

  if (!currentUser) {
    return (
      <div className="card-base p-12 text-center max-w-lg mx-auto my-12 space-y-4">
        <User className="w-12 h-12 text-neutral-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Sign In Required</h2>
        <p className="text-xs text-neutral-400">
          Please sign in to view your profile and manage account security.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="btn-primary"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header Profile Identity Card */}
      <div className="card-base p-5 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-neutral-800/80">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-2xl sm:text-3xl shrink-0 shadow-inner">
              {currentUser.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                  {currentUser.displayName}
                </h1>
                <span className="badge-emerald text-[11px] py-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Member
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded-md border border-neutral-800">
                  ID: {currentUser.userId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-emerald-400 transition-colors cursor-pointer"
                  title="Copy User ID"
                >
                  {copiedId ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="btn-secondary text-xs"
            >
              <span>Back to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bio Section (Read-only) */}
        {bio && (
          <div className="space-y-2 pt-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>About &amp; Engineering Bio</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed bg-neutral-900/60 p-4 rounded-xl border border-neutral-800/80 whitespace-pre-wrap">
              {bio}
            </p>
          </div>
        )}
      </div>

      {/* Account Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => onNavigate('credits')}
          className="card-base-hover p-4 text-left cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Credit Balance
            </span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono mt-1">
            {walletBalance} <span className="text-xs font-normal text-neutral-400">cr</span>
          </div>
          <span className="text-[10px] text-neutral-400 mt-1 block">View ledger transactions →</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('sessions')}
          className="card-base-hover p-4 text-left cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Total Sessions
            </span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono mt-1">
            {sessions.length}
          </div>
          <span className="text-[10px] text-neutral-400 mt-1 block">
            {activeSessionsCount} active · {completedSessionsCount} completed
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('my-skills')}
          className="card-base-hover p-4 text-left cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Skills Offered
            </span>
            <BookOpen className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-cyan-300 font-mono mt-1">
            {offeredSkills.length}
          </div>
          <span className="text-[10px] text-neutral-400 mt-1 block">Available for tutoring →</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('my-skills')}
          className="card-base-hover p-4 text-left cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Skills Wanted
            </span>
            <BookOpen className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-300 font-mono mt-1">
            {wantedSkills.length}
          </div>
          <span className="text-[10px] text-neutral-400 mt-1 block">Looking to learn →</span>
        </button>
      </div>

      {/* Security & Password Change Section */}
      <div className="card-base p-5 sm:p-6 lg:p-8 space-y-6">
        <div className="border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Security &amp; Password
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Update your account password to keep your SkillSwap account and credit escrow secure.
              </p>
            </div>
          </div>
        </div>

        {/* Feedback alerts */}
        {passwordSuccess && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block text-emerald-200">Success</strong>
              <span>{passwordSuccess}</span>
            </div>
          </div>
        )}

        {passwordError && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block text-red-200">Password Update Error</strong>
              <span>{passwordError}</span>
            </div>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="input-base !pr-10 text-xs"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 p-1 cursor-pointer"
                title={showCurrentPassword ? 'Hide password' : 'Show password'}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-neutral-300">
                New Password
              </label>
              <span className="text-[11px] text-neutral-400">Minimum 8 characters</span>
            </div>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="input-base !pr-10 text-xs font-sans"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 p-1 cursor-pointer"
                title={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password to confirm"
                className={`input-base !pr-10 text-xs font-sans ${
                  confirmPassword && confirmPassword !== newPassword ? 'border-red-500/60 focus:border-red-500' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 p-1 cursor-pointer"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-[11px] text-red-400 mt-1">Passwords do not match.</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={passwordLoading || !currentPassword || !newPassword || newPassword.length < 8 || newPassword !== confirmPassword}
              className="btn-primary text-xs w-full sm:w-auto px-5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{passwordLoading ? 'Updating password...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Skills Snapshot Section */}
      <div className="card-base p-5 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Skills Summary</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Active engineering skills registered to your barter exchange profile.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('my-skills')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Manage Skills</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Offered */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Teaching ({offeredSkills.length})</span>
            </h3>
            {offeredSkills.length === 0 ? (
              <p className="text-xs text-neutral-500 italic">No skills offered yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {offeredSkills.map((s) => (
                  <span
                    key={s.skillId}
                    className="px-2.5 py-1 rounded-lg text-xs bg-cyan-950/40 text-cyan-300 border border-cyan-500/20 font-medium"
                  >
                    {s.skillName} · <span className="opacity-75 text-[10px]">{s.proficiency}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Wanted */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Learning ({wantedSkills.length})</span>
            </h3>
            {wantedSkills.length === 0 ? (
              <p className="text-xs text-neutral-500 italic">No skills wanted yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {wantedSkills.map((s) => (
                  <span
                    key={s.skillId}
                    className="px-2.5 py-1 rounded-lg text-xs bg-amber-950/40 text-amber-300 border border-amber-500/20 font-medium"
                  >
                    {s.skillName} · <span className="opacity-75 text-[10px]">{s.proficiency}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
