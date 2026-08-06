import { useEffect, useState } from "react";
import useConversation from "../zustand/useConversation";
import { useAuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  decryptWithSymmetricKey,
  importSymmetricKey,
  decryptKeyWithPrivateKey,
} from "../utils/crypto";

const useGetMessages = () => {
  const [loading, setLoading] = useState(false);
  const {
    messages,
    setMessages,
    selectedConversation,
    decryptedGroupKeys,
    setDecryptedGroupKey,
  } = useConversation();
  const { authUser } = useAuthContext();

  useEffect(() => {
    const getMessages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/messages/${selectedConversation._id}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        // Client-side Decryption
        let key = decryptedGroupKeys[selectedConversation._id];

        if (!key && selectedConversation.isGroup && selectedConversation.encryptedKeys) {
          const userEnc = selectedConversation.encryptedKeys.find(
            (k) => (k.userId._id || k.userId).toString() === authUser._id.toString()
          );
          if (userEnc && userEnc.encryptedKey) {
            const rawKeyBase64 = await decryptKeyWithPrivateKey(
              authUser._id,
              userEnc.encryptedKey
            );
            if (rawKeyBase64) {
              key = await importSymmetricKey(rawKeyBase64);
              setDecryptedGroupKey(selectedConversation._id, key);
            }
          }
        }

        const processed = await Promise.all(
          data.map(async (msg) => {
            if (msg.isEncrypted && msg.ciphertext && msg.iv && key) {
              const decrypted = await decryptWithSymmetricKey(key, msg.ciphertext, msg.iv);
              return { ...msg, plaintext: decrypted };
            }
            return { ...msg, plaintext: msg.message };
          })
        );

        // Sort chronologically by sequence number
        const sorted = processed.sort((a, b) => (a.seq || 0) - (b.seq || 0));
        setMessages(sorted);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (selectedConversation?._id) getMessages();
  }, [selectedConversation?._id, setMessages, authUser._id]);

  return { messages, loading };
};

export default useGetMessages;
