import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
    },
    message: {
      type: String,
      default: "",
    },
    ciphertext: {
      type: String,
      default: "",
    },
    iv: {
      type: String,
      default: "",
    },
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
