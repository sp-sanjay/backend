import Joi from "joi";

const signupSchema = Joi.object().keys({
  username: Joi.string().lowercase().trim().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  fullName: Joi.string().max(50).required(),
  avatar: Joi.array().required(),
  coverImage: Joi.array().optional(),
});

const loginSchema = Joi.object()
  .keys({
    username: Joi.string(),
    email: Joi.string().email(),
    password: Joi.string().required(),
  })
  .or("username", "email");
export { signupSchema, loginSchema };
