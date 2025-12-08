import Joi from "joi";

export const kategoriValidator = {
  create: Joi.object({
   categories_name : Joi.string().required()  
  }),
  update: Joi.object({
    // no-data
  }),
};

export default kategoriValidator;
