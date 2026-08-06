import { useState } from "react";
import { BsSend } from "react-icons/bs";
import { FaLock } from "react-icons/fa";
import useSendMessage from "../../hooks/useSendMessage";

const MessageInput = () => {
  const [message, setMessage] = useState("");
  const { loading, sendMessage } = useSendMessage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message || !message.trim()) return;
    await sendMessage(message);
    setMessage("");
  };

  return (
    <form className="px-4 my-3" onSubmit={handleSubmit}>
      <div className="w-full relative flex items-center">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-emerald-400">
          <FaLock className="text-xs opacity-80" title="End-to-End Encrypted Input" />
        </div>

        <input
          type="text"
          className="border text-sm rounded-xl block w-full ps-9 pe-11 py-3 bg-slate-800/90 border-slate-700/80 text-white placeholder-gray-400 focus:outline-none focus:border-sky-500 transition shadow-inner"
          placeholder="Type an end-to-end encrypted message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button
          type="submit"
          disabled={loading}
          className="absolute inset-y-0 end-0 flex items-center pe-3.5 text-sky-400 hover:text-sky-300 transition"
        >
          {loading ? (
            <div className="loading loading-spinner loading-xs text-sky-400"></div>
          ) : (
            <BsSend className="text-lg" />
          )}
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
