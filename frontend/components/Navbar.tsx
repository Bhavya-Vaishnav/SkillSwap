'use client';

import React, { useState } from 'react';
import {
  Compass,
  BookOpen,
  Calendar,
  Coins,
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  LogIn,
} from 'lucide-react';
import { AuthUser } from '@/lib/apiClient';

interface NavbarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  walletBalance: number;
  pendingSessionsCount?: number;
  currentUser: AuthUser | null;
  onOpenBioScan: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export function Navbar({
  activeTab,
  onNavigate,
  walletBalance,
  pendingSessionsCount = 0,
  currentUser,
  onOpenAuth,
  onLogout,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = currentUser
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'discover', label: 'Discover', icon: Compass },
        { id: 'my-skills', label: 'My Skills', icon: BookOpen },
        {
          id: 'sessions',
          label: 'Sessions',
          icon: Calendar,
          badge: pendingSessionsCount > 0 ? pendingSessionsCount : undefined,
        },
        { id: 'credits', label: 'Credits & Ledger', icon: Coins },
      ]
    : [
        { id: 'landing', label: 'Overview', icon: LayoutDashboard },
      ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div className="flex items-center gap-5 sm:gap-7">
              <button
                type="button"
                onClick={() => handleItemClick('landing')}
                className="flex items-center gap-2.5 text-left group focus:outline-none min-h-[44px] cursor-pointer"
                title="SkillSwap Home"
                aria-label="SkillSwap Home"
              >
                <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-emerald-500/30 group-hover:border-emerald-400 transition-colors bg-neutral-900 shadow-xs">
                  <img src="/logo.png" alt="SkillSwap" className="w-7 h-7 object-contain rounded-lg" />
                </div>
                <div>
                  <span className="font-bold tracking-tight text-base text-neutral-100 group-hover:text-emerald-400 transition-colors">
                    SkillSwap
                  </span>
                  <span className="hidden sm:block text-[10px] text-neutral-400 tracking-wider uppercase font-medium">
                    Peer Skill Exchange
                  </span>
                </div>
              </button>

              {/* Desktop Navigation Links */}
              <nav className="hidden lg:flex items-center gap-1" aria-label="Desktop Navigation">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        handleItemClick(item.id);
                      }}
                      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors duration-75 min-h-[38px] cursor-pointer focus:outline-none focus:ring-0 ${
                        isActive
                          ? 'bg-neutral-800 text-emerald-400 font-semibold border-neutral-700/70 shadow-xs'
                          : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-neutral-400'}`} />
                      <span>{item.label}</span>
                      {item.badge !== undefined && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Right Action Bar */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Credits Balance Pill */}
              {currentUser && (
                <button
                  type="button"
                  onClick={() => handleItemClick('credits')}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/40 transition-all text-xs active:scale-95 min-h-[38px] cursor-pointer"
                  title="View credits & ledger balance"
                  aria-label={`Wallet balance: ${walletBalance} credits`}
                >
                  <Coins className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold text-emerald-400 font-mono">{walletBalance}</span>
                  <span className="text-[10px] text-neutral-400 font-normal">cr</span>
                </button>
              )}

              {/* User Profile / Auth Button */}
              {currentUser ? (
                <div className="hidden lg:flex items-center gap-2 pl-1">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0">
                      {currentUser.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left text-xs max-w-[120px] truncate">
                      <div className="font-medium text-neutral-200 leading-tight truncate">
                        {currentUser.displayName}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onLogout}
                    title="Log out"
                    aria-label="Log out of SkillSwap"
                    className="p-2 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-neutral-900 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-neutral-950 transition-all shadow-xs min-h-[38px] cursor-pointer active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Mobile Drawer Menu Trigger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Panel */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-3 border-t border-neutral-800/80 space-y-3 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                {currentUser ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0">
                        {currentUser.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {currentUser.displayName}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono">{walletBalance} cr available</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onLogout();
                      }}
                      className="p-2 rounded-lg text-neutral-400 hover:text-red-400 cursor-pointer"
                      title="Log out"
                      aria-label="Log out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold bg-emerald-500 text-neutral-950 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In or Register</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemClick(item.id)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-neutral-800 text-emerald-400 font-semibold border border-neutral-700'
                          : 'text-neutral-400 hover:text-white bg-neutral-900/60 border border-neutral-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile & Tablet Bottom Navigation Bar (Screens < 1024px, Authenticated Only) */}
      {currentUser && (
        <nav
          aria-label="Mobile Navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800/90 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
        >
          <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    handleItemClick(item.id);
                  }}
                  className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors duration-75 min-h-[48px] relative cursor-pointer focus:outline-none focus:ring-0 ${
                    isActive
                      ? 'text-emerald-400 bg-neutral-900/90 font-semibold'
                      : 'text-neutral-400 hover:text-neutral-200 active:scale-95'
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
                    {item.badge !== undefined && (
                      <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-neutral-950 min-w-[14px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full">
                    {item.id === 'credits' ? 'Credits' : item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
