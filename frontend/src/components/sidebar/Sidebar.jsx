import { useState } from "react";
import Conversations from "./Conversations";
import LogoutButton from "./LogoutButton";
import SearchInput from "./SearchInput";
import CreateGroupModal from "./CreateGroupModal";
import useConversation from "../../zustand/useConversation";
import { FaComments, FaUsers, FaPlus } from "react-icons/fa";

const Sidebar = () => {
  const { activeTab, setActiveTab } = useConversation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="border-r border-slate-700/60 p-4 flex flex-col w-[340px] max-w-full bg-slate-900/60">
      <SearchInput />

      {/* Navigation Tabs & Create Group Action */}
      <div className="flex items-center justify-between mt-3 mb-2 px-1">
        <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/50">
          <button
            onClick={() => setActiveTab("direct")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "direct"
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <FaComments /> Direct
          </button>

          <button
            onClick={() => setActiveTab("groups")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "groups"
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <FaUsers /> Groups
          </button>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-sky-600/30 text-sky-400 hover:text-sky-300 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs font-medium transition"
          title="Create New Group"
        >
          <FaPlus className="text-[10px]" /> Group
        </button>
      </div>

      <div className="divider px-1 my-1 opacity-30"></div>

      <Conversations />

      <LogoutButton />

      <CreateGroupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Sidebar;
