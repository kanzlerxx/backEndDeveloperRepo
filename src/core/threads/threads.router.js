  import { Router } from "express";
  import validatorMiddleware from "../../middlewares/validator.middleware.js";
  import threadsController from "./threads.controller.js";
  import threadsValidator from "./threads.validator.js";
  import { baseValidator } from "../../base/validator.base.js";
  import auth from "../../middlewares/auth.middleware.js";
import multer from "multer";
  
  const upload = multer();
  
  const r = Router(),
    validator = threadsValidator,
    controller = new threadsController();

  r.get(
    "/show-all",
    validatorMiddleware({ query: baseValidator.browseQuery }),
    controller.findAll
  );

  r.get(
    "/show-random",
    validatorMiddleware({ query: baseValidator.browseQuery }),
    controller.findAllRandom
  );

// Threads by user
  r.get(
    "/show-by-user/:user_id",
    validatorMiddleware({ query: baseValidator.browseQuery }),
    controller.findByUserId
  );

  r.get("/show-one/:id", controller.findById);

  r.post(
    "/create",
    auth(),
    upload.fields([
    { name: "threads_thumbnail", maxCount: 1 },    
    { name: "threads_images", maxCount: 5 }
    ]),
    controller.create
  );
 

  r.post(
    "/like",
    auth(),
    controller.likeThread
  );


  r.post(
    "/create/threads/:forum_id",
    auth(),
    upload.fields([
    { name: "threads_thumbnail", maxCount: 1 },    
    { name: "threads_images", maxCount: 5 }
  ]),
    controller.createThreadsInForum
  );
      
  r.put(
    "/update/:id",
    auth(),
    upload.fields([
    { name: "threads_thumbnail", maxCount: 1 },    
    { name: "threads_images", maxCount: 5 }
  ]),
    controller.update
  );

  r.delete(
    "/delete/:id",
    auth(),
    controller.delete
  );

  r.delete(
  "/delete-all",
  auth(),
  controller.deleteMyThreads
);


  const threadsRouter = r;
  export default threadsRouter;
