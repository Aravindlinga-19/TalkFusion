import { useAuthContext } from "../../context/AuthContext";
import { extractTime } from "../../utils/extractTime";
import useConversation from "../../zustand/useConversation";
import { FaLock, FaCheckDouble } from "react-icons/fa";

const Message = ({ message }) => {
  const { authUser } = useAuthContext();
  const { selectedConversation } = useConversation();

  const senderObj = message.senderId;
  const senderId = typeof senderObj === "object" ? senderObj?._id : senderObj;
  const fromMe = senderId?.toString() === authUser._id.toString();

  const formattedTime = extractTime(message.createdAt);
  const chatClassName = fromMe ? "chat-end" : "chat-start";

  const profilePic = fromMe
    ? authUser.profilePic
    : senderObj?.profilePic || selectedConversation?.profilePic || "https://avatar.iran.liara.run/public/boy";

  const senderName = fromMe
    ? "You"
    : senderObj?.fullName || selectedConversation?.fullName || "User";

  const bubbleBgColor = fromMe ? "bg-sky-600 text-white" : "bg-slate-800 text-gray-100 border border-slate-700";

  const isGroup = selectedConversation?.isGroup;
  const content = message.plaintext || message.message || "[Encrypted Message]";

  return (
    <div className={`chat ${chatClassName} my-1`}>
      <div className="chat-image avatar">
        <div className="w-9 h-9 rounded-full ring-1 ring-slate-600 overflow-hidden">
          <img alt="avatar" src={profilePic} />
        </div>
      </div>

      <div className="chat-header text-[11px] text-gray-400 mb-0.5 flex items-center gap-1">
        {isGroup && !fromMe && <span className="font-semibold text-sky-400">{senderName}</span>}
        {message.seq ? <span className="text-[10px] opacity-60">#{message.seq}</span> : null}
      </div>

      <div className={`chat-bubble text-sm ${bubbleBgColor} rounded-2xl px-3.5 py-2 shadow-md relative group`}>
        <p className="leading-relaxed break-words">{content}</p>
      </div>

      <div className="chat-footer opacity-60 text-[10px] flex gap-1.5 items-center mt-1 text-gray-400">
        <span>{formattedTime}</span>
        <FaLock className="text-[9px] text-sky-400" title="End-to-End Encrypted" />
        {fromMe && <FaCheckDouble className="text-[10px] text-sky-400" title="Delivered & ACKed" />}
      </div>
    </div>
  );
};

export default Message;
