import Joi from "joi";
import constant from '../../config/constant.js';

export const authenticationValidator = {
    login: Joi.object({
    email: Joi.string().email().required().messages({
      "string.empty": "Email must be filled",
      "any.required": "Email is required",
    }),
    password: Joi.string().required().messages({
      "string.empty": "Password must be filled",
      "any.required": "Password is required",
    }),
  }),

  refresh: Joi.object({
    refresh_token: Joi.string().required().messages({
      "string.empty": "Refresh token must be filled",
      "any.required": "Refresh token is required",
    }),
  }),

  create: Joi.object({
    // no-data
  }),
  update: Joi.object({
    // no-data
  }),
};

export default authenticationValidator;
