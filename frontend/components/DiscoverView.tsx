'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Filter,
  User,
  Layers,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react';
import {
  apiClient,
  SkillResponse,
  SkillMatchResponse,
  UserSkillRole,
  UserSkillResponse,
} from '@/lib/apiClient';
import { PeerDetail } from './PeerProfileView';

interface DiscoverViewProps {
  onOpenPeerProfile: (peer: PeerDetail) => void;
  initialSkillName?: string;
  initialRole?: UserSkillRole;
  userSkills?: UserSkillResponse[];
  onOpenAuth?: () => void;
}

type SearchMode = 'semantic' | 'exact-skill';

export function DiscoverView({
  onOpenPeerProfile,
  initialSkillName,
  initialRole,
  userSkills = [],
  onOpenAuth,
}: DiscoverViewProps) {
  const initialWanted = userSkills.find((s) => s.role === 'WANTED');
  const defaultQuery = initialSkillName || (initialWanted ? initialWanted.skillName : '');
  const defaultRole = initialRole || 'OFFERED';

  const [searchMode, setSearchMode] = useState<SearchMode>('exact-skill');
  const [skillRole, setSkillRole] = useState<UserSkillRole>(defaultRole);
  const [searchQuery, setSearchQuery] = useState(defaultQuery);
  const [allSkills, setAllSkills] = useState<SkillResponse[]>([]);
  const [matchedSkills, setMatchedSkills] = useState<SkillMatchResponse[]>([]);
  const [matchedPeers, setMatchedPeers] = useState<PeerDetail[]>([]);
  const [loading, setLoading] = useState(Boolean(defaultQuery));
  const [searched, setSearched] = useState(Boolean(defaultQuery));
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [autoDiscoverReason, setAutoDiscoverReason] = useState<string | null>(
    !initialSkillName && initialWanted
      ? `Suggested mentors teaching "${initialWanted.skillName}" based on your wanted skills`
      : null
  );

  const handleCopyUserId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const performSearch = async (
    query: string,
    mode: SearchMode = searchMode,
    role: UserSkillRole = skillRole
  ) => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);
    setError(null);

    try {
      const currentUserId = apiClient.getCurrentUser()?.userId;

      if (mode === 'exact-skill') {
        const [userSummaries, skillMatches] = await Promise.all([
          apiClient.user.findUsersBySkill(q, role).catch(() => []),
          apiClient.skills.search(q).catch(() => []),
        ]);
        setMatchedSkills(skillMatches || []);

        const filteredSummaries = currentUserId
          ? userSummaries.filter((u) => u.userId !== currentUserId)
          : userSummaries;

        const peersWithSkills: PeerDetail[] = await Promise.all(
          filteredSummaries.map(async (summary) => {
            try {
              const [skills, profile] = await Promise.all([
                apiClient.userSkills.getUserSkills(summary.userId).catch(() => []),
                apiClient.user.getPublicProfile(summary.userId).catch(() => null),
              ]);
              return {
                userId: summary.userId,
                displayName: profile?.displayName || summary.displayName || 'Peer Member',
                bio: profile?.bio || null,
                score: 1.0,
                offeredSkills: skills.filter((s) => s.role === 'OFFERED'),
                wantedSkills: skills.filter((s) => s.role === 'WANTED'),
                matchType: 'exact',
                matchedSkillName: q,
              };
            } catch {
              return {
                userId: summary.userId,
                displayName: summary.displayName || 'Peer Member',
                bio: null,
                score: 1.0,
                offeredSkills: [],
                wantedSkills: [],
                matchType: 'exact',
                matchedSkillName: q,
              };
            }
          })
        );
        setMatchedPeers(peersWithSkills);
      } else {
        const [userMatches, skillMatches] = await Promise.all([
          apiClient.user.searchUsers(q).catch(() => []),
          apiClient.skills.search(q).catch(() => []),
        ]);
        setMatchedSkills(skillMatches || []);

        const filteredMatches = currentUserId
          ? userMatches.filter((u) => u.userId !== currentUserId)
          : userMatches;

        const peersWithSkills: PeerDetail[] = await Promise.all(
          filteredMatches.map(async (match) => {
            try {
              const [skills, profile] = await Promise.all([
                apiClient.userSkills.getUserSkills(match.userId).catch(() => []),
                apiClient.user.getPublicProfile(match.userId).catch(() => null),
              ]);
              return {
                userId: match.userId,
                displayName: profile?.displayName || 'Peer Member',
                bio: profile?.bio || null,
                score: match.score,
                offeredSkills: skills.filter((s) => s.role === 'OFFERED'),
                wantedSkills: skills.filter((s) => s.role === 'WANTED'),
                matchType: 'semantic',
              };
            } catch {
              return {
                userId: match.userId,
                displayName: 'Peer Member',
                bio: null,
                score: match.score,
                offeredSkills: [],
                wantedSkills: [],
                matchType: 'semantic',
              };
            }
          })
        );
        setMatchedPeers(peersWithSkills);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Search failed. Please ensure you are signed in.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!apiClient.isAuthenticated()) return;
    if (initialSkillName) {
      setAutoDiscoverReason(null);
      setSearchQuery(initialSkillName);
      const role = initialRole || 'OFFERED';
      setSkillRole(role);
      setSearchMode('exact-skill');
      setLoading(true);
      performSearch(initialSkillName, 'exact-skill', role);
    } else if (defaultQuery) {
      setLoading(true);
      performSearch(defaultQuery, 'exact-skill', defaultRole);
    }
  }, [initialSkillName, initialRole]);

  useEffect(() => {
    if (!apiClient.isAuthenticated()) return;
    let isMounted = true;
    apiClient.skills
      .listAll()
      .then((skills) => {
        if (!isMounted) return;
        const catalog = skills || [];
        setAllSkills(catalog);

        if (!defaultQuery && catalog.length > 0 && !searched) {
          const firstSkill = catalog[0].name;
          setAutoDiscoverReason(`Suggested peers teaching "${firstSkill}" from catalog`);
          setSearchQuery(firstSkill);
          setSearchMode('exact-skill');
          setSkillRole('OFFERED');
          performSearch(firstSkill, 'exact-skill', 'OFFERED');
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setAutoDiscoverReason(null);
    performSearch(searchQuery, searchMode, skillRole);
  };

  const handleSelectSkillFromCatalog = (skillName: string) => {
    setAutoDiscoverReason(null);
    setSearchQuery(skillName);
    performSearch(skillName, searchMode, skillRole);
  };

  if (!apiClient.isAuthenticated()) {
    return (
      <div className="card-base p-10 sm:p-12 text-center space-y-4 max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400 mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Sign In to Discover Peers</h2>
          <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
            Member profiles, pgvector semantic matching, and 1-on-1 session proposals require an authenticated account.
          </p>
        </div>
        <div className="pt-2">
          {onOpenAuth && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="btn-primary text-xs px-5 py-2.5"
            >
              Sign In or Register
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Discover Peers & Skills
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          Search developer profiles using pgvector semantic AI matching or lookup peers directly by exact skill.
        </p>
      </div>

      {/* Search Controls */}
      <div className="space-y-4">
        {/* Search Mode Tabs & Role Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setSearchMode('semantic');
                if (searchQuery.trim()) {
                  performSearch(searchQuery, 'semantic', skillRole);
                }
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                searchMode === 'semantic'
                  ? 'bg-neutral-800 text-emerald-400 font-semibold shadow-xs border border-neutral-700/60'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Semantic AI Match</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchMode('exact-skill');
                if (searchQuery.trim()) {
                  performSearch(searchQuery, 'exact-skill', skillRole);
                }
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                searchMode === 'exact-skill'
                  ? 'bg-neutral-800 text-cyan-400 font-semibold shadow-xs border border-neutral-700/60'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Exact Skill Match</span>
            </button>
          </div>

          {/* Role Filter (when in Exact Skill Match mode) */}
          {searchMode === 'exact-skill' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-400 text-[11px] shrink-0">Show Peers:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSkillRole('OFFERED');
                    if (searchQuery.trim()) {
                      performSearch(searchQuery, 'exact-skill', 'OFFERED');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    skillRole === 'OFFERED'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold'
                      : 'border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  Offering to Teach
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSkillRole('WANTED');
                    if (searchQuery.trim()) {
                      performSearch(searchQuery, 'exact-skill', 'WANTED');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    skillRole === 'WANTED'
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-semibold'
                      : 'border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  Wanting to Learn
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search Input Form */}
        <form onSubmit={onSubmitForm} className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                searchMode === 'exact-skill'
                  ? 'Lookup peers by exact skill name (e.g. React, Spring Boot, PostgreSQL)...'
                  : 'Search by concepts, topics, or engineering background (e.g. distributed systems, JVM concurrency)...'
              }
              aria-label="Search skills and peers"
              className="input-base input-with-icon input-with-button"
            />
            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 btn-primary text-xs py-1.5 px-3.5 min-h-[34px]"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Catalog Skills Chips */}
          {allSkills.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <span className="text-xs text-neutral-400 shrink-0 mr-1">
                Popular Skills:
              </span>
              {allSkills.slice(0, 10).map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => handleSelectSkillFromCatalog(skill.name)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white shrink-0 min-h-[34px] transition-colors cursor-pointer"
                >
                  {skill.name}
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs">
          {error}
        </div>
      )}

      {/* Matched Skills in Catalog */}
      {matchedSkills.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Matched Catalog Skills</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {matchedSkills.map((s) => (
              <button
                key={s.skillId}
                type="button"
                onClick={() => {
                  setSearchQuery(s.name);
                  performSearch(s.name, searchMode, skillRole);
                }}
                className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-200 flex items-center gap-2 transition-colors cursor-pointer text-left"
              >
                <span className="font-semibold text-white">{s.name}</span>
                <span className="badge-cyan text-[10px] py-0">
                  {Math.round(s.score * 100)}% Match
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Auto-Discovery Suggestion Banner */}
      {autoDiscoverReason && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{autoDiscoverReason}</span>
          </div>
          <button
            type="button"
            onClick={() => setAutoDiscoverReason(null)}
            className="text-[11px] text-emerald-400 hover:text-emerald-200 underline shrink-0 cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Matched Peers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <div>
            Showing <strong className="text-white">{matchedPeers.length}</strong> matching peers
          </div>
          <div className="text-[11px] text-neutral-400">
            {searchMode === 'exact-skill'
              ? searchQuery.trim()
                ? `Direct lookup for "${searchQuery}" (${skillRole === 'OFFERED' ? 'Teachers' : 'Learners'})`
                : `Catalog lookup (${skillRole === 'OFFERED' ? 'Teachers' : 'Learners'})`
              : 'Ranked by semantic profile match'}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-300">
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" />
              <div>
                <span className="font-semibold text-white">Searching peers...</span>
                <span className="text-neutral-400 block sm:inline sm:ml-2">
                  Querying member profiles and reciprocal skills.
                </span>
              </div>
            </div>

            {/* Skeleton Cards Animation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="card-base p-5 animate-pulse space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-neutral-800" />
                      <div className="space-y-2">
                        <div className="w-28 h-4 rounded bg-neutral-800" />
                        <div className="w-20 h-3 rounded bg-neutral-800/60" />
                      </div>
                    </div>
                    <div className="w-16 h-6 rounded-lg bg-neutral-800" />
                  </div>
                  <div className="w-full h-8 rounded-lg bg-neutral-800/40" />
                  <div className="space-y-2 pt-2">
                    <div className="w-16 h-3 rounded bg-neutral-800/60" />
                    <div className="flex gap-2">
                      <div className="w-20 h-6 rounded-md bg-neutral-800" />
                      <div className="w-24 h-6 rounded-md bg-neutral-800" />
                    </div>
                  </div>
                  <div className="w-full h-10 rounded-xl bg-neutral-800" />
                </div>
              ))}
            </div>
          </div>
        ) : matchedPeers.length === 0 ? (
          <div className="p-10 sm:p-12 text-center rounded-2xl bg-neutral-900/40 border border-dashed border-neutral-800 space-y-3">
            <User className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-sm text-neutral-400">
              {searched
                ? searchMode === 'exact-skill'
                  ? `No peers currently ${skillRole === 'OFFERED' ? 'offer to teach' : 'want to learn'}${searchQuery.trim() ? ` "${searchQuery}"` : ''}. Try switching to "Semantic AI Match" or switch roles.`
                  : `No matching peers found for "${searchQuery}". Try another topic or switch to "Exact Skill Match".`
                : 'Search above to find peers with complementary skills.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {matchedPeers.map((peer) => (
              <div
                key={peer.userId}
                className="card-base-hover p-4 sm:p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onOpenPeerProfile(peer)}
                          className="text-base font-semibold text-white hover:text-emerald-400 transition-colors text-left truncate block cursor-pointer"
                        >
                          {peer.displayName || 'Peer Member'}
                        </button>
                        <div className="flex items-center gap-1 text-xs font-mono text-neutral-400 truncate mt-0.5">
                          <span>ID: {peer.userId.substring(0, 8)}...</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyUserId(peer.userId, e)}
                            title="Copy Peer UUID"
                            aria-label="Copy Peer UUID"
                            className="p-1 hover:text-white rounded transition-colors"
                          >
                            {copiedId === peer.userId ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {peer.matchType === 'exact' ? (
                      <span className="badge-cyan text-xs shrink-0">
                        Skill Match
                      </span>
                    ) : peer.score !== undefined ? (
                      <span className="badge-emerald text-xs shrink-0">
                        {Math.round(peer.score * 100)}% Match
                      </span>
                    ) : null}
                  </div>

                  {/* Clean Bio Box */}
                  {peer.bio && (
                    <div className="mt-3 bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/80 overflow-hidden">
                      <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed m-0">
                        {peer.bio}
                      </p>
                    </div>
                  )}

                  {/* Skills tags */}
                  <div className="space-y-2 mt-3.5 pt-3 border-t border-neutral-800/60 text-xs">
                    <div>
                      <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
                        Offers (Teaching)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {peer.offeredSkills.length === 0 ? (
                          <span className="text-neutral-500 text-[11px]">No offered skills listed</span>
                        ) : (
                          peer.offeredSkills.map((s) => (
                            <span
                              key={s.id}
                              className={`px-2 py-0.5 rounded-md text-xs font-medium border ${
                                s.skillName.toLowerCase() === searchQuery.toLowerCase()
                                  ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400 font-semibold'
                                  : 'badge-emerald'
                              }`}
                            >
                              {s.skillName} {s.proficiency ? `(${s.proficiency.toLowerCase()})` : ''}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="pt-1">
                      <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider block mb-1">
                        Wants (Learning)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {peer.wantedSkills.length === 0 ? (
                          <span className="text-neutral-500 text-[11px]">No wanted skills listed</span>
                        ) : (
                          peer.wantedSkills.map((s) => (
                            <span
                              key={s.id}
                              className={`px-2 py-0.5 rounded-md text-xs font-medium border ${
                                s.skillName.toLowerCase() === searchQuery.toLowerCase()
                                  ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400 font-semibold'
                                  : 'badge-cyan'
                              }`}
                            >
                              {s.skillName}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-800/80">
                  <button
                    type="button"
                    onClick={() => onOpenPeerProfile(peer)}
                    className="btn-primary w-full text-xs"
                  >
                    <span>View Profile & Propose Session</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
