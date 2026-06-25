export default function PlayerSpeedometer({ cpm = 0 }) {
  const maxCpm = 400; // max speed for visual scaling
  const fillPct = Math.min((cpm / maxCpm) * 100, 100);

  let speedColor = "bg-slate-400";
  if (cpm > 50) speedColor = "bg-emerald-500";
  if (cpm > 150) speedColor = "bg-amber-500";
  if (cpm > 250) speedColor = "bg-red-500";
  if (cpm > 350) speedColor = "bg-purple-500";

  return (
    <div className="w-full max-w-[200px] mt-2 group relative">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Speed</span>
        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
          {cpm} <span className="text-[9px] text-slate-400 font-sans">CPM</span>
        </span>
      </div>
      <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${speedColor} transition-all duration-300 ease-out`}
          style={{ width: `${fillPct}%` }}
        />
      </div>
    </div>
  );
}
