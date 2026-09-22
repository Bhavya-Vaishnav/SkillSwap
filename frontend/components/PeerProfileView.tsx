'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  BookOpen,
  Compass,
  Lock,
  CheckCircle2,
  User,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { apiClient, UserSkillResponse, PriceSuggestionResponse } from '@/lib/apiClient';

function formatPriceRange(rawRange: string): string {
  const clean = rawRange.replace(/[*\r\n]/g, '').trim();

  const minMatch = clean.match(/min(?:imum)?[:\s]+(\d+(?:\.\d+)?)/i);
  const maxMatch = clean.match(/max(?:imum)?[:\s]+(\d+(?:\.\d+)?)/i);
  if (minMatch && maxMatch) {
    const min = parseFloat(minMatch[1]);
    const max = parseFloat(maxMatch[1]);
    return min === max ? `${min} cr` : `${min} – ${max} cr`;
  }

  const toMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:credits?)?\s*(?:to|-)\s*(\d+(?:\.\d+)?)/i);
  if (toMatch) {
    const min = parseFloat(toMatch[1]);
    const max = parseFloat(toMatch[2]);
    return min === max ? `${min} cr` : `${min} – ${max} cr`;
  }

  const numbers = (clean.match(/\d+(?:\.\d+)?/g) || []).map((n) => parseFloat(n));
  if (numbers.length >= 2) {
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    return min === max ? `${min} cr` : `${min} – ${max} cr`;
  }

  if (numbers.length === 1) {
    return `${numbers[0]} cr`;
  }

  return clean.replace(/[()[\]{}]/g, '').replace(/[,;.]+$/, '').trim();
}

function formatTotalSessions(rawSessions: string): string {
  const numMatch = rawSessions.match(/(\d+)/);
  if (numMatch) {
    const count = parseInt(numMatch[1], 10);
    return `${count} ${count === 1 ? 'session' : 'sessions'}`;
  }
  return rawSessions.replace(/[()[\]{}]/g, '').replace(/[,;.]+$/, '').trim();
}

function extractPricingData(text: string): {
  avgPrice: number | null;
  priceRange: string | null;
  totalSessions: string | null;
} {
  const avgMatch =
    text.match(/(?:average\s*price|average)\s*:\s*\*?\*?\s*(\d+(?:\.\d+)?)/i) ||
    text.match(/\*\*Average\s*Price:\*\*\s*(\d+(?:\.\d+)?)/i) ||
    text.match(/(?:around|about)\s*(\d+(?:\.\d+)?)\s*credits/i);

  const avgPrice = avgMatch ? parseFloat(avgMatch[1]) : null;

  const rangeLineMatch = text.match(/(?:price\s*range)\s*:\s*\*?\*?\s*([^\n\r]+)/i);
  const priceRange = rangeLineMatch ? formatPriceRange(rangeLineMatch[1]) : null;

  let totalSessions: string | null = null;
  const sessionLineMatch = text.match(/(?:total\s*sessions|sample\s*size)\s*:\s*\*?\*?\s*([^\n\r]+)/i);
  if (sessionLineMatch) {
    totalSessions = formatTotalSessions(sessionLineMatch[1]);
  } else {
    const textSessionMatch = text.match(/(\d+)\s*(?:completed|recorded|historical)?\s*sessions?/i);
    if (textSessionMatch) {
      const count = parseInt(textSessionMatch[1], 10);
      totalSessions = `${count} ${count === 1 ? 'session' : 'sessions'}`;
    } else {
      totalSessions = '1 session';
    }
  }

  return { avgPrice, priceRange, totalSessions };
}

