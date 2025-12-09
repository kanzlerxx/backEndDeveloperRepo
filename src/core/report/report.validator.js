import Joi from "joi";

export const reportValidator = {
  create: Joi.object({
  report_option: Joi.string().required(),
  report_description: Joi.string().optional()
}),

  update: Joi.object({
    // no-data
  }),
};

export default reportValidator;
