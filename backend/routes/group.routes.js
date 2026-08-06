import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { createGroup, getGroups, addGroupMember } from "../controllers/group.controller.js";

const router = express.Router();

router.post("/create", protectRoute, createGroup);
router.get("/", protectRoute, getGroups);
router.post("/:groupId/members", protectRoute, addGroupMember);

export default router;
