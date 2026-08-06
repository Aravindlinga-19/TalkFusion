import useGetConversations from "../../hooks/useGetConversations";
import useGetGroups from "../../hooks/useGetGroups";
import useConversation from "../../zustand/useConversation";
import { getRandomEmoji } from "../../utils/emojis";
import Conversation from "./Conversation";
import { FaUser, FaUsers } from "react-icons/fa";

const Conversations = () => {
  const { loading: loadingUsers, conversations: directConversations } = useGetConversations();
  const { loading: loadingGroups } = useGetGroups();
  const { activeTab, groups } = useConversation();

  const isDirect = activeTab === "direct";
  const items = isDirect ? directConversations : groups;
  const isLoading = isDirect ? loadingUsers : loadingGroups;

  return (
    <div className="py-2 flex flex-col overflow-auto custom-scrollbar flex-1">
      {items.length === 0 && !isLoading && (
        <div className="text-center text-gray-400 py-8 px-4 text-sm flex flex-col items-center gap-2">
          {isDirect ? <FaUser className="text-2xl opacity-40" /> : <FaUsers className="text-2xl opacity-40" />}
          <p>{isDirect ? "No direct chats available." : "No group chats yet. Create one above!"}</p>
        </div>
      )}

      {items.map((item, idx) => (
        <Conversation
          key={item._id}
          conversation={item}
          emoji={getRandomEmoji()}
          lastIdx={idx === items.length - 1}
          isGroup={!isDirect}
        />
      ))}

      {isLoading && (
        <span className="loading loading-spinner mx-auto my-4 text-sky-400"></span>
      )}
    </div>
  );
};

export default Conversations;
