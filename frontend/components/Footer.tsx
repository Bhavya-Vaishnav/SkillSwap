'use client';

import React from 'react';

interface FooterProps {
  onNavigate?: (tab: string) => void;
}

export function Footer({}: FooterProps) {
  return (
    <footer className="w-full border-t border-neutral-900 bg-neutral-950 py-12 pb-28 lg:pb-12 text-center">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <img src="/logo.png" alt="SkillSwap" className="w-6 h-6 object-contain rounded-md" />
          <p className="text-base font-semibold text-white tracking-tight">
            SkillSwap
          </p>
        </div>
        <p className="text-xs text-neutral-400">
          Peer-to-peer developer skill exchange platform
        </p>
        <p className="pt-3 text-[11px] font-mono text-neutral-500 tracking-wide">
          PostgreSQL + pgvector &nbsp;•&nbsp; Spring AI &nbsp;•&nbsp; Double-Entry Ledger
        </p>
      </div>
    </footer>
  );
}
