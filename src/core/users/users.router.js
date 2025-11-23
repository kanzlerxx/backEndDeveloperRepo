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

r.get(
  "/show-all",
  validatorMiddleware({ query: baseValidator.browseQuery }),
  controller.findAll
);

r.get("/show-one/:id", controller.findById);

r.post(
  "/create",
  auth(['ADMIN']),
  validatorMiddleware({ body: validator.create }),
  controller.create
  );
  
  r.put(
    "/update/:id",
    auth(['ADMIN']),
    validatorMiddleware({ body: validator.update }),
    controller.update
    );

  r.put(
        "/update-photo", 
         auth(),
        upload.single("photo_profile"), 
        controller.updateProfilePhoto
      );
    
r.delete("/delete/:id", auth(['ADMIN']), controller.delete);

const usersRouter = r;
export default usersRouter;
