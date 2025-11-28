import Joi from "joi";

export const threadsValidator = {
  create: Joi.object({
    threads_title: Joi.string().required(),
    threads_description: Joi.string().required(),
  }),
  update: Joi.object({
    // no-data
  }),
};

export default threadsValidator;
