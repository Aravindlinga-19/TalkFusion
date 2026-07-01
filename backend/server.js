import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import establishMongoConnection from "./db/establishMongoConnection.js";
import messageRoutes from "./routes/message.routes.js";
import cookieParser from "cookie-parser";
import userRoute from "./routes/user.routes.js";
import { app, server } from "./socket/socket.js";
import path from "path";

const port = process.env.port || 5000;
const __dirname = path.resolve();

dotenv.config();

app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoute);
app.use(express.static(path.join(__dirname, "/frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

server.listen(port, () => {
  establishMongoConnection();
  console.log(`Listening on port ${port}`);
});
