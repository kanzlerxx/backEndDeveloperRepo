import { Router } from "express";
import validatorMiddleware from "../../middlewares/validator.middleware.js";
import usersController from "./users.controller.js";
import usersValidator from "./users.validator.js";
import { baseValidator } from "../../base/validator.base.js";
import auth from "../../middlewares/auth.middleware.js";
import { upload } from "../../middlewares/upload.middleware.js";


const r = Router(),
  validator = usersValidator,
  controller = new usersController();
  //digunakan untuk melihat semua user
r.get(
  "/show-all",
  validatorMiddleware({ query: baseValidator.browseQuery }),
  controller.findAll
);


r.get("/show-one/:id", controller.findById);




 r.put(
  "/update-profile",
  auth(),
  upload.single("image"),
  controller.updateUser
);

    
r.delete("/delete/:id", auth(['ADMIN']), controller.delete);

const usersRouter = r;
export default usersRouter;
