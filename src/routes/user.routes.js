import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserProfileChannelAndSubscriber,
  getWatchHistory,
  loginUser,
  logout,
  refreshAccessToken,
  registerUser,
  updateAvatar,
  updateCoverImage,
  updateUserProfile,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyUser } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validateRequest.middleware.js";
import { changeCurrentPasswordSchema, loginSchema, signupSchema } from "../schemas/user.schema.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  validateRequest(signupSchema),
  registerUser
);
router.route("/login").post(validateRequest(loginSchema),loginUser);
router.route("/logout").post(verifyUser, logout);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(validateRequest(changeCurrentPasswordSchema) ,verifyUser,changeCurrentPassword);
router.route("/current-user").get(verifyUser,getCurrentUser);
router.route("/update-profile").patch(verifyUser,updateUserProfile);
router.route("/update-avatar").patch(upload.single('file'),verifyUser,updateAvatar);
router.route("/update-cover-image").patch(upload.single('file'),verifyUser,updateCoverImage);
router.route("/user-profile-subscriber/:username").get(verifyUser,getUserProfileChannelAndSubscriber);
router.route("/history").get(verifyUser, getWatchHistory)

export default router;
