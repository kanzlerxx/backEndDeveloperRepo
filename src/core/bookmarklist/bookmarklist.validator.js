import Joi from "joi";

export const bookmarklistValidator = {
  create: Joi.object({
    // no-data
  }),
  update: Joi.object({
    // no-data
  }),

    add : Joi.object({
    bookmark_content_id: Joi.number().required(),
    threads_id:  Joi.number().required(),
  }),

  remove : Joi.object({
    bookmark_content_id:Joi.number().required(),
    threads_id: Joi.number().required(),
  }),
};

export default bookmarklistValidator;
