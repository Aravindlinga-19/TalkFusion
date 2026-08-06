import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const sendMessage = async (req, res) => {
  try {
    const { message, ciphertext, iv, isEncrypted, isGroup } = req.body;
    const { id: targetId } = req.params;
    const senderId = req.user._id;

    let conversation;

    if (isGroup) {
      // For group chats, targetId is the Conversation ID
      conversation = await Conversation.findById(targetId);
      if (!conversation) {
        return res.status(404).json({ error: "Group conversation not found" });
      }

      // Membership-based Access Control for group chat
      const isMember = conversation.participants.some(
        (p) => p.toString() === senderId.toString()
      );
      if (!isMember) {
        return res.status(403).json({ error: "Access Denied: You are not a member of this group" });
      }
    } else {
      // Check if targetId is an existing Conversation ID or a User ID
      conversation = await Conversation.findById(targetId);

      if (conversation) {
        const isMember = conversation.participants.some(
          (p) => p.toString() === senderId.toString()
        );
        if (!isMember) {
          return res.status(403).json({ error: "Access Denied: You are not a participant in this conversation" });
        }
      } else {
        // Find 1-to-1 conversation by participants
        conversation = await Conversation.findOne({
          isGroup: false,
          participants: { $all: [senderId, targetId] },
        });

        if (!conversation) {
          conversation = await Conversation.create({
            isGroup: false,
            participants: [senderId, targetId],
            lastSeq: 0,
          });
        }
      }
    }

    // Monotonically increasing sequence number for exact message ordering
    const nextSeq = (conversation.lastSeq || 0) + 1;
    conversation.lastSeq = nextSeq;

    const receiverId = isGroup
      ? null
      : conversation.participants.find((p) => p.toString() !== senderId.toString());

    const newMessage = new Message({
      senderId,
      receiverId,
      conversationId: conversation._id,
      message: message || "",
      ciphertext: ciphertext || "",
      iv: iv || "",
      isEncrypted: Boolean(isEncrypted),
      seq: nextSeq,
    });

    conversation.messages.push(newMessage._id);

    await Promise.all([conversation.save(), newMessage.save()]);

    const populatedMessage = await Message.findById(newMessage._id).populate(
      "senderId",
      "fullName username profilePic"
    );

    // Event-driven real-time fan-out delivery
    if (conversation.isGroup) {
      // Fan-out to group room
      io.to(`group_${conversation._id}`).emit("newMessage", populatedMessage);
    } else {
      // Direct 1-to-1 delivery to recipient and sender sockets
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", populatedMessage);
      }
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: targetId } = req.params;
    const senderId = req.user._id;

    let conversation = await Conversation.findById(targetId).populate({
      path: "messages",
      populate: {
        path: "senderId",
        select: "fullName username profilePic",
      },
    });

    if (!conversation) {
      // 1-to-1 lookup by target User ID
      conversation = await Conversation.findOne({
        isGroup: false,
        participants: { $all: [senderId, targetId] },
      }).populate({
        path: "messages",
        populate: {
          path: "senderId",
          select: "fullName username profilePic",
        },
      });
    }

    if (!conversation) return res.status(200).json([]);

    // Membership-based Access Control
    const isMember = conversation.participants.some(
      (p) => p.toString() === senderId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ error: "Access Denied: You are not a member of this chat" });
    }

    // Return messages ordered by sequence number / time
    const messages = conversation.messages.sort((a, b) => (a.seq || 0) - (b.seq || 0));
    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const syncMessages = async (req, res) => {
  try {
    const { conversationId, lastSeq } = req.query;
    const userId = req.user._id;

    if (!conversationId) {
      return res.status(400).json({ error: "conversationId is required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Access control
    const isMember = conversation.participants.some(
      (p) => p.toString() === userId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ error: "Access Denied" });
    }

    const seqThreshold = Number(lastSeq || 0);
    const missedMessages = await Message.find({
      conversationId: conversation._id,
      seq: { $gt: seqThreshold },
    })
      .populate("senderId", "fullName username profilePic")
      .sort({ seq: 1 });

    res.status(200).json(missedMessages);
  } catch (error) {
    console.log("Error in syncMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
