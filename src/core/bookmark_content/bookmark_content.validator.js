import Joi from "joi";

export const bookmark_contentValidator = {
  create: Joi.object({
    bookmark_name: Joi.string().required(),
    color: Joi.string().required()
  }),
  update: Joi.object({
    // no-data
  }),
};

export default bookmark_contentValidator;
