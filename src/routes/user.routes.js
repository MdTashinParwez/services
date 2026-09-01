import {Router} from 'express';
import { loginUser, logoutUser, registerUser,refreshAccessToken, changeCurrentPassword, getCurrentUser, updateProfileDetails, updateUserAvatar } from '../controllers/user.controller.js';
import {upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  validateRegisterUser,
  validateLoginUser,
  validateChangePassword,
  validateUpdateProfile,
} from "../validators/user.validator.js";

import { validate } from "../middlewares/validation.middleware.js";
const router = Router()

router.route("/register").post(
    upload.fields([{name: "avatar", maxCount: 1}]),validate(validateRegisterUser), registerUser)

router.route("/login").post( validate(validateLoginUser),loginUser)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,validate(validateChangePassword),changeCurrentPassword)
router.route("/current-user").post(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,  validate(validateUpdateProfile),updateProfileDetails)
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)


export default router 
