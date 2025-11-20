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
  '/refresh',
  validatorMiddleware({ body: validator.refresh }),
  controller.refresh
);

r.post(
  '/register',
  auth(['ADMIN']),
  validatorMiddleware({ body: validator.register }),
  controller.register
);

const authenticationRouter = r;
export default authenticationRouter;
