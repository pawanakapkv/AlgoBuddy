import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send } from "lucide-react";

export default function SpectatorChat({ socket, matchId, username }) {
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;
    
    const handleChat = (data) => {
      setChatMessages(prev => [...prev, data]);
    };
    
    socket.on("spectator_chat", handleChat);
    return () => socket.off("spectator_chat", handleChat);
  }, [socket]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;
    const msg = {
      matchId: matchId,
      message: chatInput
    };
    socket.emit("spectator_chat", msg);
    setChatMessages(prev => [...prev, { ...msg, username: "You", isMe: true }]);
    setChatInput("");
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#0c0c0e] border-l border-slate-200 dark:border-neutral-800">
      <div className="h-10 border-b border-slate-200 dark:border-neutral-800 flex items-center px-4 bg-slate-50 dark:bg-[#15151a]">
        <MessageSquare size={14} className="text-slate-500 mr-2" />
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Spectator Chat</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.length === 0 ? (
          <p className="text-xs text-slate-400 text-center mt-4">No messages yet. Be the first to cheer!</p>
        ) : (
          chatMessages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}>
              <span className="text-[9px] text-slate-400 font-semibold mb-0.5 px-1">{msg.username}</span>
              <div className={`px-3 py-2 rounded-xl text-xs max-w-[90%] ${msg.isMe ? "bg-primary text-white rounded-br-none" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-none"}`}>
                {msg.message}
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="border-t border-slate-200 dark:border-neutral-800 p-3 bg-slate-50 dark:bg-[#15151a]">
        <form onSubmit={handleSendChat} className="relative">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Send a message..."
            className="w-full bg-white dark:bg-[#0a0a0c] border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 rounded-full pl-3 pr-10 py-2 outline-none focus:border-primary/50"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary-light transition p-1">
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
