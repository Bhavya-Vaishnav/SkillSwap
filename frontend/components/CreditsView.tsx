'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Coins,
  ShieldCheck,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  RefreshCw,
  Send,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  apiClient,
  LedgerEntryResponse,
  TransferRequest,
} from '@/lib/apiClient';

interface CreditsViewProps {
  walletBalance: number;
  onRefreshBalance?: () => void;
  onToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function CreditsView({
  walletBalance,
  onRefreshBalance,
  onToast,
}: CreditsViewProps) {
  const [history, setHistory] = useState<LedgerEntryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'BONUS' | 'SESSIONS' | 'TRANSFERS' | 'IN' | 'OUT'>('ALL');
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  // Transfer form state
  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState<string>('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (onToast) {
      onToast(msg, type);
    }
  };

  const fetchHistory = useCallback(async () => {
    if (!apiClient.isAuthenticated()) return;
    setLoading(true);
    try {
      const res = await apiClient.ledger.getHistory();
      setHistory(res || []);
    } catch {
      // If error occurs, keep existing history
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRefresh = () => {
    if (onRefreshBalance) onRefreshBalance();
    fetchHistory();
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setTransferError('Please enter a valid credit amount greater than 0.');
      return;
    }
    if (parsedAmount > walletBalance) {
      setTransferError(`Insufficient balance. You have ${walletBalance} credits available.`);
      return;
    }
    if (!toUserId.trim()) {
      setTransferError('Please provide a valid recipient User UUID.');
      return;
    }

    setIsSubmitting(true);
    try {
      const req: TransferRequest = {
        toUserId: toUserId.trim(),
        amount: parsedAmount,
        entryType: 'ADJUSTMENT',
      };
      await apiClient.ledger.transfer(req);
      showToast(`Successfully transferred ${parsedAmount} credits to peer!`, 'success');
      setIsTransferOpen(false);
      setToUserId('');
      setAmount('10');
      handleRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transfer failed. Please check recipient UUID.';
      setTransferError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEntryBadge = (item: LedgerEntryResponse) => {
    const isCredit = item.amount > 0;

    if (item.entryType === 'SIGNUP_BONUS') {
      return {
        label: 'Signup Welcome Bonus',
        icon: Sparkles,
        badgeClass: 'badge-purple',
        iconBg: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
        amountColor: 'text-purple-400',
      };
    }

    if (item.entryType === 'SESSION_PAYMENT') {
      if (isCredit) {
        return {
          label: 'Session Earning',
          icon: ArrowDownLeft,
          badgeClass: 'badge-emerald',
          iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
          amountColor: 'text-emerald-400',
        };
      } else {
        return {
          label: 'Session Payment',
          icon: ArrowUpRight,
          badgeClass: 'badge-amber',
          iconBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
          amountColor: 'text-rose-400',
        };
      }
    }

    if (item.entryType === 'ADJUSTMENT') {
      if (isCredit) {
        return {
          label: 'Peer Transfer Received',
          icon: ArrowDownLeft,
          badgeClass: 'badge-cyan',
          iconBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
          amountColor: 'text-cyan-400',
        };
      } else {
        return {
          label: 'Peer Transfer Sent',
          icon: ArrowUpRight,
          badgeClass: 'badge-rose',
          iconBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
          amountColor: 'text-rose-400',
        };
      }
    }

    return {
      label: 'Adjustment',
      icon: RefreshCw,
      badgeClass: 'badge-neutral',
      iconBg: 'bg-neutral-800 border-neutral-700 text-neutral-400',
      amountColor: isCredit ? 'text-emerald-400' : 'text-rose-400',
    };
  };

  const filteredHistory = history.filter((item) => {
    if (filter === 'ALL') return true;
    if (filter === 'BONUS') return item.entryType === 'SIGNUP_BONUS';
    if (filter === 'SESSIONS') return item.entryType === 'SESSION_PAYMENT';
    if (filter === 'TRANSFERS') return item.entryType === 'ADJUSTMENT';
    if (filter === 'IN') return item.amount > 0;
    if (filter === 'OUT') return item.amount < 0;
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5 sm:pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Credits & Ledger
            </h1>
            <span className="badge-emerald text-[11px]">
              <ShieldCheck className="w-3 h-3" />
              Double-Entry Invariant
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Real-time balance and immutable audit logs tracked by atomic PostgreSQL double-entry transactions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="btn-secondary"
            title="Refresh balance and history"
            aria-label="Refresh balance and history"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTransferOpen(true)}
            className="btn-primary"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Transfer Credits</span>
          </button>
        </div>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Available Balance Hero */}
        <div className="card-base p-6 shadow-xs relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium uppercase tracking-wider">
            <span>Available Balance</span>
            <Coins className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-4xl font-extrabold text-white tracking-tight font-mono">
            {walletBalance}{' '}
            <span className="text-base font-normal text-neutral-400 font-sans">credits</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Ready for skill swap session escrow or direct peer transfers.
          </p>
        </div>

        {/* Double-Entry Ledger Integrity */}
        <div className="card-base p-6 space-y-3">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium uppercase tracking-wider">
            <span>Ledger Invariant</span>
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-sm font-semibold text-neutral-200">
            Zero-Sum Double-Entry
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            All peer exchanges record balanced debit/credit rows (+X / -X), while welcome credits (100 cr) are minted from the system reserve upon registration.
          </p>
        </div>

        {/* Transaction Logs */}
        <div className="card-base p-6 sm:col-span-2 lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium uppercase tracking-wider">
            <span>Audit Trail</span>
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-4xl font-extrabold text-white tracking-tight font-mono">
            {history.length}{' '}
            <span className="text-base font-normal text-neutral-400 font-sans">records</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Append-only journal entries directly synced with PostgreSQL.
          </p>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Transaction History
            </h2>
            <p className="text-xs text-neutral-400">
              Immutable journal of all credit events for your account.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-900/80 border border-neutral-800 self-start sm:self-auto text-xs font-medium flex-wrap">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All ({history.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('BONUS')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                filter === 'BONUS'
                  ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40 shadow-xs'
                  : 'text-neutral-400 hover:text-purple-300'
              }`}
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Signup Bonus</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('SESSIONS')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                filter === 'SESSIONS'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'text-neutral-400 hover:text-emerald-300'
              }`}
            >
              <ArrowRightLeft className="w-3 h-3 text-emerald-400" />
              <span>Sessions</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('TRANSFERS')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                filter === 'TRANSFERS'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-xs'
                  : 'text-neutral-400 hover:text-cyan-300'
              }`}
            >
              <Send className="w-3 h-3 text-cyan-400" />
              <span>Transfers</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('IN')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filter === 'IN'
                  ? 'bg-neutral-800 text-emerald-400 shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Credits In (+)
            </button>
            <button
              type="button"
              onClick={() => setFilter('OUT')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filter === 'OUT'
                  ? 'bg-neutral-800 text-rose-400 shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Credits Out (-)
            </button>
          </div>
        </div>

        {/* History Table / Card List */}
        {filteredHistory.length === 0 ? (
          <div className="card-base p-12 text-center border-dashed space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center text-neutral-400 mx-auto">
              <Coins className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">No transactions found</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              {filter === 'ALL'
                ? 'Your transaction history is empty. Complete a skill session or transfer credits to view ledger entries.'
                : 'No transactions match the selected filter.'}
            </p>
          </div>
        ) : (
          <div className="card-base overflow-hidden divide-y divide-neutral-800/80">
            {filteredHistory.map((item) => {
              const badge = getEntryBadge(item);
              const isCredit = item.amount > 0;
              const absAmount = Math.abs(item.amount);
              const formattedDate = new Date(item.createdAt).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-neutral-900/60 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${badge.iconBg}`}
                    >
                      <badge.icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white truncate">
                          {badge.label}
                        </span>
                        <span className={badge.badgeClass}>
                          {item.entryType}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-neutral-400 truncate">
                        <span>{formattedDate}</span>
                        {item.referenceId && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[11px] text-neutral-500 truncate">
                              Ref: {item.referenceId.substring(0, 8)}...
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-base sm:text-lg font-bold font-mono ${badge.amountColor}`}
                    >
                      {isCredit ? '+' : '-'}
                      {absAmount} cr
                    </div>
                    <div className="text-[10px] font-mono text-neutral-500">
                      ID: {item.id.substring(0, 8)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Accounting Principles */}
      <div className="card-base p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
          <span>PostgreSQL Double-Entry Accounting Invariants</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-neutral-400">
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1.5">
            <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Signup Bonus Invariant</span>
            </div>
            <p className="leading-relaxed">
              New accounts receive a one-time 100-credit bonus directly from the system reserve account upon registration.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1.5">
            <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Session Escrow Invariant</span>
            </div>
            <p className="leading-relaxed">
              Credits are held in session escrow during active proposals and atomically transferred upon learner completion.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1.5">
            <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Concurrency & Audit</span>
            </div>
            <p className="leading-relaxed">
              Deterministic row ordering in PostgreSQL transactions prevents deadlocks during rapid concurrent peer transfers.
            </p>
          </div>
        </div>
      </div>

      {/* Direct Peer Transfer Modal */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Transfer Credits</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Close transfer modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              {transferError && (
                <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs">
                  {transferError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-300">
                  Recipient User UUID
                </label>
                <input
                  type="text"
                  value={toUserId}
                  onChange={(e) => setToUserId(e.target.value)}
                  placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                  className="input-base font-mono"
                  required
                />
                <p className="text-[11px] text-neutral-500">
                  Enter the exact User UUID of the peer you wish to send credits to.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Amount (credits)
                  </label>
                  <span className="text-xs text-neutral-400">
                    Available: <strong className="text-emerald-400 font-mono">{walletBalance} cr</strong>
                  </span>
                </div>
                <input
                  type="number"
                  min={0.01}
                  max={walletBalance}
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-base font-mono"
                  required
                />
              </div>

              {/* Amount Quick Presets */}
              <div className="flex items-center gap-1.5">
                {[5, 10, 25, 50].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(String(preset))}
                    disabled={preset > walletBalance}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-neutral-950 border border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {preset} cr
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmount(String(walletBalance))}
                  disabled={walletBalance <= 0}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  Max
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || walletBalance <= 0}
                  className="btn-primary text-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Transferring...' : 'Send Credits'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
