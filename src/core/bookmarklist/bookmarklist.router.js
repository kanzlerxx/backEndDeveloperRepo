import { Router } from "express";
import validatorMiddleware from "../../middlewares/validator.middleware.js";
import bookmarklistController from "./bookmarklist.controller.js";
import bookmarklistValidator from "./bookmarklist.validator.js";
import { baseValidator } from "../../base/validator.base.js";
import auth from "../../middlewares/auth.middleware.js";

const r = Router(),
  validator = bookmarklistValidator,
  controller = new bookmarklistController();

r.get(
  "/show-all",
  validatorMiddleware({ query: baseValidator.browseQuery }),
  controller.findAll
);

r.post(
  "/add-thread",
  auth(),
  validatorMiddleware({ body: validator.add }),
  controller.addThread
);

// Hapus thread dari folder
r.delete(
  "/remove-thread",
  auth(),
  validatorMiddleware({ body: validator.remove }),
  controller.removeThread
);

// Ambil semua thread dalam folder tertentu
r.get(
  "/folder/:folderId",
  auth(),
  controller.getThreadsInFolder
);

r.get(
  "/user-folders",
  auth(),
  controller.getUserFolders
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
    
r.delete("/delete/:id", auth(['ADMIN']), controller.delete);

const bookmarklistRouter = r;
export default bookmarklistRouter;
