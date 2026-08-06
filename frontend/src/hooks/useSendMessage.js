import { useState } from "react";
import useConversation from "../zustand/useConversation";
import { useAuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  generateSymmetricKey,
  exportSymmetricKey,
  importSymmetricKey,
  encryptWithSymmetricKey,
  encryptKeyForRecipient,
  decryptKeyWithPrivateKey,
} from "../utils/crypto";

const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const { messages, setMessages, selectedConversation, decryptedGroupKeys, setDecryptedGroupKey } =
    useConversation();
  const { authUser } = useAuthContext();

  const sendMessage = async (messageText) => {
    if (!messageText || !messageText.trim()) return;
    setLoading(true);

    try {
      let ciphertext = "";
      let iv = "";
      let isEncrypted = false;

      // Perform E2E Encryption using Web Crypto API
      if (selectedConversation) {
        if (selectedConversation.isGroup) {
          // Group Chat Encryption
          let groupKey = decryptedGroupKeys[selectedConversation._id];
          if (!groupKey) {
            // Find encrypted key for logged-in user in group
            const userEnc = selectedConversation.encryptedKeys?.find(
              (k) => (k.userId._id || k.userId).toString() === authUser._id.toString()
            );

            if (userEnc && userEnc.encryptedKey) {
              const rawKeyBase64 = await decryptKeyWithPrivateKey(
                authUser._id,
                userEnc.encryptedKey
              );
              if (rawKeyBase64) {
                groupKey = await importSymmetricKey(rawKeyBase64);
                setDecryptedGroupKey(selectedConversation._id, groupKey);
              }
            }
          }

          if (!groupKey) {
            // Fallback: generate and set key if missing
            groupKey = await generateSymmetricKey();
            setDecryptedGroupKey(selectedConversation._id, groupKey);
          }

          const encryptedPayload = await encryptWithSymmetricKey(groupKey, messageText);
          ciphertext = encryptedPayload.ciphertext;
          iv = encryptedPayload.iv;
          isEncrypted = true;
        } else {
          // 1-to-1 Chat E2E Encryption
          let aesKey = decryptedGroupKeys[selectedConversation._id];
          if (!aesKey) {
            aesKey = await generateSymmetricKey();
            setDecryptedGroupKey(selectedConversation._id, aesKey);
          }

          const encryptedPayload = await encryptWithSymmetricKey(aesKey, messageText);
          ciphertext = encryptedPayload.ciphertext;
          iv = encryptedPayload.iv;
          isEncrypted = true;
        }
      }

      const res = await fetch(`/api/messages/send/${selectedConversation._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText, // fallback for legacy view
          ciphertext,
          iv,
          isEncrypted,
          isGroup: Boolean(selectedConversation.isGroup),
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Attach local plaintext to returned message object for immediate UI rendering
      const newMessageWithPlaintext = {
        ...data,
        plaintext: messageText,
      };

      // Append and sort by sequence number
      const updatedMessages = [...messages, newMessageWithPlaintext].sort(
        (a, b) => (a.seq || 0) - (b.seq || 0)
      );

      setMessages(updatedMessages);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading };
};

export default useSendMessage;
