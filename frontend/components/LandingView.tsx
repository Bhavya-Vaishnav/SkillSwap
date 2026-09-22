'use client';

import React from 'react';
import { ArrowRight, ArrowUpRight, ShieldCheck, Sparkles, Layers, RefreshCw, Cpu, Database, Award } from 'lucide-react';

interface LandingViewProps {
  onEnterApp: () => void;
  onStartBioScan: () => void;
  onExploreCatalog: () => void;
  onOpenAuth: () => void;
  isAuthenticated: boolean;
}

export function LandingView({
  onEnterApp,
  onExploreCatalog,
  onOpenAuth,
  isAuthenticated,
}: LandingViewProps) {
  return (
    <div className="space-y-20 sm:space-y-28 py-6 sm:py-10">
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto space-y-6 pt-2 sm:pt-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-neutral-900 border border-emerald-500/30 p-2 shadow-2xl shadow-emerald-500/10 flex items-center justify-center">
            <img src="/logo.png" alt="SkillSwap" className="w-full h-full object-contain rounded-xl" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>PEER-TO-PEER DEVELOPER SKILL EXCHANGE</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
          Trade real engineering skills. <br />
          <span className="text-emerald-400">Zero cash required.</span>
        </h1>

        <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          SkillSwap is a reciprocal exchange platform for software engineers. Teach technologies you use in production, earn credits held in an atomic double-entry ledger, and learn 1-on-1 from peer developers.
        </p>

        {/* Primary & Secondary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={onEnterApp}
              className="btn-primary w-full sm:w-auto text-xs sm:text-sm px-6 py-3"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="btn-primary w-full sm:w-auto text-xs sm:text-sm px-6 py-3"
            >
              <span>Get Started &bull; 100 Welcome Credits</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onExploreCatalog}
            className="btn-secondary w-full sm:w-auto text-xs sm:text-sm px-6 py-3"
          >
            <span>Explore Skills & Peers</span>
            <ArrowUpRight className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        {/* Real-time Exchange Architecture Visualizer */}
        <div className="pt-6 max-w-3xl mx-auto text-left">
          <div className="card-base p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 text-[11px] font-mono text-neutral-400">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                ACTIVE EXCHANGE LIFECYCLE
              </span>
              <span className="text-amber-400 font-semibold">STATE: ESCROW_LOCKED</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-center">
              {/* Learner */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block">
                  Requester (Learner)
                </span>
                <p className="text-xs font-semibold text-white">Alex Chen</p>
                <div className="text-[11px] text-neutral-400">
                  Wants: <span className="text-cyan-300 font-medium">Kafka & Distributed Sagas</span>
                </div>
              </div>

              {/* Escrow Mechanism */}
              <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80 text-center space-y-1">
                <div className="text-[10px] font-mono text-emerald-400 font-medium">
                  DOUBLE-ENTRY ESCROW
                </div>
                <div className="text-sm font-bold text-white font-mono">
                  15.00 cr
                </div>
                <div className="text-[10px] text-neutral-400">
                  Transferred upon mutual completion
                </div>
              </div>

              {/* Provider */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block">
                  Provider (Teacher)
                </span>
                <p className="text-xs font-semibold text-white">Maya Patel</p>
                <div className="text-[11px] text-neutral-400">
                  Offers: <span className="text-emerald-300 font-medium">Event-Driven Microservices</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-neutral-500 border-t border-neutral-800/60">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                pgvector Cosine Similarity Match: 0.94
              </span>
              <span>Settlement: Google Meet + Atomic Ledger Transfer</span>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Architecture & Protocol */}
      <section className="max-w-5xl mx-auto space-y-8">
        <div className="border-b border-neutral-800 pb-4">
          <p className="text-[11px] font-mono text-emerald-400 tracking-wider uppercase">
            Exchange Principles
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
            Built for developers who value reciprocal engineering time.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="card-base p-5 sm:p-6 space-y-3">
            <div className="font-mono text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4" />
              <span>01 &bull; Reciprocal Barter</span>
            </div>
            <h3 className="text-base font-semibold text-white">
              Zero Cash Friction
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Skip subscription paywalls and private tutor rates. Exchange hands-on code reviews, architecture guidance, and debugging sessions directly with peer developers.
            </p>
          </div>

          <div className="card-base p-5 sm:p-6 space-y-3">
            <div className="font-mono text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>02 &bull; Semantic Vector Search</span>
            </div>
            <h3 className="text-base font-semibold text-white">
              pgvector Cosine Distance
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Describe your technical background and learning goals in natural prose. PostgreSQL pgvector embeddings calculate cosine similarity to find complementary peers.
            </p>
          </div>

          <div className="card-base p-5 sm:p-6 space-y-3">
            <div className="font-mono text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>03 &bull; Double-Entry Escrow</span>
            </div>
            <h3 className="text-base font-semibold text-white">
              Atomic Ledger Settlement
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Every credit transaction adheres to double-entry accounting invariants. Credits stay safely in escrow until the learner confirms the session was completed.
            </p>
          </div>
        </div>
      </section>

      {/* 3-Step Protocol */}
      <section className="max-w-5xl mx-auto space-y-8">
        <div className="border-b border-neutral-800 pb-4">
          <p className="text-[11px] font-mono text-neutral-400 tracking-wider uppercase">
            Workflow Protocol
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
            Three steps from discovery to knowledge transfer.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="card-base p-5 space-y-2.5">
            <div className="text-2xl font-mono font-bold text-emerald-500/60">
              01
            </div>
            <h3 className="text-sm font-semibold text-white">
              Configure Your Stack & Goals
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Add your offered technologies with proficiency levels and list target skills to learn. You can also run the Spring AI bio parser to extract skills automatically from your bio.
            </p>
          </div>

          <div className="card-base p-5 space-y-2.5">
            <div className="text-2xl font-mono font-bold text-cyan-500/60">
              02
            </div>
            <h3 className="text-sm font-semibold text-white">
              Discover Peers & Propose Session
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Find peers by exact skill or semantic profile similarity. View what they teach and learn, check AI pricing suggestions, and propose an exchange session.
            </p>
          </div>

          <div className="card-base p-5 space-y-2.5">
            <div className="text-2xl font-mono font-bold text-amber-500/60">
              03
            </div>
            <h3 className="text-sm font-semibold text-white">
              Meet 1-on-1 & Settle Escrow
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Connect via Google Meet. After concluding your session, confirm completion to execute the atomic credit transfer to the teacher.
            </p>
          </div>
        </div>
      </section>

      {/* Technical Foundations */}
      <section className="max-w-5xl mx-auto card-base p-6 sm:p-8 space-y-6">
        <div>
          <p className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">
            Architecture Specifications
          </p>
          <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
            Engineered with modern backend primitives
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-neutral-400">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>VECTOR STORAGE</span>
            </div>
            <p className="text-white font-semibold font-sans">PostgreSQL + pgvector</p>
            <p className="text-[11px] font-sans text-neutral-400 leading-relaxed">
              High-dimensional cosine distance matching over user bio embeddings and skill profiles.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-neutral-400">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>GENERATIVE AI</span>
            </div>
            <p className="text-white font-semibold font-sans">Spring AI Engine</p>
            <p className="text-[11px] font-sans text-neutral-400 leading-relaxed">
              Structured bio parsing into skill entities and on-demand fair-market credit price suggestions.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-neutral-400">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>FINANCIAL INTEGRITY</span>
            </div>
            <p className="text-white font-semibold font-sans">Double-Entry Ledger</p>
            <p className="text-[11px] font-sans text-neutral-400 leading-relaxed">
              Strict debit/credit invariant balancing, session escrow isolation, and audit trail.
            </p>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="text-center max-w-2xl mx-auto space-y-4 pb-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Ready to swap engineering knowledge?
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400">
          Create an account to claim your 100 signup bonus credits and start discovering peers today.
        </p>
        <div className="pt-2">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={onEnterApp}
              className="btn-primary text-xs sm:text-sm px-6 py-3"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="btn-primary text-xs sm:text-sm px-6 py-3"
            >
              <span>Sign In / Register</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
