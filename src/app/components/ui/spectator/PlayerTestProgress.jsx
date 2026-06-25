export default function PlayerTestProgress({ passed = 0, total = 0, failedAttempts = 0, status = "Idle" }) {
  const isTesting = status === "Testing Code...";
  const fillPct = total > 0 ? (passed / total) * 100 : 0;
  
  return (
    <div className="w-full max-w-[200px] mt-4 flex flex-col gap-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Test Cases</span>
        {failedAttempts > 0 && (
          <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md">
            Failed Attempts: {failedAttempts}
          </span>
        )}
      </div>
      
      <div className="relative h-4 w-full bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner">
        {/* Animated testing bar */}
        {isTesting && (
          <div className="absolute inset-0 bg-blue-500/30 animate-pulse" />
        )}
        
        {/* Actual progress bar */}
        <div 
          className="h-full bg-emerald-500 transition-all duration-500 ease-out flex items-center justify-end pr-1"
          style={{ width: `${fillPct}%` }}
        >
          {fillPct > 15 && <span className="text-[8px] text-white font-bold">{passed}/{total}</span>}
        </div>
      </div>
    </div>
  );
}
