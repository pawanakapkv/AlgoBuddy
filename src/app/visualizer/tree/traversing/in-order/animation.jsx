"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  VisualizerCard,
  VisualizerInteractiveLayout,
} from "@/app/visualizer/components/VisualizerInteractiveLayout";
import useVisualizerKeyboard from "@/app/hooks/useVisualizerKeyboard";
import PlaybackControls from "@/app/components/ui/PlaybackControls";
import useVisualizerReset from "@/app/hooks/useVisualizerReset";
import { useAnimationEngine } from "@/lib/visualizer/useAnimationEngine";

class TreeNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

export default function InOrderVisualizer() {
  const [root, setRoot] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [isCalculated, setIsCalculated] = useState(false);

  const insertNode = (node, value) => {
    if (!node) return new TreeNode(value);
    if (value < node.value) {
      return { ...node, left: insertNode(node.left, value) };
    }
    if (value > node.value) {
      return { ...node, right: insertNode(node.right, value) };
    }
    return node;
  };

  const handleInsert = () => {
    const value = parseInt(inputValue, 10);
    if (Number.isNaN(value)) {
      alert("Please enter a valid number");
      return;
    }
    setRoot((prev) => insertNode(prev, value));
    setInputValue("");
    setIsCalculated(false);
  };

  const generateRandomTree = () => {
    const size = Math.floor(Math.random() * 5) + 5;
    const values = Array.from({ length: size }, () => Math.floor(Math.random() * 100) + 1);

    let newRoot = null;
    values.forEach((value) => {
      newRoot = insertNode(newRoot, value);
    });

    setRoot(newRoot);
    setIsCalculated(false);
  };

  const inOrderTraversal = (node, path = []) => {
    if (!node) return path;
    const leftPath = inOrderTraversal(node.left, path);
    leftPath.push({
      value: node.value,
      action: "visit",
      highlighted: true,
    });
    return inOrderTraversal(node.right, leftPath);
  };

  const frames = useMemo(() => {
    if (!isCalculated || !root) return [];
    return inOrderTraversal(root);
  }, [isCalculated, root]);

  const engine = useAnimationEngine({ steps: frames, initialSpeed: 1000 });

  const reset = () => {
    setRoot(null);
    setInputValue("");
    setIsCalculated(false);
    engine.reset();
  };

  useVisualizerReset(reset);

  const visualizeInOrder = () => {
    if (!root) {
      alert("Tree is empty!");
      return;
    }
    setIsCalculated(true);
    engine.reset();
    engine.play();
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

  useVisualizerKeyboard({
    onStepForward: engine.stepForward,
    onStepBackward: engine.stepBackward,
    onTogglePlay: togglePlay,
    onReset: reset,
    onSpeedChange: (s) => engine.setSpeed(s * 1000),
    speed: engine.speed / 1000,
    sorting: engine.isPlaying,
    sorted: false,
    enabled: true,
  });

  const renderTree = (node, x = 400, y = 50, level = 0, nodes = [], edges = []) => {
    if (!node) return { nodes, edges };

    const nodeRadius = 25;
    const xOffset = Math.max(50, 200 / (level + 1));
    const yOffset = 80;

    // Check if node is highlighted in current or previous frames
    let highlighted = false;
    if (isCalculated && engine.currentStep >= 0) {
        // If this node was visited at or before the current step
        highlighted = frames.slice(0, engine.currentStep + 1).some(f => f.value === node.value);
    }

    nodes.push({
      value: node.value,
      x,
      y,
      highlighted,
    });

    if (node.left) {
      const leftX = x - xOffset;
      const leftY = y + yOffset;
      edges.push({
        x1: x,
        y1: y + nodeRadius,
        x2: leftX,
        y2: leftY - nodeRadius,
      });
      renderTree(node.left, leftX, leftY, level + 1, nodes, edges);
    }

    if (node.right) {
      const rightX = x + xOffset;
      const rightY = y + yOffset;
      edges.push({
        x1: x,
        y1: y + nodeRadius,
        x2: rightX,
        y2: rightY - nodeRadius,
      });
      renderTree(node.right, rightX, rightY, level + 1, nodes, edges);
    }

    return { nodes, edges };
  };

  const { nodes, edges } = root ? renderTree(root) : { nodes: [], edges: [] };

  const getSvgDimensions = () => {
    if (nodes.length === 0) return { width: 800, height: 400 };

    const xValues = nodes.map((node) => node.x);
    const yValues = nodes.map((node) => node.y);
    const padding = 50;

    return {
      width: Math.max(800, Math.max(...xValues) - Math.min(...xValues) + 2 * padding),
      height: Math.max(400, Math.max(...yValues) + 2 * padding),
    };
  };

  const svgDimensions = getSvgDimensions();
  const currentTraversalResult = frames.slice(0, engine.currentStep + 1).map(f => f.value);

  const getMessage = () => {
    if (!root) return "Tree is empty";
    if (!isCalculated) return `Ready to traverse tree with ${nodes.length} nodes`;
    if (engine.currentStep === frames.length - 1) return `In-order traversal complete: [${frames.map((node) => node.value).join(", ")}]`;
    return "Performing in-order traversal...";
  };

  return (
    <VisualizerInteractiveLayout>
      <VisualizerCard>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <button
              onClick={generateRandomTree}
              disabled={engine.isPlaying}
              className="mb-2 w-full rounded-lg bg-[#a435f0] px-4 py-2 text-white transition-colors hover:bg-[#8f2cd6] disabled:opacity-50"
            >
              Generate Random Tree
            </button>
            <div className="flex gap-2">
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter number"
                className="flex-1 rounded-lg border p-2 transition-all focus:border-transparent focus:ring-2 focus:ring-[#a435f0] dark:bg-gray-700"
                disabled={engine.isPlaying}
                onKeyDown={(e) => e.key === "Enter" && handleInsert()}
              />
              <button
                onClick={handleInsert}
                disabled={engine.isPlaying}
                className="rounded-lg bg-[#a435f0] px-4 py-2 text-white transition-colors hover:bg-[#8f2cd6] disabled:opacity-50"
              >
                Insert
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={visualizeInOrder}
              disabled={!root || engine.isPlaying || isCalculated}
              className="w-full rounded-lg bg-[#a435f0] px-4 py-2 text-white transition-colors hover:bg-[#8f2cd6] disabled:opacity-50"
            >
              Start Traversal
            </button>
            <button
              onClick={reset}
              className="w-full rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
            >
              Reset All
            </button>
          </div>
        </div>

        {frames.length > 0 && (
          <div className="mt-6">
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
          </div>
        )}
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex-1 rounded-lg bg-gray-100 p-2 text-center dark:bg-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">Nodes</div>
              <div className="font-bold">{nodes.length}</div>
            </div>
            <div className="flex-1 rounded-lg bg-gray-100 p-2 text-center dark:bg-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">Steps</div>
              <div className="font-bold">{engine.currentStep + 1} / {frames.length}</div>
            </div>
          </div>
        </div>
      </VisualizerCard>

      <VisualizerCard
        className={
          engine.currentStep === frames.length - 1 && frames.length > 0
            ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
            : engine.isPlaying
              ? "border-[#a435f0]/30 bg-[#a435f0]/10 dark:border-[#a435f0]/50 dark:bg-[#a435f0]/20"
              : ""
        }
      >
        <p className="text-center font-medium">{getMessage()}</p>
      </VisualizerCard>

      <VisualizerCard>
        <h2 className="mb-3 text-lg font-semibold">Tree Visualization</h2>
        <div className="flex min-h-[400px] justify-center overflow-auto py-4">
          {nodes.length > 0 ? (
            <div className="relative" style={{ minWidth: `${svgDimensions.width}px` }}>
              <svg
                width={svgDimensions.width}
                height={svgDimensions.height}
                viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
                className="mx-auto"
              >
                {edges.map((edge, i) => (
                  <line
                    key={i}
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke="#94a3b8"
                    strokeWidth="2"
                    className="dark:stroke-gray-600"
                  />
                ))}
                {nodes.map((node, i) => {
                  const isCurrentTarget = isCalculated && engine.currentStep >= 0 && frames[engine.currentStep].value === node.value;
                  return (
                    <g key={i}>
                      {isCurrentTarget && <circle cx={node.x} cy={node.y} r="30" fill="none" stroke="#fcd34d" strokeWidth="2" strokeDasharray="4,2" className="animate-spin-slow opacity-80" />}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="22"
                        fill={node.highlighted ? "#a435f0" : "#d38cff"}
                        stroke={node.highlighted ? "#8710d8" : "#a435f0"}
                        strokeWidth="2"
                        className={`transition-colors ${isCurrentTarget ? "animate-pulse shadow-lg scale-110 shadow-[#a435f0]" : ""}`}
                      />
                      <text
                        x={node.x}
                        y={node.y + 5}
                        textAnchor="middle"
                        fill={node.highlighted ? "white" : "black"}
                        fontSize="13"
                        fontWeight="600"
                      >
                        {node.value}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed text-gray-500 dark:border-gray-700 dark:text-gray-400">
              {engine.isPlaying ? "Traversing..." : "No tree generated yet"}
            </div>
          )}
        </div>

        {currentTraversalResult.length > 0 && (
          <div className="mt-4 rounded-lg border border-[#a435f0]/30 bg-[#a435f0]/10 p-3 text-center dark:border-[#a435f0]/50 dark:bg-[#a435f0]/20">
            <span className="font-medium">Path: </span>
            <span className="text-[#a435f0] dark:text-[#d38cff] font-bold">
              [{currentTraversalResult.join(", ")}]
            </span>
          </div>
        )}
      </VisualizerCard>

      <VisualizerCard>
        <h2 className="mb-3 text-lg font-semibold">About In-Order Traversal</h2>
        <div className="space-y-4">
          <div className="prose text-sm dark:prose-invert">
            <p>Visits nodes in the order:</p>
            <ol className="space-y-1 pl-5">
              <li>Left subtree</li>
              <li>Root node</li>
              <li>Right subtree</li>
            </ol>
            <p className="mt-2">For BSTs, this produces nodes in sorted order.</p>
          </div>

          <div className="rounded-lg border border-[#a435f0]/30 bg-[#a435f0]/10 p-3 dark:border-[#a435f0]/50 dark:bg-[#a435f0]/20">
            <h3 className="mb-2 text-sm font-medium text-[#a435f0] dark:text-[#d38cff]">Algorithm:</h3>
            <pre className="overflow-x-auto rounded bg-white dark:bg-gray-800 p-2 text-xs">
{`function inOrder(node) {
  if (node !== null) {
    inOrder(node.left);
    visit(node);
    inOrder(node.right);
  }
}`}
            </pre>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-gray-100 p-2 text-center dark:bg-gray-700">
              <div className="text-gray-500 dark:text-gray-400">Time</div>
              <div className="font-bold">O(n)</div>
            </div>
            <div className="rounded-lg bg-gray-100 p-2 text-center dark:bg-gray-700">
              <div className="text-gray-500 dark:text-gray-400">Space</div>
              <div className="font-bold">O(h)</div>
            </div>
          </div>
        </div>
      </VisualizerCard>
    </VisualizerInteractiveLayout>
  );
}
