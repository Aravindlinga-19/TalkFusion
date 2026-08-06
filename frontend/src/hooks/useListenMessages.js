import { useEffect } from "react";
import { useSocketContext } from "../context/SocketContext";
import useConversation from "../zustand/useConversation";
import { useAuthContext } from "../context/AuthContext";
import { decryptWithSymmetricKey } from "../utils/crypto";

const useListenMessages = () => {
  const { socket } = useSocketContext();
  const { messages, setMessages, selectedConversation, decryptedGroupKeys } = useConversation();
  const { authUser } = useAuthContext();

  useEffect(() => {
    if (!socket) return;

    // Join room if selected conversation is a group
    if (selectedConversation?.isGroup) {
      socket.emit("joinGroup", selectedConversation._id);
    }

    const handleNewMessage = async (newMessage) => {
      // Check if message belongs to current selected conversation
      const isCurrentConversation =
        (selectedConversation?.isGroup && newMessage.conversationId === selectedConversation._id) ||
        (!selectedConversation?.isGroup &&
          (newMessage.senderId?._id === selectedConversation?._id ||
            newMessage.receiverId === selectedConversation?._id));

      if (isCurrentConversation) {
        let plaintext = newMessage.message;
        const key = decryptedGroupKeys[selectedConversation._id];

        if (newMessage.isEncrypted && newMessage.ciphertext && newMessage.iv && key) {
          plaintext = await decryptWithSymmetricKey(key, newMessage.ciphertext, newMessage.iv);
        }

        const formattedMsg = { ...newMessage, plaintext };

        // Deduplicate and append message in sequence order
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMessage._id)) return prev;
          const updated = [...prev, formattedMsg];
          return updated.sort((a, b) => (a.seq || 0) - (b.seq || 0));
        });
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, setMessages, selectedConversation, decryptedGroupKeys]);
};

export default useListenMessages;
