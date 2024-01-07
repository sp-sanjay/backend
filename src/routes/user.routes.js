import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  loginUser,
  logout,
  refreshAccessToken,
  registerUser,
  updateUserProfile,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyUser } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyUser, logout);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyUser,changeCurrentPassword);
router.route("/current-user").get(verifyUser,getCurrentUser);
router.route("/update-profile").patch(verifyUser,updateUserProfile);

export default router;
