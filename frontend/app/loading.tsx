export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 animate-in fade-in duration-200">
        <div className="relative flex items-center justify-center">
          {/* Ambient emerald glow */}
          <div className="absolute w-20 h-20 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
          {/* Official SkillSwap Logo */}
          <div className="relative w-14 h-14 rounded-2xl bg-neutral-900 border border-emerald-500/40 flex items-center justify-center p-2.5 shadow-2xl shadow-emerald-500/10">
            <img src="/logo.png" alt="SkillSwap" className="w-full h-full object-contain" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-sm font-bold text-white tracking-tight">SkillSwap</span>
          <span className="text-[11px] text-neutral-400 font-medium">Loading your peer workspace...</span>
        </div>

        {/* Sleek animated progress line */}
        <div className="w-36 h-1 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800 mt-1">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full animate-pulse" style={{ width: '70%' }} />
        </div>
      </div>
    </div>
  );
}
