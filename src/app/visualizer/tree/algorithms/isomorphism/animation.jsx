"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Play, Info, RefreshCw } from "lucide-react";
import {
  VisualizerCard,
  VisualizerInteractiveLayout,
} from "@/app/visualizer/components/VisualizerInteractiveLayout";
import useVisualizerKeyboard from "@/app/hooks/useVisualizerKeyboard";
import PlaybackControls from "@/app/components/ui/PlaybackControls";
import useVisualizerReset from "@/app/hooks/useVisualizerReset";
import { generateIsomorphismSteps } from "@/features/algorithms/tree/isomorphismLogic";
import { useAnimationEngine } from "@/lib/visualizer/useAnimationEngine";

// Tree 1 Setup
const NODES1 = [
  { id: "1-1", val: "1", x: 200, y: 50, parent: null },
  { id: "1-2", val: "2", x: 100, y: 150, parent: "1-1", isLeft: true },
  { id: "1-3", val: "3", x: 300, y: 150, parent: "1-1", isLeft: false },
  { id: "1-4", val: "4", x: 50, y: 250, parent: "1-2", isLeft: true },
  { id: "1-5", val: "5", x: 150, y: 250, parent: "1-2", isLeft: false },
];

const EDGES1 = NODES1.filter(n => n.parent).map(n => {
  const p = NODES1.find(parent => parent.id === n.parent);
  return { id: `${p.id}-${n.id}`, x1: p.x, y1: p.y + 20, x2: n.x, y2: n.y - 20, parent: p.id, child: n.id };
});

// Tree 2 Setup (Isomorphic, 2 and 3 swapped, 4 and 5 swapped under 2)
const NODES2 = [
  { id: "2-1", val: "1", x: 600, y: 50, parent: null },
  { id: "2-3", val: "3", x: 500, y: 150, parent: "2-1", isLeft: true }, // swapped
  { id: "2-2", val: "2", x: 700, y: 150, parent: "2-1", isLeft: false }, // swapped
  { id: "2-5", val: "5", x: 650, y: 250, parent: "2-2", isLeft: true }, // swapped
  { id: "2-4", val: "4", x: 750, y: 250, parent: "2-2", isLeft: false }, // swapped
];

const EDGES2 = NODES2.filter(n => n.parent).map(n => {
  const p = NODES2.find(parent => parent.id === n.parent);
  return { id: `${p.id}-${n.id}`, x1: p.x, y1: p.y + 20, x2: n.x, y2: n.y - 20, parent: p.id, child: n.id };
});

