'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  X,
  BookOpen,
  Compass,
  AlertCircle,
} from 'lucide-react';
import { apiClient, ParsedBioResult, ParsedSkill } from '@/lib/apiClient';

interface SkillExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSkills: (confirmed: ParsedBioResult, bioText: string) => Promise<void>;
}

const SAMPLE_BIOS = [
  {
    label: 'Backend Specialist',
    text: 'Senior backend engineer with 6+ years in Java, Spring Boot, PostgreSQL, and REST microservices. Looking to master React 19, TypeScript, and modern frontend state management.',
  },
  {
    label: 'Full-Stack & Cloud',
    text: 'Building React and Node.js applications daily. Want to learn Kubernetes cluster orchestration, Kafka distributed streaming, and high-scale System Design.',
  },
  {
    label: 'Data & Databases',
    text: 'Database engineer skilled in PostgreSQL query optimization and pgvector embeddings. Looking to learn Next.js and Python for AI workflows.',
  },
];

export function SkillExtractionModal({
  isOpen,
  onClose,
  onSaveSkills,
}: SkillExtractionModalProps) {
  const [bioText, setBioText] = useState(
    'I have 6 years building high-concurrency Java backends, Spring Boot microservices, and PostgreSQL database pipelines. Recently, I have been diving into modern frontend architectures and want to learn React, TypeScript, and System Design.'
  );

  const [offeredSkills, setOfferedSkills] = useState<ParsedSkill[]>([
    { name: 'Java', proficiency: 'ADVANCED' },
    { name: 'Spring Boot', proficiency: 'ADVANCED' },
    { name: 'PostgreSQL', proficiency: 'INTERMEDIATE' },
  ]);

  const [wantedSkills, setWantedSkills] = useState<string[]>([
    'React',
    'TypeScript',
    'System Design',
  ]);

  const [newOfferedTag, setNewOfferedTag] = useState('');
  const [newWantedTag, setNewWantedTag] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExtractWithAi = async () => {
    if (!bioText.trim()) return;
    setIsExtracting(true);
    setError(null);

    try {
      const result = await apiClient.userSkills.parseBio(bioText.trim());
      if (result) {
        setOfferedSkills(result.offered || []);
        setWantedSkills(result.wanted || []);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to extract skills using Spring AI service.');
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddOffered = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newOfferedTag.trim();
    if (!trimmed) return;
    if (wantedSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already in Wanted Skills (to learn).`);
      return;
    }
    if (offeredSkills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already in Offered Skills.`);
      return;
    }
    setOfferedSkills([...offeredSkills, { name: trimmed, proficiency: 'INTERMEDIATE' }]);
    setNewOfferedTag('');
    setError(null);
  };

  const handleAddWanted = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newWantedTag.trim();
    if (!trimmed) return;
    if (offeredSkills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already in Offered Skills (to teach).`);
      return;
    }
    if (wantedSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already in Wanted Skills.`);
      return;
    }
    setWantedSkills([...wantedSkills, trimmed]);
    setNewWantedTag('');
    setError(null);
  };

  const removeOffered = (name: string) => {
    setOfferedSkills(offeredSkills.filter((s) => s.name !== name));
  };

  const removeWanted = (name: string) => {
    setWantedSkills(wantedSkills.filter((s) => s !== name));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onSaveSkills({ offered: offeredSkills, wanted: wantedSkills }, bioText);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save skills.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 sm:space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-neutral-800 pb-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white truncate">
                Spring AI Skill Extraction
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              Paste your engineering background and learning goals. Spring AI parses explicitly mentioned skills into structured offered and wanted tags.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            aria-label="Close AI Skill Scan modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Sample Bios */}
        <div className="space-y-1.5">
          <div className="text-[11px] text-neutral-400">Quick Bio Samples:</div>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_BIOS.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => setBioText(sample.text)}
                className="px-2.5 py-1.5 rounded-lg text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bio Text Input Area */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-neutral-300">
            Paste Engineering Bio or Resume Profile
          </label>
          <textarea
            rows={4}
            value={bioText}
            onChange={(e) => setBioText(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 leading-relaxed font-mono"
            placeholder="e.g. I work with Spring Boot, Java concurrency, and PostgreSQL..."
          />
          <button
            type="button"
            onClick={handleExtractWithAi}
            disabled={isExtracting || !bioText.trim()}
            className="btn-primary w-full sm:w-auto text-xs py-2 px-4"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isExtracting ? 'Extracting with Spring AI...' : 'Run Skill Extraction'}</span>
          </button>
        </div>

        {/* Extracted Skills Section */}
        <div className="pt-4 border-t border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          {/* Offered Skills */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Skills I Offer (To Teach)</span>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-12 p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800 items-center">
              {offeredSkills.length === 0 ? (
                <span className="text-xs text-neutral-500">No skills extracted yet</span>
              ) : (
                offeredSkills.map((skill) => (
                  <span
                    key={skill.name}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  >
                    <span>{skill.name}</span>
                    <span className="text-[10px] text-neutral-400">({skill.proficiency.toLowerCase()})</span>
                    <button
                      type="button"
                      onClick={() => removeOffered(skill.name)}
                      className="hover:text-white p-0.5 ml-0.5 cursor-pointer"
                      aria-label={`Remove ${skill.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            <form onSubmit={handleAddOffered} className="flex gap-1.5">
              <input
                type="text"
                value={newOfferedTag}
                onChange={(e) => setNewOfferedTag(e.target.value)}
                placeholder="+ Add offered skill"
                className="input-base text-xs min-h-[36px] py-1.5"
              />
              <button
                type="submit"
                className="btn-secondary text-xs min-h-[36px] px-3 py-1.5"
              >
                Add
              </button>
            </form>
          </div>

          {/* Wanted Skills */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <Compass className="w-3.5 h-3.5" />
              <span>Skills I Want (To Learn)</span>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-12 p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800 items-center">
              {wantedSkills.length === 0 ? (
                <span className="text-xs text-neutral-500">No skills extracted yet</span>
              ) : (
                wantedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeWanted(skill)}
                      className="hover:text-white p-0.5 ml-0.5 cursor-pointer"
                      aria-label={`Remove ${skill}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            <form onSubmit={handleAddWanted} className="flex gap-1.5">
              <input
                type="text"
                value={newWantedTag}
                onChange={(e) => setNewWantedTag(e.target.value)}
                placeholder="+ Add wanted skill"
                className="input-base text-xs min-h-[36px] py-1.5"
              />
              <button
                type="submit"
                className="btn-secondary text-xs min-h-[36px] px-3 py-1.5"
              >
                Add
              </button>
            </form>
          </div>
        </div>

        {/* Footer actions */}
        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary text-xs"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{isSaving ? 'Saving...' : 'Confirm & Save to Profile'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
