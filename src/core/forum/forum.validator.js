import Joi from "joi";

export const forumValidator = {
  create: Joi.object({
    forum_title: Joi.string().required(),
    forum_description: Joi.string().required(),
    id_category: Joi.number().required(),
  }),
  update: Joi.object({
    // no-data
  }),
};

export default forumValidator;
