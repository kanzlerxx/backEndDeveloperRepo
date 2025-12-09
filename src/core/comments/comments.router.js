import { Router } from "express";
import validatorMiddleware from "../../middlewares/validator.middleware.js";
import commentsController from "./comments.controller.js";
import commentsValidator from "./comments.validator.js";
import { baseValidator } from "../../base/validator.base.js";
import auth from "../../middlewares/auth.middleware.js";
import multer from "multer";
import authOptional from "../../middlewares/authOpsional.middleware.js";


const upload = multer();

const r = Router(),
  validator = commentsValidator,
  controller = new commentsController();

r.get(
  "/show-all",
  auth(),
  validatorMiddleware({ query: baseValidator.browseQuery }),
  controller.findAll
);

r.get("/show-one/:id", controller.findById);

r.post(
  "/create",
  auth(),
  upload.single("image"),  // <-- upload image comment
  controller.createComment
);

r.get("/replies/:comment_id", 
  authOptional,
  controller.showReplies);


r.post("/like", auth(), controller.likeComment);
r.delete("/unlike", auth(), controller.unlikeComment);
r.get("/by-thread/:threads_id", authOptional, controller.findByThreadsId);



  
  r.put(
    "/update/:id",
    auth(),
    validatorMiddleware({ body: validator.update }),
    controller.update
    );
    
r.delete("/delete/:id", auth(), controller.delete);

const commentsRouter = r;
export default commentsRouter;