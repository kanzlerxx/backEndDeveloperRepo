  import { Router } from 'express';
  import validatorMiddleware from '../../middlewares/validator.middleware.js';
  import AuthenticationController from './authentication.controller.js';
  import AuthenticationValidator from './authentication.validator.js';
  import auth from '../../middlewares/auth.middleware.js';

  const r = Router(),
    validator = AuthenticationValidator,
    controller = new AuthenticationController();

  r.post(
    '/login',
    validatorMiddleware({ body: validator.login }),
    controller.login
  );

  r.post(
  '/forget-password',
  validatorMiddleware({ body: validator.forgetPassword}),
  controller.forgetPassword
);

r.post(
  '/reset-password',
  validatorMiddleware({ body: validator.resetPassword }),
  controller.resetPassword
)

  r.post(
    '/refresh',
    validatorMiddleware({ body: validator.refresh }),
    controller.refresh
  );

  r.post(
    '/register',
    // auth(),
    validatorMiddleware({ body: validator.register }),
    controller.register
  );


  r.put(
    '/update',
    auth(),
    validatorMiddleware({ body: validator.update }),
    controller.update
  );

  r.post(
    '/logout',
    auth(),
    controller.logout
  );

  const authenticationRouter = r;
  export default authenticationRouter;
