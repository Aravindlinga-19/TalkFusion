import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { getUsersForSideBar, updatePublicKey } from "../controllers/user.controller.js";

const router = express.Router();
router.get("/", protectRoute, getUsersForSideBar);
router.put("/public-key", protectRoute, updatePublicKey);

export default router;