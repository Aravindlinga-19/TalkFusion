import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import { io } from "../socket/socket.js";

export const createGroup = async (req, res) => {
  try {
    const { groupName, members, groupAvatar, encryptedKeys } = req.body;
    const adminId = req.user._id;

    if (!groupName || !members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: "Group name and members are required" });
    }

    // Ensure admin is part of participants
    const allParticipants = Array.from(new Set([...members, adminId.toString()]));

    const defaultAvatar = groupAvatar || `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(groupName)}`;

    const newGroup = new Conversation({
      isGroup: true,
      groupName,
      groupAdmin: adminId,
      groupAvatar: defaultAvatar,
      participants: allParticipants,
      encryptedKeys: encryptedKeys || [],
      messages: [],
    });

    await newGroup.save();

    const populatedGroup = await Conversation.findById(newGroup._id)
      .populate("participants", "fullName username profilePic publicKey")
      .populate("groupAdmin", "fullName username profilePic");

    // Real-time WebSocket notification to all active group members
    allParticipants.forEach((memberId) => {
      io.to(`user_${memberId}`).emit("newGroupCreated", populatedGroup);
    });

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.log("Error in createGroup controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Conversation.find({
      isGroup: true,
      participants: userId,
    })
      .populate("participants", "fullName username profilePic publicKey")
      .populate("groupAdmin", "fullName username profilePic")
      .sort({ updatedAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.log("Error in getGroups controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addGroupMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { newMemberId, encryptedKey } = req.body;
    const userId = req.user._id;

    const group = await Conversation.findById(groupId);
    if (!group || !group.isGroup) {
      return res.status(444).json({ error: "Group not found" });
    }

    // Membership-based access control: Only existing members (or admin) can add
    if (!group.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(403).json({ error: "Access Denied: You are not a member of this group" });
    }

    if (!group.participants.includes(newMemberId)) {
      group.participants.push(newMemberId);
      if (encryptedKey) {
        group.encryptedKeys.push({ userId: newMemberId, encryptedKey });
      }
      await group.save();
    }

    const updatedGroup = await Conversation.findById(groupId)
      .populate("participants", "fullName username profilePic publicKey")
      .populate("groupAdmin", "fullName username profilePic");

    io.to(`group_${groupId}`).emit("groupUpdated", updatedGroup);
    io.to(`user_${newMemberId}`).emit("newGroupCreated", updatedGroup);

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.log("Error in addGroupMember controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
