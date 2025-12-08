import { Router } from "express";
import validatorMiddleware from "../../middlewares/validator.middleware.js";
import bookmark_contentController from "./bookmark_content.controller.js";
import bookmark_contentValidator from "./bookmark_content.validator.js";
import { baseValidator } from "../../base/validator.base.js";
import auth from "../../middlewares/auth.middleware.js";

const r = Router(),
  validator = bookmark_contentValidator,
  controller = new bookmark_contentController();

r.get(
  "/show-all",
  validatorMiddleware({ query: baseValidator.browseQuery }),
  controller.findAll
);

r.get("/show-one/:id", controller.findById);

r.post(
  "/create",
  auth(),
  validatorMiddleware({ body: validator.create }),
  controller.create
  );
  
  r.put(
    "/update/:id",
    auth(['ADMIN']),
    validatorMiddleware({ body: validator.update }),
    controller.update
    );
    
r.delete("/delete/:id", auth(['ADMIN']), controller.delete);

const bookmark_contentRouter = r;
export default bookmark_contentRouter;
