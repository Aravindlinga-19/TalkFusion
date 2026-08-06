import { useState } from "react";
import useCreateGroup from "../../hooks/useCreateGroup";
import useGetConversations from "../../hooks/useGetConversations";
import { FaLock, FaUsers } from "react-icons/fa";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const { conversations } = useGetConversations();
  const { createGroup, loading } = useCreateGroup();

  if (!isOpen) return null;

  const toggleMember = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await createGroup({
      groupName,
      selectedMembers,
      allUsers: conversations,
    });
    if (success) {
      setGroupName("");
      setSelectedMembers([]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl text-white">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xl">
            <FaUsers className="text-2xl" />
            <span>Create Encrypted Group</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl font-bold rounded-full w-8 h-8 flex items-center justify-center hover:bg-slate-700 transition"
          >
            ✕
          </button>
        </div>

        <div className="bg-sky-950/40 border border-sky-800/50 rounded-xl p-3 mb-4 flex items-center gap-2 text-xs text-sky-300">
          <FaLock className="text-sky-400 text-sm flex-shrink-0" />
          <span>E2EE Group Keys will be generated and securely exchanged with chosen members.</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Group Name
            </label>
            <input
              type="text"
              placeholder="e.g. Project TalkFusion Team"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-sky-500 transition"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Select Group Members ({selectedMembers.length})
            </label>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {conversations.map((user) => {
                const isChecked = selectedMembers.includes(user._id);
                return (
                  <div
                    key={user._id}
                    onClick={() => toggleMember(user._id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition border ${
                      isChecked
                        ? "bg-sky-600/30 border-sky-500 text-white"
                        : "bg-slate-900/60 border-slate-800 text-gray-300 hover:bg-slate-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={user.profilePic}
                        alt={user.fullName}
                        className="w-8 h-8 rounded-full bg-slate-700"
                      />
                      <div>
                        <p className="font-semibold text-sm leading-none">{user.fullName}</p>
                        <p className="text-xs text-gray-400">@{user.username}</p>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="checkbox checkbox-primary checkbox-sm border-slate-600"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2 pt-2 border-t border-slate-700/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-700 text-gray-200 hover:bg-slate-600 transition text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold transition text-sm shadow-lg shadow-sky-500/20 flex items-center gap-2"
            >
              {loading ? <span className="loading loading-spinner loading-xs"></span> : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
