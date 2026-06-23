"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, AlertTriangle, CheckCircle, Terminal, Eye } from "lucide-react";
import { io } from "socket.io-client";

export default function SpectatorSimulatorModal({ isOpen, onClose, matchData }) {
  const [socket, setSocket] = useState(null);
  const [seconds, setSeconds] = useState(0);

  const p1 = matchData?.players?.[0] || { name: "Player 1" };
  const p2 = matchData?.players?.[1] || { name: "Player 2" };

  const [p1Status, setP1Status] = useState("Idle");
  const [p2Status, setP2Status] = useState("Idle");
  
  const [p1TestOutput, setP1TestOutput] = useState("");
  const [p2TestOutput, setP2TestOutput] = useState("");

  const [matchEnded, setMatchEnded] = useState(false);
  const [winnerId, setWinnerId] = useState(null);

  // Formatting time helper
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Main game timer
  useEffect(() => {
    if (!isOpen || matchEnded) return;
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, matchEnded]);

  // Socket Connection
  useEffect(() => {
    if (!isOpen || !matchData) return;

    const socketUrl = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://127.0.0.1:4000"
      : "https://algobuddy-socket-server.onrender.com";

    const newSocket = io(socketUrl, {
      transports: ["websocket", "polling"],
      auth: async (cb) => {
        try {
          const { supabase } = await import('@/lib/supabase');
          const { data: sessionData } = await supabase.auth.getSession();
          cb({ token: sessionData?.session?.access_token || null });
        } catch {
          cb({ token: null });
        }
      }
    });

    newSocket.on("connect", () => {
      newSocket.emit("join_spectator", { matchId: matchData.matchId });
    });

    const p1UserId = p1.userId;
    const p2UserId = p2.userId;

    newSocket.on("opponent_typing_status", (data) => {
      const isP1 = data.userId === p1UserId;
      if (isP1) {
        setP1Status(data.isTyping ? "Typing..." : "Thinking...");
      } else {
        setP2Status(data.isTyping ? "Typing..." : "Thinking...");
      }
    });

    newSocket.on("opponent_test_submit", (data) => {
      const isP1 = data.userId === p1UserId;
      if (isP1) {
        setP1Status("Testing Code...");
      } else {
        setP2Status("Testing Code...");
      }
    });

    newSocket.on("opponent_test_result", (data) => {
      const isP1 = data.userId === p1UserId;
      const resultText = data.passed ? "All Test Cases Passed! 🏆" : "Test Cases Failed ❌";
      if (isP1) {
        setP1TestOutput(resultText);
        setP1Status("Idle");
      } else {
        setP2TestOutput(resultText);
        setP2Status("Idle");
      }
    });

    newSocket.on("match_ended", (data) => {
      setMatchEnded(true);
      setWinnerId(data.winnerUserId);
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [isOpen, matchData]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-[#0f0f13] w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-800 flex flex-col overflow-hidden"
          style={{ height: "calc(100vh - 80px)" }}
        >
          {/* Header */}
          <div className="h-14 bg-slate-50 dark:bg-[#15151a] border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                <Eye size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-neutral-200 text-sm leading-tight">
                  Spectator Mode: {matchData?.topic || "Match"}
                </h3>
                <span className="text-[10px] font-semibold text-slate-500">Live Match • {formatTime(seconds)}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-500 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Dual Pane Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Player 1 View */}
            <div className="flex-1 border-r border-slate-200 dark:border-neutral-800 flex flex-col bg-slate-50 dark:bg-[#0a0a0c]">
              <div className="h-10 border-b border-slate-200 dark:border-neutral-800 flex items-center px-4 bg-white dark:bg-[#111116] justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                    {p1.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-semibold text-xs text-slate-700 dark:text-neutral-300">
                    {p1.name} {winnerId === p1.userId && "👑 (Winner)"}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    p1Status === "Typing..." ? "bg-primary/20 text-primary-light animate-pulse" :
                    p1Status === "Testing Code..." ? "bg-amber-500/20 text-amber-500 animate-pulse" :
                    "bg-slate-500/20 text-slate-500"
                  }`}>
                  {p1Status}
                </span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50" />
                
                <Terminal size={48} className={`mb-4 ${p1Status === "Typing..." ? "text-primary animate-pulse" : "text-slate-700"}`} />
                <h4 className="text-lg font-bold text-slate-800 dark:text-neutral-200 mb-2">
                  {p1Status === "Idle" ? "Waiting for action..." : p1Status}
                </h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  Raw code visibility is restricted to prevent unfair advantages. You are viewing live status updates.
                </p>

                {p1TestOutput && (
                  <div className={`mt-6 p-3 rounded-xl border w-full max-w-sm ${p1TestOutput.includes("Passed") ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-red-500/10 border-red-500/20 text-red-500"}`}>
                    <span className="text-sm font-bold block mb-1">Latest Test Result</span>
                    <span className="text-xs">{p1TestOutput}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Player 2 View */}
            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#0a0a0c]">
              <div className="h-10 border-b border-slate-200 dark:border-neutral-800 flex items-center px-4 bg-white dark:bg-[#111116] justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold">
                    {p2.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-semibold text-xs text-slate-700 dark:text-neutral-300">
                    {p2.name} {winnerId === p2.userId && "👑 (Winner)"}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    p2Status === "Typing..." ? "bg-purple-500/20 text-purple-400 animate-pulse" :
                    p2Status === "Testing Code..." ? "bg-amber-500/20 text-amber-500 animate-pulse" :
                    "bg-slate-500/20 text-slate-500"
                  }`}>
                  {p2Status}
                </span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/5 via-transparent to-transparent opacity-50" />
                
                <Terminal size={48} className={`mb-4 ${p2Status === "Typing..." ? "text-purple-400 animate-pulse" : "text-slate-700"}`} />
                <h4 className="text-lg font-bold text-slate-800 dark:text-neutral-200 mb-2">
                  {p2Status === "Idle" ? "Waiting for action..." : p2Status}
                </h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  Raw code visibility is restricted to prevent unfair advantages. You are viewing live status updates.
                </p>

                {p2TestOutput && (
                  <div className={`mt-6 p-3 rounded-xl border w-full max-w-sm ${p2TestOutput.includes("Passed") ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-red-500/10 border-red-500/20 text-red-500"}`}>
                    <span className="text-sm font-bold block mb-1">Latest Test Result</span>
                    <span className="text-xs">{p2TestOutput}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
