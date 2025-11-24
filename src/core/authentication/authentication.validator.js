import Joi from "joi";
import constant from '../../config/constant.js';

export const authenticationValidator = {

  login: Joi.object({
  identifier: Joi.string().required(),
  password: Joi.string().required(),
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
  username: Joi.string()
    .min(3)
    .max(50)
    .optional(),

  bio: Joi.string()
    .max(300)
    .allow(null, '')
    .optional(),

  profile_image: Joi.string()
    .uri()
    .allow(null, '')
    .optional(),
})
.min(1) // minimal harus ada satu field yang diupdate

};

export default authenticationValidator;
