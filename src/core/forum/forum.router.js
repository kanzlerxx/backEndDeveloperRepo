import { Router } from "express";
import validatorMiddleware from "../../middlewares/validator.middleware.js";
import forumController from "./forum.controller.js";
import forumValidator from "./forum.validator.js";
import { baseValidator } from "../../base/validator.base.js";
import auth from "../../middlewares/auth.middleware.js";
import multer from "multer";
const upload = multer();

const r = Router(),
  validator = forumValidator,
  controller = new forumController();

r.get(
  "/show-all"
  ,
  validatorMiddleware({ query: baseValidator.browseQuery }),
  controller.findAll
);

r.get("/show-one/:id", controller.findById);

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
