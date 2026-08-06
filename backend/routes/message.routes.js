import express from "express";
import { getMessages, sendMessage, syncMessages } from "../controllers/message.controller.js";
import protectRoute from "../middleware/protectRoute.js";
import { rateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.get("/sync", protectRoute, syncMessages);
router.post("/send/:id", protectRoute, rateLimiter({ windowMs: 10 * 1000, max: 30 }), sendMessage);
router.get("/:id", protectRoute, getMessages);

export default router;