function cleanMarkdownLine(line: string): string {
  let cleaned = line;
  cleaned = cleaned.replace(/\bSample\s*Size\b/gi, 'Total Sessions');

  if (/price\s*range/i.test(cleaned)) {
    const rangeMatch = cleaned.match(/(?:price\s*range\s*:\s*\*?\*?)(.*)/i);
    if (rangeMatch) {
      const formatted = formatPriceRange(rangeMatch[1]);
      cleaned = cleaned.replace(
        /(price\s*range\s*:\s*\*?\*?).*/i,
        `Price Range:** ${formatted.replace('cr', 'credits')}`
      );
    }
  }

  if (/total\s*sessions/i.test(cleaned)) {
    const sessionMatch = cleaned.match(/(?:total\s*sessions\s*:\s*\*?\*?)(.*)/i);
    if (sessionMatch) {
      const formatted = formatTotalSessions(sessionMatch[1]);
      cleaned = cleaned.replace(
        /(total\s*sessions\s*:\s*\*?\*?).*/i,
        `Total Sessions:** ${formatted}`
      );
    }
  }

  cleaned = cleaned.replace(/\s*\(Minimum:[^)]*$/i, '');
  cleaned = cleaned.replace(/\s*\(Min:[^)]*$/i, '');

  return cleaned;
}

function renderFormattedLine(line: string) {
  const parts = line.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function FormattedAiResponse({ content }: { content: string }) {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);

  return (
    <div className="space-y-2 text-xs leading-relaxed text-neutral-300">
      {lines.map((rawLine, idx) => {
        const isBullet = rawLine.startsWith('- ') || rawLine.startsWith('* ');
        const strippedLine = isBullet ? rawLine.slice(2).trim() : rawLine;
        const cleanLine = cleanMarkdownLine(strippedLine);

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
              <div className="flex-1">{renderFormattedLine(cleanLine)}</div>
            </div>
          );
        }

        return (
          <p key={idx} className="text-neutral-300">
            {renderFormattedLine(cleanLine)}
          </p>
        );
      })}
    </div>
  );
}

export interface PeerDetail {
  userId: string;
  displayName?: string;
  bio?: string | null;
  score?: number;
  offeredSkills: UserSkillResponse[];
  wantedSkills: UserSkillResponse[];
  matchType?: 'semantic' | 'exact';
  matchedSkillName?: string;
}

interface PeerProfileViewProps {
  peer: PeerDetail;
  walletBalance: number;
  onBack: () => void;
  onSubmitExchangeRequest: (request: {
    providerId: string;
    skillId: string;
    creditAmount: number;
  }) => Promise<void>;
}

