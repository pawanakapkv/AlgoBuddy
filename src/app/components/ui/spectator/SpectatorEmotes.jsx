import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const EMOTES = ["🔥", "👏", "🤯", "😂", "❤️"];

export default function SpectatorEmotes({ socket, matchId }) {
  const [activeEmotes, setActiveEmotes] = useState([]);

  useEffect(() => {
    if (!socket) return;
    const handleEmote = (data) => {
      setActiveEmotes(prev => [...prev, { id: data.id, emoji: data.emoji }]);
      setTimeout(() => {
        setActiveEmotes(prev => prev.filter(e => e.id !== data.id));
      }, 2000);
    };
    socket.on("spectator_emote", handleEmote);
    return () => socket.off("spectator_emote", handleEmote);
  }, [socket]);

  const sendEmote = (emoji) => {
    if (!socket || !matchId) return;
    const id = Date.now() + Math.random().toString(36).substring(7);
    socket.emit("spectator_emote", { matchId, emoji, id });
    // Optimistically show the emote
    setActiveEmotes(prev => [...prev, { id, emoji }]);
    setTimeout(() => {
      setActiveEmotes(prev => prev.filter(e => e.id !== id));
    }, 2000);
  };

  return (
    <>
      {/* Floating Emotes Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[110]">
        <AnimatePresence>
          {activeEmotes.map((emote) => {
            const randomX = Math.random() * 100 - 50;
            return (
              <motion.div
                key={emote.id}
                initial={{ opacity: 0, y: 100, x: 0, scale: 0.5 }}
                animate={{ opacity: [0, 1, 1, 0], y: -200, x: randomX, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute bottom-[20%] left-1/2 -translate-x-1/2 text-4xl drop-shadow-lg"
              >
                {emote.emoji}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Emote Buttons */}
      <div className="flex gap-2 justify-center pb-2 bg-slate-50 dark:bg-[#15151a] border-t border-slate-200 dark:border-neutral-800 pt-2 shrink-0">
        {EMOTES.map(emoji => (
          <button
            key={emoji}
            onClick={() => sendEmote(emoji)}
            className="w-10 h-10 rounded-full bg-white dark:bg-[#1a1a20] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all border border-slate-200 dark:border-slate-800 flex items-center justify-center text-lg z-50"
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}
