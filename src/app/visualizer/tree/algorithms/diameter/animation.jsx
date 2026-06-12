"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Info, Scan, RefreshCw } from "lucide-react";
import {
  VisualizerCard,
  VisualizerInteractiveLayout,
} from "@/app/visualizer/components/VisualizerInteractiveLayout";
import useVisualizerKeyboard from "@/app/hooks/useVisualizerKeyboard";
import PlaybackControls from "@/app/components/ui/PlaybackControls";
import useVisualizerReset from "@/app/hooks/useVisualizerReset";
import { generateDiameterSteps } from "@/features/algorithms/tree/diameterLogic";
import { useAnimationEngine } from "@/lib/visualizer/useAnimationEngine";

const NODES = [
  { id: "A", x: 400, y: 50, parent: null },
  { id: "B", x: 250, y: 120, parent: "A" },
  { id: "C", x: 550, y: 120, parent: "A" },
  { id: "D", x: 150, y: 210, parent: "B" },
  { id: "E", x: 350, y: 210, parent: "B" },
  { id: "F", x: 100, y: 300, parent: "D" },
  { id: "G", x: 200, y: 300, parent: "D" },
  { id: "H", x: 400, y: 300, parent: "E" },
  { id: "I", x: 450, y: 390, parent: "H" },
];

const EDGES = NODES.filter(n => n.parent).map(n => {
  const p = NODES.find(parent => parent.id === n.parent);
  return { id: `${p.id}-${n.id}`, x1: p.x, y1: p.y + 20, x2: n.x, y2: n.y - 20, parent: p.id, child: n.id };
});

export default function DiameterAnimation() {
  const [isCalculated, setIsCalculated] = useState(false);

  const frames = useMemo(() => {
    if (!isCalculated) return [];
    return generateDiameterSteps();
  }, [isCalculated]);

  const engine = useAnimationEngine({ steps: frames, initialSpeed: 1600 });

  useVisualizerReset(() => {
    setIsCalculated(false);
    engine.reset();
  });

  const handleFindDiameter = () => {
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

  const activeNodes = currentStep ? currentStep.activeNodes : [];
  const calculatedHeights = currentStep ? currentStep.calculatedHeights : {};
  const maxDiameter = currentStep ? currentStep.maxDiameter : 0;
  const diameterPathEdges = currentStep ? currentStep.diameterPathEdges : [];
  const diameterPathNodes = currentStep ? currentStep.diameterPathNodes : [];
  const message = currentStep ? currentStep.message : "Click 'Find Diameter' to calculate subtree heights.";

  return (
    <VisualizerInteractiveLayout>
      <VisualizerCard>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4 text-cyan-600 dark:text-cyan-400 font-mono bg-cyan-50 dark:bg-cyan-950/30 px-4 py-2 rounded-lg border border-cyan-200 dark:border-cyan-900/50">
            Max Diameter: <span className="text-xl font-bold ml-2 text-cyan-700 dark:text-cyan-300">{maxDiameter}</span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleFindDiameter} 
              disabled={engine.isPlaying || isCalculated}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-[#a435f0] hover:bg-[#8f2cd6] disabled:opacity-50 text-white rounded-xl transition-all shadow-md"
            >
              <Scan className="w-4 h-4" /> Find Diameter
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
          diameterPathEdges.length > 0
            ? "border-cyan-200 bg-cyan-50 dark:border-cyan-900 dark:bg-cyan-950/30"
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
          <svg width="800" height="420" viewBox="0 0 800 420" className="max-w-full h-auto drop-shadow-sm">
            {/* Edges */}
            {EDGES.map(e => {
              const isPath = diameterPathEdges.includes(e.id) || diameterPathEdges.includes(`${e.child}-${e.parent}`);
              
              return (
                <line 
                  key={e.id} 
                  x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} 
                  stroke={isPath ? "#06b6d4" : "#cbd5e1"} 
                  strokeWidth={isPath ? "5" : "2"}
                  className={`transition-all duration-500 ${!isPath && 'dark:stroke-slate-700'}`}
                />
              );
            })}

            {/* Nodes */}
            {NODES.map(node => {
              const isActive = activeNodes.includes(node.id);
              const isPath = diameterPathNodes.includes(node.id);
              const h = calculatedHeights[node.id];
              
              let fill = "var(--background)";
              let stroke = "#94a3b8"; // slate-400
              let r = "20";
              let textFill = "var(--foreground)";

              if (isPath) {
                fill = "#cffafe"; // cyan-100
                stroke = "#06b6d4"; // cyan-500
                r = "26";
                textFill = "#164e63"; // cyan-900
              } else if (isActive) {
                fill = "#ecfeff"; // cyan-50
                stroke = "#06b6d4";
                r = "24";
                textFill = "#164e63";
              } else if (h !== undefined) {
                stroke = "#0891b2"; // cyan-600
              }

              return (
                <g key={node.id} className="transition-all duration-500">
                  {isPath && <circle cx={node.x} cy={node.y} r="32" fill="none" stroke="#22d3ee" strokeWidth="2" className="opacity-80 animate-ping" />}
                  {isActive && <circle cx={node.x} cy={node.y} r="30" fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="4,2" className="animate-spin-slow opacity-80" />}
                  
                  <circle 
                    cx={node.x} cy={node.y} r={r} 
                    fill={fill} stroke={stroke} strokeWidth="2.5" 
                    className="shadow-sm transition-all duration-500 dark:stroke-slate-600" 
                  />
                  <text x={node.x} y={node.y + 4} textAnchor="middle" fill={textFill} fontSize="12" fontWeight="bold" className="transition-colors">{node.id}</text>
                  
                  {/* Height Indicator Label */}
                  {h !== undefined && (
                    <text x={node.x + 28} y={node.y + 4} fill="#06b6d4" fontSize="12" fontWeight="bold">h:{h}</text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </VisualizerCard>
    </VisualizerInteractiveLayout>
  );
}
