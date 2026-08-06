import { useEffect, useState } from "react";
import useConversation from "../../zustand/useConversation";
import MessageInput from "./MessageInput";
import Messages from "./Messages";
import SecurityModal from "./SecurityModal";
import { TiMessages } from "react-icons/ti";
import { FaLock, FaUsers, FaShieldAlt } from "react-icons/fa";
import { useAuthContext } from "../../context/AuthContext";

const MessageContainer = () => {
  const { selectedConversation, setSelectedConversation } = useConversation();
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  useEffect(() => {
    return () => setSelectedConversation(null);
  }, [setSelectedConversation]);

  const isGroup = selectedConversation?.isGroup;
  const title = isGroup ? selectedConversation.groupName : selectedConversation?.fullName;
  const avatarSrc = isGroup
    ? selectedConversation.groupAvatar || `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(title)}`
    : selectedConversation?.profilePic;

  return (
    <div className="md:min-w-[450px] flex flex-col flex-1 bg-slate-900/40">
      {!selectedConversation ? (
        <NoChatSelected />
      ) : (
        <>
          {/* Header */}
          <div className="bg-slate-800/90 border-b border-slate-700/60 px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden ring-2 ring-sky-500/30">
                <img src={avatarSrc} alt={title} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight flex items-center gap-2">
                  {title}
                  {isGroup && (
                    <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <FaUsers className="text-[9px]" /> Group
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-400">
                  {isGroup
                    ? `${selectedConversation.participants?.length || 0} members`
                    : `@${selectedConversation.username || "user"}`}
                </p>
              </div>
            </div>

            {/* E2EE Security Badge */}
            <button
              onClick={() => setShowSecurityModal(true)}
              className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs font-semibold transition"
              title="Click to view E2EE Security Details"
            >
              <FaLock className="text-xs" />
              <span>End-to-End Encrypted</span>
            </button>
          </div>

          <Messages />
          <MessageInput />

          <SecurityModal
            isOpen={showSecurityModal}
            onClose={() => setShowSecurityModal(false)}
            conversation={selectedConversation}
          />
        </>
      )}
    </div>
  );
};

const NoChatSelected = () => {
  const { authUser } = useAuthContext();
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="px-4 text-center sm:text-lg md:text-xl text-gray-200 font-semibold flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-3xl border border-sky-500/30 mb-2">
          <TiMessages />
        </div>
        <p className="text-2xl font-bold">Welcome, {authUser?.fullName}! 👋</p>
        <p className="text-sm text-gray-400 max-w-sm">
          Select a direct chat or encrypted group conversation from the sidebar to start secure messaging.
        </p>
        <div className="flex items-center gap-2 mt-3 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full">
          <FaShieldAlt /> TalkFusion E2E Encryption Active
        </div>
      </div>
    </div>
  );
};

export default MessageContainer;