export default function IsomorphismAnimation() {
  const [isCalculated, setIsCalculated] = useState(false);

  const frames = useMemo(() => {
    if (!isCalculated) return [];
    return generateIsomorphismSteps();
  }, [isCalculated]);

  const engine = useAnimationEngine({ steps: frames, initialSpeed: 1600 });

  useVisualizerReset(() => {
    setIsCalculated(false);
    engine.reset();
  });

  const handleCheck = () => {
    setIsCalculated(true);
    engine.reset();
    engine.play();
  };

  const handleReset = () => {
    setIsCalculated(false);
    engine.reset();
  };

  const togglePlay = () => {
    if (engine.currentStep === frames.length - 1 && frames.length > 0) {
      engine.reset();
    } else if (engine.isPlaying) {
      engine.pause();
    } else {
      engine.play();
    }
  };

  useEffect(() => {
    if (
      engine.currentStep === frames.length - 1 &&
      frames.length > 0 &&
      !engine.isPlaying
    ) {
      // Auto pause at the end
    }
  }, [engine.currentStep, frames, engine.isPlaying, engine]);

  useVisualizerKeyboard({
    onStepForward: engine.stepForward,
    onStepBackward: engine.stepBackward,
    onTogglePlay: togglePlay,
    onReset: handleReset,
    onSpeedChange: (s) => engine.setSpeed(s * 1000),
    speed: engine.speed / 1000,
    sorting: engine.isPlaying,
    sorted: false,
    enabled: true,
  });

  const currentStep =
    frames.length > 0 && engine.currentStep >= 0
      ? frames[engine.currentStep]
      : null;

  const activePairs = currentStep ? currentStep.activePairs : [];
  const matchStatus = currentStep ? currentStep.matchStatus : {};
  const isomorphic = currentStep ? currentStep.isomorphicResult : null;
  const message = currentStep ? currentStep.message : "Click 'Check Isomorphism' to compare the two trees step-by-step.";

  return (
    <VisualizerInteractiveLayout>
      <VisualizerCard>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4 text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
            Result: <span className="text-xl font-bold ml-2 text-emerald-700 dark:text-emerald-300">{isomorphic === null ? "?" : (isomorphic ? "True" : "False")}</span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleCheck} 
              disabled={engine.isPlaying || isCalculated}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-[#a435f0] hover:bg-[#8f2cd6] disabled:opacity-50 text-white rounded-xl transition-all shadow-md"
            >
              <Play className="w-4 h-4 fill-white" /> Check Isomorphism
            </button>
            <button 
              onClick={handleReset} 
              className="px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all border border-red-500/30 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>

        <PlaybackControls 
          isPlaying={engine.isPlaying}
          onPlayPause={togglePlay}
          onStepForward={engine.stepForward}
          onStepBackward={engine.stepBackward}
          onReset={() => { engine.reset(); }}
          speed={engine.speed / 1000}
          onSpeedChange={(s) => engine.setSpeed(s * 1000)}
          disabled={frames.length === 0}
          showPlayPause={true}
        />
      </VisualizerCard>

      <VisualizerCard
        className={
          isomorphic !== null
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
            : engine.isPlaying
                ? "border-[#a435f0]/30 bg-[#a435f0]/10 dark:border-[#a435f0]/50 dark:bg-[#a435f0]/20"
                : ""
        }
      >
        <div className="flex items-center text-xs text-gray-500 font-semibold gap-1.5 mb-2">
          <Info className="w-4 h-4 text-[#a435f0]" /> Animation Status
          <span className="ml-auto font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-400">
            Step {engine.currentStep !== -1 ? engine.currentStep + 1 : 0} / {frames.length || 0}
          </span>
        </div>
        <div className="text-lg font-medium min-h-[28px]">{message}</div>
      </VisualizerCard>

      <VisualizerCard>
        <div className="overflow-auto flex justify-center py-6 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 relative min-h-[500px]">
          <svg width="800" height="350" viewBox="0 0 800 350" className="max-w-full h-auto drop-shadow-sm">
            {/* Divider */}
            <line x1="400" y1="0" x2="400" y2="350" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,5" className="dark:stroke-slate-700" />
            <text x="200" y="20" fill="var(--foreground)" fontSize="16" fontWeight="bold" textAnchor="middle">Tree 1</text>
            <text x="600" y="20" fill="var(--foreground)" fontSize="16" fontWeight="bold" textAnchor="middle">Tree 2</text>

            {/* Tree 1 Edges */}
            {EDGES1.map(e => <line key={e.id} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="#cbd5e1" strokeWidth="2" className="dark:stroke-slate-700 transition-colors" />)}
            {/* Tree 2 Edges */}
            {EDGES2.map(e => <line key={e.id} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="#cbd5e1" strokeWidth="2" className="dark:stroke-slate-700 transition-colors" />)}

            {/* Active Comparison Indicator */}
            {activePairs.length === 2 && (
              <path 
                d={`M ${NODES1.find(n => n.id === activePairs[0]).x} ${NODES1.find(n => n.id === activePairs[0]).y} Q 400 0 ${NODES2.find(n => n.id === activePairs[1]).x} ${NODES2.find(n => n.id === activePairs[1]).y}`}
                fill="none"
                stroke="#a435f0"
                strokeWidth="2"
                strokeDasharray="5,5"
                className="opacity-60 animate-pulse"
              />
            )}

            {/* Tree 1 Nodes */}
            {NODES1.map(node => {
              const isActive = activePairs[0] === node.id;
              let stroke = "#94a3b8"; // slate-400
              let fill = "var(--background)";
              let textFill = "var(--foreground)";
              
              if (isActive) {
                stroke = "#a435f0";
                fill = "#f3e8ff"; // purple-100
                textFill = "#6b21a8"; // purple-800
              }

              // Check if involved in a match/mismatch
              Object.entries(matchStatus).forEach(([pairKey, status]) => {
                if (pairKey.startsWith(node.id + "_")) {
                  if (status === "match") { stroke = "#10b981"; fill = "#d1fae5"; textFill = "#047857"; } // emerald
                  if (status === "mismatch") { stroke = "#ef4444"; fill = "#fee2e2"; textFill = "#b91c1c"; } // red
                }
              });

              return (
                <g key={node.id} className="transition-all duration-300">
                  {isActive && <circle cx={node.x} cy={node.y} r="30" fill="none" stroke="#d8b4fe" strokeWidth="2" strokeDasharray="4,2" className="animate-spin-slow opacity-80" />}
                  <circle cx={node.x} cy={node.y} r="24" fill={fill} stroke={stroke} strokeWidth="2.5" className="shadow-sm transition-all duration-300 dark:stroke-slate-600" />
                  <text x={node.x} y={node.y + 5} textAnchor="middle" fill={textFill} fontSize="14" fontWeight="bold" className="transition-colors">{node.val}</text>
                </g>
              );
            })}

            {/* Tree 2 Nodes */}
            {NODES2.map(node => {
              const isActive = activePairs[1] === node.id;
              let stroke = "#94a3b8";
              let fill = "var(--background)";
              let textFill = "var(--foreground)";
              
              if (isActive) {
                stroke = "#a435f0";
                fill = "#f3e8ff";
                textFill = "#6b21a8";
              }

              Object.entries(matchStatus).forEach(([pairKey, status]) => {
                if (pairKey.endsWith("_" + node.id)) {
                  if (status === "match") { stroke = "#10b981"; fill = "#d1fae5"; textFill = "#047857"; }
                  if (status === "mismatch") { stroke = "#ef4444"; fill = "#fee2e2"; textFill = "#b91c1c"; }
                }
              });

              return (
                <g key={node.id} className="transition-all duration-300">
                  {isActive && <circle cx={node.x} cy={node.y} r="30" fill="none" stroke="#d8b4fe" strokeWidth="2" strokeDasharray="4,2" className="animate-spin-slow opacity-80" />}
                  <circle cx={node.x} cy={node.y} r="24" fill={fill} stroke={stroke} strokeWidth="2.5" className="shadow-sm transition-all duration-300 dark:stroke-slate-600" />
                  <text x={node.x} y={node.y + 5} textAnchor="middle" fill={textFill} fontSize="14" fontWeight="bold" className="transition-colors">{node.val}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </VisualizerCard>
    </VisualizerInteractiveLayout>
  );
}
