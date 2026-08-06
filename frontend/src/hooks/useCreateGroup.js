import { useState } from "react";
import useConversation from "../zustand/useConversation";
import { useAuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  generateSymmetricKey,
  exportSymmetricKey,
  encryptKeyForRecipient,
} from "../utils/crypto";

const useCreateGroup = () => {
  const [loading, setLoading] = useState(false);
  const { addGroup, setDecryptedGroupKey, setSelectedConversation } = useConversation();
  const { authUser } = useAuthContext();

  const createGroup = async ({ groupName, selectedMembers, allUsers }) => {
    if (!groupName || !groupName.trim()) {
      toast.error("Group name is required");
      return false;
    }
    if (!selectedMembers || selectedMembers.length === 0) {
      toast.error("Select at least 1 member");
      return false;
    }

    setLoading(true);
    try {
      // Generate Group Symmetric AES-GCM Key
      const groupSymmetricKey = await generateSymmetricKey();
      const rawKeyBase64 = await exportSymmetricKey(groupSymmetricKey);

      // Collect all member IDs including current user
      const memberIds = Array.from(new Set([...selectedMembers, authUser._id]));

      // Encrypt Group Key for each participant using their Public Key
      const encryptedKeys = [];
      for (const memberId of memberIds) {
        let pubKeyPem = "";
        if (memberId === authUser._id) {
          pubKeyPem = authUser.publicKey;
        } else {
          const userObj = allUsers.find((u) => u._id === memberId);
          pubKeyPem = userObj?.publicKey;
        }

        if (pubKeyPem) {
          const encKey = await encryptKeyForRecipient(pubKeyPem, rawKeyBase64);
          if (encKey) {
            encryptedKeys.push({ userId: memberId, encryptedKey: encKey });
          }
        }
      }

      const res = await fetch("/api/groups/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName,
          members: memberIds,
          encryptedKeys,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Store key locally in Zustand
      setDecryptedGroupKey(data._id, groupSymmetricKey);
      addGroup(data);
      setSelectedConversation(data);
      toast.success(`Group "${groupName}" created with E2E Encryption!`);
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { createGroup, loading };
};

export default useCreateGroup;