export function PeerProfileView({
  peer,
  walletBalance,
  onBack,
  onSubmitExchangeRequest,
}: PeerProfileViewProps) {
  const [displayName, setDisplayName] = useState<string>(peer.displayName || 'Peer Member');
  const [bio, setBio] = useState<string | null>(peer.bio || null);
  const [selectedSkillId, setSelectedSkillId] = useState<string>(
    peer.offeredSkills[0]?.skillId || ''
  );
  const [creditOffer, setCreditOffer] = useState<string>('10');
  const [autoAppliedPrice, setAutoAppliedPrice] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [priceSuggestion, setPriceSuggestion] = useState<string | null>(null);
  const [suggestionDetails, setSuggestionDetails] = useState<PriceSuggestionResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(peer.userId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  useEffect(() => {
    if (!peer.displayName || peer.bio === undefined) {
      apiClient.user
        .getPublicProfile(peer.userId)
        .then((pub) => {
          if (pub) {
            if (pub.displayName) setDisplayName(pub.displayName);
            if (pub.bio) setBio(pub.bio);
          }
        })
        .catch(() => {});
    }
  }, [peer.userId, peer.displayName, peer.bio]);

  const selectedSkill = peer.offeredSkills.find((s) => s.skillId === selectedSkillId) || peer.offeredSkills[0];

  const handleGetPriceSuggestion = async () => {
    if (!selectedSkill?.skillName) return;
    setLoadingSuggestion(true);
    setAiError(null);
    setPriceSuggestion(null);
    setSuggestionDetails(null);

    try {
      const res = await apiClient.sessions.suggestPrice(selectedSkill.skillName);

      if (res) {
        const text = res.message || res.suggestion || 'Pricing recommendation received.';
        setPriceSuggestion(text);
        setSuggestionDetails(res);

        if (
          res.averagePrice !== null &&
          res.averagePrice !== undefined &&
          res.averagePrice > 0
        ) {
          setCreditOffer(String(res.averagePrice));
          setAutoAppliedPrice(res.averagePrice);
        }
      } else {
        setPriceSuggestion('No suggestion returned by AI service.');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setAiError(errMsg);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkill) return;
    setError(null);

    const numericAmount = parseFloat(creditOffer);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid credit amount greater than 0.');
      return;
    }
    if (numericAmount > walletBalance) {
      setError(`Insufficient credits. You currently have ${walletBalance} credits available.`);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmitExchangeRequest({
        providerId: peer.userId,
        skillId: selectedSkill.skillId,
        creditAmount: numericAmount,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create session request.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="btn-ghost -ml-2 text-xs"
        aria-label="Back to Discover"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Matches</span>
      </button>

      {/* Main Profile Header */}
      <div className="card-base p-5 sm:p-6 flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400 font-bold shrink-0 shadow-xs">
          <User className="w-8 h-8" />
        </div>

        <div className="flex-1 space-y-2.5 w-full">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {displayName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs text-neutral-400">User ID:</span>
                <span className="text-xs font-mono text-neutral-200 select-all break-all bg-neutral-950 px-2 py-0.5 rounded-lg border border-neutral-800">
                  {peer.userId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedId ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {peer.matchType === 'exact' ? (
              <span className="badge-cyan text-xs shrink-0">
                Exact Skill Match
              </span>
            ) : peer.score !== undefined ? (
              <span className="badge-emerald text-xs shrink-0">
                {Math.round(peer.score * 100)}% Match
              </span>
            ) : null}
          </div>

          {bio && (
            <p className="text-xs text-neutral-300 bg-neutral-950/70 p-3 rounded-xl border border-neutral-800/80 leading-relaxed">
              {bio}
            </p>
          )}
        </div>
      </div>

      {/* Skills Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Offered Skills */}
        <div className="card-base p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <BookOpen className="w-4 h-4" />
            <span>Skills Offered (Can Teach)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {peer.offeredSkills.length === 0 ? (
              <span className="text-xs text-neutral-500">No skills offered yet</span>
            ) : (
              peer.offeredSkills.map((skill) => (
                <span
                  key={skill.id}
                  className="badge-emerald"
                >
                  {skill.skillName} {skill.proficiency && `(${skill.proficiency.toLowerCase()})`}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Wanted Skills */}
        <div className="card-base p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
            <Compass className="w-4 h-4" />
            <span>Skills Wanted (Learning)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {peer.wantedSkills.length === 0 ? (
              <span className="text-xs text-neutral-500">No learning targets yet</span>
            ) : (
              peer.wantedSkills.map((skill) => (
                <span
                  key={skill.id}
                  className="badge-cyan"
                >
                  {skill.skillName}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Request Skill Exchange Session Form */}
      <div className="card-base p-5 sm:p-6 space-y-5 sm:space-y-6">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Propose an Exchange Session
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Select the skill you want to learn and set your credit proposal. Credits will be held in escrow until session completion.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="p-6 text-center rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-semibold text-white">
              Session Request Created!
            </h3>
            <p className="text-xs text-neutral-300 max-w-md mx-auto">
              Your request was saved in the database. The peer will receive this proposal under their Sessions tab to accept or decline.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="btn-secondary mt-2 text-xs"
            >
              Return to Discovery
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Select Skill to Learn */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Select Skill to Learn
                </label>
                <select
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                  className="input-base cursor-pointer"
                >
                  {peer.offeredSkills.map((s) => (
                    <option key={s.skillId} value={s.skillId} className="bg-neutral-900 text-white">
                      {s.skillName} {s.proficiency ? `(${s.proficiency.toLowerCase()})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Credits to Offer */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-neutral-300">
                    Credits to Offer
                  </label>
                  <span className="text-[11px] text-neutral-400">
                    Available: <strong className="text-emerald-400 font-mono">{walletBalance} cr</strong>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={0.01}
                    max={walletBalance}
                    step="any"
                    placeholder="e.g. 10"
                    value={creditOffer}
                    onChange={(e) => {
                      setCreditOffer(e.target.value);
                      setAutoAppliedPrice(null);
                    }}
                    className="input-base !pr-16 font-mono"
                  />
                  {walletBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setCreditOffer(String(walletBalance));
                        setAutoAppliedPrice(null);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-neutral-400 hover:text-emerald-400 bg-neutral-900 hover:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-700 transition-colors cursor-pointer"
                    >
                      Max
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* On-Demand AI Price Suggestion */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-400">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Pricing Assistant</span>
                </div>
                <button
                  type="button"
                  onClick={handleGetPriceSuggestion}
                  disabled={loadingSuggestion || !selectedSkill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 transition-colors disabled:opacity-50 min-h-[34px] cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${loadingSuggestion ? 'animate-spin' : ''}`} />
                  <span>{loadingSuggestion ? 'Analyzing market price...' : 'Get AI Price Suggestion'}</span>
                </button>
              </div>

              {aiError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-red-300">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Gemini / Backend Debug Error:</span>
                  </div>
                  <pre className="font-mono text-[11px] text-red-200 bg-red-950/90 p-2 rounded-lg border border-red-500/20 overflow-x-auto whitespace-pre-wrap break-all">
                    {aiError}
                  </pre>
                </div>
              )}

              {priceSuggestion && (() => {
                const metrics = extractPricingData(priceSuggestion);
                return (
                  <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3.5 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                      <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        AI Recommended Credit Rate
                      </span>
                      {autoAppliedPrice !== null && (
                        <span className="badge-emerald text-[10px] py-0.5">
                          <Check className="w-3 h-3" />
                          Average Applied
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-purple-500/20">
                        <div className="text-[10px] uppercase font-medium text-neutral-400">Average Price</div>
                        <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                          {suggestionDetails?.averagePrice != null
                            ? `${suggestionDetails.averagePrice} cr`
                            : metrics.avgPrice !== null
                            ? `${metrics.avgPrice} cr`
                            : '—'}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-purple-500/20">
                        <div className="text-[10px] uppercase font-medium text-neutral-400">Price Range</div>
                        <div className="text-xs font-semibold text-purple-200 mt-1">
                          {suggestionDetails?.minimumPrice != null && suggestionDetails?.maximumPrice != null
                            ? `${suggestionDetails.minimumPrice} – ${suggestionDetails.maximumPrice} cr`
                            : metrics.priceRange || 'Market rate'}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-neutral-950/80 border border-purple-500/20">
                        <div className="text-[10px] uppercase font-medium text-neutral-400">Total Sessions</div>
                        <div className="text-xs font-semibold text-neutral-200 mt-1">
                          {suggestionDetails?.sampleSize != null
                            ? `${suggestionDetails.sampleSize} ${suggestionDetails.sampleSize === 1 ? 'session' : 'sessions'}`
                            : metrics.totalSessions || '1 session'}
                        </div>
                      </div>
                    </div>

                    <div className="pt-1">
                      <FormattedAiResponse content={priceSuggestion} />
                    </div>
                  </div>
                );
              })()}

              {!priceSuggestion && !aiError && (
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Click above to analyze historical session rates and get an AI fair-market recommendation for &quot;{selectedSkill?.skillName || 'selected skill'}&quot;.
                </p>
              )}
            </div>

            {/* Submit Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-neutral-800">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Credits are locked in escrow until session completion</span>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onBack}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedSkill}
                  className="btn-primary text-xs"
                >
                  {isSubmitting ? 'Proposing...' : 'Send Session Request'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
