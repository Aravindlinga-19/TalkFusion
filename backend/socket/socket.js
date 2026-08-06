import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

const userSocketMap = {}; // { userId: socketId }

// Stateless horizontal scaling setup using Redis adapter if REDIS_URL environment variable is provided
if (process.env.REDIS_URL) {
  import("redis").then(({ createClient }) => {
    import("@socket.io/redis-adapter").then(({ createAdapter }) => {
      const pubClient = createClient({ url: process.env.REDIS_URL });
      const subClient = pubClient.duplicate();
      Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        console.log("Socket.IO Redis Adapter configured for horizontal fan-out");
      }).catch(err => console.error("Redis connection error:", err));
    });
  }).catch(() => console.log("Redis client not installed, using default in-memory adapter"));
}

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
    // Join a user-specific room for multi-device broadcast
    socket.join(`user_${userId}`);
    console.log(`User connected: ${userId} with socket ID ${socket.id}`);
  }

  // Broadcast online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Room management for Group Chats
  socket.on("joinGroup", (groupId) => {
    if (groupId) {
      socket.join(`group_${groupId}`);
      console.log(`Socket ${socket.id} joined group_${groupId}`);
    }
  });

  socket.on("leaveGroup", (groupId) => {
    if (groupId) {
      socket.leave(`group_${groupId}`);
      console.log(`Socket ${socket.id} left group_${groupId}`);
    }
  });

  // Reliable Delivery Acknowledgments
  socket.on("sendAckMessage", (payload, ack) => {
    if (typeof ack === "function") {
      ack({ status: "delivered", timestamp: Date.now() });
    }
  });

  socket.on("disconnect", () => {
    if (userId && userId !== "undefined") {
      delete userSocketMap[userId];
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, io, server };
