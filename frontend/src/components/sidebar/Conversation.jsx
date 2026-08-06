import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../zustand/useConversation";
import { FaUsers, FaLock } from "react-icons/fa";

const Conversation = ({ conversation, lastIdx, emoji, isGroup }) => {
  const { selectedConversation, setSelectedConversation } = useConversation();

  const isSelected = selectedConversation?._id === conversation._id;
  const { onlineUsers } = useSocketContext();
  const isOnline = !isGroup && onlineUsers.includes(conversation._id);

  const title = isGroup ? conversation.groupName : conversation.fullName;
  const avatarSrc = isGroup
    ? conversation.groupAvatar || `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(title)}`
    : conversation.profilePic;

  return (
    <>
      <div
        className={`flex gap-3 items-center hover:bg-sky-600/30 rounded-xl p-2.5 my-0.5 cursor-pointer transition ${
          isSelected ? "bg-sky-500/40 border-l-4 border-sky-400" : ""
        }`}
        onClick={() => setSelectedConversation(conversation)}
      >
        <div className={`avatar ${isOnline ? "online" : ""}`}>
          <div className="w-11 h-11 rounded-full bg-slate-700 overflow-hidden ring-1 ring-slate-600/50">
            <img src={avatarSrc} alt="avatar" />
          </div>
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className="font-semibold text-gray-100 text-sm truncate">{title}</p>
            <div className="flex items-center gap-1">
              <FaLock className="text-[10px] text-sky-400 opacity-80" title="End-to-End Encrypted" />
              <span className="text-xs">{emoji}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-400">
            {isGroup ? (
              <span className="flex items-center gap-1 text-sky-300/80">
                <FaUsers className="text-[10px]" />
                {conversation.participants?.length || 0} members
              </span>
            ) : (
              <span>{isOnline ? "Online" : "Offline"}</span>
            )}
          </div>
        </div>
      </div>

      {!lastIdx && <div className="divider my-0 py-0 h-[1px] opacity-20" />}
    </>
  );
};

export default Conversation;
