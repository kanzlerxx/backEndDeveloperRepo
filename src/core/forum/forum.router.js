import { Router } from "express";
import validatorMiddleware from "../../middlewares/validator.middleware.js";
import forumController from "./forum.controller.js";
import forumValidator from "./forum.validator.js";
import { baseValidator } from "../../base/validator.base.js";
import auth from "../../middlewares/auth.middleware.js";
import multer from "multer";
import authOptional from "../../middlewares/authOpsional.middleware.js";
const upload = multer();

const r = Router(),
  validator = forumValidator,
  controller = new forumController();

r.get(
  "/show-all",
  authOptional,
  validatorMiddleware({ query: baseValidator.browseQuery }),
  controller.findAll
);

r.post("/follow", 
  auth(),
  controller.followForum);

r.delete("/unfollow", 
  auth(), 
  controller.unfollowForum);

r.get("/show-one/:id",
  authOptional,
  controller.findById
);

r.get(
  "/show-all/by-total-follower",
  authOptional,
  controller.findForumsByTotalFollower
);




r.post(
  "/create",
  auth(),
  upload.fields([
    { name: "forum_profile", maxCount: 1 },
    { name: "forum_banner", maxCount: 1 },
  ]),
  controller.create
);

r.put(
  "/update/:id",
  auth(),
  upload.fields([
    { name: "forum_profile", maxCount: 1 },
    { name: "forum_banner", maxCount: 1 },
  ]),
  controller.update
);
    
r.delete("/delete/:id", auth(), controller.delete);

const forumRouter = r;
export default forumRouter;
