'use client';

import React, { useState } from 'react';
import {
  Plus,
  Sparkles,
  BookOpen,
  Compass,
  X,
  Trash2,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import {
  UserSkillResponse,
  UserSkillRequest,
  ProficiencyLevel,
  UserSkillRole,
} from '@/lib/apiClient';

interface MySkillsViewProps {
  userSkills: UserSkillResponse[];
  onAddSkill: (skill: UserSkillRequest) => Promise<void>;
  onUpdateProficiency?: (id: string, proficiency: ProficiencyLevel) => Promise<void>;
  onDeleteSkill?: (id: string, skillName: string) => Promise<void>;
  onOpenSkillScan: () => void;
  onFindTutorsForSkill?: (skillName: string) => void;
  onFindPeersForSkill?: (skillName: string, role: UserSkillRole) => void;
}

export function MySkillsView({
  userSkills,
  onAddSkill,
  onUpdateProficiency,
  onDeleteSkill,
  onOpenSkillScan,
  onFindTutorsForSkill,
  onFindPeersForSkill,
}: MySkillsViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [category, setCategory] = useState('');
  const [role, setRole] = useState<UserSkillRole>('OFFERED');
  const [proficiency, setProficiency] = useState<ProficiencyLevel>('ADVANCED');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Proficiency update & deletion state
  const [updatingSkillId, setUpdatingSkillId] = useState<string | null>(null);
  const [skillToDelete, setSkillToDelete] = useState<{ id: string; skillName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const offeredSkills = userSkills.filter((s) => s.role === 'OFFERED');
  const wantedSkills = userSkills.filter((s) => s.role === 'WANTED');

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    const cleanName = skillName.trim();
    if (!cleanName) return;

    const lower = cleanName.toLowerCase();
    const existsSameRole = userSkills.some(
      (s) => s.skillName.toLowerCase() === lower && s.role === role
    );
    if (existsSameRole) {
      setModalError(
        `"${cleanName}" is already listed under ${role === 'OFFERED' ? 'Skills Offered' : 'Skills Wanted'}.`
      );
      return;
    }

    const existsOppositeRole = userSkills.some(
      (s) => s.skillName.toLowerCase() === lower && s.role !== role
    );
    if (existsOppositeRole) {
      setModalError(
        role === 'OFFERED'
          ? `"${cleanName}" is already listed under Wanted Skills (to learn). A skill cannot be both taught and learned concurrently.`
          : `"${cleanName}" is already listed under Offered Skills (to teach). A skill cannot be both taught and learned concurrently.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddSkill({
        skillName: cleanName,
        category: category.trim() || null,
        role,
        proficiency: role === 'OFFERED' ? proficiency : null,
      });
      setSkillName('');
      setCategory('');
      setModalError(null);
      setShowAddModal(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setModalError(err.message);
      } else {
        setModalError('Failed to add skill.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProficiencyChange = async (id: string, newLevel: ProficiencyLevel) => {
    if (!onUpdateProficiency) return;
    setUpdatingSkillId(id);
    try {
      await onUpdateProficiency(id, newLevel);
    } finally {
      setUpdatingSkillId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!skillToDelete || !onDeleteSkill) return;
    setIsDeleting(true);
    try {
      await onDeleteSkill(skillToDelete.id, skillToDelete.skillName);
      setSkillToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const getProficiencyBadgeClass = (level: ProficiencyLevel | null) => {
    switch (level) {
      case 'EXPERT':
        return 'badge-purple';
      case 'ADVANCED':
        return 'badge-emerald';
      case 'INTERMEDIATE':
        return 'badge-cyan';
      case 'BEGINNER':
        return 'badge-amber';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-8 sm:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5 sm:pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
            My Skills
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Manage skills you offer to teach and target technologies you want to learn from peer engineers.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenSkillScan}
            className="btn-secondary flex-1 sm:flex-initial"
            title="Scan your bio or resume with Spring AI to extract skills"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Bio Scan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole('OFFERED');
              setSkillName('');
              setCategory('');
              setModalError(null);
              setShowAddModal(true);
            }}
            className="btn-primary flex-1 sm:flex-initial"
          >
            <Plus className="w-4 h-4" />
            <span>Add Skill</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Offered vs Wanted */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Skills I Offer */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-semibold text-white">
                Skills I Offer (Teaching)
              </h2>
              <span className="badge-emerald text-[10px]">
                {offeredSkills.length}
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {offeredSkills.length === 0 ? (
              <div className="p-8 text-center rounded-xl card-base border-dashed text-xs text-neutral-400 space-y-2">
                <p>No offered skills configured.</p>
                <button
                  type="button"
                  onClick={() => {
                    setRole('OFFERED');
                    setShowAddModal(true);
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold inline-block cursor-pointer"
                >
                  + Add your first teaching skill
                </button>
              </div>
            ) : (
              offeredSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="card-base p-3.5 flex items-center justify-between group hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-neutral-100 truncate">
                        {skill.skillName}
                      </div>
                      <div className="text-[11px] text-emerald-400 font-medium mt-0.5">
                        Teaching
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onUpdateProficiency ? (
                      <div className="relative inline-flex items-center">
                        <select
                          value={skill.proficiency || 'ADVANCED'}
                          disabled={updatingSkillId === skill.id}
                          onChange={(e) =>
                            handleProficiencyChange(skill.id, e.target.value as ProficiencyLevel)
                          }
                          className={`appearance-none text-[10px] sm:text-[11px] font-bold uppercase tracking-wider pl-2.5 pr-6 py-1 rounded-lg border transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 ${getProficiencyBadgeClass(
                            skill.proficiency
                          )}`}
                          title="Click to update proficiency level"
                        >
                          <option value="BEGINNER" className="bg-neutral-900 text-amber-300">Beginner</option>
                          <option value="INTERMEDIATE" className="bg-neutral-900 text-cyan-300">Intermediate</option>
                          <option value="ADVANCED" className="bg-neutral-900 text-emerald-300">Advanced</option>
                          <option value="EXPERT" className="bg-neutral-900 text-purple-300">Expert</option>
                        </select>
                        {updatingSkillId === skill.id ? (
                          <Loader2 className="w-3 h-3 text-emerald-400 absolute right-1.5 animate-spin pointer-events-none" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-1.5 pointer-events-none" />
                        )}
                      </div>
                    ) : (
                      skill.proficiency && (
                        <span className={getProficiencyBadgeClass(skill.proficiency)}>
                          {skill.proficiency}
                        </span>
                      )
                    )}

                    {(onFindPeersForSkill || onFindTutorsForSkill) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onFindPeersForSkill) {
                            onFindPeersForSkill(skill.skillName, 'WANTED');
                          } else if (onFindTutorsForSkill) {
                            onFindTutorsForSkill(skill.skillName);
                          }
                        }}
                        className="hidden sm:inline-flex px-2 py-1 rounded-lg text-[11px] text-neutral-400 hover:text-emerald-300 hover:bg-neutral-800 transition-colors cursor-pointer"
                        title="Find learners who want to learn this skill"
                      >
                        Find Learners
                      </button>
                    )}

                    {onDeleteSkill && (
                      <button
                        type="button"
                        onClick={() => setSkillToDelete({ id: skill.id, skillName: skill.skillName })}
                        className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title={`Remove ${skill.skillName}`}
                        aria-label={`Remove ${skill.skillName}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Skills I Want */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-semibold text-white">
                Skills I Want (Learning)
              </h2>
              <span className="badge-cyan text-[10px]">
                {wantedSkills.length}
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {wantedSkills.length === 0 ? (
              <div className="p-8 text-center rounded-xl card-base border-dashed text-xs text-neutral-400 space-y-2">
                <p>No learning targets configured.</p>
                <button
                  type="button"
                  onClick={() => {
                    setRole('WANTED');
                    setShowAddModal(true);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold inline-block cursor-pointer"
                >
                  + Add skills you want to learn
                </button>
              </div>
            ) : (
              wantedSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="card-base p-3.5 flex items-center justify-between group hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-neutral-100 truncate">
                        {skill.skillName}
                      </div>
                      <div className="text-[11px] text-cyan-400 font-medium mt-0.5">
                        Learning Target
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {(onFindPeersForSkill || onFindTutorsForSkill) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onFindPeersForSkill) {
                            onFindPeersForSkill(skill.skillName, 'OFFERED');
                          } else if (onFindTutorsForSkill) {
                            onFindTutorsForSkill(skill.skillName);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] text-neutral-400 hover:text-cyan-300 hover:bg-neutral-800 transition-colors cursor-pointer"
                        title="Find peers offering to teach this skill"
                      >
                        Find Teachers
                      </button>
                    )}

                    {onDeleteSkill && (
                      <button
                        type="button"
                        onClick={() => setSkillToDelete({ id: skill.id, skillName: skill.skillName })}
                        className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title={`Remove ${skill.skillName}`}
                        aria-label={`Remove ${skill.skillName}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Skill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white">Add Skill to Profile</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSkill} className="space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs">
                  {modalError}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Skill Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. React, Spring Boot, PostgreSQL, Kafka"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  className="input-base"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Category (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Backend, Frontend, Database, DevOps"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-base"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Skill Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('OFFERED')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      role === 'OFFERED'
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-semibold'
                        : 'border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    Skills I Offer (Teach)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('WANTED')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      role === 'WANTED'
                        ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 font-semibold'
                        : 'border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    Skills I Want (Learn)
                  </button>
                </div>
              </div>

              {role === 'OFFERED' && (
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Proficiency Level
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as ProficiencyLevel[]).map(
                      (level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setProficiency(level)}
                          className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all capitalize cursor-pointer ${
                            proficiency === level
                              ? 'bg-neutral-800 border-neutral-600 text-white font-semibold'
                              : 'border-neutral-800 text-neutral-400 hover:bg-neutral-800'
                          }`}
                        >
                          {level.toLowerCase()}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Save Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Skill Confirmation Modal */}
      {skillToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Remove Skill</h4>
                <p className="text-xs text-neutral-400">Remove from profile</p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 bg-neutral-950 p-3 rounded-xl border border-neutral-800 leading-relaxed">
              Are you sure you want to remove <strong className="text-white">&quot;{skillToDelete.skillName}&quot;</strong>? You will no longer receive peer matches for this skill.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSkillToDelete(null)}
                disabled={isDeleting}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-xs transition-colors disabled:opacity-50 min-h-[40px] cursor-pointer"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isDeleting ? 'Removing...' : 'Remove'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
