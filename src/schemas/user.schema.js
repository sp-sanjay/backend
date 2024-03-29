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

const changeCurrentPasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
  confirmNewPassword: Joi.string().min(8).required(),
});

const updateUserProfileSchema = Joi.object({
  email: Joi.string().email().required(),
  fullName: Joi.string().required(),
});

const profilePictureSchema = Joi.object({
    file: Joi.object().required()
})
export {
  signupSchema,
  loginSchema,
  changeCurrentPasswordSchema,
  updateUserProfileSchema,
  profilePictureSchema
};
