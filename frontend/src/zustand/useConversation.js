import { create } from "zustand";

const useConversation = create((set) => ({
  selectedConversation: null,
  setSelectedConversation: (selectedConversation) =>
    set({ selectedConversation }),
  messages: [],
  setMessages: (messages) => set({ messages }),
  activeTab: "direct", // "direct" | "groups"
  setActiveTab: (activeTab) => set({ activeTab }),
  groups: [],
  setGroups: (groups) => set({ groups }),
  addGroup: (group) => set((state) => ({ groups: [group, ...state.groups] })),
  decryptedGroupKeys: {}, // { groupId: AESKey }
  setDecryptedGroupKey: (groupId, key) =>
    set((state) => ({
      decryptedGroupKeys: { ...state.decryptedGroupKeys, [groupId]: key },
    })),
}));

export default useConversation;
