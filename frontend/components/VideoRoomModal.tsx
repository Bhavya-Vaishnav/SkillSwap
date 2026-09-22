'use client';

import React, { useState } from 'react';
import {
  Video,
  X,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  User,
} from 'lucide-react';
import { SessionResponse } from '@/lib/apiClient';

interface VideoRoomModalProps {
  session: SessionResponse | null;
  currentUserId?: string;
  isOpen: boolean;
  onClose: () => void;
  onCompleteAndRelease: (sessionId: string) => Promise<void>;
}

export function VideoRoomModal({
  session,
  currentUserId,
  isOpen,
  onClose,
  onCompleteAndRelease,
}: VideoRoomModalProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !session) return null;

  const meetingUrl = session.meetingLink || 'https://meet.google.com/new';

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(meetingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await onCompleteAndRelease(session.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const isRequester =
    currentUserId && session.requesterId
      ? currentUserId.toLowerCase() === session.requesterId.toLowerCase()
      : false;

  const counterpartyName = isRequester
    ? session.providerName || 'Provider'
    : session.requesterName || 'Requester';

  const counterpartyEmail = isRequester
    ? session.providerEmail || 'Verified Provider'
    : session.requesterEmail || 'Verified Requester';

  const counterpartyRole = isRequester ? 'Provider (Teacher)' : 'Requester (Learner)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-neutral-800 pb-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-neutral-400">
                Session ID: {session.id.substring(0, 8)}...
              </span>
              <span className="badge-emerald text-[10px]">
                {session.status}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-1 truncate">
              Skill Exchange Meeting
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close meeting modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Counterparty & Details */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-neutral-950/70 border border-neutral-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400 font-bold shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
                {counterpartyRole}
              </div>
              <div className="text-sm font-semibold text-white truncate">
                {counterpartyName}
              </div>
              <div className="text-xs text-neutral-400 truncate">
                {counterpartyEmail}
              </div>
            </div>
          </div>

          <div className="text-right shrink-0 pl-2">
            <div className="text-xs font-medium text-neutral-400">Escrow Value</div>
            <div className="text-base font-bold text-emerald-400 font-mono">
              {session.creditAmount} credits
            </div>
          </div>
        </div>

        {/* Meeting Link Box */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-neutral-300">
            Google Meet Video Link
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-200 truncate select-all flex items-center min-h-[42px]">
              {meetingUrl}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className="btn-secondary py-2 px-3 min-h-[42px]"
                title="Copy meeting link"
                aria-label="Copy meeting link"
              >
                {copied ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <Check className="w-4 h-4" />
                    <span>Copied</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs">
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </span>
                )}
              </button>
              <a
                href={meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary py-2 px-4 min-h-[42px]"
              >
                <span>Join</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            {isRequester
              ? 'After your 1-on-1 session finishes, confirm completion below to release the escrow credits to the teacher.'
              : 'Join the meeting above. Escrow credits will be transferred to your balance once the requester confirms completion.'}
          </p>
        </div>

        {/* Actions */}
        {isRequester ? (
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs"
            >
              Close
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleComplete}
              className="btn-primary text-xs"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{loading ? 'Completing...' : 'Mark Completed & Pay'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3 pt-4 border-t border-neutral-800">
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Credits will atomically transfer to your balance upon requester confirmation.</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary w-full text-xs"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
